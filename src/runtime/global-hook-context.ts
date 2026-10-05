
/**
 * Hosted cloud-agent pods inject this when `cloud_agent_user_email_env_var`
 * is on. Private workers do not have it at daemon startup (the owner is only
 * known at ClaimWorker time); they override per claim instead.
 */
export const EXEC_DAEMON_USER_EMAIL_ENV_VAR = "CURSOR_CLOUD_AGENT_USER_EMAIL_ADDRESS";
export function resolveExecDaemonGlobalHookContext(args?: { env?: NodeJS.ProcessEnv; userEmail?: string; cursorVersion?: string }) {
    const env = args?.env ?? process.env;
    const envEmail = env[EXEC_DAEMON_USER_EMAIL_ENV_VAR]?.trim() ?? "";
    const explicitEmail = args?.userEmail?.trim() ?? "";
    return {
        cursor_version: args?.cursorVersion ?? "1.0.0",
        user_email: explicitEmail.length > 0 ? explicitEmail : envEmail.length > 0 ? envEmail : null,
    };
}
