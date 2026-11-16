# Mux

Mux is a local workspace for coding agents. The Bun backend stores workspaces and sessions in MongoDB and runs the selected agent in the project directory. The Vite frontend serves the landing page at `/` and the workspace at `/app`.

## Setup

Install Bun 1.3.13 and MongoDB, then run `bun install` from the repository root. Set `DB_URL` in `apps/backend/.env` to a MongoDB connection string, for example `mongodb://127.0.0.1:27017/mux`. Authenticate Claude Code or configure the credentials required by the Claude Agent SDK. Run `bun run dev` and open `http://localhost:5173`.

In the workspace, enter an existing absolute directory path, add a session, and send a message. The backend listens on `127.0.0.1:3001`; Vite proxies `/ws` to it. The backend is intended for local use and has no account authentication.

Use `bun run check-types`, `bun run lint`, and `bun run build` to verify the monorepo. A production deployment requires a WebSocket proxy and appropriate access controls; Vite's development proxy is not a production server.

## Session options

Use **Review changes** in a session to inspect staged and unstaged Git diffs and the list of untracked files. This shows the whole checkout, including changes that existed before the session. Untracked file contents are not included, and large diffs are truncated.

In an existing session, **Attach project files** accepts up to five project-relative UTF-8 text files, each up to 50 KB. Mux reads the files when the message is submitted and sends their contents to the selected provider. The conversation records their names, sizes and SHA-256 hashes, not snapshots of their contents. Symlinks resolving outside the checkout are rejected. Avoid attaching secrets.

Use **Task brief** to save goals, constraints, decisions, and verification steps for the session. The saved brief is sent with each subsequent message; save changes before sending. It does not transfer provider-native history to another session.

Choose a Claude model in the composer, or use the default configured by Claude Code. Completed turns display the token usage and estimated cost reported by the Claude SDK; these figures are estimates rather than billing totals. Enable the Git worktree option before creating a session to create a separate branch and folder next to the project. Worktrees are retained for manual inspection and cleanup.

To use an ACP-compatible agent, set `ACP_COMMAND` to the executable and optionally set `ACP_ARGS` to a JSON array of arguments in the backend environment. Select ACP agent before creating a session. The agent must support ACP protocol version 1 over newline-delimited JSON on standard input and output. Session continuation requires the agent to support `session/load`. Mux presents ACP allow-once permission requests for review; requests without an allow-once option are declined. ACP client filesystem and terminal requests are not supported. ACP usage and model selection are not yet supported.

Codex sessions use the local `codex` executable and its existing login. Install and authenticate the Codex CLI before use; optionally set `CODEX_COMMAND` to the executable path. Cursor sessions use `@cursor/sdk`. Run `bun install` from the repository root to install it, then run `bun run --filter backend cursor:login` to sign in through a browser. Cursor stores an SDK credential locally after login. Alternatively, set `CURSOR_API_KEY` in the backend environment. Select the provider before creating a session; an optional model ID can be entered in the composer. Token counts are shown when reported; dollar estimates are only shown when provided by the provider.

Session management includes search, rename, archive, deletion, and a new session handoff using an editable brief. Deleting a session retains its worktree. A separate confirmed cleanup can remove a registered worktree only when Git reports no modified, untracked or ignored files; its branch remains and the old session cannot continue. Handoffs do not copy native provider history. The activity list contains only events that providers expose and is not a complete audit trail. Active output and pending approvals can be recovered after a browser reconnect while the backend process is still running; a backend restart does not recover an active run. The instruction inspector detects common root-level locations without asserting that any provider loaded them.

Claude permission requests and ACP allow-once requests are displayed for review and expire after five minutes. Codex and Cursor use their own configured permission behavior. Stop requests are delivered via the provider's supported cancellation mechanism; review the checkout after stopping. Cursor cancellation depends on SDK runtime support. See [context evaluation](docs/context-evaluation.md) for a repeatable evaluation plan.
# Mux
