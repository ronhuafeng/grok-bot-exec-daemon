import test from 'node:test';
import assert from 'node:assert/strict';
import { AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE, AGENT_STORE_FUSE_PID_FILE } from '../src/interop/vendor/constants-agent-store-fuse.js';
import { AGENT_STORE_MOUNT_ROOT } from '../src/interop/vendor/constants-agent-store-ids.js';
import { createContext } from '../src/interop/vendor/context-core.js';
import { withSpan } from '../src/interop/vendor/context-otel.js';
import { FuseLivenessMonitor, FUSE_LIVENESS_RELAUNCH_EVENT, FUSE_LIVENESS_RELAUNCH_REASON, type FuseLivenessHost, type ProbeProcess, type ScheduledProbe } from '../src/runtime/fuseLiveness.js';

const FUSE_PID = 4242;
const REPLACEMENT_PID = 5252;
const DEADLINE_MS = 5;
const INTERVAL_MS = 1;
const FAILURES_BEFORE_KILL = 2;
const KILL_GRACE_MS = 5;

interface HungProbe extends ProbeProcess {
  onExit?: (code: number | null) => void;
}

interface QueuedTimer {
  ms: number;
  fn: () => void;
  canceled: boolean;
}

type Mismatch = 'cmdline' | 'pid' | 'grace';

function matchingCmdline(): string {
  return `/usr/local/bin/${AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE} --backend-mode mock`;
}

function createHarness(mismatch?: Mismatch): {
  host: FuseLivenessHost;
  signals: [number, NodeJS.Signals][];
  aborts: string[];
  probes: HungProbe[];
  flushNext: () => QueuedTimer;
  switched: () => boolean;
  bind: (monitor: FuseLivenessMonitor) => void;
} {
  const signals: [number, NodeJS.Signals][] = [];
  const aborts: string[] = [];
  const probes: HungProbe[] = [];
  const timers: QueuedTimer[] = [];
  let monitor: FuseLivenessMonitor | undefined;
  let switched = false;
  const host: FuseLivenessHost = {
    now: () => probes.length,
    schedule(ms, fn): ScheduledProbe {
      const timer: QueuedTimer = { ms, fn, canceled: false };
      timers.push(timer);
      return { cancel() { timer.canceled = true; } };
    },
    spawnProbe(): ProbeProcess {
      const probe: HungProbe = {
        pid: 9100 + probes.length,
        unref() {},
        onceExit(cb) { probe.onExit = cb; },
        onceError() {},
      };
      probes.push(probe);
      return probe;
    },
    readFile(file) {
      if (file !== AGENT_STORE_FUSE_PID_FILE) return undefined;
      if (mismatch === 'grace' && signals.some(([, signal]) => signal === 'SIGTERM')) return `${REPLACEMENT_PID}\n`;
      if (mismatch !== undefined && mismatch !== 'grace' && monitor?.killWarranted === true && !switched) {
        switched = true;
        if (mismatch === 'pid') return `${REPLACEMENT_PID}\n`;
      }
      return `${FUSE_PID}\n`;
    },
    processAlive(pid) {
      return pid === FUSE_PID || pid === REPLACEMENT_PID;
    },
    readCmdline(pid) {
      if (mismatch === 'cmdline' && switched) return 'unrelated-service';
      if (pid === FUSE_PID || pid === REPLACEMENT_PID) return matchingCmdline();
      return 'unrelated-service';
    },
    kill(pid, signal) { signals.push([pid, signal]); },
    abortConnection(mountRoot) { aborts.push(mountRoot); },
    renameFile: () => false,
    removeFile() {},
    safeCwd: () => '/tmp',
    reportEvent() {},
    spanFactory: ctx => ctx,
  };
  return {
    host,
    signals,
    aborts,
    probes,
    flushNext() {
      const timer = timers.find(item => !item.canceled);
      assert.ok(timer, 'expected a scheduled liveness callback');
      timer.canceled = true;
      timer.fn();
      return timer;
    },
    switched: () => switched,
    bind(next) { monitor = next; },
  };
}

function startMonitor(host: FuseLivenessHost): FuseLivenessMonitor {
  return new FuseLivenessMonitor({
    host,
    killEnabled: true,
    intervalMs: INTERVAL_MS,
    deadlineMs: DEADLINE_MS,
    failuresBeforeKill: FAILURES_BEFORE_KILL,
    killGraceMs: KILL_GRACE_MS,
    mountRoot: AGENT_STORE_MOUNT_ROOT,
    pidFile: AGENT_STORE_FUSE_PID_FILE,
  });
}

