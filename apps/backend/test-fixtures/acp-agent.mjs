import { createInterface } from "node:readline";
const send = (message) => process.stdout.write(`${JSON.stringify(message)}\n`);
let promptId;
createInterface({ input: process.stdin }).on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") send({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: 1, agentCapabilities: { loadSession: true } } });
  if (message.method === "session/new") send({ jsonrpc: "2.0", id: message.id, result: { sessionId: "mock-session" } });
  if (message.method === "session/prompt") {
    promptId = message.id;
    send({ jsonrpc: "2.0", method: "session/update", params: { update: { sessionUpdate: "tool_call", title: "Inspect file" } } });
    send({ jsonrpc: "2.0", id: 500, method: "session/request_permission", params: { toolCall: { title: "Inspect file" }, options: [{ optionId: "once", name: "Allow once", kind: "allow_once" }] } });
  }
  if (message.id === 500 && message.result) {
    const text = message.result.outcome.outcome === "selected" ? "Allowed" : "Declined";
    send({ jsonrpc: "2.0", method: "session/update", params: { update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text } } } });
    send({ jsonrpc: "2.0", id: promptId, result: { stopReason: "end_turn" } });
  }
});
