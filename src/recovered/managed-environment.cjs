module.exports = {
/***/ "./src/managed-environment.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Bn: () => (/* reexport safe */ _anysphere_utils__WEBPACK_IMPORTED_MODULE_0__.Bn),
/* harmony export */   R1: () => (/* binding */ ManagedEnvironment),
/* harmony export */   ZH: () => (/* reexport safe */ _anysphere_utils__WEBPACK_IMPORTED_MODULE_1__.ZH),
/* harmony export */   _Z: () => (/* binding */ ManagedEnvironmentValidationError),
/* harmony export */   j8: () => (/* binding */ SANDBOX_ENV_RESTORE_ENV_VAR),
/* harmony export */   jg: () => (/* binding */ ENV_NAME_PATTERN),
/* harmony export */   tr: () => (/* binding */ validateManagedEnvironmentNames),
/* harmony export */   uT: () => (/* binding */ CURSOR_SANDBOX_ENV_NAME_PATTERN)
/* harmony export */ });
/* unused harmony export ORIGIN_CLI_SESSION_TOKEN_ENV_VAR */
/* harmony import */ var _anysphere_utils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../utils/dist/safe-spawn-cwd.js");
/* harmony import */ var _anysphere_utils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("../utils/dist/workload-spawn.js");

// Keep in sync with @anysphere/constants env-var-names.ts. exec-daemon avoids
// importing that package so the standalone bundled daemon does not gain another
// workspace dep. packages/exec-daemon/src/managed-environment.test.ts asserts
// drift against the canonical copy.
const ENV_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
// Keep in sync with @anysphere/constants CURSOR_SANDBOX_ENV_NAME_PATTERN.
const CURSOR_SANDBOX_ENV_NAME_PATTERN = /CURSOR_SANDBOX/i;
// Re-exported from utils (already a dependency) rather than copied; the test
// asserts drift against the canonical @anysphere/constants copy.

// Keep in sync with @anysphere/constants CLOUD_AGENT_ORIGIN_CLI_SESSION_TOKEN_ENV_VAR
// (same drift assertion in the test). The host that runs the daemon injects
// this session on its own rotation schedule (a `replace: false` push from the
// backend), and no other managed-env writer owns it, so a `replace: true` push
// that does not name it keeps it instead of dropping it with that writer's
// stale keys. The Sand host's box-secrets sync is such a writer: it replaces
// the whole managed set on every desktop reconnect.
const ORIGIN_CLI_SESSION_TOKEN_ENV_VAR = "CURSOR_AUTH_TOKEN";
/**
 * Holds the whole managed environment serialized as `builtin export
 * NAME='value'` shell statements, which the daemon's shells re-eval after a
 * shell-state snapshot restore so stale snapshot values cannot win.
 *
 * Because it restates every managed value, treat it as carrying the union of
 * their secrets rather than as an ordinary variable: anything that filters
 * managed env by name must filter this too, or the filtered names come back
 * through it. Matching {@link CURSOR_SANDBOX_ENV_NAME_PATTERN} keeps it out of
 * the shell state dumps, and out of the managed set itself.
 */
const SANDBOX_ENV_RESTORE_ENV_VAR = "__CURSOR_SANDBOX_ENV_RESTORE";
class ManagedEnvironmentValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ManagedEnvironmentValidationError";
    }
}
function validateManagedEnvironmentNames(env) {
    for (const name of Object.keys(env)) {
        if (!ENV_NAME_PATTERN.test(name)) {
            throw new ManagedEnvironmentValidationError(`Invalid environment variable name: "${name}"`);
        }
        // Shell state dump scripts filter CURSOR_SANDBOX vars from snapshots. A
        // managed var matching that filter would be set, then disappear after the
        // next shell state restore, so reject it at the managed-environment layer.
        if (CURSOR_SANDBOX_ENV_NAME_PATTERN.test(name)) {
            throw new ManagedEnvironmentValidationError(`Environment variable name "${name}" is reserved (matches CURSOR_SANDBOX filter)`);
        }
        if (name === _anysphere_utils__WEBPACK_IMPORTED_MODULE_1__/* .WORKLOAD_CGROUP_ENV_VAR */ .ZH) {
            throw new ManagedEnvironmentValidationError(`Environment variable name "${name}" is reserved for the workload cgroup contract`);
        }
        if (name === _anysphere_utils__WEBPACK_IMPORTED_MODULE_0__/* .SPAWN_CWD_HOP_ENV_VAR */ .Bn) {
            throw new ManagedEnvironmentValidationError(`Environment variable name "${name}" is reserved for the spawn cwd-hop contract`);
        }
    }
}
class ManagedEnvironment {
    values = new Map();
    apply(args) {
        validateManagedEnvironmentNames(args.env);
        const env = { ...args.env };
        const replace = args.replace === true;
        const requestedKeys = new Set(Object.keys(env));
        const removedKeys = [];
        if (replace) {
            for (const key of this.values.keys()) {
                if (!requestedKeys.has(key) && key !== ORIGIN_CLI_SESSION_TOKEN_ENV_VAR) {
                    removedKeys.push(key);
                }
            }
            for (const key of removedKeys) {
                this.values.delete(key);
            }
        }
        for (const [name, value] of Object.entries(env)) {
            this.values.set(name, value);
        }
        return {
            env,
            removedKeys,
            replace,
            applied: Object.keys(env).length,
            removed: removedKeys.length,
        };
    }
    /**
     * Removes only the named keys from the managed set, leaving every other
     * managed key in place. Unlike `apply({ replace: true })` (which clears all
     * keys not in the request, except the Origin CLI session token), this is the
     * primitive a run-scoped overlay uses to tear down exactly the keys it added
     * without disturbing env synced by other writers (e.g.
     * UpdateBackgroundComposerEnvironment). Because replace mode never drops the
     * Origin CLI session token, a caller that wants it gone names it here or
     * writes it explicitly.
     */
    remove(keys) {
        const removedKeys = [];
        for (const key of keys) {
            if (this.values.delete(key)) {
                removedKeys.push(key);
            }
        }
        return {
            env: {},
            removedKeys,
            replace: false,
            applied: 0,
            removed: removedKeys.length,
        };
    }
    entries() {
        return this.values.entries();
    }
    snapshot() {
        return Object.fromEntries(this.values);
    }
}


/***/ },

};
