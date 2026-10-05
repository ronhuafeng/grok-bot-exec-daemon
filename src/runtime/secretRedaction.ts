import nodeFsPromises from "node:fs/promises";
import nodeOs from "node:os";
import nodePath from "node:path";
import { SecretRedactor } from "../interop/vendor/secrets-exec.js";
import { parseCommaSeparatedNames } from "./comma-separated-names.js";
export const GITHUB_AUTH_TOKEN_SECRET_NAME = "__CURSOR_GITHUB_AUTH_TOKEN";
export const OAUTH2_AUTH_TOKEN_SECRET_NAME = "__CURSOR_OAUTH2_AUTH_TOKEN";
export const X_TOKEN_AUTH_SECRET_NAME = "__CURSOR_X_TOKEN_AUTH_TOKEN";
export const PAT_AUTH_TOKEN_SECRET_NAME = "__CURSOR_PAT_AUTH_TOKEN";
export const CLOUD_AGENT_ALL_SECRET_NAMES_ENV_VAR = "CLOUD_AGENT_ALL_SECRET_NAMES";
// Keep in sync with @anysphere/constants cloud-agent.ts. exec-daemon avoids
// importing that package at runtime so the standalone bundled daemon does not
// gain another workspace dep; secretRedaction.test.ts asserts drift against
// the canonical copy.
export const CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR = "CLOUD_AGENT_INJECTED_SECRET_NAMES";
export const RETAINED_ENV_SECRET_NAME_PREFIX = "__CURSOR_RETAINED_ENV_SECRET_";
// Cursor credentials that authenticate the daemon itself (e.g. self-hosted
// worker auth). Always redacted when present, even without an injected-secret
// manifest. Names are string literals rather than @anysphere/constants imports
// (CLOUD_AGENT_ORIGIN_CLI_SESSION_TOKEN_ENV_VAR = "CURSOR_AUTH_TOKEN") because
// the standalone bundled daemon avoids extra workspace deps; keep in sync.
export const ALWAYS_REDACTED_ENV_SECRET_NAMES = ["CURSOR_API_KEY", "CURSOR_AUTH_TOKEN"];
export const SYNTHETIC_GIT_AUTH_SECRET_SPECS = [
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
export const SYNTHETIC_GIT_AUTH_USERNAMES = SYNTHETIC_GIT_AUTH_SECRET_SPECS.map((spec) => spec.username);
export const SECRET_NAME_BY_USERNAME = new Map<string, string>(SYNTHETIC_GIT_AUTH_SECRET_SPECS.map((spec) => [spec.username, spec.secretName]));
export const SYNTHETIC_GIT_AUTH_SECRET_NAMES = new Set<string>(SYNTHETIC_GIT_AUTH_SECRET_SPECS.map((spec) => spec.secretName));
export function isSyntheticGitAuthSecretName(secretName: string) {
    return SYNTHETIC_GIT_AUTH_SECRET_NAMES.has(secretName);
}
export type GitAuthTokenLookup = (secretName: string) => readonly string[] | undefined;
export type GitAuthTokens = Partial<Record<string, string[]>>;
export class CachedGitAuthTokens {
    tokens: GitAuthTokens = {};
    getTokens(secretName: string) {
        return this.tokens[secretName];
    }
    async refresh(gitConfigPath = getGlobalGitConfigPath()) {
        this.tokens = await readSyntheticGitAuthTokensFromGitConfig(gitConfigPath);
    }
}
export const cachedGitAuthTokens = new CachedGitAuthTokens();
export function extractSyntheticGitAuthTokensFromGitConfigContents(contents: string) {
    const tokens: GitAuthTokens = {};
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
export function getGlobalGitConfigPath() {
    return nodePath.join(nodeOs.homedir(), ".gitconfig");
}
export async function readSyntheticGitAuthTokensFromGitConfig(gitConfigPath = getGlobalGitConfigPath()) {
    try {
        return extractSyntheticGitAuthTokensFromGitConfigContents(await nodeFsPromises.readFile(gitConfigPath, "utf8"));
    }
    catch {
        return {};
    }
}
export function getCachedGitAuthTokens(secretName: string) {
    if (!isSyntheticGitAuthSecretName(secretName)) {
        return undefined;
    }
    return cachedGitAuthTokens.getTokens(secretName);
}
export async function refreshCachedGitAuthTokens(gitConfigPath = getGlobalGitConfigPath()) {
    await cachedGitAuthTokens.refresh(gitConfigPath);
}
export function parseRedactedSecretNames(secretNamesEnv: string | undefined): string[] {
    const names = new Set<string>(parseCommaSeparatedNames(secretNamesEnv));
    for (const spec of SYNTHETIC_GIT_AUTH_SECRET_SPECS) {
        names.add(spec.secretName);
    }
    for (const name of ALWAYS_REDACTED_ENV_SECRET_NAMES) {
        names.add(name);
    }
    return [...names];
}
export function createExecDaemonSecretAccessor(processEnv = process.env, getGitAuthTokens: GitAuthTokenLookup = getCachedGitAuthTokens) {
    return (name: string) => {
        if (isSyntheticGitAuthSecretName(name)) {
            // Substitution expands one value, so it gets the host-scoped credential
            // git config lists first. Redaction covers all of them; see
            // `createExecDaemonSecretRedactor`.
            return getGitAuthTokens(name)?.[0];
        }
        return processEnv[name];
    };
}
export function createExecDaemonSecretRedactor(secretNamesEnv = process.env[CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR], processEnv = process.env, getGitAuthTokens: GitAuthTokenLookup = getCachedGitAuthTokens, retainedEnvSecretValues: Iterable<string> = []) {
    const parsedSecretNames = parseRedactedSecretNames(secretNamesEnv);
    const envSecretValuesByName = new Map<string, string>();
    for (const name of parsedSecretNames) {
        if (isSyntheticGitAuthSecretName(name)) {
            continue;
        }
        const value = processEnv[name];
        if (value !== undefined) {
            envSecretValuesByName.set(name, value);
        }
    }
    const retainedEnvSecretsByName = new Map<string, string>();
    let retainedSecretIndex = 0;
    for (const value of retainedEnvSecretValues) {
        retainedEnvSecretsByName.set(`${RETAINED_ENV_SECRET_NAME_PREFIX}${retainedSecretIndex}`, value);
        retainedSecretIndex += 1;
    }
    const redactor = new SecretRedactor([...parsedSecretNames, ...retainedEnvSecretsByName.keys()], (name: string) => {
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
export class SecretRedactionState {
    getGitAuthTokens: GitAuthTokenLookup;
    redactor: ReturnType<typeof createExecDaemonSecretRedactor>;
    retainedEnvSecretValues = new Set<string>();
    constructor(getGitAuthTokens: GitAuthTokenLookup = getCachedGitAuthTokens) {
        this.getGitAuthTokens = getGitAuthTokens;
    }
    // Removed env vars may still exist in already-running tmux panes. Retain
    // their old values so transcript/log redaction stays conservative.
    retainSecretsRemovedByEnvUpdate(args: { removedKeys: Iterable<string>; nextSecretNamesEnv: string | undefined; env: NodeJS.ProcessEnv }) {
        const removedKeys = new Set<string>(args.removedKeys);
        const nextRedactedNames = new Set<string>(parseRedactedSecretNames(args.nextSecretNamesEnv));
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
    retainSecretValues(values: Iterable<string>, env: NodeJS.ProcessEnv) {
        for (const value of values) {
            this.retainedEnvSecretValues.add(value);
        }
        this.refreshFromEnv(env);
    }
    refreshFromEnv(env: NodeJS.ProcessEnv) {
        this.redactor = createExecDaemonSecretRedactor(env[CLOUD_AGENT_INJECTED_SECRET_NAMES_ENV_VAR], env, this.getGitAuthTokens, this.retainedEnvSecretValues);
    }
    getRedactor() {
        return this.redactor;
    }
}
