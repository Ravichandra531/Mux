import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import type { Usage } from "common";

type CodexOptions = {
  cwd: string;
  prompt: string;
  signal: AbortSignal;
  onActivity: (label: string) => void;
  model?: string;
  sessionId?: string;
  onSession: (id: string) => Promise<void>;
  onText: (text: string) => void;
};

export async function runCodex(
  options: CodexOptions,
): Promise<Usage | undefined> {
  if (options.signal.aborted) throw new Error("Run cancelled before it started.");
  const args = ["exec", "--json", "--skip-git-repo-check"];
  if (options.model && options.model !== "default") {
    args.push("--model", options.model);
  }
  if (options.sessionId) {
    args.push("resume", options.sessionId, "-");
  } else {
    args.push("-");
  }
  const child = spawn(process.env.CODEX_COMMAND || "codex", args, {
    cwd: options.cwd,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const abort = () => child.kill("SIGTERM");
  options.signal.addEventListener("abort", abort, { once: true });
  if (options.signal.aborted) abort();
  child.stdin.on("error", () => {});
  child.stderr.resume();
  const exit = new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
  child.stdin.end(options.prompt);
  const lines = createInterface({ input: child.stdout });
  let usage: Usage | undefined;
  let failure: string | undefined;
  let completed = false;
  for await (const line of lines) {
    let event: any;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    if (
      event.type === "thread.started" &&
      typeof event.thread_id === "string"
    ) {
      await options.onSession(event.thread_id);
    } else if ((event.type === "item.started" || event.type === "item.completed") && event.item?.type !== "agent_message" && typeof event.item?.type === "string") {
      options.onActivity(`${event.type === "item.started" ? "Started" : "Completed"}: ${event.item.type}${typeof event.item.command === "string" ? ` · ${event.item.command}` : ""}`);
    } else if (
      event.type === "item.completed" &&
      event.item?.type === "agent_message"
    ) {
      options.onText(event.item.text);
    } else if (event.type === "turn.failed") {
      failure = event.error?.message || "Codex turn failed.";
    } else if (event.type === "error") {
      failure = event.message || "Codex reported an error.";
    } else if (event.type === "turn.completed") {
      completed = true;
      if (event.usage) {
        usage = {
          inputTokens: event.usage.input_tokens ?? 0,
          outputTokens: event.usage.output_tokens ?? 0,
          cacheReadTokens: event.usage.cached_input_tokens ?? 0,
          cacheWriteTokens: 0,
        };
      }
    }
  }
  const code = await exit;
  options.signal.removeEventListener("abort", abort);
  if (failure || code !== 0 || !completed) {
    throw new Error(
      failure ||
        `Codex exited without completing the turn (code ${code}). Check its authentication and configuration.`,
    );
  }
  return usage;
}
