module.exports = {
/***/ "./src/serveCommand.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  E: () => (/* binding */ collectUnknownServeOptions),
  l: () => (/* binding */ createServeCommand)
});

// EXTERNAL MODULE: ../../node_modules/.pnpm/@commander-js+extra-typings@14.0.0_commander@15.0.0/node_modules/@commander-js/extra-typings/esm.mjs
var esm = __webpack_require__("../../node_modules/.pnpm/@commander-js+extra-typings@14.0.0_commander@15.0.0/node_modules/@commander-js/extra-typings/esm.mjs");
;// ./src/trace-attributes.ts
function parseTraceAttributes(value) {
    if (value.trim() === "") {
        return {};
    }
    const attributes = {};
    for (const rawPair of value.split(",")) {
        const pair = rawPair.trim();
        const separatorIndex = pair.indexOf("=");
        if (separatorIndex <= 0) {
            throw new Error(`Invalid trace attribute: ${rawPair}. Expected key=value.`);
        }
        const key = pair.slice(0, separatorIndex).trim();
        const attributeValue = pair.slice(separatorIndex + 1).trim();
        if (key.length === 0) {
            throw new Error(`Invalid trace attribute: ${rawPair}. Attribute key cannot be empty.`);
        }
        attributes[key] = attributeValue;
    }
    return attributes;
}

;// ./src/serveCommand.ts


/**
 * Builds the `serve` subcommand definition (options only — the caller attaches
 * `.action()`). Extracted from index.ts so the exact CLI surface — including its
 * unknown-option tolerance — is unit-testable without booting the daemon.
 *
 * WHY UNKNOWN-OPTION TOLERANCE (the reason #159039 was reverted): the in-box
 * exec-daemon binary is a PREBUILT bundle downloaded from S3, NOT compiled from
 * the box image's source tree, and the box's committed launcher
 * (`sand/box/supervision/start-exec-daemon.sh`) can be a newer revision than that bundle.
 * commander is strict on unknown options by default, so when the original PR
 * taught the launcher to pass a brand-new `--computer-use-lazy-init` flag, a
 * stale daemon bundle that predated the flag exited 1 with
 * `error: unknown option '--computer-use-lazy-init'` — the whole exec-daemon
 * failed to start (far worse than the missing-handler bug it was fixing).
 *
 * `serve` is invoked only by machine-generated launchers (the Sand box launcher
 * and the cloud-agent podConfig generator), never typed by a human, so a stray
 * option is a generator bug (caught by tests) rather than a user typo. Tolerating
 * unknown options here makes it impossible for a future launcher flag to ever
 * brick an older daemon again. Known flags are still declared and parsed
 * normally; any tolerated leftovers are surfaced by {@link collectUnknownServeOptions}
 * so the caller can log them and typos stay visible.
 *
 * The primary guard is still launcher-side (the launcher probes
 * `serve --help` and only passes a flag the bundled binary advertises); this is
 * the belt-and-suspenders daemon-side layer.
 */
