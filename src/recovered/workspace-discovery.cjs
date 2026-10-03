module.exports = {
/***/ "./src/workspace-discovery.ts"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MH: () => (/* binding */ discoverExecDaemonWorkspacePaths)
/* harmony export */ });
/* unused harmony exports DEFAULT_EXEC_DAEMON_REPOS_ROOT, EXEC_DAEMON_REPOS_ROOT_ENV_VAR */
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("node:fs/promises");
/* harmony import */ var node_fs_promises__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(node_fs_promises__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("node:path");
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _anysphere_local_exec__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("../local-exec/dist/index.js");



const DEFAULT_EXEC_DAEMON_REPOS_ROOT = "/agent/repos";
const EXEC_DAEMON_REPOS_ROOT_ENV_VAR = "CURSOR_EXEC_DAEMON_REPOS_ROOT";
async function canonicalizePath(pathToNormalize) {
    const resolvedPath = (0,node_path__WEBPACK_IMPORTED_MODULE_1__.resolve)(pathToNormalize);
    try {
        return await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.realpath)(resolvedPath);
    }
    catch {
        return resolvedPath;
    }
}
/**
 * Discovers workspace roots for exec-daemon. When `/agent/repos` exists, we
 * treat each direct child git repo as an additional workspace while keeping the
 * daemon's primary cwd first for stable rule precedence.
 */
async function discoverExecDaemonWorkspacePaths(ctx, gitExecutor, workspacePath, options = {}) {
    const defaultWorkspacePath = await canonicalizePath(workspacePath);
    const reposRoot = await canonicalizePath(options.reposRoot ??
        process.env[EXEC_DAEMON_REPOS_ROOT_ENV_VAR] ??
        DEFAULT_EXEC_DAEMON_REPOS_ROOT);
    try {
        const reposRootStats = await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.stat)(reposRoot);
        if (!reposRootStats.isDirectory()) {
            return {
                workspacePaths: [defaultWorkspacePath],
                usesReposRoot: false,
            };
        }
    }
    catch {
        return {
            workspacePaths: [defaultWorkspacePath],
            usesReposRoot: false,
        };
    }
    let repoEntries = [];
    try {
        repoEntries = await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.readdir)(reposRoot);
    }
    catch {
        return {
            workspacePaths: [defaultWorkspacePath],
            usesReposRoot: false,
        };
    }
    const candidateRepoPaths = (await Promise.all(repoEntries.map(async (entry) => {
        const candidatePath = await canonicalizePath((0,node_path__WEBPACK_IMPORTED_MODULE_1__.join)(reposRoot, entry));
        try {
            const candidateStats = await (0,node_fs_promises__WEBPACK_IMPORTED_MODULE_0__.stat)(candidatePath);
            return candidateStats.isDirectory() ? candidatePath : undefined;
        }
        catch {
            return undefined;
        }
    }))).filter((candidatePath) => candidatePath !== undefined);
    const discoveredRepoRoots = (await Promise.all(candidateRepoPaths.map(async (candidatePath) => {
        const gitRoot = await (0,_anysphere_local_exec__WEBPACK_IMPORTED_MODULE_2__/* .findGitRoot */ .ky5)(ctx, gitExecutor, candidatePath);
        if (gitRoot === null) {
            return undefined;
        }
        const resolvedGitRoot = (0,node_path__WEBPACK_IMPORTED_MODULE_1__.resolve)(gitRoot);
        return resolvedGitRoot === candidatePath ? candidatePath : undefined;
    }))).filter((candidatePath) => candidatePath !== undefined);
    const preferredWorkspacePath = await canonicalizePath((await (0,_anysphere_local_exec__WEBPACK_IMPORTED_MODULE_2__/* .findGitRoot */ .ky5)(ctx, gitExecutor, defaultWorkspacePath)) ?? defaultWorkspacePath);
    const fallbackWorkspacePath = discoveredRepoRoots.length > 0 ? preferredWorkspacePath : defaultWorkspacePath;
    const orderedWorkspacePaths = [
        fallbackWorkspacePath,
        ...[...new Set(discoveredRepoRoots)]
            .filter((repoPath) => repoPath !== fallbackWorkspacePath)
            .sort((left, right) => left.localeCompare(right)),
    ];
    return {
        workspacePaths: [...new Set(orderedWorkspacePaths)],
        usesReposRoot: true,
    };
}


/***/ },

};
