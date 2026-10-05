import type { IncomingMessage } from "node:http";
/** The daemon uses the ws server's default nodebuffer binaryType. */
export interface WebSocket {
  readonly readyState: number;
  on(event: "message", listener: (data: Buffer, isBinary: boolean) => void): this;
  on(event: "close", listener: (code: number, reason: Buffer) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  send(data: string | Uint8Array, callback?: (error?: Error) => void): void;
  close(code?: number, reason?: string | Buffer): void;
}
export interface WebSocketServer {
  on(event: "connection", listener: (socket: WebSocket, request: IncomingMessage) => void): this;
  on(event: "error", listener: (error: Error) => void): this;
  close(callback?: (error?: Error) => void): void;
}
declare module "../modules.js" {
  interface ExternalModules {
    "../../node_modules/.pnpm/ws@8.21.3/node_modules/ws/wrapper.mjs": { zu: new (options: { port: number; host?: string }) => WebSocketServer };
  }
}
