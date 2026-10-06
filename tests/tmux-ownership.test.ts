import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShellEnvironmentRefreshCommand, buildTmuxGlobalArgs, resolveTmuxServerSocket } from '../src/runtime/tmux-session-manager.js';

test('tmux clients select only the daemon socket', () => {
  assert.deepEqual(buildTmuxGlobalArgs(undefined), ['-u']);
  assert.deepEqual(buildTmuxGlobalArgs('/conf', '/var/lib/exec-daemon/tmux.sock'), ['-u', '-S', '/var/lib/exec-daemon/tmux.sock', '-f', '/conf']);
  assert.equal(resolveTmuxServerSocket('/data'), '/data/tmux.sock');
  assert.equal(resolveTmuxServerSocket('  '), '/opt/cursor/.exec-daemon/tmux.sock');
  const refresh = buildShellEnvironmentRefreshCommand({
    tmuxBinaryPath: "/a'b/tmux",
    tmuxConfigPath: '/c d',
    serverSocket: '/sock et',
    sessionName: 'session',
  });
  assert.match(refresh, /-S '\/sock et'/);
  assert.equal(buildShellEnvironmentRefreshCommand({
    tmuxBinaryPath: "/a'b/tmux",
    tmuxConfigPath: '/c d',
    sessionName: 'session',
  }).includes(' -S '), false);
});
