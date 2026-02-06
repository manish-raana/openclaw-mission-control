# Mission Control

A real-time, high-performance dashboard for managing autonomous agents and complex task queues. Built with **Convex**, **React**, and **Tailwind CSS**, Mission Control provides a "Command Center" experience for monitoring and orchestrating operations.

## ✨ Features

- 🚀 **Real-time Synchronization**: Powered by Convex, every change (task moves, agent updates, comments, document creation) propagates instantly to all connected clients.
- 🤖 **Agent Oversight**: Monitor the status and activity of your agent roster in real-time, with live counts in the header.
- 📦 **Mission Queue**: A kanban-style overview of tasks categorized by status: Inbox, Assigned, In Progress, Review, and Done, with selection-driven detail views.
- 🧭 **Task Detail Panel**: Inspect and edit task status, descriptions, and assignees, plus quick actions like “Mark as Done” and task ID copy.
- 🧾 **Resources & Deliverables**: Task-linked documents show up as structured resources with type and path metadata.
- 💬 **Comments & Activity**: Comment tracking and a live activity feed with filters for tasks, comments, docs, and status updates.
- 🔐 **Secure Access**: Integrated Convex Auth for secure terminal login and management.
- 📱 **Responsive Design**: Premium, centered layout that works seamlessly across all devices.
- 🔗 **OpenClaw Integration**: Automatic task tracking for OpenClaw agent runs with real-time progress updates.

## 🛠 Tech Stack

- **Backend**: [Convex](https://convex.dev/) (Real-time Database, Functions, Auth)
- **Frontend**: [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Tabler Icons](https://tabler-icons.io/)

## 🚀 Getting Started

### 1. Initial Setup
Run the following commands to install dependencies and start the development environment:

```bash
bun install
bun dev
```

### 2. Seeding Data
To populate your local dashboard with the initial roster of agents and tasks, run the seed script:

```bash
npx convex run seed:run
```

### 3. Terminal Access
1. Open the app in your browser (usually `http://localhost:5173`).
2. Use the **Sign Up** flow to create your commander credentials.
3. Access the dashboard to start monitoring operations.

## 🔗 OpenClaw Integration

Mission Control integrates with [OpenClaw](https://github.com/anthropics/openclaw) to automatically track agent tasks in real-time.

### How It Works

```
OpenClaw Agent → Lifecycle Events → Hook Handler → HTTP POST → Convex → Real-time UI
```

When an OpenClaw agent runs:
1. **Task Created** - A new task appears in the "In Progress" column with the user's prompt as the title
2. **Progress Updates** - Tool usage and thinking events appear as comments
3. **Completion** - Task moves to "Done" with duration displayed (e.g., "Completed in 2m 15s")
4. **Errors** - Task moves to "Review" column with error details

### Setup

#### 1. Install the Mission Control Hook

Use the included installer script:

```bash
bash hooks/mission-control/install.sh
```

This copies `handler.ts` to `~/.openclaw/hooks/mission-control/` and creates a backup of any existing handler.

Or copy manually:

```bash
mkdir -p ~/.openclaw/hooks/mission-control
cp hooks/mission-control/handler.ts ~/.openclaw/hooks/mission-control/handler.ts
```

#### 2. Configure the Webhook URL

Add the Mission Control hook entry to your OpenClaw config (`~/.openclaw/openclaw.json`):

```json
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

Or set the environment variable:

```bash
export MISSION_CONTROL_URL="https://your-project.convex.site/openclaw/event"
```

#### 3. Restart OpenClaw Gateway

```bash
openclaw gateway restart
```

### Compatibility: OpenClaw >= 2026.2.x (tsdown bundling)

> **Temporary notice** — this section covers a workaround needed until [openclaw/openclaw#9947](https://github.com/openclaw/openclaw/pull/9947) is merged upstream.

OpenClaw 2026.2.x migrated its build from `tsc` to `tsdown`, which bundles `agent-events.ts` into a large shared chunk instead of producing a standalone `dist/infra/agent-events.js` file. Importing the bundled chunk directly re-executes all module-level side effects, which crashes the gateway in a respawn loop.

**The handler included in this repo already contains the fix.** It uses ESM module caching to discover and import the gateway's already-loaded chunk — sharing the same `listeners` Set without re-executing side effects.

The discovery strategy (`findAgentEventsModule()` in `handler.ts`) works as follows:

1. Check `globalThis.__openclawAgentEvents` (legacy path)
2. Parse `dist/index.js` imports, find the chunk containing `emitAgentEvent`, extract the `onAgentEvent` export alias, then `import()` the same file (ESM returns the cached instance)
3. Check `dist/infra/agent-events.js` (pre-2026.2.x builds, or after PR #9947 is merged)
4. Fallback: scan `loader-*.js` / `reply-*.js` chunks

**If you prefer to patch OpenClaw directly** instead of relying on the handler workaround, you have two options:

**Option A — Rebuild from the fix branch:**
```bash
git clone https://github.com/therealkaiharper-wq/openclaw
cd openclaw
git checkout fix/agent-events-entry-point
pnpm install && pnpm build
npm install -g .
openclaw gateway restart
```
This restores `dist/infra/agent-events.js` as a standalone entry point. The handler's step 3 will find it automatically.

**Option B — Add the entry point to your local build's `tsdown.config.ts`:**

In the OpenClaw source, add `"src/infra/agent-events.ts"` to the `entry` array in `tsdown.config.ts`, then rebuild:
```bash
pnpm build && npm install -g . && openclaw gateway restart
```

### Features

| Feature | Description |
|---------|-------------|
| **Prompt Capture** | User prompts become task titles and descriptions |
| **Duration Tracking** | Shows how long each agent run took |
| **Source Detection** | Messages from Telegram, Discord, etc. show source prefix |
| **Markdown Comments** | Progress updates render with full markdown support |
| **Agent Matching** | OpenClaw agents map to Mission Control agents by name |

### Webhook Endpoint

The integration receives events at:

```
POST /openclaw/event
```

Payload format:
```json
{
  "runId": "unique-run-id",
  "action": "start" | "end" | "error" | "progress",
  "sessionKey": "session-key",
  "prompt": "user prompt text",
  "source": "Telegram",
  "response": "agent response",
  "error": "error message"
}
```

## 📖 Learn More

- [Convex Documentation](https://docs.convex.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

---

*Mission Control // Secure Terminal Access // Ref: 2026*

## 🌟 GitHub Stars

![Star History](https://api.star-history.com/svg?repos=manish-raana/openclaw-mission-control&type=Date)
