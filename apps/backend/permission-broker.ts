import type { PermissionRequest, ServerMessage } from "common";

/** Keeps interactive decisions in memory; missing, cancelled and timed-out decisions deny. */
export class PermissionBroker {
  private pending = new Map<string, { request: PermissionRequest; finish: (option: string | null) => void }>();
  constructor(private publish: (message: ServerMessage) => void) {}

  list() { return Array.from(this.pending.values(), ({ request }) => request); }

  ask(sessionId: string, description: string, options: PermissionRequest["options"], signal: AbortSignal): Promise<string | null> {
    if (signal.aborted || description.length > 20000 || !options.length) return Promise.resolve(null);
    const request: PermissionRequest = { requestId: crypto.randomUUID(), sessionId, description, options };
    return new Promise((resolve) => {
      let settled = false;
      const finish = (value: string | null) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal.removeEventListener("abort", onAbort);
        this.pending.delete(request.requestId);
        this.publish({ type: "permission_closed", requestId: request.requestId });
        resolve(value);
      };
      const onAbort = () => finish(null);
      const timer = setTimeout(onAbort, 5 * 60_000);
      this.pending.set(request.requestId, { request, finish });
      signal.addEventListener("abort", onAbort, { once: true });
      if (signal.aborted) onAbort();
      else this.publish({ type: "permission_request", request });
    });
  }

  respond(requestId: string, optionId: string | null) {
    const item = this.pending.get(requestId);
    if (!item) return false;
    if (optionId !== null && !item.request.options.some((option) => option.id === optionId)) return false;
    item.finish(optionId);
    return true;
  }
}
