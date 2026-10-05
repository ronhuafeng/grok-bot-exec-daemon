
/**
 * Parses a comma-separated name list, preserving first-seen order.
 */
export function parseCommaSeparatedNames(value: string | undefined): string[] {
    const names = new Set<string>();
    if (value === undefined) {
        return [];
    }
    for (const name of value.split(",")) {
        const trimmedName = name.trim();
        if (trimmedName.length > 0) {
            names.add(trimmedName);
        }
    }
    return [...names];
}
