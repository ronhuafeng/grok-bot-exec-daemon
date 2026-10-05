import { LocalGitExecutor } from "../interop/vendor/local-exec.js";
import { discoverExecDaemonWorkspacePaths } from "./workspace-discovery.js";
import type { Context } from "../interop/contracts/context.js";

export async function refreshGitTokenForCurrentWorkspace(ctx: Context, gitService: Pick<import("./git.js").GitService, "refreshGithubAccessToken">, accessToken: string, hostname: string, workspacePath = process.cwd(), options: { verbose?: boolean; repoUrl?: string } = {}) {
    const workspaceDiscovery = await discoverExecDaemonWorkspacePaths(ctx, new LocalGitExecutor(), workspacePath);
    await gitService.refreshGithubAccessToken(accessToken, hostname, {
        repoPaths: workspaceDiscovery.workspacePaths,
        verbose: options.verbose,
        repoUrl: options.repoUrl,
    });
}
