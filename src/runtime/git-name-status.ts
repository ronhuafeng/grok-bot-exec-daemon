
/**
 * Parsers for `git diff -z` list output, used when a diff is too large to
 * read contents for and only names and numstat are wanted.
 */
export const ABSENT_OBJECT_ID = /^0+$/;
export const GITLINK_MODE = "160000";
export function nulTokens(output: string) {
    const tokens = output.split("\0");
    if (tokens[tokens.length - 1] === "") {
        tokens.pop();
    }
    return tokens;
}
export function blobId(mode: string, id: string) {
    return mode === GITLINK_MODE || ABSENT_OBJECT_ID.test(id) ? undefined : id;
}
/**
 * `git diff --raw -z --no-abbrev`: `:<old mode> <new mode> <old id> <new id> <status>\0<path>\0`,
 * renames/copies `...<status>\0<old>\0<new>\0`.
 */
export function parseRawDiffZ(output: string) {
    const tokens = nulTokens(output);
    const entries = [];
    for (let i = 0; i < tokens.length;) {
        const header = tokens[i++];
        if (header === undefined || !header.startsWith(":")) {
            break;
        }
        const [fromMode = "", toMode = "", fromId = "", toId = "", status = ""] = header
            .slice(1)
            .split(" ");
        const fromBlob = blobId(fromMode, fromId);
        const toBlob = blobId(toMode, toId);
        const kind = status[0];
        if (kind === "R" || kind === "C") {
            const from = tokens[i++] ?? "";
            const to = tokens[i++] ?? "";
            entries.push({ status, from, to, fromBlob, toBlob });
            continue;
        }
        const filePath = tokens[i++] ?? "";
        entries.push({
            status,
            from: kind === "A" ? "/dev/null" : filePath,
            to: kind === "D" ? "/dev/null" : filePath,
            fromBlob,
            toBlob,
        });
    }
    return entries;
}
/**
 * `git diff --numstat -z`: `<added>\t<removed>\t<path>\0`, renames/copies
 * `<added>\t<removed>\t\0<old>\0<new>\0`. Keyed by the new path; binary files
 * (`-\t-`) count as 0/0.
 */
export function parseNumstatZ(output: string) {
    const tokens = nulTokens(output);
    const counts = new Map<string, { added: number; removed: number }>();
    for (let i = 0; i < tokens.length;) {
        const record = tokens[i++];
        if (record === undefined || record === "") {
            break;
        }
        const [added = "-", removed = "-", inlinePath = ""] = record.split("\t");
        let filePath = inlinePath;
        if (filePath === "") {
            i += 1; // old path
            filePath = tokens[i++] ?? "";
        }
        counts.set(filePath, {
            added: Number.parseInt(added, 10) || 0,
            removed: Number.parseInt(removed, 10) || 0,
        });
    }
    return counts;
}
/**
 * The `core.bigFileThreshold` at which `git diff --numstat --no-renames`,
 * which counts a file with a blob above it as binary without reading either
 * side, reads at most `budget` bytes: files are admitted smallest first while
 * both of their sides fit. An absent side of an add or delete is 0 bytes.
 */
export function numstatBigFileThreshold(files: readonly { fromBytes: number; toBytes: number }[], budget: number) {
    const pairs = files
        .map(({ fromBytes, toBytes }) => ({
        largest: Math.max(fromBytes, toBytes),
        total: fromBytes + toBytes,
    }))
        .sort((a, b) => a.largest - b.largest);
    let spent = 0;
    let threshold = 0;
    for (const pair of pairs) {
        if (spent + pair.total > budget) {
            // git still diffs a blob exactly at the threshold, so a tie with the
            // first pair that does not fit must fall below it.
            return Math.min(threshold, pair.largest - 1);
        }
        spent += pair.total;
        threshold = pair.largest;
    }
    return threshold;
}
