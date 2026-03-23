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

# 5. Recent activity (last 10 commits, one-line)
RECENT_COMMITS=$(git log --oneline -10 2>/dev/null | sed 's/"/\\"/g' | tr '\n' '|')

# 6. Days since last commit
LAST_COMMIT_DATE=$(git log -1 --format="%ci" 2>/dev/null | cut -d' ' -f1)
TODAY=$(date +%Y-%m-%d)

# 7. Check for quality checklist
CHECKLIST_EXISTS="false"
if [ -f "$ROOT/tools/quality-checklist.md" ]; then
    CHECKLIST_EXISTS="true"
fi

# 8. Output as system message
cat <<HOOKEOF
{"systemMessage": "SESSION PREFLIGHT — Branch: $BRANCH | Game: $CURRENT_GAME | Version: $LATEST_TAG (+$COMMITS_SINCE) | Behind remote: $BEHIND | On main: $ON_MAIN | All branches: $ALL_BRANCHES | Last commit: $LAST_COMMIT_DATE | Dirty: $(echo "$DIRTY" | tr '\n' '; ')", "hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "PROJECT STATE: branch=$BRANCH game=$CURRENT_GAME version=$LATEST_TAG commits_since_tag=$COMMITS_SINCE behind_remote=$BEHIND on_main=$ON_MAIN branches=$ALL_BRANCHES last_commit_date=$LAST_COMMIT_DATE quality_checklist=$CHECKLIST_EXISTS recent_commits=$RECENT_COMMITS --- MANDATORY SESSION START PROCEDURE: 1) If on main, switch to develop immediately. 2) If behind remote, pull. 3) Read CLAUDE.md for full roadmap and status. 4) Read tools/quality-checklist.md for self-check rules. 5) Present greeting to user: recent accomplishments (from git log and CLAUDE.md status), whats next on roadmap, then ask: What do you want to work on? 6) Run quality checklist silently before every major action."}}
HOOKEOF
