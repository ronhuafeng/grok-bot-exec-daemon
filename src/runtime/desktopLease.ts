import { DesktopLeaseStatus, DesktopLeaseActorKind, DesktopLeaseResponse, DesktopLeaseOwner } from "../interop/vendor/proto-agent-v1-control-service-pb.js";
import { ConnectError } from "../interop/vendor/connect-connect-error.js";
import { Code } from "../interop/vendor/connect-code.js";
import type { agent_v1_DesktopLeaseRequest } from "../interop/contracts/protobuf-generated.js";

export const PROTO_STATUS = {
    ok: DesktopLeaseStatus.OK,
    busy: DesktopLeaseStatus.BUSY,
    invalid: DesktopLeaseStatus.INVALID_REQUEST,
};
export const PROTO_ACTOR_KIND = {
    human: DesktopLeaseActorKind.HUMAN,
    agent: DesktopLeaseActorKind.AGENT,
};
export interface DesktopLeaseOwnerView {
    kind: "human" | "agent";
    actorId: string;
    expiresAtUnixMs: number;
}
export interface DesktopLeaseResult {
    status: "ok" | "busy" | "invalid";
    owner: DesktopLeaseOwnerView | undefined;
    message: string;
}
export interface DesktopLeaseStorePort {
    acquire(actorId: string): Promise<DesktopLeaseResult>;
    release(actorId: string): DesktopLeaseResult;
    getOwner(): DesktopLeaseOwnerView | undefined;
}
export function toResponse(result: DesktopLeaseResult) {
    const owner = result.owner;
    return new DesktopLeaseResponse({
        status: PROTO_STATUS[result.status],
        owner: owner === undefined
            ? undefined
            : new DesktopLeaseOwner({
                kind: PROTO_ACTOR_KIND[owner.kind],
                actorId: owner.actorId,
                expiresAtUnixMs: BigInt(owner.expiresAtUnixMs),
            }),
        message: result.message,
    });
}
/**
 * ControlService.DesktopLease. Acquire is for humans; agents take the desktop
 * by stamping their computer actions. `store` is undefined on daemons without
 * an X11 desktop, which answer Unimplemented so callers fall back.
 */
export async function handleDesktopLease(store: DesktopLeaseStorePort | undefined, request: agent_v1_DesktopLeaseRequest) {
    if (store === undefined) {
        throw new ConnectError("Desktop lease is not available on this daemon", Code.Unimplemented);
    }
    const action = request.action;
    switch (action.case) {
        case "acquire":
            return toResponse(await store.acquire(action.value.actorId));
        case "release":
            return toResponse(store.release(action.value.actorId));
        case "getState":
            return toResponse({
                status: "ok",
                owner: store.getOwner(),
                message: "ok",
            });
        default:
            return toResponse({
                status: "invalid",
                owner: store.getOwner(),
                message: "desktop lease action is required",
            });
    }
}
