
export const refreshedTokensInMemory: Record<string, { refreshToken: string }> = {};

export function getRefreshedMcpOAuthTokens() {
    const tokens = { ...refreshedTokensInMemory };
    // Clear after retrieval so tokens are only synced to DB once
    for (const key of Object.keys(refreshedTokensInMemory)) {
        delete refreshedTokensInMemory[key];
    }
    return tokens;
}

export function createEphemeralScopedTokenStorage() {
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
