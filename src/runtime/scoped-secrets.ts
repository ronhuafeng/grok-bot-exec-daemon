import { validateManagedEnvironmentNames } from "./managed-environment.js";
export interface ScopedShellArgs {
    secretScopeId?: string;
    requestScopedEnv?: NodeJS.ProcessEnv;
}
export interface ScopedSecretsInnerExecutor<Context, Args extends ScopedShellArgs, Result> {
    execute(ctx: Context, args: Args): Result;
    getCwd(conversationId?: string): Promise<string>;
    getWorkspacePath(): string;
}
export class ScopedSecretStore {
    onValuesAdded: (values: string[]) => void;
    byScope = new Map<string, { revision: number; secrets: Readonly<Record<string, string>> }>();
    everSeenNames = new Set<string>();
    constructor(onValuesAdded: (values: string[]) => void) {
        this.onValuesAdded = onValuesAdded;
    }
    /**
     * Replaces the scope's values; `revision` is the server's counter for them.
     * Same name rules as the managed environment: a name under the
     * `CURSOR_SANDBOX` filter would ride into the restore script, so it is
     * refused here before the server's validation is trusted.
     */
    set(scopeId: string, revision: number, secrets: Readonly<Record<string, string>>) {
        validateManagedEnvironmentNames(secrets);
        const copy: Record<string, string> = {};
        const values: string[] = [];
        for (const [name, value] of Object.entries(secrets)) {
            copy[name] = value;
            values.push(value);
            this.everSeenNames.add(name);
        }
        this.byScope.set(scopeId, { revision, secrets: Object.freeze(copy) });
        this.onValuesAdded(values);
    }
    get(scopeId: string) {
        return this.byScope.get(scopeId)?.secrets;
    }
    revisionOf(scopeId: string) {
        return this.byScope.get(scopeId)?.revision;
    }
    /**
     * The per-command env for a scope: every name ever held is present (as
     * `undefined`, meaning unset) and the scope's own values are set on top.
     * Undefined when the store has never held anything, so the wrapper can leave
     * args untouched on hosts that never receive scoped secrets.
     */
    requestScopedEnvFor(scopeId: string | undefined) {
        if (this.everSeenNames.size === 0) {
            return undefined;
        }
        const env: NodeJS.ProcessEnv = {};
        for (const name of this.everSeenNames) {
            env[name] = undefined;
        }
        const own = scopeId === undefined ? undefined : this.byScope.get(scopeId);
        if (own !== undefined) {
            Object.assign(env, own.secrets);
        }
        return env;
    }
}
export class ScopedSecretsShellCoreExecutor<Context, Args extends ScopedShellArgs, Result> {
    innerExecutor: ScopedSecretsInnerExecutor<Context, Args, Result>;
    store: ScopedSecretStore;
    constructor(innerExecutor: ScopedSecretsInnerExecutor<Context, Args, Result>, store: ScopedSecretStore) {
        this.innerExecutor = innerExecutor;
        this.store = store;
    }
    execute(ctx: Context, args: Args): Result {
        const requestScopedEnv = this.store.requestScopedEnvFor(args.secretScopeId);
        if (requestScopedEnv === undefined) {
            return this.innerExecutor.execute(ctx, args);
        }
        return this.innerExecutor.execute(ctx, {
            ...args,
            requestScopedEnv: { ...requestScopedEnv, ...args.requestScopedEnv },
        });
    }
    async getCwd(conversationId?: string) {
        return this.innerExecutor.getCwd(conversationId);
    }
    getWorkspacePath() {
        return this.innerExecutor.getWorkspacePath();
    }
}
