import mongoose from "mongoose";

export { mongoose };

const workspaceSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true },
);

const sessionSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    conversation: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        _id: false,
      },
    ],
    anthropicSessionId: String,
    provider: {
      type: String,
      enum: ["claude", "acp", "codex", "cursor"],
      default: "claude",
    },
    acpSessionId: String,
    codexSessionId: String,
    cursorSessionId: String,
    worktreePath: String,
    worktreeRemoved: { type: Boolean, default: false },
    modelId: String,
    taskBrief: { type: String, default: "" },
    title: { type: String, default: "" },
    archived: { type: Boolean, default: false },
    activity: [{ label: { type: String, required: true }, at: { type: Date, required: true }, _id: false }],
    usage: {
      inputTokens: Number,
      outputTokens: Number,
      cacheReadTokens: Number,
      cacheWriteTokens: Number,
      estimatedCostUsd: Number,
    },
  },
  { timestamps: true },
);

export const WorkspaceModel = mongoose.model("Workspace", workspaceSchema);
export const SessionModel = mongoose.model("Session", sessionSchema);
