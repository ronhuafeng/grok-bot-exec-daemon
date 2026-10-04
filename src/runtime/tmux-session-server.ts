import { createLogger } from "../interop/vendor/context-logger.js";
import { TmuxSession } from "../interop/vendor/proto-agent-v1-tmux-session-service-pb.js";
import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import { TmuxValidationError, TmuxSessionAlreadyExistsError } from "./tmux-session-manager.js";
import type { Context } from "../interop/contracts/context.js";
import type * as Proto from "../interop/contracts/protobuf-generated.js";
import type { TmuxSessionManager } from "./tmux-session-manager.js";

export const logger = createLogger("tmux-session-server");
export function toProtoSession(session: ReturnType<TmuxSessionManager["createSessionRecord"]>) {
    return new TmuxSession({
        sessionId: session.sessionId,
        sessionName: session.sessionName,
        displayName: session.displayName,
        kind: session.kind,
        cwd: session.cwd,
        shell: session.shell,
        processArgs: session.processArgs,
        createdAtUnixMs: BigInt(session.createdAtUnixMs),
        attachedClientCount: session.attachedClientCount,
    });
}
export class TmuxSessionServer {
    tmuxSessionManager: TmuxSessionManager;
    constructor(tmuxSessionManager: TmuxSessionManager) {
        this.tmuxSessionManager = tmuxSessionManager;
    }
    throwInternalError(args: { ctx: Context; message: string; details?: Record<string, unknown> }): never {
        logger.error(args.ctx, args.message, args.details ?? {});
        throw new ConnectError(args.message, Code.Internal);
    }
    async createSession(ctx: Context, request: Proto.agent_v1_CreateTmuxSessionRequest) {
        logger.info(ctx, "CreateSession request", {
            sessionName: request.sessionName,
            displayName: request.displayName,
            kind: request.kind,
            cwd: request.cwd,
        });
        if (request.sessionName && !this.tmuxSessionManager.isValidSessionName(request.sessionName)) {
            throw new ConnectError("Invalid tmux session name", Code.InvalidArgument);
        }
        if (request.process && !request.process.shell) {
            throw new ConnectError("Process shell is required", Code.InvalidArgument);
        }
        try {
            const session = await this.tmuxSessionManager.createSession({
                sessionName: request.sessionName,
                displayName: request.displayName,
                kind: request.kind,
                process: request.process
                    ? {
                        shell: request.process.shell,
                        args: request.process.args,
                    }
                    : undefined,
                cwd: request.cwd,
                env: request.env,
            });
            return {
                session: toProtoSession(session),
            };
        }
        catch (error) {
            if (error instanceof TmuxValidationError) {
                logger.error(ctx, "Failed to create tmux session", {
                    error: error.message,
                });
                throw new ConnectError(error.message, Code.InvalidArgument);
            }
            if (error instanceof TmuxSessionAlreadyExistsError) {
                logger.error(ctx, "Failed to create tmux session", {
                    error: error.message,
                });
                throw new ConnectError(error.message, Code.AlreadyExists);
            }
            logger.error(ctx, "Failed to create tmux session", {
                sessionName: request.sessionName,
            });
            throw new ConnectError("Failed to create tmux session", Code.Internal);
        }
    }
    async listSessions(ctx: Context, _request: Proto.agent_v1_ListTmuxSessionsRequest) {
        try {
            const sessions = await this.tmuxSessionManager.listSessions();
            return {
                sessions: sessions.map(toProtoSession),
            };
        }
        catch {
            this.throwInternalError({
                ctx,
                message: "Failed to list tmux sessions",
            });
        }
    }
    async killSession(ctx: Context, request: Proto.agent_v1_KillTmuxSessionRequest) {
        if (!request.sessionId) {
            throw new ConnectError("session_id is required", Code.InvalidArgument);
        }
        const success = await (async () => {
            try {
                return await this.tmuxSessionManager.killSession(request.sessionId);
            }
            catch {
                return this.throwInternalError({
                    ctx,
                    message: "Failed to kill tmux session",
                    details: { sessionId: request.sessionId },
                });
            }
        })();
        if (!success) {
            throw new ConnectError(`Tmux session not found: ${request.sessionId}`, Code.NotFound);
        }
        logger.info(ctx, "KillSession request", { sessionId: request.sessionId });
        return {
            success: true,
        };
    }
    async attachSession(ctx: Context, request: Proto.agent_v1_AttachTmuxSessionRequest) {
        if (!request.sessionId) {
            throw new ConnectError("session_id is required", Code.InvalidArgument);
        }
        if (!request.cols) {
            throw new ConnectError("cols is required", Code.InvalidArgument);
        }
        if (!request.rows) {
            throw new ConnectError("rows is required", Code.InvalidArgument);
        }
        const attachment = await (async () => {
            try {
                return await this.tmuxSessionManager.attachSession({
                    sessionId: request.sessionId,
                    cols: request.cols,
                    rows: request.rows,
                });
            }
            catch {
                return this.throwInternalError({
                    ctx,
                    message: "Failed to attach tmux session",
                    details: { sessionId: request.sessionId },
                });
            }
        })();
        if (!attachment) {
            throw new ConnectError(`Tmux session not found: ${request.sessionId}`, Code.NotFound);
        }
        logger.info(ctx, "AttachSession request", {
            sessionId: request.sessionId,
            ptyId: attachment.ptyId,
        });
        return {
            ptyId: attachment.ptyId,
            session: toProtoSession(attachment.session),
        };
    }
}
