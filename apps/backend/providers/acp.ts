import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

type RpcMessage = {
  id?: number;
  method?: string;
  result?: any;
  error?: { message?: string };
  params?: any;
};

type AcpOptions = {
  cwd: string;
  prompt: string;
  signal: AbortSignal;
  onActivity: (label: string) => void;
  onPermission: (description: string, options: { id: string; label: string }[]) => Promise<string | null>;
  sessionId?: string;
  onSession: (id: string) => Promise<void>;
  onText: (text: string) => void;
};

export async function runAcp(options: AcpOptions): Promise<void> {
  if (options.signal.aborted) throw new Error("Run cancelled before it started.");
  const command = process.env.ACP_COMMAND;
  if (!command) {
    throw new Error(
      "Set ACP_COMMAND to an ACP agent executable before using this provider.",
    );
  }
  let args: string[] = [];
  if (process.env.ACP_ARGS) {
    const parsed: unknown = JSON.parse(process.env.ACP_ARGS);
    if (
      !Array.isArray(parsed) ||
      !parsed.every((value) => typeof value === "string")
    ) {
      throw new Error("ACP_ARGS must be a JSON array of strings.");
    }
    args = parsed;
  }

  const child = spawn(command, args, {
    cwd: options.cwd,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const abort = () => child.kill("SIGTERM");
  options.signal.addEventListener("abort", abort, { once: true });
  if (options.signal.aborted) abort();
  const lines = createInterface({ input: child.stdout });
  const pending = new Map<
    number,
    { resolve: (result: any) => void; reject: (error: Error) => void }
  >();
  let nextId = 0;
  let streaming = false;
  child.stderr.resume();
  const fail = (error: Error) => {
    for (const entry of pending.values()) {
      entry.reject(error);
    }
    pending.clear();
  };
  child.on("error", fail);
  child.on("close", (code) =>
    fail(
      new Error(
        `ACP agent exited (${code ?? "unknown"}). Check its configuration.`,
      ),
    ),
  );
  child.stdin.on("error", fail);
  const send = (message: object) =>
    child.stdin.write(`${JSON.stringify(message)}\n`);
  const request = (method: string, params: object): Promise<any> => {
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      send({ jsonrpc: "2.0", id, method, params });
    });
  };
  lines.on("line", (line) => {
    let message: RpcMessage;
    try {
      message = JSON.parse(line) as RpcMessage;
    } catch {
      fail(new Error("ACP agent sent invalid JSON."));
      return;
    }
    if (message.method === "session/update" && streaming) {
      const update = message.params?.update;
      if (
        update?.sessionUpdate === "agent_message_chunk" &&
        update.content?.type === "text"
      ) {
        options.onText(update.content.text);
      }
      if ((update?.sessionUpdate === "tool_call" || update?.sessionUpdate === "tool_call_update") && typeof update.title === "string") options.onActivity(`Tool: ${update.title}`);
    } else if (message.method && message.id !== undefined) {
      if (message.method === "session/request_permission") {
        const requestId = message.id;
        const choices = Array.isArray(message.params?.options) ? message.params.options.filter((option: any) => option?.kind === "allow_once" && typeof option.optionId === "string" && typeof option.name === "string").map((option: any) => ({ id: option.optionId, label: option.name })) : [];
        void (async () => {
          const chosen = await options.onPermission(JSON.stringify(message.params?.toolCall ?? {}, null, 2), choices);
          send({ jsonrpc: "2.0", id: requestId, result: { outcome: chosen ? { outcome: "selected", optionId: chosen } : { outcome: "cancelled" } } });
        })();
      } else {
        send({
          jsonrpc: "2.0",
          id: message.id,
          error: { code: -32601, message: "Method not supported" },
        });
      }
    } else if (message.id !== undefined) {
      const entry = pending.get(message.id);
      if (entry) {
        pending.delete(message.id);
        if (message.error) {
          entry.reject(
            new Error(message.error.message || "ACP request failed."),
          );
        } else {
          entry.resolve(message.result);
        }
      }
    }
  });

  try {
    const init = await request("initialize", {
      protocolVersion: 1,
      clientCapabilities: {},
      clientInfo: { name: "mux", version: "0.0.0" },
    });
    if (init?.protocolVersion !== 1) {
      throw new Error("ACP agent does not support protocol version 1.");
    }
    let id = options.sessionId;
    if (id) {
      if (!init.agentCapabilities?.loadSession) {
        throw new Error(
          "This ACP agent cannot resume sessions. Create a new session to continue.",
        );
      }
      await request("session/load", {
        sessionId: id,
        cwd: options.cwd,
        mcpServers: [],
      });
    } else {
      const session = await request("session/new", {
        cwd: options.cwd,
        mcpServers: [],
      });
      if (typeof session?.sessionId !== "string") {
        throw new Error("ACP agent did not return a session ID.");
      }
      id = session.sessionId;
      await options.onSession(id!);
    }
    streaming = true;
    const result = await request("session/prompt", {
      sessionId: id,
      prompt: [{ type: "text", text: options.prompt }],
    });
    if (result?.stopReason !== "end_turn") {
      throw new Error(
        `ACP turn stopped: ${result?.stopReason || "unknown reason"}.`,
      );
    }
  } finally {
    options.signal.removeEventListener("abort", abort);
    lines.close();
    child.kill();
  }
}
