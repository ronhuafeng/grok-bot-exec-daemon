// Exact retained private values from the installed setup dependency closure.
import { loadPrivateModule } from "./loader.js";

const dependency = loadPrivateModule("setup");
export const ensureCanvasSkillSdkMirror = dependency.ensureCanvasSkillSdkMirror;
export const getProjectDir = dependency.getProjectDir;
export const DEFAULT_RENDERER_CONFIG = dependency.DEFAULT_RENDERER_CONFIG;
export const generateRenderPlan = dependency.generateRenderPlan;
export const renderFromPlan = dependency.renderFromPlan;
export const CliHooksExecutor = dependency.CliHooksExecutor;
export const HooksConfigLoader = dependency.HooksConfigLoader;
export const ListableHooksResourceAccessor = dependency.ListableHooksResourceAccessor;
export const MutableHooksConfigLeaseImpl = dependency.MutableHooksConfigLeaseImpl;
export const NodeFileReader = dependency.NodeFileReader;
export const getCloudManagedTeamHooksPath = dependency.getCloudManagedTeamHooksPath;
export const getHooksConfigPaths = dependency.getHooksConfigPaths;
export const hasAnyHooks = dependency.hasAnyHooks;
