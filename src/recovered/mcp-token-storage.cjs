module.exports = {
/***/ "./src/mcp-token-storage.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Iw: () => (/* binding */ createEphemeralScopedTokenStorage),
/* harmony export */   w8: () => (/* binding */ getRefreshedMcpOAuthTokens)
/* harmony export */ });
/* unused harmony exports buildExecDaemonStorageIdentifier, createEnvBasedScopedTokenStorage */
/* unused harmony import specifier */ var LoggedScopedMcpTokenStorage;
/* unused harmony import specifier */ var createStructuredLifecycleLogger;
/* unused harmony import specifier */ var McpOAuthStoredData;
/* harmony import */ var _anysphere_mcp_agent_exec__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../mcp-agent-exec/dist/index.js");


const refreshedTokensInMemory = {};
function buildExecDaemonStorageIdentifier(serverUrl) {
    try {
        return `exec-daemon:${new URL(serverUrl).host}`;
    }
    catch {
        return "exec-daemon-mcp-oauth-storage";
    }
}
function getRefreshedMcpOAuthTokens() {
    const tokens = { ...refreshedTokensInMemory };
    // Clear after retrieval so tokens are only synced to DB once
    for (const key of Object.keys(refreshedTokensInMemory)) {
        delete refreshedTokensInMemory[key];
    }
    return tokens;
}
function createEnvBasedScopedTokenStorage(serverUrl, ctx, logger) {
    const urlKey = Buffer.from(serverUrl).toString("base64").replace(/[+/=]/g, "_");
    const envName = `EXEC_DAEMON_MCP_OAUTH_${urlKey}`;
    let stored;
    const loadStored = () => {
        if (stored !== undefined) {
            return stored;
        }
        const json = process.env[envName];
        if (!json) {
            return undefined;
        }
        try {
            stored = McpOAuthStoredData.fromJsonString(json);
            return stored;
        }
        catch (error) {
            logger.warn(ctx, `Failed to parse MCP OAuth data for ${serverUrl}`, {
                error,
            });
            return undefined;
        }
    };
    const storage = {
        async loadTokens() {
            const data = loadStored();
            if (!data) {
                return undefined;
            }
            // Return "expired" tokens - SDK will use refresh_token to get fresh access_token
            return {
                access_token: "",
                refresh_token: data.refreshToken,
                expires_in: 0,
                token_type: "Bearer",
            };
        },
        async saveTokens(tokens) {
            if (!tokens.refresh_token) {
                return;
            }
            logger.info(ctx, `Saving refreshed token for ${serverUrl} in memory`);
            refreshedTokensInMemory[serverUrl] = {
                refreshToken: tokens.refresh_token,
            };
        },
        async loadClientInformation() {
            const data = loadStored();
            if (!data) {
                return undefined;
            }
            return {
                client_id: data.clientId,
                client_secret: data.clientSecret,
                redirect_uris: data.redirectUris,
            };
        },
        async saveClientInformation() { },
    };
    return new LoggedScopedMcpTokenStorage({
        identifier: buildExecDaemonStorageIdentifier(serverUrl),
        serverUrl,
        logger: createStructuredLifecycleLogger({ logger, ctx }),
        inner: storage,
    });
}
function createEphemeralScopedTokenStorage() {
    return {
        async loadTokens() {
            return undefined;
        },
        async saveTokens() { },
        async loadClientInformation() {
            return undefined;
        },
        async saveClientInformation() { },
    };
}


/***/ },

};
