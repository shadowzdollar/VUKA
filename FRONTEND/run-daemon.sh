#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Free up port 5173 gracefully before launching daemon
if lsof -ti :5173 >/dev/null 2>&1; then
  echo "Stopping previous instance on :5173..."
  fuser -k 5173/tcp 2>/dev/null || true
  sleep 1.5
fi

# Launch with nohup and setsid to completely detach from terminal session & ignore SIGHUP
setsid nohup npm run dev > "$DIR/vuka-dev.log" 2>&1 < /dev/null &

NEW_PID=$!
echo "Vuka dev server launched in background (PID: $NEW_PID)."
echo "Output is logged to: $DIR/vuka-dev.log"
