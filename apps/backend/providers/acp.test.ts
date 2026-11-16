import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { runAcp } from "./acp";

test("routes an ACP permission decision and streams activity and text", async () => {
  const previousCommand = process.env.ACP_COMMAND;
  const previousArgs = process.env.ACP_ARGS;
  process.env.ACP_COMMAND = process.execPath;
  process.env.ACP_ARGS = JSON.stringify([fileURLToPath(new URL("../test-fixtures/acp-agent.mjs", import.meta.url))]);
  const text: string[] = [];
  const activity: string[] = [];
  let session = "";
  try {
    await runAcp({ cwd: process.cwd(), prompt: "test", signal: new AbortController().signal, onActivity: (value) => activity.push(value), onSession: async (id) => { session = id; }, onText: (value) => text.push(value), onPermission: async (_description, options) => options[0]?.id ?? null });
    expect(session).toBe("mock-session");
    expect(activity).toContain("Tool: Inspect file");
    expect(text).toEqual(["Allowed"]);
  } finally {
    if (previousCommand === undefined) delete process.env.ACP_COMMAND; else process.env.ACP_COMMAND = previousCommand;
    if (previousArgs === undefined) delete process.env.ACP_ARGS; else process.env.ACP_ARGS = previousArgs;
  }
});
