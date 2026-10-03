module.exports = {
/***/ "./src/refresh-git-token.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   E: () => (/* binding */ refreshGitTokenForCurrentWorkspace)
/* harmony export */ });
/* harmony import */ var _anysphere_local_exec__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../local-exec/dist/index.js");
/* harmony import */ var _workspace_discovery_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("./src/workspace-discovery.ts");


async function refreshGitTokenForCurrentWorkspace(ctx, gitService, accessToken, hostname, workspacePath = process.cwd(), options = {}) {
    const workspaceDiscovery = await (0,_workspace_discovery_js__WEBPACK_IMPORTED_MODULE_1__/* .discoverExecDaemonWorkspacePaths */ .MH)(ctx, new _anysphere_local_exec__WEBPACK_IMPORTED_MODULE_0__/* .LocalGitExecutor */ .xK7(), workspacePath);
    await gitService.refreshGithubAccessToken(accessToken, hostname, {
        repoPaths: workspaceDiscovery.workspacePaths,
        verbose: options.verbose,
        repoUrl: options.repoUrl,
    });
}


/***/ },

};
