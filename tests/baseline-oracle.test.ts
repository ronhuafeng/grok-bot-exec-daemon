import test from 'node:test';
import assert from 'node:assert/strict';
import { baselineBindings } from './fixtures/baseline-bindings.js';
import { context, serviceGlobals, denied } from './fixtures/service-fixtures.js';
import { loadOwnedSegmentSide, assertFunctionBindings } from './helpers/owned-vm.js';

test('baseline oracle maps renamed exports and cross-module passthroughs explicitly', () => {
    const bindings = Object.values(baselineBindings).flat();
    const shell = bindings.filter(binding => binding.module === '../interop/vendor/shell-exec.js');
    assert.equal(shell.length, 2);
    for (const binding of shell) assert.equal(binding.exports?.St, 'configureSandboxPrereqs');
    const websocket = bindings.filter(binding => binding.module === '../interop/vendor/websocket.js');
    assert.equal(websocket.length, 1);
    assert.equal(websocket[0]?.exports?.zu, 'WebSocketServer');
    const environment = bindings.filter(binding => binding.module === './managed-environment.js');
    assert.equal(environment.length, 4);
    for (const binding of environment) {
        assert.deepEqual(binding.exports?.ZH, { module: '../interop/vendor/utils-workload-spawn.js', name: 'WORKLOAD_CGROUP_ENV_VAR' });
        assert.deepEqual(binding.exports?.Bn, { module: '../interop/vendor/utils-safe-spawn-cwd.js', name: 'SPAWN_CWD_HOP_ENV_VAR' });
    }
});

for (const [name, reserved] of [['NORMAL_ENV', false], ['CGROUP_RESERVED', true], ['CWD_RESERVED', true]] as const) {
    test(`tmux environment validation ${reserved ? 'rejects' : 'accepts'} ${name} on baseline and native candidate`, async () => {
        for (const side of ['baseline', 'typed'] as const) {
            const selected = ['TmuxSessionManager', 'TmuxValidationError'] as const;
            const bindings = await loadOwnedSegmentSide('tmux-session-manager', selected, {
                ...serviceGlobals(),
                '../interop/vendor/utils-workload-spawn.js': {
                    getWorkloadPlacement: () => ({ kind: 'direct' }),
                    WORKLOAD_CGROUP_ENV_VAR: 'CGROUP_RESERVED',
                },
                '../interop/vendor/utils-safe-spawn-cwd.js': { SPAWN_CWD_HOP_ENV_VAR: 'CWD_RESERVED' },
            }, side);
            assertFunctionBindings(bindings, selected);
            const module = bindings as Pick<typeof import('../src/runtime/tmux-session-manager.js'), typeof selected[number]>;
            const manager = new module.TmuxSessionManager({
                workspacePath: '/workspace', globalContext: context,
                ptyManager: { spawn: denied }, execTmux: async () => denied(),
            });
            if (reserved) {
                assert.throws(() => manager.validateEnvNames([name]), error => {
                    assert.ok(error instanceof module.TmuxValidationError, side);
                    assert.equal(error.message, `Invalid environment variable name: ${name}`, side);
                    return true;
                }, side);
            } else {
                assert.equal(manager.validateEnvNames([name]), undefined, side);
            }
        }
    });
}

test('baseline oracle rejects an accessed missing fixture export but permits an explicitly undefined export', async () => {
    for (const defineExport of [false, true]) {
        const bindings = await loadOwnedSegmentSide('tmux-session-manager', ['TmuxSessionManager'], {
            ...serviceGlobals(),
            '../interop/vendor/utils-workload-spawn.js': {
                getWorkloadPlacement: () => ({ kind: 'direct' }),
                ...(defineExport ? { WORKLOAD_CGROUP_ENV_VAR: undefined } : {}),
            },
            '../interop/vendor/utils-safe-spawn-cwd.js': { SPAWN_CWD_HOP_ENV_VAR: undefined },
        }, 'baseline');
        assertFunctionBindings(bindings, ['TmuxSessionManager']);
        const module = bindings as Pick<typeof import('../src/runtime/tmux-session-manager.js'), 'TmuxSessionManager'>;
        const manager = new module.TmuxSessionManager({
            workspacePath: '/workspace', globalContext: context,
            ptyManager: { spawn: denied }, execTmux: async () => denied(),
        });
        if (defineExport) {
            assert.equal(manager.validateEnvNames(['NORMAL_ENV']), undefined);
        } else {
            assert.throws(() => manager.validateEnvNames(['NORMAL_ENV']), /Missing baseline fixture export: .*utils-workload-spawn\.js#WORKLOAD_CGROUP_ENV_VAR/);
        }
    }
});
