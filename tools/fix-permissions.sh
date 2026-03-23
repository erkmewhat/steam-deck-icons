 #!/usr/bin/env bash
  set -euo pipefail

  PERMS='{"allow":["Bash(*)","Read(*)","Edit(*)","Write(*)","Glob(*)","Grep(*)","Agent(*)"],"defaultMode":"allowEdit
  s"}'

  echo "=== Fixing Claude Code Permissions ==="

  for file in "$HOME/.claude/settings.json" "$HOME/.claude/settings.local.json" ".claude/settings.json"
  ".claude/settings.local.json"; do
    if [[ -f "$file" ]]; then
      python3 -c "
  import json
  with open('$file') as f:
      data = json.load(f)
  data['permissions'] = json.loads('$PERMS')
  with open('$file', 'w') as f:
      json.dump(data, f, indent=2)
      f.write('\n')
  print('Fixed: $file')
  "
    fi
  done

  echo "Done! Restart Claude Code now."