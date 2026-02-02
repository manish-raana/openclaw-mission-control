# OpenClaw Setup for Mission Control

This guide tells OpenClaw agents how to connect to Mission Control, receive tasks, and sync progress.

## Prerequisites

1. **Convex CLI installed globally:**
   ```bash
   npm install -g convex
   ```

2. **Mission Control server running** (typically at `http://127.0.0.1:3211`)

---

## Step 1: Set Environment Variables

Add these to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export CONVEX_URL="http://127.0.0.1:3211"
export OPENCLAW_GATEWAY_TOKEN="your-token-here"
```

Then reload:
```bash
source ~/.zshrc
openclaw gateway restart
```

**Get your token** from Mission Control's `.env.local`:
```bash
cat /Users/sethrose/Developer/Github/openclaw-mission-control/.env.local | grep OPENCLAW_GATEWAY_TOKEN
```

---

## Step 2: Add Mission Control to AGENTS.md

Append this section to `~/.openclaw/workspace/AGENTS.md`:

```markdown
---

# Mission Control Protocol

You are part of a coordinated squad. Your "Shared Brain" is a Convex database via Mission Control.

## Convex CLI Setup

Install Convex globally if you haven't:
```bash
npm install -g convex
```

## Agent Instructions (Heartbeat)

On every wake-up cycle, perform the following in order:

### 1. Poll for Tasks
```bash
npx convex run queries:listTasks '{}'
```
Filter for tasks where you are in `assigneeIds` and status is "assigned".

### 2. Accept a Task
When you pick up a task, write to `memory/WORKING.md`:
```
Task: <Task Title>
Task ID: <sessionKey from Convex>
```
This signals the sync bridge to flip the task to "in_progress".

### 3. Log Activity
For every major tool use, log it to Mission Control:
```bash
npx convex run activities:create '{"type": "tool_use", "message": "Using browser to research X", "agentId": "YOUR_AGENT_ID"}'
```

### 4. Submit Deliverables
Upload final outputs and move task to review:
```bash
npx convex run documents:create '{"title": "Result", "content": "MARKDOWN_HERE", "type": "deliverable", "taskId": "TASK_ID"}'
npx convex run tasks:update '{"id": "TASK_ID", "status": "review"}'
```

## Task Lifecycle

| Status | Meaning |
|--------|---------|
| inbox | Unassigned tasks |
| assigned | Assigned to you, not started |
| in_progress | You're actively working (tracked via WORKING.md) |
| review | Submitted, awaiting approval |
| done | Manually approved in UI |

## Local Working Memory

**Always** keep `memory/WORKING.md` updated with your current Task ID and sessionKey. This is how the sync bridge knows what you're working on.
```

---

## Step 3: Add Mission Control Behavior to SOUL.md

Append this section to `~/.openclaw/workspace/SOUL.md`:

```markdown
---

### Mission Control Behavior

- **You are proactive.** You do not wait for the Commander to DM you. Check Mission Control on every heartbeat.
- **The Inbox is your truth.** Treat the Mission Control "Inbox" and "Assigned" columns as your primary source of work.
- **Never complete locally without updating.** You must update task status in Convex before marking anything done.
- **Prefix sync logs with "SYNC:"** to distinguish dashboard activity from chat messages.
- **Keep WORKING.md current.** If you're working on a task, the sessionKey must be written there so the bridge tracks progress.
```

---

## Step 4: Create HEARTBEAT.md

Create or overwrite `~/.openclaw/workspace/HEARTBEAT.md`:

```markdown
# Heartbeat Checklist

**Mission Control** (every wake-up):
1. Run `npx convex run queries:listTasks '{}'` and check for assigned tasks
2. If assigned, update `memory/WORKING.md` with Task ID and title
3. Log activity with `npx convex run activities:create`

**Quick Wins** (rotate through):
- Review `memory/YYYY-MM-DD.md` for pending items
- Check git status on active projects
- Update MEMORY.md with lessons learned

**Quiet Hours**: 23:00-08:00 CST unless urgent.

Reply `HEARTBEAT_OK` when nothing needs attention.
```

---

## Step 5: Create WORKING.md Template

Create `~/.openclaw/workspace/memory/WORKING.md`:

```markdown
# Current Task

