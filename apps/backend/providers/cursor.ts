import type { Usage } from "common";

type CursorOptions = {
  cwd: string;
  prompt: string;
  signal: AbortSignal;
  onActivity: (label: string) => void;
  model?: string;
  sessionId?: string;
  onSession: (id: string) => Promise<void>;
  onText: (text: string) => void;
};

export async function runCursor(
  options: CursorOptions,
): Promise<Usage | undefined> {
  const packageName = "@cursor/sdk";
  let sdk: any;
  try {
    sdk = await import(packageName);
  } catch {
    throw new Error(
      "Cursor SDK is not installed. Run bun install when the package registry is available.",
    );
  }
  const config = {
    ...(process.env.CURSOR_API_KEY
      ? { apiKey: process.env.CURSOR_API_KEY }
      : {}),
    ...(options.model && options.model !== "default"
      ? { model: { id: options.model } }
      : {}),
    local: { cwd: options.cwd },
  };
  const agent = options.sessionId
    ? await sdk.Agent.resume(options.sessionId, config)
    : await sdk.Agent.create(config);
  try {
    if (options.signal.aborted) throw new Error("Run cancelled before it started.");
    if (!options.sessionId) {
      await options.onSession(agent.agentId);
    }
    const run = await agent.send(options.prompt);
    const abort = () => { if (run.supports("cancel")) void run.cancel().catch(() => {}); };
    options.signal.addEventListener("abort", abort, { once: true });
    if (options.signal.aborted) abort();
    try {
    for await (const event of run.stream()) {
      if (event.type === "assistant") {
        for (const block of event.message.content) {
          if (block.type === "text") {
            options.onText(block.text);
          }
        }
      }
      if (event.type === "tool_call") options.onActivity("Tool activity reported by Cursor");
    }
    const result = await run.wait();
    if (result.status !== "finished") {
      throw new Error(result.error?.message || `Cursor run ${result.status}.`);
    }
    if (!result.usage) {
      return undefined;
    }
    return {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cacheReadTokens: result.usage.cacheReadTokens,
      cacheWriteTokens: result.usage.cacheWriteTokens,
    };
    } finally {
      options.signal.removeEventListener("abort", abort);
    }
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}
