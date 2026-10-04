
export const PLUGIN_INSTALL_TIMEOUT_MS = 115000;
export const PLUGIN_INSTALL_EXTRACTION_TIMEOUT_MS = 45000;
export const PLUGIN_ARTIFACT_MAX_BYTES = 256 * 1024 * 1024;
export const PLUGIN_ARTIFACT_MAX_EXTRACTED_BYTES = PLUGIN_ARTIFACT_MAX_BYTES;
export const PLUGIN_ARTIFACT_MAX_ENTRIES = 65536;
/** GNU tar (Linux): `-rw-r--r-- user/group 1234 2024-01-15 12:00 path` */
export const TAR_VERBOSE_LISTING_GNU_SIZE_PATTERN = /^\S+\s+\S+\/\S+\s+(\d+)\s+\d{4}-\d{2}-\d{2}/;
/** BSD tar (macOS): `-rw-r--r--  0 user group  1234 May 19 12:00 path` */
export const TAR_VERBOSE_LISTING_BSD_SIZE_PATTERN = /^[dl-][rwx-]{9}\s+\d+\s+\S+\s+\S+\s+(\d+)\s+/;
export function parseTarVerboseListingSize(line: string) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
        return null;
    }
    const gnuMatch = trimmed.match(TAR_VERBOSE_LISTING_GNU_SIZE_PATTERN);
    if (gnuMatch !== null) {
        return Number.parseInt(gnuMatch[1], 10);
    }
    const bsdMatch = trimmed.match(TAR_VERBOSE_LISTING_BSD_SIZE_PATTERN);
    if (bsdMatch !== null) {
        return Number.parseInt(bsdMatch[1], 10);
    }
    return null;
}
