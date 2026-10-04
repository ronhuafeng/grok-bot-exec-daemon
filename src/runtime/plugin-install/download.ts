import { ConnectError } from "../../interop/vendor/connect-connect-error.js";
import { Code } from "../../interop/vendor/connect-code.js";
import nodeFs from "node:fs";
import nodeStream from "node:stream";
import nodeStreamPromises from "node:stream/promises";
import { PLUGIN_ARTIFACT_MAX_BYTES } from "./limits.js";
export function createPluginArtifactByteLimitTransform(maxBytes: number) {
    let bytesWritten = 0;
    return new nodeStream.Transform({
        transform(chunk: Buffer | string, _encoding, callback) {
            const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            if (bytesWritten + chunkBuffer.length > maxBytes) {
                callback(new Error("plugin artifact too large"));
                return;
            }
            bytesWritten += chunkBuffer.length;
            callback(null, chunkBuffer);
        },
    });
}
export async function downloadPluginArtifactToFile(params: { fetchImpl: typeof fetch; downloadUrl: string; timeoutMs: number; destinationPath: string }) {
    const response = await params.fetchImpl(params.downloadUrl, {
        method: "GET",
        signal: AbortSignal.timeout(params.timeoutMs),
    });
    if (!response.ok) {
        throw new ConnectError(`artifact download failed with HTTP ${response.status}`, Code.Internal);
    }
    const contentLengthHeader = response.headers.get("content-length");
    if (contentLengthHeader !== null) {
        const contentLength = Number.parseInt(contentLengthHeader, 10);
        if (Number.isFinite(contentLength) && contentLength > PLUGIN_ARTIFACT_MAX_BYTES) {
            throw new ConnectError("plugin artifact exceeds size limit", Code.InvalidArgument);
        }
    }
    if (response.body === null) {
        throw new ConnectError("plugin artifact download had no body", Code.Internal);
    }
    const limitedBody = nodeStream.Readable.fromWeb(response.body).pipe(createPluginArtifactByteLimitTransform(PLUGIN_ARTIFACT_MAX_BYTES));
    await nodeStreamPromises.pipeline(limitedBody, nodeFs.createWriteStream(params.destinationPath, { flags: "wx", mode: 0o666 }));
}
