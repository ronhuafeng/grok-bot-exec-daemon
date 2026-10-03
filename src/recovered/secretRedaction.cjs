module.exports = {
/***/ "./src/secretRedaction.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LK: () => (/* binding */ SecretRedactionState),
/* harmony export */   gz: () => (/* binding */ CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR),
/* harmony export */   hK: () => (/* binding */ ALWAYS_REDACTED_ENV_SECRET_NAMES),
/* harmony export */   l1: () => (/* binding */ CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR),
/* harmony export */   o5: () => (/* binding */ SYNTHETIC_GIT_AUTH_USERNAMES),
/* harmony export */   wM: () => (/* binding */ refreshCachedGitAuthTokens)
/* harmony export */ });
/* unused harmony exports GITHUB_AUTH_TOKEN_SECRET_NAME, OAUTH2_AUTH_TOKEN_SECRET_NAME, X_TOKEN_AUTH_SECRET_NAME, PAT_AUTH_TOKEN_SECRET_NAME, extractSyntheticGitAuthTokensFromGitConfigContents, getGlobalGitConfigPath, readSyntheticGitAuthTokensFromGitConfig, getCachedGitAuthTokens, createExecDaemonSecretAccessor, createExecDaemonSecretRedactor */
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("node:fs/promises");
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_fs_promises__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("node:os");
/* harmony import */ var node_os__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(node_os__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("node:path");
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _anysphere_secrets_exec__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("../secrets-exec/dist/index.js");
/* harmony import */ var _comma_separated_names_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("./src/comma-separated-names.ts");





const GITHUB_AUTH_TOKEN_SECRET_NAME = "__CURSOR_GITHUB_AUTH_TOKEN";
const OAUTH2_AUTH_TOKEN_SECRET_NAME = "__CURSOR_OAUTH2_AUTH_TOKEN";
const X_TOKEN_AUTH_SECRET_NAME = "__CURSOR_X_TOKEN_AUTH_TOKEN";
const PAT_AUTH_TOKEN_SECRET_NAME = "__CURSOR_PAT_AUTH_TOKEN";
const CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR = "CLOUD_AGENT_ALL_SECRET_NAMES";
// Keep in sync with @anysphere/constants cloud-agent.ts. exec-daemon avoids
// importing that package at runtime so the standalone bundled daemon does not
// gain another workspace dep; secretRedaction.test.ts asserts drift against
// the canonical copy.
const CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR = "CLOUD_AGENT_INJECTED_SECRET_NAMES";
const RETAINED_ENV_SECRET_NAME_PREFIX = "__CURSOR_RETAINED_ENV_SECRET_";
// Cursor credentials that authenticate the daemon itself (e.g. self-hosted
// worker auth). Always redacted when present, even without an injected-secret
// manifest. Names are string literals rather than @anysphere/constants imports
// (CLOUD_AGENT_ORIGIN_CLI_SESSION_TOKEN_ENV_VAR = "CURSOR_AUTH_TOKEN") because
// the standalone bundled daemon avoids extra workspace deps; keep in sync.
const ALWAYS_REDACTED_ENV_SECRET_NAMES = ["CURSOR_API_KEY", "CURSOR_AUTH_TOKEN"];
const SYNTHETIC_GIT_AUTH_SECRET_SPECS = [
    {
        secretName: GITHUB_AUTH_TOKEN_SECRET_NAME,
        username: "x-access-token",
    },
    {
        secretName: OAUTH2_AUTH_TOKEN_SECRET_NAME,
        username: "oauth2",
    },
    {
        secretName: X_TOKEN_AUTH_SECRET_NAME,
        username: "x-token-auth",
    },
    {
        secretName: PAT_AUTH_TOKEN_SECRET_NAME,
        username: "pat",
    },
];
/**
 * Every git HTTP basic-auth username our provisioning/refresh flows may embed
 * in remotes and insteadOf rewrites. Derived from the redaction specs so a
 * provider cannot gain a rewrite scheme without its token also being redacted.
 */
const SYNTHETIC_GIT_AUTH_USERNAMES = SYNTHETIC_GIT_AUTH_SECRET_SPECS.map((spec) => spec.username);
const SECRET_NAME_BY_USERNAME = new Map(SYNTHETIC_GIT_AUTH_SECRET_SPECS.map((spec) => [spec.username, spec.secretName]));
const SYNTHETIC_GIT_AUTH_SECRET_NAMES = new Set(SYNTHETIC_GIT_AUTH_SECRET_SPECS.map((spec) => spec.secretName));
function isSyntheticGitAuthSecretName(secretName) {
    return SYNTHETIC_GIT_AUTH_SECRET_NAMES.has(secretName);
}
class CachedGitAuthTokens {
    tokens = {};
    getTokens(secretName) {
        return this.tokens[secretName];
    }
    async refresh(gitConfigPath = getGlobalGitConfigPath()) {
        this.tokens = await readSyntheticGitAuthTokensFromGitConfig(gitConfigPath);
    }
}
const cachedGitAuthTokens = new CachedGitAuthTokens();
function extractSyntheticGitAuthTokensFromGitConfigContents(contents) {
    const tokens = {};
    for (const match of contents.matchAll(/^\s*\[url\s+"([^"]+)"\]\s*$/gm)) {
        const rawUrl = match[1];
        try {
            const parsed = new URL(rawUrl);
            const secretName = SECRET_NAME_BY_USERNAME.get(parsed.username);
            if (parsed.protocol === "https:" && secretName && parsed.password) {
                // One username can carry several live credentials: a workspace spanning
                // two organizations gets a host-scoped rewrite for the primary owner and
                // a repo-scoped one per additional owner, all under `x-access-token`.
                // Keeping only the last leaves the others readable in logs.
                const tokensForSecret = tokens[secretName];
                if (tokensForSecret === undefined) {
                    tokens[secretName] = [parsed.password];
                }
                else if (!tokensForSecret.includes(parsed.password)) {
                    tokensForSecret.push(parsed.password);
                }
            }
        }
        catch { }
    }
    return tokens;
}
function getGlobalGitConfigPath() {
    return node_path__WEBPACK_IMPORTED_MODULE_2___default().join(node_os__WEBPACK_IMPORTED_MODULE_1___default().homedir(), ".gitconfig");
}
async function readSyntheticGitAuthTokensFromGitConfig(gitConfigPath = getGlobalGitConfigPath()) {
    try {
        return extractSyntheticGitAuthTokensFromGitConfigContents(await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.readFile)(gitConfigPath, "utf8"));
    }
    catch {
        return {};
    }
}
function getCachedGitAuthTokens(secretName) {
    if (!isSyntheticGitAuthSecretName(secretName)) {
        return undefined;
    }
    return cachedGitAuthTokens.getTokens(secretName);
}
async function refreshCachedGitAuthTokens(gitConfigPath = getGlobalGitConfigPath()) {
    await cachedGitAuthTokens.refresh(gitConfigPath);
}
function parseRedactedSecretNames(secretNamesEnv) {
    const names = new Set((0,_comma_separated_names_js__WEBPACK_IMPORTED_MODULE_4__/* .parseCommaSeparatedNames */ .w)(secretNamesEnv));
    for (const spec of SYNTHETIC_GIT_AUTH_SECRET_SPECS) {
        names.add(spec.secretName);
    }
    for (const name of ALWAYS_REDACTED_ENV_SECRET_NAMES) {
        names.add(name);
    }
    return [...names];
}
function createExecDaemonSecretAccessor(processEnv = process.env, getGitAuthTokens = getCachedGitAuthTokens) {
    return (name) => {
        if (isSyntheticGitAuthSecretName(name)) {
            // Substitution expands one value, so it gets the host-scoped credential
            // git config lists first. Redaction covers all of them; see
            // `createExecDaemonSecretRedactor`.
            return getGitAuthTokens(name)?.[0];
        }
        return processEnv[name];
    };
}
function createExecDaemonSecretRedactor(secretNamesEnv = process.env[CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR], processEnv = process.env, getGitAuthTokens = getCachedGitAuthTokens, retainedEnvSecretValues = []) {
    const parsedSecretNames = parseRedactedSecretNames(secretNamesEnv);
    const envSecretValuesByName = new Map();
    for (const name of parsedSecretNames) {
        if (isSyntheticGitAuthSecretName(name)) {
            continue;
        }
        const value = processEnv[name];
        if (value !== undefined) {
            envSecretValuesByName.set(name, value);
        }
    }
    const retainedEnvSecretsByName = new Map();
    let retainedSecretIndex = 0;
    for (const value of retainedEnvSecretValues) {
        retainedEnvSecretsByName.set(`${RETAINED_ENV_SECRET_NAME_PREFIX}${retainedSecretIndex}`, value);
        retainedSecretIndex += 1;
    }
    const redactor = new _anysphere_secrets_exec__WEBPACK_IMPORTED_MODULE_3__/* .SecretRedactor */ .pE([...parsedSecretNames, ...retainedEnvSecretsByName.keys()], (name) => {
        const retainedValue = retainedEnvSecretsByName.get(name);
        if (retainedValue !== undefined) {
            return retainedValue;
        }
        if (isSyntheticGitAuthSecretName(name)) {
            return getGitAuthTokens(name);
        }
        return envSecretValuesByName.get(name);
    });
    const redactorHasSecrets = redactor.hasSecrets();
    return redactorHasSecrets ? redactor : undefined;
}
class SecretRedactionState {
    getGitAuthTokens;
    redactor;
    retainedEnvSecretValues = new Set();
    constructor(getGitAuthTokens = getCachedGitAuthTokens) {
        this.getGitAuthTokens = getGitAuthTokens;
    }
    // Removed env vars may still exist in already-running tmux panes. Retain
    // their old values so transcript/log redaction stays conservative.
    retainSecretsRemovedByEnvUpdate(args) {
        const removedKeys = new Set(args.removedKeys);
        const nextRedactedNames = new Set(parseRedactedSecretNames(args.nextSecretNamesEnv));
        for (const name of parseRedactedSecretNames(args.env[CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR])) {
            if (isSyntheticGitAuthSecretName(name)) {
                continue;
            }
            if (nextRedactedNames.has(name) && !removedKeys.has(name)) {
                continue;
            }
            const value = args.env[name];
            if (value !== undefined) {
                this.retainedEnvSecretValues.add(value);
            }
        }
    }
    /**
     * Values injected per command (scoped secrets) rather than through env.
     * Retained for the daemon's lifetime, like removed env values, so output of
     * a process still holding an old value stays redacted after a rotation.
     */
    retainSecretValues(values, env) {
        for (const value of values) {
            this.retainedEnvSecretValues.add(value);
        }
        this.refreshFromEnv(env);
    }
    refreshFromEnv(env) {
        this.redactor = createExecDaemonSecretRedactor(env[CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR], env, this.getGitAuthTokens, this.retainedEnvSecretValues);
    }
    getRedactor() {
        return this.redactor;
    }
}


/***/ },

};
