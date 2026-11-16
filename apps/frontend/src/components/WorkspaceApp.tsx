import { useEffect, useRef, useState } from "react";
import type { ClientMessage, PermissionRequest, ServerMessage, Workspace } from "common";
import { PermissionPrompt } from "./PermissionPrompt";
import { SessionControls } from "./SessionControls";
import "./workspace.css";

export function WorkspaceApp({ pairingToken }: { pairingToken?: string }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [path, setPath] = useState("");
  const [prompt, setPrompt] = useState("");
  const [contextFiles, setContextFiles] = useState("");
  const [savingBrief, setSavingBrief] = useState(false);
  const [briefStatus, setBriefStatus] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [model, setModel] = useState("default");
  const [useWorktree, setUseWorktree] = useState(false);
  const [newProvider, setNewProvider] = useState<
    "claude" | "acp" | "codex" | "cursor"
  >("claude");
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [error, setError] = useState("");
  const [changes, setChanges] = useState<{ sessionId: string; status: string; diff: string; truncated: boolean } | null>(null);
  const [instructions, setInstructions] = useState<{ sessionId: string; files: string[] } | null>(null);
  const [streams, setStreams] = useState<Record<string, string>>({});
  const socket = useRef<WebSocket | null>(null);
  const streamsRef = useRef<Record<string, string>>({});
  const setRunStreams = (streams: Record<string, string>) => { streamsRef.current = streams; setStreams(streams); };
  const pendingMessage = useRef<{ content: string; workspaceId: string } | null>(null);
  const pendingTurn = useRef<{ sessionId: string; prompt: string; files: string } | null>(null);
  const [draftWorkspace, setDraftWorkspace] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const connect = () => {
      setStatus("connecting");
      const ws = pairingToken
        ? new WebSocket("ws://127.0.0.1:3001/ws", ["mux-v1", pairingToken])
        : new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
      socket.current = ws;
      ws.onopen = () => {
        setStatus("connected");
        setError("");
      };
      ws.onclose = () => {
        if (!stopped) {
          setStatus("disconnected");
          pendingMessage.current = null;
          setCreatingSession(false);
          timer = setTimeout(connect, 2000);
        }
      };
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data) as ServerMessage;
        if (msg.type === "changes") setChanges(msg);
        if (msg.type === "instruction_files") setInstructions(msg);
        if (msg.type === "session_updated") setWorkspaces((items) => items.map((workspace) => ({ ...workspace, sessions: workspace.sessions.map((session) => session.id === msg.session.id ? msg.session : session) })));
        if (msg.type === "session_deleted") {
          setWorkspaces((items) => items.map((workspace) => ({ ...workspace, sessions: workspace.sessions.filter((session) => session.id !== msg.sessionId) })));
          setSelected((current) => current === msg.sessionId ? null : current);
        }
        if (msg.type === "brief_saved") {
          setSavingBrief(false);
          setBriefStatus("Brief saved.");
          setWorkspaces((items) => items.map((workspace) => ({ ...workspace, sessions: workspace.sessions.map((session) => session.id === msg.sessionId ? { ...session, taskBrief: msg.brief } : session) })));
        }
        if (msg.type === "init") { setWorkspaces(msg.workspaces.map((workspace) => ({ ...workspace, sessions: workspace.sessions.map((session) => ({ ...session, activity: [...(session.activity || []), ...(msg.runs.find((run) => run.sessionId === session.id)?.activity || [])] })) }))); setRunStreams(Object.fromEntries(msg.runs.map((run) => [run.sessionId, run.text]))); setPermissions(msg.permissions); }
        if (msg.type === "permission_request") setPermissions((items) => [...items.filter((item) => item.requestId !== msg.request.requestId), msg.request]);
        if (msg.type === "permission_closed") setPermissions((items) => items.filter((item) => item.requestId !== msg.requestId));
        if (msg.type === "workspace_created") {
          setWorkspaces((w) => [...w, msg.workspace]);
          setPath("");

        }
        if (msg.type === "session_created") {
          setWorkspaces((w) =>
            w.map((x) =>
              x.id === msg.session.workspaceId
                ? { ...x, sessions: [...x.sessions, msg.session] }
                : x,
            ),
          );
          setSelected(msg.session.id);
          setModel(msg.session.model || "default");
          const pending = pendingMessage.current;
          if (pending && (!pending.workspaceId || pending.workspaceId === msg.session.workspaceId)) {
            socket.current?.send(JSON.stringify({ type: "send_message", sessionId: msg.session.id, content: pending.content, model: "default" }));
            pendingTurn.current = { sessionId: msg.session.id, prompt: pending.content, files: "" };
            setRunStreams({ ...streamsRef.current, [msg.session.id]: "" });
            setPrompt("");
            pendingMessage.current = null;
            setCreatingSession(false);
          }
        }
        if (msg.type === "message_added") {
          if (!(msg.sessionId in streamsRef.current)) setRunStreams({ ...streamsRef.current, [msg.sessionId]: "" });
          if (pendingTurn.current?.sessionId === msg.sessionId) pendingTurn.current = null;
          setWorkspaces((w) =>
            w.map((x) => ({
              ...x,
              sessions: x.sessions.map((s) =>
                s.id === msg.sessionId
                  ? { ...s, messages: [...s.messages, msg.message] }
                  : s,
              ),
            })),
          );
        }
        if (msg.type === "agent_chunk") {
          setRunStreams({ ...streamsRef.current, [msg.sessionId]: (streamsRef.current[msg.sessionId] || "") + msg.chunk });
        }
        if (msg.type === "agent_activity") setWorkspaces((items) => items.map((workspace) => ({ ...workspace, sessions: workspace.sessions.map((session) => session.id === msg.sessionId ? { ...session, activity: [...(session.activity || []), msg.activity] } : session) })));
        if (msg.type === "agent_complete" || msg.type === "run_failed") {
          const content = streamsRef.current[msg.sessionId] || "";
          setWorkspaces((w) =>
            w.map((x) => ({
              ...x,
              sessions: x.sessions.map((session) =>
                session.id === msg.sessionId
                  ? {
                      ...session,
                      messages: content
                        ? [...session.messages, { role: "assistant", content }]
                        : session.messages,
                      ...(msg.type === "agent_complete" && msg.usage ? { usage: msg.usage } : {}),
                      ...(msg.type === "agent_complete" && msg.model ? { model: msg.model } : {}),
                    }
                  : session,
              ),
            })),
          );
          const next = { ...streamsRef.current }; delete next[msg.sessionId]; setRunStreams(next);
          if (msg.type === "run_failed") setError(msg.message);
        }
        if (msg.type === "error") {
          setSavingBrief(false);
          if (pendingTurn.current && pendingTurn.current.sessionId === msg.sessionId) {
            const pending = pendingTurn.current;
            setPrompt((value) => value || pending.prompt);
            setContextFiles((value) => value || pending.files);
            pendingTurn.current = null;
            const next = { ...streamsRef.current }; delete next[pending.sessionId]; setRunStreams(next);
          }
          setError(msg.message);
          pendingMessage.current = null;
          setCreatingSession(false);
        }
      };
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      socket.current?.close();
    };
  }, [pairingToken]);
  const send = (message: ClientMessage) => {
    if (socket.current?.readyState !== WebSocket.OPEN) {
      setError(
        "The connection was lost. Wait for it to reconnect and try again.",
      );
      return false;
    }
    setError("");
    socket.current.send(JSON.stringify(message));
    return true;
  };
  const active = workspaces
    .flatMap((w) => w.sessions)
    .find((s) => s.id === selected);
  const currentWorkspace = workspaces.find((w) =>
    w.sessions.some((s) => s.id === selected),
  );
  const running = !!active && active.id in streams;
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar" aria-label="Projects and sessions">
        <div className="sidebar-title">Mux</div>
        <button type="button" className="new-chat" onClick={() => { setSelected(null); setDraftWorkspace(""); setPrompt(""); setModel("default"); }}><span aria-hidden="true">✎</span> New chat</button>
        <div className="workspace-section-heading">
          <span>Projects and chats</span>
          <span className="project-count">{workspaces.length}</span>
        </div>
        <div className="session-filter">
          <label htmlFor="session-search">Search sessions</label>
          <input id="session-search" value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} placeholder="Search titles and messages" />
          <label><input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} /> Show archived</label>
        </div>
        <div className="workspace-list">
          {workspaces.length === 0 && (
            <p className="sidebar-empty">
              Your projects will appear here. Add a folder to get started.
            </p>
          )}
          {workspaces.map((workspace) => (
            <section className="workspace-group" key={workspace.id}>
              <div className="workspace-group-head">
                <div className="project-heading">
                  <span className="project-chevron">⌄</span>
                  <div>
                    <strong>{workspace.name}</strong>
                    <small title={workspace.path}>{workspace.path}</small>
                  </div>
                </div>
                <button
                  type="button"
                  title="New session"
                  aria-label={`New session in ${workspace.name}`}
                  disabled={status !== "connected"}
                  onClick={() =>
                    send({
                      type: "create_session",
                      workspaceId: workspace.id,
                      useWorktree,
                      provider: newProvider,
                    })
                  }
                >
                  +
                </button>
              </div>
              <div className="session-list">
                {workspace.sessions.length === 0 && (
                  <p className="no-sessions">No sessions yet</p>
                )}
                {workspace.sessions.filter((session) => (showArchived || !session.archived) && `${session.title || ""} ${session.messages.map((message) => message.content).join(" ")}`.toLowerCase().includes(sessionSearch.toLowerCase())).map((session, index) => (
                  <button
                    type="button"
                    className={`session-link ${selected === session.id ? "selected" : ""}`}
                    key={session.id}
                    aria-current={selected === session.id ? "page" : undefined}
                    onClick={() => {
                      setSelected(session.id);
                      setBriefStatus("");
                      setModel(session.model || "default");
                    }}
                  >
                    <span className="session-dot" />
                    <span>
                      {session.title || session.messages
                        .find((message) => message.role === "user")
                        ?.content.slice(0, 40) || `New session ${index + 1}`}{session.archived ? " (archived)" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <label className="provider-option">
          <span>Provider for new sessions</span>
          <select
            value={newProvider}
            onChange={(event) =>
              setNewProvider(
                event.target.value as "claude" | "acp" | "codex" | "cursor",
              )
            }
          >
            <option value="claude">Claude Code</option>
            <option value="acp">ACP agent</option>
            <option value="codex">Codex</option>
            <option value="cursor">Cursor</option>
          </select>
        </label>
        <p className="provider-note">{newProvider === "acp" ? "ACP requires a configured agent. Allow once permissions can be reviewed; model selection is unavailable and resuming depends on the agent." : newProvider === "codex" ? "Codex uses the local CLI and its existing login. Model IDs are optional." : newProvider === "cursor" ? "Cursor uses the local SDK and requires login or an API key. Model IDs are optional." : "Claude Code uses the local Agent SDK credentials and supports model selection."}</p>
        <label className="worktree-option">
          <input
            type="checkbox"
            checked={useWorktree}
            onChange={(event) => setUseWorktree(event.target.checked)}
          />
          <span>New sessions use a Git worktree</span>
        </label>
        <form
          className="workspace-add"
          onSubmit={(event) => {
            event.preventDefault();
            if (path.trim()) {
              send({ type: "create_workspace", path });
            }
          }}
        >
          <label htmlFor="workspace-path">Add a project</label>
          <div className="add-project-row">
            <input
              id="workspace-path"
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="/path/to/project"
              required
            />
            <button disabled={status !== "connected"} aria-label="Add project">
              +
            </button>
          </div>
          <p>Enter a folder on this computer.</p>
        </form>
      </aside>
      <main className="workspace-main">
        <header className="workspace-header">
          <div className="header-identity">
            <span className="header-mark">✳</span>
            <div>
              <strong>{currentWorkspace?.name || "Workspace"}</strong>
              <span className="header-divider">/</span>
              <span>{active?.messages.find((message) => message.role === "user")?.content.slice(0, 55) || (active ? "New session" : "Your projects and sessions")}</span>
            </div>
          </div>
          {active && <button type="button" onClick={() => send({ type: "get_changes", sessionId: active.id })}>Review changes</button>}
          <a href="/" title="Back to home" aria-label="Back to home">⌂</a>
        </header>
        {error && (
          <div className="workspace-error" role="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        {active && changes?.sessionId === active.id && <section className="changes-review" aria-label="Git changes">
          <div className="changes-heading"><strong>Git changes</strong><button type="button" onClick={() => setChanges(null)}>Close</button></div>
          <p>Current checkout changes may include work made before this session. Untracked files appear in the status list; their contents are not shown.</p>
          <pre>{changes.status || "No changes in this checkout."}</pre>
          {changes.diff && <pre>{changes.diff}</pre>}
          {changes.truncated && <p>Diff truncated. Open the project in Git to see all changes.</p>}
        </section>}
        {active && <PermissionPrompt requests={permissions.filter((request) => request.sessionId === active.id)} send={send} />}
        {active && <details className="session-controls"><summary>Project instructions</summary>
          <p>Check common instruction locations in this checkout. Detection does not confirm that the provider loaded them.</p>
          <button type="button" disabled={!!active.worktreeRemoved} onClick={() => send({ type: "inspect_instructions", sessionId: active.id })}>Check instruction files</button>
          {instructions?.sessionId === active.id && <p>{instructions.files.length ? instructions.files.join(", ") : "No common root instruction locations found."}</p>}
        </details>}
        {active && <SessionControls key={active.id} session={active} running={running} useWorktree={useWorktree} send={send} />}
        {active && <details className="session-controls"><summary>Agent activity ({active.activity?.length || 0})</summary>
          <p>Only events exposed by the selected provider are shown. This is not a complete audit log.</p>
          {active.activity?.length ? <ol>{active.activity.map((item, index) => <li key={`${item.at}-${index}`}><time>{new Date(item.at).toLocaleTimeString()}</time> {item.label}</li>)}</ol> : <p>Activity appears here when the provider reports tool events.</p>}
        </details>}
        {active ? (
          <>
            <div className="workspace-content">
            <div className="conversation" aria-live="polite">
              {active.messages.length === 0 && (
                <div className="conversation-empty">
                  <span className="empty-mark">✳</span>
                  <h1>Start with an idea.</h1>
                  <p>
                    Ask the agent to explore, build, or improve something in{" "}
                    {currentWorkspace?.name}.
                  </p>
                </div>
              )}
              {active.messages.map((message, index) => (
                <article className={`chat-message ${message.role}`} key={index}>
                  <div className="chat-avatar">
                    {message.role === "user" ? "Y" : "✳"}
                  </div>
                  <div className="chat-body">
                    <div className="chat-role">
                      {message.role === "user"
                        ? "You"
                        : active.provider === "acp"
                          ? "ACP agent"
                          : active.provider === "codex"
                            ? "Codex"
                            : active.provider === "cursor"
                              ? "Cursor"
                              : "Claude"}
                    </div>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
              {running && (
                <article className="chat-message assistant">
                  <div className="chat-avatar">✳</div>
                  <div className="chat-body">
                    <div className="chat-role">
                      {active.provider === "acp"
                        ? "ACP agent"
                        : active.provider === "codex"
                          ? "Codex"
                          : active.provider === "cursor"
                            ? "Cursor"
                            : "Claude"}
                    </div>
                    <p>{streams[active.id] || "Working on your request…"}</p>
                  </div>
                </article>
              )}
              {running && <button type="button" onClick={() => send({ type: "cancel_run", sessionId: active.id })}>Stop run</button>}
            </div>
            <aside className="session-details" aria-label="Session details" hidden>
              <div className="detail-heading"><span className="detail-icon">▣</span><strong>{currentWorkspace?.name}</strong></div>
              <div className="detail-row"><span>⌁</span><span>Project folder</span></div>
              <p className="detail-path" title={currentWorkspace?.path}>{currentWorkspace?.path}</p>
              <div className="detail-divider" />
              <div className="detail-row"><span>◇</span><span>{active.worktreePath ? "Git worktree" : "Project directory"}</span></div>
              {active.worktreePath && <p className="detail-path" title={active.worktreePath}>{active.worktreePath}</p>}
              <div className="detail-divider" />
              <div className="detail-caption">Session</div>
              <div className="detail-row"><span className="agent-spark">✳</span><span>{active.provider === "acp" ? "ACP agent" : active.provider === "codex" ? "Codex" : active.provider === "cursor" ? "Cursor" : "Claude Code"}</span><small>{running ? "Working" : "Ready"}</small></div>
            </aside>
            </div>
            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                if (prompt.trim() && !running && !savingBrief && !active.worktreeRemoved) {
                  if (contextFiles.split("\n").filter((file) => file.trim()).length > 5) { setError("Attach no more than five files."); return; }
                  const sent = send({
                    type: "send_message",
                    sessionId: active.id,
                    content: prompt,
                    model,
                    files: contextFiles.split("\n").map((file) => file.trim()).filter(Boolean),
                  });
                  if (!sent) {
                    return;
                  }
                  pendingTurn.current = { sessionId: active.id, prompt, files: contextFiles };
                  setRunStreams({ ...streamsRef.current, [active.id]: "" });
                  setPrompt("");
                  setContextFiles("");
                }
              }}
            >
              <label className="sr-only" htmlFor="prompt">
                Message Claude
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask anything about your project…"
                rows={3}
              />
              <details className="context-picker">
                <summary>Attach project files</summary>
                <label htmlFor="context-files">Relative file paths, one per line</label>
                <textarea id="context-files" value={contextFiles} onChange={(event) => setContextFiles(event.target.value)} placeholder={'src/app.ts\nREADME.md'} rows={2} />
                <p>Up to five text files, 50 KB each. Contents are sent to the selected provider with your next message.</p>
              </details>
              <details className="context-picker" key={active.id}>
                <summary>Task brief</summary>
                <label htmlFor="task-brief">Goal, constraints, decisions, and verification steps</label>
                <textarea id="task-brief" defaultValue={active.taskBrief || ""} maxLength={12000} rows={4} onChange={() => setBriefStatus("Unsaved changes.")} />
                <button type="button" onClick={() => {
                  const input = document.getElementById("task-brief") as HTMLTextAreaElement | null;
                  if (input && send({ type: "save_brief", sessionId: active.id, brief: input.value })) { setSavingBrief(true); setBriefStatus("Saving brief…"); }
                }} disabled={savingBrief}>Save brief</button>
                <span role="status"> {briefStatus}</span>
                <p>The saved brief is sent with each message in this session. Save edits before sending.</p>
              </details>
              <div className="composer-footer">
                <div className="composer-context">
                  <label className="sr-only" htmlFor="provider">
                    Provider
                  </label>
                  <select
                    id="provider"
                    value={active.provider || "claude"}
                    disabled
                    onChange={() => {}}
                  >
                    <option value="claude">Claude Code</option>
                    <option value="codex">Codex</option>
                    <option value="acp">ACP agent</option>
                    <option value="cursor">Cursor</option>
                  </select>
                  <label className="sr-only" htmlFor="model">
                    Model
                  </label>
                  {!active.provider || active.provider === "claude" ? (
                    <select
                      id="model"
                      value={model}
                      disabled={!!running}
                      onChange={(event) => setModel(event.target.value)}
                    >
                      <option value="default">Default model</option>
                      <option value="sonnet">Sonnet</option>
                      <option value="opus">Opus</option>
                      <option value="haiku">Haiku</option>
                    </select>
                  ) : active.provider === "acp" ? (
                    <span>Agent default model</span>
                  ) : (
                    <input
                      id="model"
                      value={model === "default" ? "" : model}
                      disabled={!!running}
                      onChange={(event) =>
                        setModel(event.target.value || "default")
                      }
                      placeholder="Default model"
                      aria-label="Model ID (optional)"
                    />
                  )}
                </div>
                <button
                  disabled={
                    !prompt.trim() || !!running || savingBrief || !!active.worktreeRemoved || status !== "connected"
                  }
                >
                  <span aria-hidden="true">↑</span><span className="sr-only">Send message</span>
                </button>
              </div>
            </form>
            <p className="composer-hint">
              {active.worktreeRemoved ? "This session's worktree was removed. Start a handoff to continue." : active.worktreePath
                ? `Worktree: ${active.worktreePath}`
                : "The agent works in the selected project folder."}
              {active.usage &&
                ` · ${active.usage.inputTokens.toLocaleString()} input / ${active.usage.outputTokens.toLocaleString()} output tokens${active.usage.estimatedCostUsd != null ? ` · $${active.usage.estimatedCostUsd.toFixed(4)} estimated` : ""}`}
              {active.taskBrief && ` · Saved brief: ${new TextEncoder().encode(active.taskBrief).length.toLocaleString()} bytes per message`}
            </p>
          </>
        ) : (
          <>
            <div className="workspace-content draft-content">
              <div className="conversation draft-conversation">
                <div className="draft-heading"><span className="empty-mark">✳</span><h1>What would you like to work on?</h1></div>
              </div>
            </div>
            <form className="composer draft-composer" onSubmit={(event) => {
              event.preventDefault();
              if (!prompt.trim() || creatingSession) return;
              pendingMessage.current = { content: prompt.trim(), workspaceId: draftWorkspace };
              setCreatingSession(true);
              if (!send({ type: "create_session", ...(draftWorkspace ? { workspaceId: draftWorkspace } : {}), useWorktree, provider: newProvider })) {
                pendingMessage.current = null;
                setCreatingSession(false);
              }
            }}>
              <label className="sr-only" htmlFor="draft-prompt">Message your agent</label>
              <textarea id="draft-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask anything about your project…" rows={3} />
              <div className="composer-footer">
                <div className="composer-context">
                  <label className="sr-only" htmlFor="draft-project">Project</label>
                  <select id="draft-project" value={draftWorkspace} onChange={(event) => setDraftWorkspace(event.target.value)} disabled={creatingSession}>
                    <option value="">No project</option>
                    {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
                  </select>
                  <span>{newProvider === "claude" ? "Claude Code" : newProvider === "acp" ? "ACP agent" : newProvider === "codex" ? "Codex" : "Cursor"}</span>
                </div>
                <button disabled={!prompt.trim() || creatingSession || status !== "connected"} aria-label="Send message">↑</button>
              </div>
            </form>
            <p className="composer-hint">{status !== "connected" ? "Connecting to Mux…" : creatingSession ? "Starting session…" : draftWorkspace ? "Your agent works in the selected project folder." : "Chat without a project, or select one to work on its files."}</p>
          </>
        )}
      </main>
    </div>
  );
}
