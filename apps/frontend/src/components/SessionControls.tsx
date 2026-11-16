import { useState } from "react";
import type { ClientMessage, Session } from "common";

type Props = { session: Session; running: boolean; useWorktree: boolean; send: (message: ClientMessage) => boolean };

export function SessionControls({ session, running, useWorktree, send }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmWorktree, setConfirmWorktree] = useState(false);
  const [provider, setProvider] = useState<"claude" | "codex" | "cursor" | "acp">("claude");
  return <details className="session-controls">
    <summary>Manage session</summary>
    <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); send({ type: "update_session", sessionId: session.id, title: String(data.get("title") || "") }); }}>
      <label>Session name <input name="title" defaultValue={session.title || ""} maxLength={120} /></label>
      <button disabled={running}>Save name</button>
    </form>
    <button type="button" disabled={running} onClick={() => send({ type: "update_session", sessionId: session.id, archived: !session.archived })}>{session.archived ? "Restore session" : "Archive session"}</button>
    {!confirmDelete ? <button type="button" disabled={running} onClick={() => setConfirmDelete(true)}>Delete session</button> : <span>Delete conversation? The worktree is retained. <button type="button" onClick={() => send({ type: "delete_session", sessionId: session.id })}>Confirm delete</button> <button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button></span>}
    {session.worktreePath && (!confirmWorktree ? <button type="button" disabled={running} onClick={() => setConfirmWorktree(true)}>Remove clean worktree</button> : <p>This removes the worktree folder and stops this session from continuing. Modified, untracked and ignored files block removal. The branch remains. <button type="button" onClick={() => { if (send({ type: "remove_worktree", sessionId: session.id })) setConfirmWorktree(false); }}>Confirm removal</button> <button type="button" onClick={() => setConfirmWorktree(false)}>Cancel</button></p>)}
    <details><summary>Start a handoff</summary>
      <p>Review this brief before creating a new session. Provider history, attached files and changes in a separate worktree are not transferred. The new session uses the project folder or a new worktree according to the sidebar setting.</p>
      <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); send({ type: "create_session", workspaceId: session.workspaceId, provider, useWorktree, taskBrief: String(data.get("brief") || "") }); }}>
        <label>Handoff brief<textarea name="brief" defaultValue={session.taskBrief || ""} maxLength={12000} rows={4} /></label>
        <label>Provider <select value={provider} onChange={(event) => setProvider(event.target.value as typeof provider)}><option value="claude">Claude Code</option><option value="codex">Codex</option><option value="cursor">Cursor</option><option value="acp">ACP agent</option></select></label>
        <button disabled={running}>Create handoff session</button>
      </form>
    </details>
  </details>;
}
