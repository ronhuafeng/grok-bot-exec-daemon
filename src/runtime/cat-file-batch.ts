
/**
 * Incremental parser for `git cat-file --batch` stdout. Each request yields
 * either `<oid> <type> <size>\n<size bytes>\n` or `<spec> missing\n` (or
 * `ambiguous`), in request order. Bodies are decoded from exactly `size`
 * bytes, so a multibyte character can never straddle a chunk boundary.
 *
 * Only blobs are file contents. A `<rev>:<path>` that names a submodule
 * gitlink resolves to a commit (when the superproject happens to hold that
 * object), and a tree or tag can be named the same way; those bodies are
 * consumed and reported as `undefined`, like a missing object.
 */
export class CatFileBatchOutputParser {
    expectedCount: number;
    /** Decoded contents per request; `undefined` for a missing or non-blob object. */
    results: (string | undefined)[] = [];
    pending: Buffer = Buffer.alloc(0);
    bodyRemaining = -1;
    bodyIsBlob = false;
    bodyChunks: Buffer[] = [];
    constructor(expectedCount: number) {
        this.expectedCount = expectedCount;
    }
    push(chunk: Buffer) {
        this.pending = this.pending.length === 0 ? chunk : Buffer.concat([this.pending, chunk]);
        for (;;) {
            if (this.bodyRemaining < 0) {
                const newline = this.pending.indexOf(0x0a);
                if (newline < 0) {
                    return;
                }
                const header = this.pending.subarray(0, newline).toString("utf8");
                this.pending = this.pending.subarray(newline + 1);
                const match = /^[0-9a-f]{40,64} (blob|tree|commit|tag) (\d+)$/.exec(header);
                if (match === null) {
                    this.results.push(undefined);
                    continue;
                }
                this.bodyIsBlob = match[1] === "blob";
                this.bodyRemaining = Number(match[2]);
                this.bodyChunks = [];
            }
            const take = Math.min(this.bodyRemaining, this.pending.length);
            if (take > 0) {
                this.bodyChunks.push(this.pending.subarray(0, take));
                this.pending = this.pending.subarray(take);
                this.bodyRemaining -= take;
            }
            if (this.bodyRemaining > 0 || this.pending.length === 0) {
                return;
            }
            if (this.pending[0] !== 0x0a) {
                throw new Error("git cat-file --batch: expected a newline after the object body");
            }
            this.pending = this.pending.subarray(1);
            this.results.push(this.bodyIsBlob ? Buffer.concat(this.bodyChunks).toString("utf8") : undefined);
            this.bodyRemaining = -1;
            this.bodyChunks = [];
        }
    }
    finish() {
        if (this.bodyRemaining >= 0 || this.pending.length > 0) {
            throw new Error("git cat-file --batch: output ended mid-object");
        }
        if (this.results.length !== this.expectedCount) {
            throw new Error(`git cat-file --batch: got ${this.results.length} objects for ${this.expectedCount} requests`);
        }
        return this.results;
    }
}
/**
 * `git cat-file --batch-check` stdout: `<oid> <type> <size>` per object, or
 * `<oid> missing`. Returns blob sizes by id, leaving out missing objects and
 * non-blobs.
 */
export function parseCatFileBatchCheck(output: string) {
    const sizes = new Map<string, number>();
    for (const line of output.split("\n")) {
        const match = /^([0-9a-f]{40,64}) blob (\d+)$/.exec(line);
        if (match !== null) {
            sizes.set(match[1], Number(match[2]));
        }
    }
    return sizes;
}
