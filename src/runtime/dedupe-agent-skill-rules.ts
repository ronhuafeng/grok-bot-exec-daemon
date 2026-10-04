
import type { Context } from "../interop/contracts/context.js";
import type { agent_v1_CursorRule, agent_v1_AgentSkill } from "../interop/contracts/protobuf-generated.js";

/**
 * Drop the `agentFetched` skill rules that duplicate `RequestContext.agentSkills`.
 *
 * On a cloud-agent VM, skills must stay in the cursor-rules merge: their
 * `getAllCursorRules()` is the only source of always-apply skills (emitted as
 * `global` rules) and plugin `rules/` entries, neither of which appears in
 * `agentSkills`. But the same services ALSO emit an `agentFetched` `CursorRule`
 * carrying the same `SKILL.md` body for every non-always-apply skill, so that
 * body would be serialized twice into the per-turn, blob-stored request context.
 *
 * The match is intentionally narrow — `agentFetched` rules whose path is in
 * `agentSkills`. Always-apply skills (`global` rules) and plugin `rules/`
 * entries are not `agentFetched` / not in `agentSkills`, so they are preserved.
 *
 * This mirrors the IDE's `removeDuplicatedAgentSkillRulesForRequestContext` in
 * `workbenchRequestContextExecutor.ts` (#131956): the IDE applies the same
 * filter in its own request-context executor, so the cloud applies it in its own
 * wiring (this decorator) rather than in the shared `LocalRequestContextExecutor`.
 */
export function removeDuplicatedAgentSkillRules(rules: agent_v1_CursorRule[], agentSkills: readonly agent_v1_AgentSkill[]): agent_v1_CursorRule[] {
    const agentSkillPaths = new Set<string>(agentSkills.map((skill) => skill.fullPath).filter((path) => path.length > 0));
    if (agentSkillPaths.size === 0) {
        return rules;
    }
    return rules.filter((rule) => rule.type?.type.case !== "agentFetched" || !agentSkillPaths.has(rule.fullPath));
}
/**
 * Cloud-agent-only `CursorRulesService` decorator that strips the duplicated
 * `agentFetched` skill rules (see {@link removeDuplicatedAgentSkillRules}) from
 * the rules fed into the request context, leaving the wrapped service — used by
 * other consumers such as the resource provider — untouched.
 *
 * Only `getAllCursorRules` is transformed; `reload`/`dispose`/`onDidChangeRules`
 * forward to the inner service so its lifecycle and change notifications are
 * preserved.
 */
export interface DedupeCursorRulesService {
    getAllCursorRules(ctx: Context): Promise<agent_v1_CursorRule[]>;
    reload(ctx: Context): void;
    dispose(): void;
    onDidChangeRules(callback: () => void): () => void;
}
export function withDeduplicatedAgentSkillRules(inner: DedupeCursorRulesService, getAgentSkills: (ctx: Context) => Promise<agent_v1_AgentSkill[]>): DedupeCursorRulesService {
    return {
        async getAllCursorRules(ctx) {
            const [rules, agentSkills] = await Promise.all([
                inner.getAllCursorRules(ctx),
                getAgentSkills(ctx),
            ]);
            return removeDuplicatedAgentSkillRules(rules, agentSkills);
        },
        reload(ctx) {
            inner.reload(ctx);
        },
        dispose() {
            inner.dispose();
        },
        onDidChangeRules(callback) {
            return inner.onDidChangeRules(callback);
        },
    };
}