/** Two interval ticks whose probes stay hung through the deadline. */
function driveTwoHungDeadlines(flushNext: () => QueuedTimer, monitor: FuseLivenessMonitor): void {
  monitor.start(createContext());
  const firstTick = flushNext();
  assert.equal(firstTick.ms, 0);
  const firstDeadline = flushNext();
  assert.equal(firstDeadline.ms, DEADLINE_MS);
  const secondTick = flushNext();
  assert.equal(secondTick.ms, INTERVAL_MS);
  const secondDeadline = flushNext();
  assert.equal(secondDeadline.ms, DEADLINE_MS);
}

test('two hung probes SIGTERM then SIGKILL the matching agent-store fuse pid', () => {
  assert.equal(AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE.includes('cursor-agent-store-fuse'), true);
  assert.equal(matchingCmdline().includes(AGENT_STORE_FUSE_BINARY_CMDLINE_NEEDLE), true);
  const harness = createHarness();
  const monitor = startMonitor(harness.host);
  harness.bind(monitor);
  try {
    driveTwoHungDeadlines(harness.flushNext, monitor);
    assert.equal(harness.probes.length, 2);
    assert.equal(harness.probes.every(probe => probe.onExit !== undefined), true);
    assert.equal(monitor.killWarranted, true);
    assert.deepEqual(harness.signals, [[FUSE_PID, 'SIGTERM']]);
    const grace = harness.flushNext();
    assert.equal(grace.ms, KILL_GRACE_MS);
    assert.deepEqual(harness.signals, [[FUSE_PID, 'SIGTERM'], [FUSE_PID, 'SIGKILL']]);
    assert.deepEqual(harness.aborts, [AGENT_STORE_MOUNT_ROOT, AGENT_STORE_MOUNT_ROOT]);
    assert.equal(harness.switched(), false);
  } finally {
    monitor.stop();
  }
});

test('a hung fuse is not killed when its cmdline no longer matches', () => {
  const harness = createHarness('cmdline');
  const monitor = startMonitor(harness.host);
  harness.bind(monitor);
  try {
    driveTwoHungDeadlines(harness.flushNext, monitor);
    assert.equal(monitor.killWarranted, true);
    assert.equal(harness.switched(), true);
    assert.deepEqual(harness.signals, []);
    const next = harness.flushNext();
    assert.equal(next.ms, INTERVAL_MS);
    assert.deepEqual(harness.signals, []);
  } finally {
    monitor.stop();
  }
});

test('a hung fuse is not killed when the pid file changes to a different live pid', () => {
  const harness = createHarness('pid');
  const monitor = startMonitor(harness.host);
  harness.bind(monitor);
  try {
    driveTwoHungDeadlines(harness.flushNext, monitor);
    assert.equal(monitor.killWarranted, true);
    assert.equal(harness.switched(), true);
    assert.equal(harness.signals.some(([pid]) => pid === FUSE_PID || pid === REPLACEMENT_PID), false);
    assert.deepEqual(harness.signals, []);
    assert.deepEqual(harness.aborts, []);
  } finally {
    monitor.stop();
  }
});

test('a remount during the kill grace aborts only the original mount', () => {
  const harness = createHarness('grace');
  const monitor = startMonitor(harness.host);
  harness.bind(monitor);
  try {
    driveTwoHungDeadlines(harness.flushNext, monitor);
    assert.deepEqual(harness.signals, [[FUSE_PID, 'SIGTERM']]);
    assert.deepEqual(harness.aborts, [AGENT_STORE_MOUNT_ROOT]);
    harness.flushNext();
    assert.deepEqual(harness.signals, [[FUSE_PID, 'SIGTERM']]);
    assert.deepEqual(harness.aborts, [AGENT_STORE_MOUNT_ROOT]);
  } finally {
    monitor.stop();
  }
});

test('a relaunch reason is reported once and then removed', () => {
  const events: string[] = [];
  const removed: string[] = [];
  const reasonPath = '/tmp/exec-daemon-fuse-reason';
  const host: FuseLivenessHost = {
    now: () => 0,
    schedule: () => ({ cancel() {} }),
    spawnProbe: () => { throw new Error('probe not used'); },
    readFile: file => file === `${reasonPath}.reporting` ? `${FUSE_LIVENESS_RELAUNCH_REASON}\n` : undefined,
    processAlive: () => false,
    readCmdline: () => undefined,
    kill() {},
    abortConnection() {},
    renameFile: () => true,
    removeFile(file) { removed.push(file); },
    safeCwd: () => '/tmp',
    reportEvent(_ctx, event) { events.push(event); },
    spanFactory: ctx => ctx,
  };
  const monitor = new FuseLivenessMonitor({ host, relaunchReasonPath: reasonPath });
  monitor.reportRelaunchReason(withSpan(createContext()));
  assert.deepEqual(events, [FUSE_LIVENESS_RELAUNCH_EVENT]);
  assert.deepEqual(removed, [`${reasonPath}.reporting`]);
  events.length = 0;
  host.renameFile = () => false;
  monitor.reportRelaunchReason(withSpan(createContext()));
  assert.deepEqual(events, []);
});
