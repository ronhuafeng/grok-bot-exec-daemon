import nodePath from "node:path";
import nodeFsPromises from "node:fs/promises";
import nodeUtil from "node:util";
import { PLUGINS_CACHE_ROOT, loadPluginsFromCloudManifest } from "../interop/vendor/cursor-plugins.js";
import type { PluginContent, RawCloudPluginManifest } from "../interop/contracts/cursor-plugins.js";
import type { JsonValue } from "../interop/contracts/protobuf-runtime.js";

export const log = nodeUtil.debuglog("exec-daemon-cloud-plugins");
export const CLOUD_PLUGIN_MANIFEST_FILENAME = ".cloud-plugin-manifest.json";
export class CloudPluginsService {
    userHomeDirectory: string;
    plugins: PluginContent[] = [];
    loadPromise: Promise<PluginContent[]> | undefined;
    loadedOnce = false;
    // Starts true: the manifest has not been read yet, so the empty set is short
    // of whatever the pod was provisioned with rather than a pod given none.
    pluginSetIncomplete = true;
    constructor(userHomeDirectory: string) {
        this.userHomeDirectory = userHomeDirectory;
        void this.reload();
    }
    async getAllEnabledPlugins() {
        await this.ensureLoaded();
        if (this.plugins.length === 0 && this.loadedOnce) {
            await this.reload();
        }
        return [...this.plugins];
    }
    getLoadFailures() {
        return [];
    }
    isPluginSetIncomplete() {
        return this.pluginSetIncomplete;
    }
    async reload(): Promise<PluginContent[]> {
        if (this.loadPromise) {
            return this.loadPromise;
        }
        this.loadPromise = this.load()
            .then((plugins) => {
            this.plugins = plugins;
            this.loadedOnce = true;
            // A missing manifest reaches here too, and that genuinely means the pod
            // was provisioned with no plugins rather than that we failed to see any.
            this.pluginSetIncomplete = false;
            return plugins;
        })
            .catch((error: unknown) => {
            log("Failed to load cloud plugins: %o", error);
            this.plugins = [];
            this.loadedOnce = true;
            this.pluginSetIncomplete = true;
            return [];
        })
            .finally(() => {
            this.loadPromise = undefined;
        });
        return this.loadPromise;
    }
    async ensureLoaded() {
        if (this.loadPromise) {
            await this.loadPromise;
            return;
        }
        if (!this.loadedOnce) {
            await this.reload();
        }
    }
    async load(): Promise<PluginContent[]> {
        const cacheRoot = nodePath.join(this.userHomeDirectory, ".cursor", PLUGINS_CACHE_ROOT);
        const manifest = await this.loadManifest(cacheRoot);
        if (manifest === undefined) {
            return [];
        }
        return loadPluginsFromCloudManifest(manifest, cacheRoot, {
            log: (message) => log("%s", message),
        });
    }
    async loadManifest(cacheRoot: string): Promise<RawCloudPluginManifest | undefined> {
        try {
            const content = await nodeFsPromises.readFile(nodePath.join(cacheRoot, CLOUD_PLUGIN_MANIFEST_FILENAME), "utf-8");
            // No reviver is supplied, so the parsed data is JSON. Preserve the legacy
            // property read (including its caught null failure) before the array guard.
            const parsed: unknown = JSON.parse(content);
            if (!Array.isArray((parsed as { plugins?: JsonValue }).plugins)) {
                return undefined;
            }
            // The check above establishes the sole raw-ingestion precondition. Entry
            // validation remains with the existing loader, which can skip or reject.
            return parsed as RawCloudPluginManifest;
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return undefined;
            }
            throw error;
        }
    }
}
