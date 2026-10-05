import { createConnectRouter } from "../interop/vendor/connect-router.js";
import type { IncomingMessage } from "node:http";
import type { WebSocket, WebSocketServer } from "../interop/contracts/websocket.js";
import type { ConnectRouter, ConnectRouterOptions, UniversalHandler, UniversalServerRequest } from "../interop/contracts/connect.js";
import type { JsonValue } from "../interop/contracts/protobuf-runtime.js";
export interface WebSocketAdapterOptions extends ConnectRouterOptions {
    routes(router: ConnectRouter): void;
    authenticate?(request: IncomingMessage): boolean | Promise<boolean>;
}
export interface WebSocketMessageTypes {
    REQUEST: 1; CANCEL: 2; RESPONSE: 3; RESPONSE_HEADERS: 4; RESPONSE_END: 5; ERROR: 6;
    [number: number]: string;
}
/** Only JSON provenance is known here; these fields are not protocol-validated. */
export type RawWebSocketFrame = Record<string, JsonValue | undefined>;
export type WebSocketRequestKey = JsonValue | undefined;
export type WebSocketActiveRequests = Map<WebSocketRequestKey, { abortController: AbortController }>;
export type WebSocketHandlers = Map<WebSocketRequestKey, UniversalHandler>;
export type WebSocketReply =
    | { type: 3; requestId: WebSocketRequestKey; body: string }
    | { type: 4; requestId: WebSocketRequestKey; status: number; headers: Record<string, string> }
    | { type: 5; requestId: WebSocketRequestKey; trailers: Record<string, string> }
    | { type: 6; requestId: WebSocketRequestKey; code: string; message: string };

/**
 * WebSocket adapter for ConnectRPC server-side transport.
 *
 * This adapter allows exposing ConnectRPC services over WebSocket connections,
 * supporting headers, cancellation, and server-side streaming.
 *
 * Copyright Anysphere Inc.
 */
/**
 * Message types for the WebSocket protocol
 */
export var WebSocketMessageType: WebSocketMessageTypes | undefined;
(function (WebSocketMessageType: WebSocketMessageTypes) {
    /** Client sends a request to invoke an RPC */
    WebSocketMessageType[WebSocketMessageType["REQUEST"] = 1] = "REQUEST";
    /** Client sends a cancellation signal */
    WebSocketMessageType[WebSocketMessageType["CANCEL"] = 2] = "CANCEL";
    /** Server sends response data (can be multiple for streaming) */
    WebSocketMessageType[WebSocketMessageType["RESPONSE"] = 3] = "RESPONSE";
    /** Server sends response headers */
    WebSocketMessageType[WebSocketMessageType["RESPONSE_HEADERS"] = 4] = "RESPONSE_HEADERS";
    /** Server sends response trailers and signals end of stream */
    WebSocketMessageType[WebSocketMessageType["RESPONSE_END"] = 5] = "RESPONSE_END";
    /** Server sends an error */
    WebSocketMessageType[WebSocketMessageType["ERROR"] = 6] = "ERROR";
})(WebSocketMessageType || (WebSocketMessageType = {} as WebSocketMessageTypes));
/**
 * Creates a WebSocket handler that serves ConnectRPC services.
 *
 * @param wss - WebSocket server instance
 * @param options - Adapter options including routes
 */
export function connectWebSocketAdapter(wss: WebSocketServer, options: WebSocketAdapterOptions) {
    const router = createConnectRouter(options);
    options.routes(router);
    // Build path -> handler map
    const handlers: WebSocketHandlers = new Map<WebSocketRequestKey, UniversalHandler>();
    for (const handler of router.handlers) {
        handlers.set(handler.requestPath, handler);
    }
    wss.on("connection", (ws, request) => {
        // Authenticate if handler provided
        const authPromise = options.authenticate
            ? Promise.resolve(options.authenticate(request))
            : Promise.resolve(true);
        authPromise
            .then((authenticated) => {
            if (!authenticated) {
                ws.close(4001, "Unauthorized");
                return;
            }
            handleConnection(ws, handlers);
        })
            .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "Auth error";
            ws.close(4001, message);
        });
    });
}
/**
 * Handle an authenticated WebSocket connection
 */
export function handleConnection(ws: WebSocket, handlers: WebSocketHandlers) {
    const activeRequests: WebSocketActiveRequests = new Map<WebSocketRequestKey, { abortController: AbortController }>();
    ws.on("message", (data: Buffer | string) => {
        let message: unknown;
        try {
            const messageStr = typeof data === "string" ? data : data.toString("utf8");
            message = JSON.parse(messageStr);
        }
        catch {
            sendError(ws, "", "INVALID_MESSAGE", "Failed to parse message");
            return;
        }
        // Keep the original uncaught null property-read failure; no packet validator is added.
        switch ((message as { type?: unknown }).type) {
            case WebSocketMessageType!.REQUEST:
                // A numeric JSON object field selects the branch, but all other fields stay raw.
                handleRequest(ws, handlers, activeRequests, message as RawWebSocketFrame);
                break;
            case WebSocketMessageType!.CANCEL:
                handleCancel(activeRequests, message as RawWebSocketFrame);
                break;
            default:
                sendError(ws, "", "UNKNOWN_MESSAGE_TYPE", "Unknown message type");
        }
    });
    ws.on("close", () => {
        // Abort all active requests when connection closes
        for (const ctx of activeRequests.values()) {
            ctx.abortController.abort();
        }
        activeRequests.clear();
    });
    ws.on("error", () => {
        // Abort all active requests on error
        for (const ctx of activeRequests.values()) {
            ctx.abortController.abort();
        }
        activeRequests.clear();
    });
}
/**
 * Handle an RPC request
 */
