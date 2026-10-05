import type { Agent } from "node:http";
/** HttpsProxyAgent extends agent-base.Agent, itself a node:http.Agent in the snapshot. */
declare module "../modules.js" {
  interface ExternalModules {
    "../../node_modules/.pnpm/https-proxy-agent@7.0.6/node_modules/https-proxy-agent/dist/index.js": { HttpsProxyAgent: new (proxy: string | URL) => Agent };
  }
}
declare module "./vendor.js" {
  interface SetupVendorBindings { external_node_https_namespaceObject: typeof import("node:https"); }
}
