#!/bin/bash
# Non-interactive session preflight for Claude Code SessionStart hook.
# Outputs JSON context so Claude has full project state on every session.
# No prompts, no interactive input — safe for hooks.

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1. Fetch remote (silent)
git fetch origin --tags --prune 2>/dev/null

# 2. Gather state
BRANCH=$(git branch --show-current)
CURRENT_GAME=$(cat .current-game 2>/dev/null || echo "unknown")
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "none")
COMMITS_SINCE=$(git rev-list "${LATEST_TAG}..HEAD" --count 2>/dev/null || echo "0")
DIRTY=$(git status --porcelain | head -5)
ALL_BRANCHES=$(git branch -a --format='%(refname:short)' | tr '\n' ', ')

# 3. Check if local is behind remote
BEHIND=0
if git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse "origin/$BRANCH")
    if [ "$LOCAL" != "$REMOTE" ]; then
        BEHIND=$(git rev-list HEAD..origin/$BRANCH --count 2>/dev/null || echo "0")
    fi
fi

# 4. Check if on main (violation)
ON_MAIN="false"
if [ "$BRANCH" = "main" ]; then
    ON_MAIN="true"
fi

# 5. Output as system message
cat <<HOOKEOF
{"systemMessage": "SESSION PREFLIGHT — Branch: $BRANCH | Game: $CURRENT_GAME | Version: $LATEST_TAG (+$COMMITS_SINCE) | Behind remote: $BEHIND commits | On main (violation): $ON_MAIN | All branches: $ALL_BRANCHES | Dirty: $(echo "$DIRTY" | tr '\n' '; ') | MANDATORY: Read CLAUDE.md now. If on main, switch to develop immediately. If behind remote, pull before doing anything.", "hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "PROJECT STATE: branch=$BRANCH game=$CURRENT_GAME version=$LATEST_TAG commits_since_tag=$COMMITS_SINCE behind_remote=$BEHIND on_main=$ON_MAIN branches=$ALL_BRANCHES. ACTION REQUIRED: 1) Read CLAUDE.md for roadmap and status. 2) If on main, run: git checkout develop. 3) If behind remote, run: git pull. 4) Report branch, version, game, and next roadmap step to user."}}
HOOKEOF
