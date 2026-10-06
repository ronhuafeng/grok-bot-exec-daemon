import test from 'node:test';
import assert, { AssertionError } from 'node:assert/strict';
import {
  combineAssertionAndCleanup,
  unmountFuse,
  FuseUnmountError,
  type CommandResult,
  type CommandRunner,
} from './lib/fuse-mount-cleanup.js';

function scripted(handlers: Readonly<Record<string, () => Promise<CommandResult> | CommandResult>>): {
  run: CommandRunner;
  calls: string[];
} {
  const calls: string[] = [];
  const run: CommandRunner = async (command, _args) => {
    calls.push(command);
    const handler = handlers[command];
    if (handler === undefined) throw new Error(`unexpected command ${command}`);
    return handler();
  };
  return { run, calls };
}

test('nonzero fusermount3 falls through to a successful fusermount', async () => {
  const { run, calls } = scripted({
    fusermount3: () => ({ status: 1, stdout: '', stderr: 'fusermount3: failed to unmount' }),
    fusermount: () => ({ status: 0, stdout: '', stderr: '' }),
    umount: () => { throw new Error('umount should not run after fusermount succeeds'); },
  });
  await unmountFuse('/mnt/agent-store', run);
  assert.deepEqual(calls, ['fusermount3', 'fusermount']);
});

test('spawn failures fall through to a successful umount', async () => {
  const { run, calls } = scripted({
    fusermount3: () => { throw new Error('spawn fusermount3 ENOENT'); },
    fusermount: () => { throw new Error('spawn fusermount ENOENT'); },
    umount: () => ({ status: 0, stdout: '', stderr: '' }),
  });
  await unmountFuse('/mnt/agent-store', run);
  assert.deepEqual(calls, ['fusermount3', 'fusermount', 'umount']);
});

test('every failed unmount attempt is included when cleanup throws', async () => {
  const { run, calls } = scripted({
    fusermount3: () => ({ status: 1, stdout: '', stderr: 'mountpoint not found' }),
    fusermount: () => { throw new Error('spawn fusermount ENOENT'); },
    umount: () => ({ status: 32, stdout: '', stderr: 'umount: target is busy' }),
  });
  await assert.rejects(() => unmountFuse('/mnt/agent-store', run), (error: unknown) => {
    assert.ok(error instanceof FuseUnmountError);
    assert.equal(error.attempts.length, 3);
    assert.deepEqual(calls, ['fusermount3', 'fusermount', 'umount']);
    assert.match(error.message, /failed to unmount \/mnt\/agent-store/);
    assert.match(error.message, /fusermount3 -u \/mnt\/agent-store: status 1: mountpoint not found/);
    assert.match(error.message, /fusermount -u \/mnt\/agent-store: spawn error: spawn fusermount ENOENT/);
    assert.match(error.message, /umount \/mnt\/agent-store: status 32: umount: target is busy/);
    const fusermount3 = error.attempts[0];
    const fusermount = error.attempts[1];
    const umount = error.attempts[2];
    assert.ok(fusermount3 !== undefined && !('spawnError' in fusermount3));
    assert.equal(fusermount3.status, 1);
    assert.equal(fusermount3.stderr, 'mountpoint not found');
    assert.ok(fusermount !== undefined && 'spawnError' in fusermount);
    assert.equal(fusermount.spawnError, 'spawn fusermount ENOENT');
    assert.ok(umount !== undefined && !('spawnError' in umount));
    assert.equal(umount.status, 32);
    assert.equal(umount.stderr, 'umount: target is busy');
    return true;
  });
});

test('a successful first unmount does not try the fallback commands', async () => {
  const { run, calls } = scripted({
    fusermount3: () => ({ status: 0, stdout: '', stderr: '' }),
    fusermount: () => { throw new Error('fusermount should not run'); },
    umount: () => { throw new Error('umount should not run'); },
  });
  await unmountFuse('/mnt/agent-store', run);
  assert.deepEqual(calls, ['fusermount3']);
});

test('a cleanup failure keeps the original assertion message', () => {
  const assertion = new AssertionError({
    message: 'fstype mismatch',
    actual: '',
    expected: 'fuse.agent-store',
    operator: 'strictEqual',
  });
  const combined = combineAssertionAndCleanup(assertion, new Error('fusermount3 -u /mnt: status 1: busy'));
  assert.equal(combined, assertion);
  assert.match(combined.message, /fstype mismatch/);
  assert.match(combined.message, /Cleanup also failed: fusermount3 -u \/mnt: status 1: busy/);
});
