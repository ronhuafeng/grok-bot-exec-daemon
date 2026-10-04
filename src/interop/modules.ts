// Typed contracts for the preserved runtime boundary.
export interface ExternalModules {
  "node:buffer": typeof import("node:buffer");
  "node:child_process": typeof import("node:child_process");
  "node:crypto": typeof import("node:crypto");
  "node:fs": typeof import("node:fs");
  "node:fs/promises": typeof import("node:fs/promises");
  "node:http": typeof import("node:http");
  "node:os": typeof import("node:os");
  "node:path": typeof import("node:path");
  "node:perf_hooks": typeof import("node:perf_hooks");
  "node:readline": typeof import("node:readline");
  "node:stream": typeof import("node:stream");
  "node:stream/promises": typeof import("node:stream/promises");
  "node:url": typeof import("node:url");
  "node:util": typeof import("node:util");
  "node:zlib": typeof import("node:zlib");
}
export interface VendorBindings {}
