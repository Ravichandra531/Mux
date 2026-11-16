import { expect, test } from "bun:test";
import { PermissionBroker } from "./permission-broker";
import type { ServerMessage } from "common";

test("validates decisions and closes each request exactly once", async () => {
  const events: ServerMessage[] = [];
  const broker = new PermissionBroker((event) => events.push(event));
  const controller = new AbortController();
  const result = broker.ask("session", "Review the proposed action", [{ id: "allow", label: "Allow once" }], controller.signal);
  const request = broker.list()[0]!;
  expect(broker.respond(request.requestId, "unknown")).toBe(false);
  expect(broker.list()).toHaveLength(1);
  expect(broker.respond(request.requestId, "allow")).toBe(true);
  expect(await result).toBe("allow");
  expect(broker.respond(request.requestId, "allow")).toBe(false);
  expect(events.map((event) => event.type)).toEqual(["permission_request", "permission_closed"]);
});

test("cancelling a run denies its pending request", async () => {
  const broker = new PermissionBroker(() => {});
  const controller = new AbortController();
  const result = broker.ask("session", "Action", [{ id: "allow", label: "Allow once" }], controller.signal);
  controller.abort();
  expect(await result).toBeNull();
  expect(broker.list()).toHaveLength(0);
});
