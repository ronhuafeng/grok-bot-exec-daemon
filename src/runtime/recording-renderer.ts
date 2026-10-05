import { generateRenderPlan, DEFAULT_RENDERER_CONFIG, renderFromPlan } from "../interop/vendor/setup-private.js";
export class ExecDaemonPolishedRecordingRenderer {
    assertAvailable() { }
    async renderRecordingSession(options: { stagingSessionDir: string; fps?: number; outputVideoPath: string; includeBrandTag?: boolean }) {
        const plan = await generateRenderPlan({
            sessionDir: options.stagingSessionDir,
            fps: options.fps,
        }, DEFAULT_RENDERER_CONFIG);
        if (plan.diagnostics.errors.length > 0) {
            throw new Error(`Plan generation failed: ${plan.diagnostics.errors.join(", ")}`);
        }
        await renderFromPlan({
            plan,
            outputVideoPath: options.outputVideoPath,
            outputWidth: 0,
            sessionDir: options.stagingSessionDir,
            includeBrandTag: options.includeBrandTag,
        });
    }
}