function createServeCommand() {
    return (new esm/* Command */.uB("serve")
        .description("Start the exec daemon server")
        .option("-p, --port <port>", "Server port", (val) => parseInt(val, 10), 8080)
        .option("--pty-websocket-port <port>", "WebSocket port for PTY host service", (val) => parseInt(val, 10), 8081)
        .requiredOption("--auth-token <token>", "Authentication token (required)")
        .option("--pty-auth-token <token>", "Authentication token for PTY WebSocket RPCs")
        .addOption(new esm/* Option */.c$("--log-level <level>", "Log level").choices([
        "debug",
        "info",
        "warn",
        "error",
    ]))
        .option("--rg-path <path>", "Path to ripgrep executable", "rg")
        .option("--browser-enabled", "Enable browser automation", false)
        // --cursor-self-control-enabled is deprecated in favor of CUA-based testing for Cursor
        .option("--cursor-self-control-enabled", "Enable cursor self control (deprecated, use CUA-based testing for Cursor instead)", false)
        .option("--mcp-config <json>", "MCP configuration JSON")
        .option("--mcp-oauth-server-urls <json>", "JSON array of MCP server URLs that use OAuth tokens")
        .option("--http-mcp-tools-file <path>", "Path to a JSON file containing HTTP MCP tool definitions (avoids CLI arg size limits)")
        .option("--cloud-rules-enabled", "Enable cloud rules", false)
        .option("--computer-use-enabled", "Enable computer use", false)
        .option("--computer-use-lazy-init", "Initialize computer use lazily on first use; default off keeps eager startup init", false)
        .option("--computer-use-api-width <pixels>", "Computer-use screenshot width; height follows configured display aspect (default: 1280-wide). WARNING: do not change this when --record-screen-enabled — RecordScreen polished rendering only works at the default 1280 API width.", (val) => parseInt(val, 10))
        .option("--computer-use-api-height <pixels>", "Computer-use screenshot height; omit to derive from configured display aspect", (val) => parseInt(val, 10))
        .option("--desktop-lease-enforce", "Reject computer actions that carry no desktop-lease actor; default off keeps legacy callers working", false)
        .option("--machine-resources-enabled", "Sample memory / CPU / disk every 5 s for ControlService.GetResourceUsage", false)
        .option("--agent-store-fuse-liveness-kill", "After two consecutive hung FUSE probes, SIGTERM then SIGKILL the in-pod FUSE (PID-reuse guarded)", false)
        .option("--chrome-executable-path <path>", "Chrome executable path")
        .option("--tmux-service-enabled", "Enable tmux session service", false)
        .option("--tmux-path <path>", "Path to tmux executable")
        .option("--tmux-conf-path <path>", "Path to tmux config file")
        .option("--record-screen-enabled", "Enable screen recording", false)
        .option("--origin-cli-enabled", "Put the bundled Origin CLI (`origin`) on PATH for agent commands", false)
        .option("--orbitd-proxy-socket <path>", "Report marked Sand browser operations to Orbit through the orbitd proxy socket")
        .option("--agent-store-conflict-notices", "Drain agent-store FUSE conflict journal into tool-result hook carriers", false)
        .option("--agent-store-quota-notices", "Include agent-store quota_exceeded journal rows in conflict-notice carriers", false)
        .option("--generate-image-enabled", "Enable generate image tool", false)
        .option("--nested-claude-hook-output-normalization-enabled", "Enable nested Claude hookSpecificOutput normalization compatibility", false)
        .option("--command-hook-stdin-transport-enabled", "Deliver command hook payloads through stdin instead of legacy argv wrappers", false)
        .option("--project-dir <path>", "Overrides the project directory for the exec daemon")
        .option("--mcp-meta-tool-enabled", "Enable MCP meta-tool (GetMcpTools) discovery mode", false)
        .option("--session-mcp-enabled", "Expose discovery for MCP servers loaded after daemon startup", false)
        .option("--strip-agent-skill-content", "Omit AgentSkill.content from request context for non-plugin skills", false)
        .option("--filter-model-disabled-skills", "Omit disable-model-invocation skills from request context", false)
        .option("--agent-store-skills-dir <path>", "Skill discovery root for a mounted Agent Store, as resolved by the launcher. Repeatable when a pod mounts more than one store skills dir. Omitted means the store contributes no skills.", (value, previous) => previous === undefined ? [value] : [...previous, value])
        .option("--mcp-meta-tool-slim-descriptors", "Omit per-tool MCP descriptions/schemas from meta-tool descriptors", false)
        .option("--mcp-input-schema-json", "Carry remaining MCP schemas as flat JSON strings instead of nested Values", false)
        .option("--sandbox-enabled", "Enable sandbox-aware shell execution", false)
        .option("--sandbox-helper-path <path>", "Path to cursorsandbox binary for sandbox enforcement")
        .option("--sandbox-policy <json>", "Sandbox policy JSON")
        .option("--read-only-bare-mode", "Enable read-only bare repo mode for shared pods", false)
        .option("--read-only-bare-repo-path <path>", "Path to the bare git repository (used with --read-only-bare-mode)", "/workspace/readonly-pod-bare.git")
        .option("--claude-md-enabled", "Enable claude.md loading", true)
        .option("--no-claude-md-enabled", "Disable claude.md loading")
        .option("--trace-endpoint <url>", "Backend URL for sending OpenTelemetry traces (e.g., https://api2.cursor.sh)")
        .option("--trace-auth-token <token>", "Access token for authenticating trace requests to the backend")
        .option("--ghost-mode <boolean>", "Enable ghost/privacy mode (disables tracing)", (val) => val === "true", true)
        .option("--trace-insecure <boolean>", "Skip SSL certificate verification for trace endpoint (for local development)", (val) => val === "true", false)
        .option("--trace-attributes <attributes>", 'Comma-separated trace resource attributes as key=value pairs (e.g. "runner_cluster=us1,region=iad")', parseTraceAttributes)
        // Tolerate unknown options / excess operands on the serve path so a newer
        // launcher flag can never brick an older daemon binary (see file header).
        // allowUnknownOption keeps commander from erroring on an unrecognized
        // `--flag`; allowExcessArguments is required alongside it because commander
        // reclassifies a tolerated unknown option as an excess operand, which would
        // otherwise still error.
        .allowUnknownOption()
        .allowExcessArguments());
}
/**
 * Returns the option-looking tokens commander tolerated (via
 * allowUnknownOption/allowExcessArguments) but did not recognize, so the caller
 * can log them at startup. Keeping them visible means a generator typo in a known
 * flag degrades to a logged warning instead of silently changing behavior.
 */
function collectUnknownServeOptions(args) {
    return args.filter((arg) => arg.startsWith("-"));
}


/***/ },

};
