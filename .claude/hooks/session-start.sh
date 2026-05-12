#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code web sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "==> FoodStack session-start hook"

cd "$CLAUDE_PROJECT_DIR"

echo "==> Installing npm dependencies..."
npm install

echo "==> Generating Prisma client..."
npm run --workspace=@foodstack/database generate

echo "==> Done."
