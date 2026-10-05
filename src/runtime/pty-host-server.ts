import { createLogger } from "../interop/vendor/context-logger.js";
import { PtyInfo, PtyEvent, PtyData, PtyExited } from "../interop/vendor/proto-agent-v1-pty-host-service-pb.js";
import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import { isClientDisconnectError } from "./errors.js";
import type { Context } from "../interop/contracts/context.js";
import type * as Proto from "../interop/contracts/protobuf-generated.js";
export type PtyHostEvent = { eventId: string; data: { type: "data"; data: Buffer } | { type: "exit"; exitCode: number; signal?: number } };
export interface PtyHostManagerPort {
    spawn(options: { process?: { shell: string; args?: string[] }; cwd?: string; env?: Record<string, string>; cols: number; rows: number }): string;
    attach(id: string, listener: (event: PtyHostEvent) => void, lastEventId?: string): { events: PtyHostEvent[] } | undefined;
    detach(id: string, listener: (event: PtyHostEvent) => void): void;
    sendInput(id: string, data: Buffer): boolean;
    resize(id: string, cols: number, rows: number): boolean;
    list(): { id: string; shell: string; cwd: string; cols: number; rows: number; pid: number; args: string[] }[];
    terminate(id: string): boolean;
}

export const logger = createLogger("pty-host-server");
/**
 * Implementation of the PtyHostService gRPC service
 */
export class PtyHostServer {
    ptyManager: PtyHostManagerPort;
    constructor(ptyManager: PtyHostManagerPort) {
        this.ptyManager = ptyManager;
    }
    async spawnPty(ctx: Context, request: Proto.agent_v1_SpawnPtyRequest) {
        logger.info(ctx, "SpawnPty request", {
            process: request.process,
            cwd: request.cwd,
            cols: request.cols,
            rows: request.rows,
        });
        try {
            const ptyId = this.ptyManager.spawn({
                process: request.process
                    ? { shell: request.process.shell, args: request.process.args }
                    : undefined,
                cwd: request.cwd,
                env: request.env,
                cols: request.cols,
                rows: request.rows,
            });
            return {
                ptyId,
            };
        }
        catch (error) {
            logger.error(ctx, "Failed to spawn PTY", { error });
            throw new ConnectError(`Failed to spawn PTY: ${error instanceof Error ? error.message : String(error)}`, Code.Internal);
        }
    }
    async *attachPty(ctx: Context, request: Proto.agent_v1_AttachPtyRequest) {
        logger.info(ctx, "AttachPty request", {
            ptyId: request.ptyId,
            lastEventId: request.lastEventId,
        });
        // Set up event queue BEFORE attaching to ensure no events are lost.
        // The listener is registered atomically with capturing historical events.
        const eventQueue: Proto.agent_v1_PtyEvent[] = [];
        let resolveNext: (() => void) | null = null;
        const listener = (event: PtyHostEvent) => {
            eventQueue.push(this.convertToPtyEvent(event));
            if (resolveNext) {
                resolveNext();
                resolveNext = null;
            }
        };
        const attachment = this.ptyManager.attach(request.ptyId, listener, request.lastEventId);
        if (!attachment) {
            throw new ConnectError(`PTY not found: ${request.ptyId}`, Code.NotFound);
        }
        const { events } = attachment;
        try {
            // Yield historical events first
            for (const event of events) {
                yield this.convertToPtyEvent(event);
            }
            // Stream new events as they arrive (listener was already capturing them)
            while (true) {
                // Wait for an event to be available
                while (eventQueue.length === 0) {
                    await new Promise<void>((resolve) => {
                        resolveNext = resolve;
                    });
                }
                const event = eventQueue.shift();
                if (event) {
                    yield event;
                    // Check if this is an exit event
                    if (event.data.case === "ptyExited") {
                        break;
                    }
                }
            }
        }
        catch (error) {
            // Client disconnect errors (e.g. timeout on client side) are expected and not worth logging as errors
            if (isClientDisconnectError(error)) {
                logger.debug(ctx, "Client disconnected during PTY streaming", {
                    ptyId: request.ptyId,
                    code: error.code,
                });
                return;
            }
            throw error;
        }
        finally {
            // Clean up the listener
            this.ptyManager.detach(request.ptyId, listener);
        }
    }
    async sendInput(ctx: Context, request: Proto.agent_v1_SendInputRequest) {
        logger.debug(ctx, "SendInput request", {
            ptyId: request.ptyId,
            dataLength: request.data.length,
        });
        const success = this.ptyManager.sendInput(request.ptyId, Buffer.from(request.data));
        if (!success) {
            throw new ConnectError(`PTY not found: ${request.ptyId}`, Code.NotFound);
        }
        return { success: true };
    }
    async resizePty(ctx: Context, request: Proto.agent_v1_ResizePtyRequest) {
        logger.info(ctx, "ResizePty request", {
            ptyId: request.ptyId,
            cols: request.cols,
            rows: request.rows,
        });
        const success = this.ptyManager.resize(request.ptyId, request.cols, request.rows);
        if (!success) {
            throw new ConnectError(`PTY not found: ${request.ptyId}`, Code.NotFound);
        }
        return { success: true };
    }
    async listPtys(ctx: Context, _request: Proto.agent_v1_ListPtysRequest) {
        logger.debug(ctx, "ListPtys request");
        const ptys = this.ptyManager.list();
        return {
            ptys: ptys.map((pty) => new PtyInfo({
                ptyId: pty.id,
                shell: pty.shell,
                cwd: pty.cwd,
                cols: pty.cols,
                rows: pty.rows,
                pid: pty.pid,
                processArgs: pty.args,
            })),
        };
    }
    async terminatePty(ctx: Context, request: Proto.agent_v1_TerminatePtyRequest) {
        logger.info(ctx, "TerminatePty request", { ptyId: request.ptyId });
        const success = this.ptyManager.terminate(request.ptyId);
        if (!success) {
            throw new ConnectError(`PTY not found: ${request.ptyId}`, Code.NotFound);
        }
        return { success: true };
    }
    /**
     * Converts internal PtyEvent to protobuf PtyEvent
     */
    convertToPtyEvent(event: PtyHostEvent) {
        if (event.data.type === "data") {
            return new PtyEvent({
                eventId: event.eventId,
                data: {
                    case: "ptyData",
                    value: new PtyData({
                        data: new Uint8Array(event.data.data),
                    }),
                },
            });
        }
        return new PtyEvent({
            eventId: event.eventId,
            data: {
                case: "ptyExited",
                value: new PtyExited({
                    exitCode: event.data.exitCode,
                    signal: event.data.signal,
                }),
            },
        });
    }
}
