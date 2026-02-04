# OpenClaw Integration for Mission Control

## Overview

Mission Control integrates with OpenClaw to automatically track agent tasks in real-time without polling. When an OpenClaw agent runs, tasks appear on the board and are tracked through completion with status updates, progress comments, and duration tracking.

**Key constraint:** No modifications to OpenClaw source code. Integration achieved entirely through user-installed hooks and configuration.

## Architecture

```
OpenClaw Lifecycle → emitAgentEvent() → onAgentEvent() listener → HTTP POST → Convex HTTP Endpoint → Mutation → Real-time UI
```

**Why this approach:**
- No polling - event-driven via OpenClaw's existing agent event system
- Zero OpenClaw source changes - uses user-installed hook in `~/.openclaw/hooks/`
- Leverages `gateway:startup` hook to register a persistent `onAgentEvent()` listener
- Captures user prompts from session files for meaningful task titles
- Loose coupling - HTTP webhook between systems
- Works across processes/machines

## Features

| Feature | Description |
|---------|-------------|
| **Prompt Capture** | User prompts become task titles and descriptions |
| **Duration Tracking** | Shows how long each agent run took (e.g., "Completed in 2m 15s") |
| **Source Detection** | Messages from Telegram, Discord, etc. show source prefix in comments |
| **Markdown Comments** | Progress updates render with full markdown support |
| **Agent Matching** | OpenClaw agents map to Mission Control agents by name |
| **Progress Updates** | Tool usage and thinking events appear as task comments |

## How It Works

1. **Hook listens for `gateway:startup`** - OpenClaw triggers this when the gateway starts
2. **Hook listens for `agent:bootstrap`** - Captures session info (agentId, sessionId) for prompt extraction
3. **Dynamically imports `onAgentEvent`** - from openclaw's `dist/infra/agent-events.js` module
4. **Registers a persistent listener** - watches for lifecycle events (`stream: "lifecycle"`)
5. **Extracts user prompt** - reads from session JSONL file at `~/.openclaw/agents/{agentId}/sessions/{sessionId}.jsonl`
6. **Cleans metadata** - strips channel metadata (Telegram, Discord, etc.) while preserving source
7. **POSTs to Mission Control** - on `phase: "start"` / `phase: "end"` / `phase: "error"`

## Files

### Mission Control (this repo)

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Tasks table with `sessionKey`, `openclawRunId`, `startedAt` fields |
| `convex/http.ts` | POST route `/openclaw/event` for webhook |
| `convex/openclaw.ts` | Mutations to create/update tasks, add comments, track duration |
| `convex/queries.ts` | Enriched queries with `lastMessageTime` for task cards |

### OpenClaw Hook (`~/.openclaw/hooks/mission-control/`)

| File | Purpose |
|------|---------|
| `HOOK.md` | Hook metadata (events: `gateway:startup`, `agent:bootstrap`) |
| `handler.ts` | Registers listener, extracts prompts, POSTs to Convex |

---

## Implementation Details

### Schema Extensions

**File: `convex/schema.ts`**

```typescript
tasks: defineTable({
  // ... existing fields
  sessionKey: v.optional(v.string()),
  openclawRunId: v.optional(v.string()),
  startedAt: v.optional(v.number()),
}),
```

### HTTP Endpoint

**File: `convex/http.ts`**

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

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

export default http;
```

### Webhook Mutation

**File: `convex/openclaw.ts`**

Handles incoming events with:
- Task creation with prompt-based titles
- Duration calculation and formatting
- Comment creation for start/progress/end events
- Activity feed updates
- Agent matching by name

Key functions:
- `formatDuration(ms)` - converts milliseconds to human-readable format
- `summarizePrompt(prompt)` - truncates long prompts for titles

### Hook Handler

**File: `~/.openclaw/hooks/mission-control/handler.ts`**

Key functions:
- `extractCleanPrompt(rawPrompt)` - strips channel metadata, returns `{ prompt, source }`
- `getLastUserMessage(sessionFile)` - reads JSONL to find user prompt
- `getLastAssistantMessage(sessionFile)` - captures agent response for completion
- `findAgentEventsModule()` - dynamically locates openclaw's agent-events module

---

## Configuration

### 1. Install the Hook

Copy the hook files to `~/.openclaw/hooks/mission-control/`:
- `HOOK.md`
- `handler.ts`

### 2. Configure OpenClaw

Add to `~/.openclaw/config.jsonc`:

```jsonc
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "mission-control": {
          "enabled": true,
          "env": {
            "MISSION_CONTROL_URL": "https://your-project.convex.site/openclaw/event"
          }
        }
      }
    }
  }
}
```

For local development:
```jsonc
"MISSION_CONTROL_URL": "http://127.0.0.1:3211/openclaw/event"
```

### 3. Restart Gateway

```bash
openclaw gateway restart
```

---

## Webhook Payload

**Endpoint:** `POST /openclaw/event`

```typescript
{
  runId: string;           // Unique run identifier
  action: string;          // "start" | "end" | "error" | "progress"
  sessionKey?: string;     // Session key for task matching
  agentId?: string;        // Agent name for assignment
  timestamp?: string;      // ISO timestamp
  prompt?: string;         // User's prompt (cleaned)
  source?: string;         // Channel source (Telegram, Discord, etc.)
  response?: string;       // Agent's response (on completion)
  message?: string;        // Progress message
  error?: string;          // Error message
  eventType?: string;      // Event type for debugging
}
```

---

## Task Lifecycle

### On Agent Start
1. Task created in "In Progress" column
2. Title set from summarized prompt
3. Description set to full prompt
4. First comment added: "Started" with source prefix if from channel
5. Activity logged

### On Progress
- Tool usage creates comment: "Using tool: {toolName}"
- Thinking events create comment: "Thinking..."

### On Agent End
1. Task moved to "Done"
2. Duration calculated from `startedAt`
3. Final comment: "Completed in {duration}" with response excerpt
4. Activity logged

### On Error
1. Task moved to "Review"
2. Error comment added with details
3. Activity logged

---

## Agent Mapping

OpenClaw agents are matched to Mission Control agents by name. Create agents in Mission Control that match your OpenClaw agent IDs.

If no match is found, a system "OpenClaw" agent is created/used.

---

## Verification

1. Start Mission Control: `bun dev`
2. Ensure hook is configured with correct URL
3. Restart OpenClaw gateway
4. Run an agent: `openclaw agent -m "Test task"`
5. Verify in UI:
   - Task appears in "In Progress"
   - Comments show progress
   - On completion, moves to "Done" with duration

---

## Summary

**Mission Control:**
- 3 files modified (`convex/schema.ts`, `convex/http.ts`, `convex/queries.ts`)
- 1 file created (`convex/openclaw.ts`)

**OpenClaw User Config:**
- 2 files created (`~/.openclaw/hooks/mission-control/HOOK.md`, `handler.ts`)

**Total: 6 files, no OpenClaw source changes, event-driven, real-time sync with rich features**
