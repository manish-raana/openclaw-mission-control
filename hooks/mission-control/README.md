# Mission Control Hook for OpenClaw

Syncs OpenClaw agent lifecycle events to the Mission Control dashboard for real-time task tracking.

## Status

**Working** - The hook captures agent lifecycle events and syncs them to Mission Control.

## Architecture

```
OpenClaw Gateway
    ├── gateway:startup → Hook registers lifecycle listener
    ├── agent:bootstrap → Hook captures agent start
    └── lifecycle events → Hook POSTs to Convex HTTP endpoint
                              ↓
                        Mission Control
                        Convex Backend
                              ↓
                        Real-time UI
```

## Installation

### 1. Create Hook Directory

```bash
mkdir -p ~/.openclaw/hooks/mission-control
```

### 2. Copy Hook Files

Copy these files to `~/.openclaw/hooks/mission-control/`:
- `HOOK.md` - Hook metadata
- `handler.ts` - Event handler
- `README.md` - This file

### 3. Configure OpenClaw

Add to `~/.openclaw/openclaw.json` under `hooks.internal.entries`:

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "mission-control": {
          "enabled": true,
          "env": {
            "MISSION_CONTROL_URL": "http://127.0.0.1:3211/openclaw/event"
          }
        }
      }
    }
  }
}
```

For production, use your Convex deployment URL:
```json
"MISSION_CONTROL_URL": "https://your-project.convex.site/openclaw/event"
```

**Note:** Port 3211 is the Convex site URL port for HTTP endpoints in local development. For production, use your Convex deployment site URL.

### 4. Verify Hook Registration

```bash
openclaw hooks list
```

Should show:
```
✓ ready   │ 📊 mission-control │ Sync agent lifecycle events to Mission Control dashboard │ openclaw-managed
```

Get detailed hook info:
```bash
openclaw hooks info mission-control
```

### 5. Restart Gateway

```bash
openclaw gateway restart
```

### 6. Check Status

Check gateway status:
```bash
openclaw gateway status
```

View recent logs:
```bash
openclaw logs --tail 50
```

Check for mission-control specific logs:
```bash
openclaw logs --filter mission-control
```

## Testing

### Run Test Agent

```bash
openclaw agent --agent main -m "test message"
```

### Check Logs for Events

```bash
openclaw logs --filter mission-control --tail 20
```

### Check Mission Control UI

Open the Mission Control dashboard to see if tasks appear in the "In Progress" column when an agent starts, and move to "Done" when complete.

## Mission Control Backend Setup

The Mission Control Convex backend needs these files:

### convex/schema.ts
Tasks table must include:
```typescript
sessionKey: v.optional(v.string()),
openclawRunId: v.optional(v.string()),
```

### convex/http.ts
HTTP endpoint for webhook:
```typescript
http.route({
  path: "/openclaw/event",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    await ctx.runMutation(api.openclaw.receiveAgentEvent, body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});
```

### convex/openclaw.ts
Mutation to handle events - creates/updates tasks based on agent lifecycle.

## How It Should Work

1. **gateway:startup** - Hook registers `onAgentEvent()` listener
2. **Agent starts** - `emitAgentEvent()` fires with `stream: "lifecycle"`, `phase: "start"`
3. **Hook listener** - Receives event, POSTs to Mission Control
4. **Convex mutation** - Creates task with status `in_progress`
5. **Agent ends** - `emitAgentEvent()` fires with `phase: "end"`
6. **Hook listener** - POSTs end event
7. **Convex mutation** - Updates task to status `done`

## Troubleshooting

### Hook Not Listed

```bash
openclaw hooks list
openclaw hooks check
```

- Check `~/.openclaw/hooks/mission-control/HOOK.md` exists
- Ensure `hooks.internal.enabled: true` in config

### Check Hook Details

```bash
openclaw hooks info mission-control
```

### "Unrecognized key" Error
- Only `enabled` and `env` are allowed in hook config entries
- Use `env.MISSION_CONTROL_URL` not `url` directly

### View Config

```bash
openclaw config show hooks.internal.entries.mission-control
```

### "Cannot find package 'openclaw'"
- The handler dynamically searches for the installed openclaw location
- Handler searches common paths: global npm, homebrew, source installs

### Events Not Received
- **Current known issue** - Module instance isolation
- The hook imports a separate instance of agent-events.js
- Need to find a way to access the same module instance as the gateway

### Enable/Disable Hook

```bash
openclaw hooks enable mission-control
openclaw hooks disable mission-control
```

## Files

```
~/.openclaw/hooks/mission-control/
├── HOOK.md      # Hook metadata (events: gateway:startup)
├── handler.ts   # Event handler
└── README.md    # This file
```

## Next Steps

To fix the module instance issue, potential approaches:
1. Have openclaw expose `onAgentEvent` through the hook context
2. Use a global/shared event bus
3. Store listeners in a global object accessible to both instances
4. Have openclaw's hook loader pass the agent-events module to hooks