export function handleRequest(ws: WebSocket, handlers: WebSocketHandlers, activeRequests: WebSocketActiveRequests, request: RawWebSocketFrame) {
    const { requestId, path, method, headers, body } = request;
    // Check if request ID is already in use
    if (activeRequests.has(requestId)) {
        sendError(ws, requestId, "DUPLICATE_REQUEST_ID", "Request ID already in use");
        return;
    }
    // Find handler for path
    const handler = handlers.get(path);
    if (!handler) {
        sendError(ws, requestId, "NOT_FOUND", `No handler for path: ${path}`);
        return;
    }
    // Create abort controller for this request
    const abortController = new AbortController();
    activeRequests.set(requestId, { abortController });
    // Build UniversalServerRequest
    const requestHeaders = new Headers();
    for (const [key, value] of // Preserve Object.entries/Headers coercion and failures for raw JSON header values.
    Object.entries(headers as Record<string, unknown>)) {
        requestHeaders.set(key, value as string);
    }
    // Decode body through the existing native overload. Raw JSON arrays are also
    // accepted by Buffer.from; invalid values retain its original throw behavior.
    const bodyBytes = Buffer.from(body as string, "base64");
    // Create async iterable for body
    async function* bodyIterator() {
        yield bodyBytes;
    }
    const universalRequest = {
        httpVersion: "2.0", // Pretend to be HTTP/2 to allow streaming
        url: `https://websocket${path}`,
// The retained router rejects nonmatching raw methods via allowedMethods.includes
        // before invoking a protocol/core handler; this preserves that 405 path.
        method: method as UniversalServerRequest["method"],
        header: requestHeaders,
        body: bodyIterator(),
        signal: abortController.signal,
        contextValues: undefined,
    };
    // Execute handler
    handler(universalRequest)
        .then(async (response) => {
        // Check if request was cancelled
        if (abortController.signal.aborted) {
            return;
        }
        // Send response headers
        const responseHeaders: Record<string, string> = {};
        if (response.header) {
            response.header.forEach((value, key) => {
                responseHeaders[key] = value;
            });
        }
        sendMessage(ws, {
            type: WebSocketMessageType!.RESPONSE_HEADERS,
            requestId,
            status: response.status,
            headers: responseHeaders,
        });
        // Stream response body
        if (response.body) {
            try {
                for await (const chunk of response.body) {
                    // Check for cancellation between chunks
                    if (abortController.signal.aborted) {
                        break;
                    }
                    sendMessage(ws, {
                        type: WebSocketMessageType!.RESPONSE,
                        requestId,
                        body: Buffer.from(chunk).toString("base64"),
                    });
                }
            }
            catch (error) {
                if (!abortController.signal.aborted) {
                    const message = error instanceof Error ? error.message : "Stream error";
                    sendError(ws, requestId, "STREAM_ERROR", message);
                }
                return;
            }
        }
        // Send response end with trailers
        const trailers: Record<string, string> = {};
        if (response.trailer) {
            response.trailer.forEach((value, key) => {
                trailers[key] = value;
            });
        }
        sendMessage(ws, {
            type: WebSocketMessageType!.RESPONSE_END,
            requestId,
            trailers,
        });
    })
        .catch((error: unknown) => {
        if (!abortController.signal.aborted) {
            const message = error instanceof Error ? error.message : "Handler error";
            sendError(ws, requestId, "INTERNAL_ERROR", message);
        }
    })
        .finally(() => {
        activeRequests.delete(requestId);
    });
}
/**
 * Handle a cancellation request
 */
export function handleCancel(activeRequests: WebSocketActiveRequests, cancel: RawWebSocketFrame) {
    const ctx = activeRequests.get(cancel.requestId);
    if (ctx) {
        ctx.abortController.abort();
        activeRequests.delete(cancel.requestId);
    }
}
/**
 * Send a message to the WebSocket client
 */
export function sendMessage(ws: WebSocket, message: WebSocketReply) {
    if (ws.readyState === 1) {
        // WebSocket.OPEN
        ws.send(JSON.stringify(message));
    }
}
/**
 * Send an error message to the WebSocket client
 */
export function sendError(ws: WebSocket, requestId: WebSocketRequestKey, code: string, message: string) {
    sendMessage(ws, {
        type: WebSocketMessageType!.ERROR,
        requestId,
        code,
        message,
    });
}
