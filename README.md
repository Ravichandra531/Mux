# Mux

Mux is a local workspace for coding agents. The Bun backend stores workspaces and sessions in MongoDB and runs the selected agent in the project directory. The Vite frontend serves the landing page at `/` and the workspace at `/app`.

## Setup

Install Bun 1.3.13 and MongoDB, then run `bun install` from the repository root. Set `DB_URL` in `apps/backend/.env` to a MongoDB connection string, for example `mongodb://127.0.0.1:27017/mux`. Authenticate Claude Code or configure the credentials required by the Claude Agent SDK. Run `bun run dev` and open `http://localhost:5173`.

In the workspace, enter an existing absolute directory path, add a session, and send a message. The backend listens on `127.0.0.1:3001`; Vite proxies `/ws` to it. The backend is intended for local use and has no account authentication.

Use `bun run check-types`, `bun run lint`, and `bun run build` to verify the monorepo. A production deployment requires a WebSocket proxy and appropriate access controls; Vite's development proxy is not a production server.

## Session options

Choose a Claude model in the composer, or use the default configured by Claude Code. Completed turns display the token usage and estimated cost reported by the Claude SDK; these figures are estimates rather than billing totals. Enable the Git worktree option before creating a session to create a separate branch and folder next to the project. Worktrees are retained for manual inspection and cleanup.

To use an ACP-compatible agent, set `ACP_COMMAND` to the executable and optionally set `ACP_ARGS` to a JSON array of arguments in the backend environment. Select ACP agent before creating a session. The agent must support ACP protocol version 1 over newline-delimited JSON on standard input and output. Session continuation requires the agent to support `session/load`. Mux currently declines ACP permission requests and does not support ACP client filesystem or terminal requests; use agents that can operate within those limitations. ACP usage and model selection are not yet supported.

Codex sessions use the local `codex` executable and its existing login. Install and authenticate the Codex CLI before use; optionally set `CODEX_COMMAND` to the executable path. Cursor sessions use `@cursor/sdk`. Run `bun install` from the repository root to install it, then run `bun run --filter backend cursor:login` to sign in through a browser. Cursor stores an SDK credential locally after login. Alternatively, set `CURSOR_API_KEY` in the backend environment. Select the provider before creating a session; an optional model ID can be entered in the composer. Token counts are shown when reported; dollar estimates are only shown when provided by the provider.
# Mux