Task:
Task ID:

---

## Active Context

<!-- What are you working on right now? -->

## Progress Notes

<!-- Quick scratchpad for current work -->

## Subtasks

- [ ]
- [ ]
- [ ]
```

---

## Step 6: Create Mission Control Skill

Create `~/.openclaw/workspace/skills/mission-control/SKILL.md`:

```markdown
---
name: mission-control
version: 1.0.0
description: Integration for the Mission Control Dashboard
metadata: {"openclaw":{"emoji":"🛰️","category":"infrastructure"}}
---

# Mission Control Protocol

This skill enables you to communicate with the Convex-powered Mission Control dashboard.

## Setup Requirements

Ensure these environment variables are configured:
- `CONVEX_URL` or `CONVEX_SITE_URL` - Backend API URL
- `OPENCLAW_GATEWAY_TOKEN` - Secure ingest token

Verify with: `openclaw configure --section environment`

## Agent Instructions (Heartbeat)

On every wake-up cycle:

### 1. Poll for Tasks
```bash
npx convex run queries:listTasks '{}'
```
Filter for tasks where:
- You are in `assigneeIds`
- Status is "assigned"

### 2. Synchronize WORKING.md
If accepting a task, write to `memory/WORKING.md`:
```
Task: <Task Title>
Task ID: <sessionKey from Convex>
```
This triggers the sync bridge to flip status to "in_progress".

### 3. Log Activity
Mirror technical work to the dashboard:
```bash
npx convex run activities:create '{"type": "sync", "message": "Executing task...", "agentId": "YOUR_ID"}'
```

### 4. Submit Deliverables
Upload results and move to review:
```bash
npx convex run documents:create '{"title": "Result", "content": "MARKDOWN", "type": "deliverable", "taskId": "TASK_ID"}'
npx convex run tasks:update '{"id": "TASK_ID", "status": "review"}'
```

## Common Commands

| Action | Command |
|--------|---------|
| List tasks | `npx convex run queries:listTasks '{}'` |
| Update status | `npx convex run tasks:update` |
| Create activity | `npx convex run activities:create` |
| Upload document | `npx convex run documents:create` |

## Task Status Flow

```
inbox → assigned → in_progress → review → done
                        ↑
                   (tracked via WORKING.md)
```
```

---

## Step 7: Set Up Heartbeat Cron

Create a cron to check for tasks every 10 minutes. **Important:** Run from Mission Control directory where `convex` is installed:

```bash
cd /Users/sethrose/Developer/Github/openclaw-mission-control
openclaw cron add \
  --name "mission-control-heartbeat" \
  --cron "*/10 * * * *" \
  --session "isolated" \
  --message "cd /Users/sethrose/Developer/Github/openclaw-mission-control && npx convex run queries:listTasks '{}' && cat memory/WORKING.md"
```

---

## Step 8: Run the Sync Bridge

Start the sync bridge in watch mode (from Mission Control directory):

```bash
cd /Users/sethrose/Developer/Github/openclaw-mission-control
node openclaw-sync.mjs --watch
```

The bridge will:
- Monitor `memory/WORKING.md` → auto-flip tasks to `in_progress`
- Poll sessions via `openclaw sessions list` → update agent `lastSeenAt`
- Emit activities to the Live Feed

---

## Testing the Integration

1. **Verify agent is synced:**
   ```bash
   npx convex run queries:listAgents '{}'
   ```
   You should see your agent with `source: "openclaw"`.

2. **Check tasks:**
   ```bash
   npx convex run queries:listTasks '{}'
   ```

3. **Create a test task** in Mission Control UI and assign to your agent. On next heartbeat, you should pick it up.

---

## System Boundary

| Component | Responsibility |
|-----------|---------------|
| **OpenClaw** | Execution (tools, files, browser, shell), local memory, cron heartbeats |
| **Mission Control** | Shared state (Convex), dashboard UI, task lifecycle, Live Feed |

Mission Control only ingests task sessions or explicit tasks. Agent identity sessions (e.g., `agent:main:main`) are ignored to keep the Mission Queue clean.
