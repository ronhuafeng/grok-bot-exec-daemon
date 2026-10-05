import { readFileSync } from "node:fs";

export const AUTH_TOKEN_ENV_VAR = "EXEC_DAEMON_AUTH_TOKEN";
export const AUTH_TOKEN_FILE_ENV_VAR = "EXEC_DAEMON_AUTH_TOKEN_FILE";
export const PTY_AUTH_TOKEN_ENV_VAR = "EXEC_DAEMON_PTY_AUTH_TOKEN";
export const PTY_AUTH_TOKEN_FILE_ENV_VAR = "EXEC_DAEMON_PTY_AUTH_TOKEN_FILE";
export const BIND_HOST_ENV_VAR = "EXEC_DAEMON_BIND_HOST";
export const PTY_BIND_HOST_ENV_VAR = "EXEC_DAEMON_PTY_BIND_HOST";

export type SecretSource = "cli" | "file" | "environment";
export interface ResolvedSecret { value: string; source: SecretSource }

function nonempty(value: string | undefined): string | undefined {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
}

/** CLI wins, then a token file, then the environment variable. */
export function resolveAuthSecret(input: { cli?: string; filePath?: string; environment?: string; readFile?: (path: string) => string }): ResolvedSecret | undefined {
    const cli = nonempty(input.cli);
    if (cli !== undefined) return { value: cli, source: "cli" };
    const filePath = nonempty(input.filePath);
    if (filePath !== undefined) {
        const read = input.readFile ?? ((path: string) => readFileSync(path, "utf8"));
        const value = nonempty(read(filePath));
        if (value === undefined) throw new Error(`Auth token file is empty: ${filePath}`);
        return { value, source: "file" };
    }
    const environment = nonempty(input.environment);
    if (environment !== undefined) return { value: environment, source: "environment" };
    return undefined;
}

/** CLI wins over the environment. An empty result means listen on all interfaces. */
export function resolveBindHost(cli: string | undefined, environment: string | undefined): string | undefined {
    const value = nonempty(cli) ?? nonempty(environment);
    if (value === undefined) return undefined;
    if (value.length > 255 || /\s/.test(value)) throw new Error("Invalid bind host");
    return value;
}

const LOOPBACK_BIND_HOSTS: ReadonlySet<string> = new Set(["127.0.0.1", "::1", "localhost"]);

export type PtyListenerMode =
    | { mode: "authenticated"; token: string; source: SecretSource }
    | { mode: "disabled" }
    | { mode: "anonymous"; bindHost: string };

/**
 * A present PTY secret always authenticates. With no secret, the listener stays
 * down unless anonymous mode was requested on an explicit loopback bind host.
 * Empty secrets are already `undefined` from {@link resolveAuthSecret}.
 */
export function decidePtyListener(input: {
    secret: ResolvedSecret | undefined;
    allowAnonymous: boolean;
    bindHost: string | undefined;
}): PtyListenerMode {
    if (input.secret !== undefined) {
        return { mode: "authenticated", token: input.secret.value, source: input.secret.source };
    }
    if (!input.allowAnonymous) {
        return { mode: "disabled" };
    }
    if (input.bindHost !== undefined && LOOPBACK_BIND_HOSTS.has(input.bindHost)) {
        return { mode: "anonymous", bindHost: input.bindHost };
    }
    throw new Error("Unauthenticated PTY requires an explicit loopback bind host");
}
