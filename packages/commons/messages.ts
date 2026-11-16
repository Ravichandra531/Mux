import { z } from "zod";

export const ClientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create_workspace"),
    path: z.string().trim().min(1),
  }),
  z.object({
    type: z.literal("create_session"),
    workspaceId: z.string().min(1).optional(),
    useWorktree: z.boolean().optional(),
    provider: z.enum(["claude", "acp", "codex", "cursor"]).optional(),
    taskBrief: z.string().max(12000).optional(),
  }),
  z.object({
    type: z.literal("send_message"),
    sessionId: z.string().min(1),
    content: z.string().trim().min(1),
    model: z.string().trim().min(1).max(120).optional(),
    files: z.array(z.string().trim().min(1).max(500)).max(5).optional(),
  }),
  z.object({ type: z.literal("ping") }),
  z.object({ type: z.literal("get_changes"), sessionId: z.string().min(1) }),
  z.object({ type: z.literal("save_brief"), sessionId: z.string().min(1), brief: z.string().max(12000) }),
  z.object({ type: z.literal("update_session"), sessionId: z.string().min(1), title: z.string().trim().max(120).optional(), archived: z.boolean().optional() }),
  z.object({ type: z.literal("delete_session"), sessionId: z.string().min(1) }),
  z.object({ type: z.literal("cancel_run"), sessionId: z.string().min(1) }),
  z.object({ type: z.literal("permission_response"), requestId: z.string().min(1), optionId: z.string().nullable() }),
  z.object({ type: z.literal("remove_worktree"), sessionId: z.string().min(1) }),
  z.object({ type: z.literal("inspect_instructions"), sessionId: z.string().min(1) }),
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Session = {
  id: string;
  workspaceId: string;
  messages: ChatMessage[];
  worktreePath?: string;
  worktreeRemoved?: boolean;
  provider?: "claude" | "acp" | "codex" | "cursor";
  model?: string;
  taskBrief?: string;
  title?: string;
  archived?: boolean;
  activity?: Activity[];
  usage?: Usage;
};
export type Activity = { label: string; at: string };
export type PermissionRequest = { requestId: string; sessionId: string; description: string; options: { id: string; label: string }[] };
export type Usage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  estimatedCostUsd?: number;
};
export type Workspace = {
  id: string;
  name: string;
  path: string;
  sessions: Session[];
};
export type ServerMessage =
  | { type: "init"; workspaces: Workspace[]; runs: { sessionId: string; text: string; activity: Activity[] }[]; permissions: PermissionRequest[] }
  | { type: "workspace_created"; workspace: Workspace }
  | { type: "session_created"; session: Session }
  | { type: "message_added"; sessionId: string; message: ChatMessage }
  | { type: "agent_chunk"; sessionId: string; chunk: string }
  | { type: "agent_activity"; sessionId: string; activity: Activity }
  | { type: "permission_request"; request: PermissionRequest }
  | { type: "permission_closed"; requestId: string }
  | { type: "instruction_files"; sessionId: string; files: string[] }
  | { type: "agent_complete"; sessionId: string; usage?: Usage; model?: string }
  | { type: "run_failed"; sessionId: string; message: string }
  | { type: "changes"; sessionId: string; status: string; diff: string; truncated: boolean }
  | { type: "brief_saved"; sessionId: string; brief: string }
  | { type: "session_updated"; session: Session }
  | { type: "session_deleted"; sessionId: string }
  | { type: "error"; message: string; sessionId?: string }
  | { type: "pong" };
