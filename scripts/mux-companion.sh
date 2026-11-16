#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v bun >/dev/null || { echo 'Install Bun first: https://bun.sh'; exit 1; }
command -v mongod >/dev/null || { echo 'Install MongoDB Community Server first: https://www.mongodb.com/try/download/community'; exit 1; }
command -v openssl >/dev/null || { echo 'OpenSSL is required.'; exit 1; }
mkdir -p "$HOME/.mux-companion/db"
MONGO_PORT=27079
mongod --dbpath "$HOME/.mux-companion/db" --bind_ip 127.0.0.1 --port "$MONGO_PORT" --nounixsocket --quiet > "$HOME/.mux-companion/mongodb.log" 2>&1 &
mongo_pid=$!
trap 'kill "$mongo_pid" 2>/dev/null || true' EXIT
sleep 2
if ! kill -0 "$mongo_pid" 2>/dev/null; then echo 'MongoDB could not start. Check ~/.mux-companion/mongodb.log.'; exit 1; fi
export MUX_COMPANION=1
export MUX_PAIRING_TOKEN="$(openssl rand -hex 32)"
export DB_URL="mongodb://127.0.0.1:$MONGO_PORT/mux-companion"
export PORT=3001
printf '\nYour pairing code (keep it private):\n%s\n\nEnter it on the Mux website. Keep this terminal open.\n\n' "$MUX_PAIRING_TOKEN"
cd apps/backend
bun run start
