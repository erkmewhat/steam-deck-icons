#!/bin/bash
# Project setup and sync script.
# Run from project root: bash tools/setup.sh
#
# Ensures you have the latest code, correct branch, and all dependencies installed.
# Safe to run repeatedly — idempotent.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Stream Deck Sim Racing — Project Setup ==="
echo ""

# 1. Check git status
echo "[1/5] Checking git status..."
BRANCH=$(git branch --show-current)
echo "  Current branch: $BRANCH"

if [ -n "$(git status --porcelain)" ]; then
    echo "  ⚠ Uncommitted changes detected:"
    git status --short
    echo ""
    read -p "  Stash changes and continue? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash push -m "setup-auto-stash-$(date +%Y%m%d-%H%M%S)"
        echo "  Changes stashed."
    else
        echo "  Continuing with uncommitted changes."
    fi
fi

# 2. Fetch and pull latest
echo "[2/5] Fetching latest from origin..."
git fetch origin --tags --prune

if git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH")
    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "  Remote has new commits. Pulling..."
        git pull origin "$BRANCH" --rebase
        echo "  Updated to latest."
    else
        echo "  Already up to date."
    fi
else
    echo "  Branch '$BRANCH' has no remote tracking. Skipping pull."
fi

# 3. Show version info
echo "[3/5] Version info..."
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "no tags")
COMMITS_SINCE=$(git rev-list "${LATEST_TAG}..HEAD" --count 2>/dev/null || echo "?")
echo "  Latest tag: $LATEST_TAG"
echo "  Commits since: $COMMITS_SINCE"
echo "  Branch: $BRANCH"

# 4. Install dependencies
echo "[4/5] Installing dependencies..."
if [ ! -d "$ROOT/node_modules" ]; then
    echo "  Installing root dependencies..."
    cd "$ROOT" && npm install --silent
else
    echo "  Root node_modules present."
fi

if [ ! -d "$ROOT/plugin/node_modules" ]; then
    echo "  Installing plugin dependencies..."
    cd "$ROOT/plugin" && npm install --silent
else
    echo "  Plugin node_modules present."
fi
cd "$ROOT"

# 5. Verify build
echo "[5/5] Verifying TypeScript build..."
if [ -f "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/plugin.js" ]; then
    SRC_TIME=$(stat -c %Y "$ROOT/plugin/src/plugin.ts" 2>/dev/null || stat -f %m "$ROOT/plugin/src/plugin.ts" 2>/dev/null || echo 0)
    BIN_TIME=$(stat -c %Y "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/plugin.js" 2>/dev/null || stat -f %m "$ROOT/plugin/com.simracing.lmu.sdPlugin/bin/plugin.js" 2>/dev/null || echo 0)
    if [ "$SRC_TIME" -gt "$BIN_TIME" ] 2>/dev/null; then
        echo "  Source newer than build. Rebuilding..."
        cd "$ROOT/plugin" && npm run build
        cd "$ROOT"
    else
        echo "  Build is current."
    fi
else
    echo "  No build found. Building..."
    cd "$ROOT/plugin" && npm run build
    cd "$ROOT"
fi

echo ""
echo "=== Setup complete ==="
echo "  Branch:  $BRANCH"
echo "  Version: $LATEST_TAG (+$COMMITS_SINCE)"
echo "  Ready to work."
echo ""
echo "Quick commands:"
echo "  bash tools/deploy.sh [lmu|ace]  — Build and deploy to Stream Deck"
echo "  cd plugin && npm run build      — Compile TypeScript only"
echo "  bash tools/setup.sh             — Re-run this setup"
