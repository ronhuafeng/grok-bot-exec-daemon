
export function parseTraceAttributes(value: string): Record<string, string> {
    if (value.trim() === "") {
        return {};
    }
    const attributes: Record<string, string> = {};
    for (const rawPair of value.split(",")) {
        const pair = rawPair.trim();
        const separatorIndex = pair.indexOf("=");
        if (separatorIndex <= 0) {
            throw new Error(`Invalid trace attribute: ${rawPair}. Expected key=value.`);
        }
        const key = pair.slice(0, separatorIndex).trim();
        const attributeValue = pair.slice(separatorIndex + 1).trim();
        if (key.length === 0) {
            throw new Error(`Invalid trace attribute: ${rawPair}. Attribute key cannot be empty.`);
        }
        attributes[key] = attributeValue;
    }
    return attributes;
}
