#!/usr/bin/env bash
set -euo pipefail

if lsof -ti :5173 >/dev/null 2>&1; then
  fuser -k 5173/tcp 2>/dev/null || true
  echo "Vuka dev server on :5173 stopped."
else
  echo "No process running on :5173."
fi
