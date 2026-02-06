#!/usr/bin/env bash
# Mission Control Hook Installer
# Usage: bash hooks/mission-control/install.sh
set -euo pipefail

HOOK_DIR="$HOME/.openclaw/hooks/mission-control"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing mission-control hook..."

# 1. Copy hook files
mkdir -p "$HOOK_DIR"
cp "$SCRIPT_DIR/HOOK.md" "$HOOK_DIR/HOOK.md"
cp "$SCRIPT_DIR/handler.ts" "$HOOK_DIR/handler.ts"
echo "  Copied hook files to $HOOK_DIR"

# 2. Ensure the agent-events shim exists for the current openclaw version.
#    The hook needs onAgentEvent from the gateway's own module instance.
#    Older versions had infra/agent-events.js; newer bundled versions don't.
#    This creates a shim at the old path so the handler can find it.
OPENCLAW_BIN="$(command -v openclaw 2>/dev/null || true)"
if [ -n "$OPENCLAW_BIN" ]; then
  DIST_DIR="$(dirname "$(readlink "$OPENCLAW_BIN" 2>/dev/null || echo "$OPENCLAW_BIN")")"
  # Resolve dist dir from the bin entry point
  for candidate in "$DIST_DIR" "$DIST_DIR/../dist" "/usr/local/lib/node_modules/openclaw/dist" "/opt/homebrew/lib/node_modules/openclaw/dist"; do
    if [ -d "$candidate" ] && ls "$candidate"/*.js &>/dev/null; then
      DIST_DIR="$(cd "$candidate" && pwd)"
      break
    fi
  done

  INFRA_DIR="$DIST_DIR/infra"
  SHIM_PATH="$INFRA_DIR/agent-events.js"

  if [ -f "$SHIM_PATH" ]; then
    echo "  agent-events.js already exists (legacy openclaw version)"
  else
    # Find the bundled file that contains onAgentEvent + emitAgentEvent
    LOADER_FILE=""
    for f in "$DIST_DIR"/loader-*.js "$DIST_DIR"/*.js; do
      [ -f "$f" ] || continue
      if grep -q "function onAgentEvent(" "$f" 2>/dev/null && grep -q "function emitAgentEvent(" "$f" 2>/dev/null; then
        LOADER_FILE="$(basename "$f")"
        break
      fi
    done

    if [ -n "$LOADER_FILE" ]; then
      # Find the export alias: "onAgentEvent as Xx" in the export map
      ALIAS=$(grep -o 'onAgentEvent as [a-zA-Z_$][a-zA-Z0-9_$]*' "$DIST_DIR/$LOADER_FILE" | head -1 | awk '{print $3}')
      if [ -z "$ALIAS" ]; then
        ALIAS="onAgentEvent"
      fi

      # Use sudo if the dist dir is not writable by the current user
      SUDO=""
      if [ ! -w "$DIST_DIR" ]; then
        SUDO="sudo"
        echo "  (dist dir is root-owned, using sudo)"
      fi

      $SUDO mkdir -p "$INFRA_DIR"
      $SUDO tee "$SHIM_PATH" > /dev/null << SHIMEOF
// Auto-generated shim for mission-control hook compatibility.
// Re-exports onAgentEvent from the bundled loader module.
// Recreate by running: bash hooks/mission-control/install.sh
export { ${ALIAS} as onAgentEvent } from "../${LOADER_FILE}";
SHIMEOF
      echo "  Created agent-events shim -> $LOADER_FILE (export: $ALIAS)"
    else
      echo "  WARNING: Could not find onAgentEvent in openclaw dist files."
      echo "  The hook may not receive lifecycle events."
    fi
  fi
fi

# 3. Ensure hook is enabled in config
CONFIG="$HOME/.openclaw/openclaw.json"
if [ -f "$CONFIG" ]; then
  if ! grep -q '"mission-control"' "$CONFIG"; then
    echo ""
    echo "  NOTE: Add mission-control to your openclaw.json hooks.internal.entries:"
    echo '    "mission-control": { "enabled": true, "env": { "MISSION_CONTROL_URL": "http://127.0.0.1:3211/openclaw/event" } }'
  else
    echo "  Hook already configured in openclaw.json"
  fi
else
  echo "  WARNING: $CONFIG not found. Run 'openclaw' first to initialize."
fi

# 4. Restart gateway if running
if command -v openclaw &>/dev/null; then
  if openclaw gateway status 2>&1 | grep -q "running"; then
    echo "  Restarting gateway..."
    openclaw gateway restart 2>/dev/null || true
    sleep 3
  fi
fi

# 5. Verify
if command -v openclaw &>/dev/null; then
  echo ""
  openclaw hooks list 2>/dev/null || true
fi

echo ""
echo "Done. Run this script again after upgrading openclaw."
