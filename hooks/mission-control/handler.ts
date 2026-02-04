/**
 * Mission Control Hook
 *
 * Syncs agent lifecycle events to Mission Control dashboard.
 * Captures user prompts and agent responses.
 */

import path from "node:path";
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import os from "node:os";

type HookEvent = {
  type: string;
  action: string;
  sessionKey: string;
  context: Record<string, unknown>;
  timestamp: Date;
  messages: string[];
};

type AgentEventPayload = {
  runId: string;
  seq: number;
  stream: string;
  ts: number;
  data: Record<string, unknown>;
  sessionKey?: string;
};

type OpenClawConfig = {
  hooks?: {
    internal?: {
      entries?: Record<string, { enabled?: boolean; env?: Record<string, string> }>;
    };
  };
};

let listenerRegistered = false;
let missionControlUrl: string | undefined;

// Track session info by sessionKey
const sessionInfo = new Map<string, { agentId: string; sessionId: string }>();

// Track the last real (non-system) runId per sessionKey so follow-up runs can link back
const lastRealRunId = new Map<string, string>();

// Track pending write tool calls by toolCallId
const pendingWrites = new Map<string, { filePath: string; content: string; sessionKey: string }>();

async function postToMissionControl(payload: Record<string, unknown>) {
  if (!missionControlUrl) return;

  try {
    const response = await fetch(missionControlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error("[mission-control] POST failed:", response.status);
    }
  } catch (err) {
    console.error("[mission-control] Failed:", err instanceof Error ? err.message : err);
  }
}

function resolveUrl(cfg?: OpenClawConfig): string | undefined {
  const hookConfig = cfg?.hooks?.internal?.entries?.["mission-control"];
  return hookConfig?.env?.MISSION_CONTROL_URL || process.env.MISSION_CONTROL_URL;
}

/**
 * Extract the last user message from a session file (JSONL format)
 */
async function getLastUserMessage(sessionFilePath: string): Promise<string | null> {
  try {
    const content = await fsp.readFile(sessionFilePath, "utf-8");
    const lines = content.trim().split("\n");

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type === "message" && entry.message?.role === "user") {
          const msg = entry.message;
          if (msg.content) {
            if (Array.isArray(msg.content)) {
              const textParts = msg.content
                .filter((p: { type?: string }) => p.type === "text")
                .map((p: { text?: string }) => p.text || "")
                .join("\n");
              if (textParts) return textParts;
            } else if (typeof msg.content === "string") {
              return msg.content;
            }
          }
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  } catch (err) {
    console.error("[mission-control] Failed to read session file:", err);
  }
  return null;
}

/**
 * Extract the last assistant message from a session file
 */
async function getLastAssistantMessage(sessionFilePath: string): Promise<string | null> {
  try {
    const content = await fsp.readFile(sessionFilePath, "utf-8");
    const lines = content.trim().split("\n");

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type === "message" && entry.message?.role === "assistant") {
          const msg = entry.message;
          if (msg.content) {
            if (Array.isArray(msg.content)) {
              const textParts = msg.content
                .filter((p: { type?: string }) => p.type === "text")
                .map((p: { text?: string }) => p.text || "")
                .join("\n");
              if (textParts) return textParts;
            } else if (typeof msg.content === "string") {
              return msg.content;
            }
          }
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  } catch (err) {
    console.error("[mission-control] Failed to read session file:", err);
  }
  return null;
}

function getSessionFilePath(agentId: string, sessionId: string): string {
  const home = os.homedir();
  return path.join(home, ".openclaw", "agents", agentId, "sessions", `${sessionId}.jsonl`);
}

/**
 * Extract the clean user message and source from metadata-wrapped prompts.
 * Handles formats like:
 * "System: [timestamp] Node: ... [Telegram User ...] actual message [message_id: 123]"
 */
function extractCleanPrompt(rawPrompt: string): { prompt: string; source: string | null } {
  // Webchat metadata format:
  // "System: [timestamp] Node: hostname (IP) · app VERSION · mode MODE\n\nactual user message"
  const webchatMatch = rawPrompt.match(/^System:\s*\[\d{4}-[^\]]+\]\s*Node:\s*[^\n]+\n\n(.+)/s);
  if (webchatMatch && webchatMatch[1]) {
    return { prompt: webchatMatch[1].trim(), source: "webchat" };
  }

  // If it doesn't look like it has metadata, return as-is
  if (!rawPrompt.includes("System:") && !rawPrompt.includes("[message_id:")) {
    return { prompt: rawPrompt.trim(), source: null };
  }

  // Try to extract the source and actual message
  // Pattern: [Channel User (info) timestamp] actual message [message_id: xxx]
  const channels = ["Telegram", "Discord", "Slack", "WhatsApp", "SMS", "Email"];
  let source: string | null = null;

  for (const channel of channels) {
    if (rawPrompt.includes(`[${channel}`)) {
      source = channel;
      break;
    }
  }

  const channelMatch = rawPrompt.match(/\[(?:Telegram|Discord|Slack|WhatsApp|SMS|Email)[^\]]+\]\s*(.+?)(?:\s*\[message_id:|$)/s);
  if (channelMatch && channelMatch[1]) {
    return { prompt: channelMatch[1].trim(), source };
  }

  // Fallback: try to get content after the last ] before [message_id
  const messageIdIndex = rawPrompt.indexOf("[message_id:");
  if (messageIdIndex > 0) {
    const beforeMessageId = rawPrompt.slice(0, messageIdIndex);
    const lastBracket = beforeMessageId.lastIndexOf("]");
    if (lastBracket > 0) {
      return { prompt: beforeMessageId.slice(lastBracket + 1).trim(), source };
    }
  }

  // Last fallback: return trimmed original
  return { prompt: rawPrompt.trim(), source };
}

function formatPromptWithSource(prompt: string, source: string | null): string {
  if (source) {
    return `${source}: ${prompt}`;
  }
  return prompt;
}

async function findAgentEventsModule(): Promise<{
  onAgentEvent: (listener: (evt: AgentEventPayload) => void) => () => void;
} | null> {
  const g = globalThis as Record<string, unknown>;
  if (g.__openclawAgentEvents && typeof (g.__openclawAgentEvents as Record<string, unknown>).onAgentEvent === "function") {
    return g.__openclawAgentEvents as { onAgentEvent: (listener: (evt: AgentEventPayload) => void) => () => void };
  }

  const searchPaths = [
    "/usr/local/lib/node_modules/openclaw/dist/infra/agent-events.js",
    "/opt/homebrew/lib/node_modules/openclaw/dist/infra/agent-events.js",
  ];

  const mainPath = process.argv[1];
  if (mainPath) {
    const mainDir = path.dirname(mainPath);
    searchPaths.unshift(path.join(mainDir, "infra", "agent-events.js"));
    searchPaths.unshift(path.join(mainDir, "..", "dist", "infra", "agent-events.js"));
  }

  const home = os.homedir();
  if (home) {
    searchPaths.push(path.join(home, ".npm-global", "lib", "node_modules", "openclaw", "dist", "infra", "agent-events.js"));
  }

  for (const searchPath of searchPaths) {
    try {
      if (fs.existsSync(searchPath)) {
        const module = await import(`file://${searchPath}`);
        if (typeof module.onAgentEvent === "function") return module;
      }
    } catch {
      // Continue
    }
  }

  return null;
}

const handler = async (event: HookEvent) => {
  // Initialize URL from config
  if (!missionControlUrl) {
    const cfg = event.context.cfg as OpenClawConfig | undefined;
    missionControlUrl = resolveUrl(cfg);
  }

  console.log(`[mission-control] Event: ${event.type}:${event.action} session=${event.sessionKey}`);

  // Handle agent bootstrap - store session info for later
  if (event.type === "agent" && event.action === "bootstrap") {
    const agentId = event.context.agentId as string | undefined;
    const sessionId = event.context.sessionId as string | undefined;

    if (agentId && sessionId) {
      console.log("[mission-control] Storing session info:", agentId, sessionId);
      sessionInfo.set(event.sessionKey, { agentId, sessionId });
    }
    return;
  }

  // Register listener on gateway startup
  if (event.type === "gateway" && event.action === "startup") {
    if (listenerRegistered) return;

    if (!missionControlUrl) {
      console.log("[mission-control] No URL configured, skipping");
      return;
    }

    try {
      const agentEvents = await findAgentEventsModule();
      if (!agentEvents) {
        console.error("[mission-control] Could not find agent-events module");
        return;
      }

      agentEvents.onAgentEvent(async (evt: AgentEventPayload) => {
        const sessionKey = evt.sessionKey;
        if (!sessionKey) return;

        // Lifecycle events
        if (evt.stream === "lifecycle") {
          const phase = evt.data?.phase as string | undefined;
          if (!phase) return;

          // Skip heartbeat runs — they shouldn't create tasks
          const messageChannel = evt.data?.messageChannel as string | undefined;
          if (messageChannel === "heartbeat") {
            console.log("[mission-control] Skipping heartbeat lifecycle event");
            return;
          }

          const info = sessionInfo.get(sessionKey);

          if (phase === "start") {
            let prompt: string | null = null;
            let source: string | null = null;
            let rawPrompt: string | null = null;

            if (info) {
              const sessionFile = getSessionFilePath(info.agentId, info.sessionId);
              await new Promise(resolve => setTimeout(resolve, 100));
              rawPrompt = await getLastUserMessage(sessionFile);
              if (rawPrompt) {
                const extracted = extractCleanPrompt(rawPrompt);
                prompt = extracted.prompt;
                source = extracted.source;
                console.log("[mission-control] Raw prompt:", rawPrompt.slice(0, 100));
                console.log("[mission-control] Clean prompt:", prompt.slice(0, 100));
                console.log("[mission-control] Source:", source);
              }
            }

            // Determine if this is a real user run or a system follow-up
            // Check both: messageChannel from event data (if available) and
            // source detected by extractCleanPrompt (webchat metadata, Telegram brackets, etc.)
            const userChannels = ["telegram", "webchat", "whatsapp", "discord", "slack", "signal", "sms", "imessage", "nostr"];
            const isUserChannel = (messageChannel && userChannels.includes(messageChannel)) || source !== null;

            if (!isUserChannel && rawPrompt && (rawPrompt.startsWith("System:") || rawPrompt.startsWith("Read HEARTBEAT"))) {
              // System follow-up runs (exec notifications) — don't create new tasks,
              // but track them so tool events link to the original task
              console.log("[mission-control] System follow-up run, linking to previous runId:", lastRealRunId.get(sessionKey));
              return;
            }

            // Override source with messageChannel if available and no source detected
            if (messageChannel && !source) {
              source = messageChannel;
            }

            // Track this as the last real runId for this session
            lastRealRunId.set(sessionKey, evt.runId);
            console.log("[mission-control] Tracked real runId:", evt.runId, "for session:", sessionKey);

            void postToMissionControl({
              runId: evt.runId,
              action: "start",
              sessionKey,
              timestamp: new Date(evt.ts).toISOString(),
              prompt,
              source,
              eventType: "lifecycle:start",
            });
          } else if (phase === "end") {
            // Capture the assistant's response before cleanup
            let response: string | null = null;
            if (info) {
              const sessionFile = getSessionFilePath(info.agentId, info.sessionId);
              response = await getLastAssistantMessage(sessionFile);
              if (response) {
                // Truncate long responses
                const maxLen = 1000;
                if (response.length > maxLen) {
                  response = response.slice(0, maxLen) + "...";
                }
                console.log("[mission-control] Captured response:", response.slice(0, 100));
              }
            }

            const endRunId = lastRealRunId.get(sessionKey) || evt.runId;
            sessionInfo.delete(sessionKey);
            void postToMissionControl({
              runId: endRunId,
              action: "end",
              sessionKey,
              timestamp: new Date(evt.ts).toISOString(),
              response,
              eventType: "lifecycle:end",
            });
          } else if (phase === "error") {
            const errorRunId = lastRealRunId.get(sessionKey) || evt.runId;
            sessionInfo.delete(sessionKey);
            void postToMissionControl({
              runId: errorRunId,
              action: "error",
              sessionKey,
              timestamp: new Date(evt.ts).toISOString(),
              error: evt.data?.error as string | undefined,
              eventType: "lifecycle:error",
            });
          }
          return;
        }

        // Tool usage - progress updates and document capture
        if (evt.stream === "tool") {
          const toolName = evt.data?.name as string | undefined;
          const phase = evt.data?.phase as string | undefined;
          const toolCallId = evt.data?.toolCallId as string | undefined;

          // Use the last real runId if this is a follow-up/system run
          const effectiveRunId = lastRealRunId.get(sessionKey) || evt.runId;

          if (toolName && phase === "start") {
            void postToMissionControl({
              runId: effectiveRunId,
              action: "progress",
              sessionKey,
              timestamp: new Date(evt.ts).toISOString(),
              message: `🔧 Using tool: ${toolName}`,
              eventType: "tool:start",
            });

            // Track write tool calls for document capture
            if (toolName === "write" && toolCallId) {
              const args = evt.data?.args as Record<string, unknown> | undefined;
              const filePath = (args?.file_path ?? args?.path) as string | undefined;
              const content = args?.content as string | undefined;

              if (filePath && content) {
                pendingWrites.set(toolCallId, { filePath, content, sessionKey });
                console.log(`[mission-control] Tracking write: ${toolCallId} -> ${filePath}`);
              }
            }
          }

          // Capture document creation when write tool completes successfully
          if (toolName === "write" && phase === "result" && toolCallId) {
            const isError = evt.data?.isError as boolean | undefined;
            const pending = pendingWrites.get(toolCallId);

            if (pending && !isError) {
              const { filePath, content } = pending;
              const fileName = path.basename(filePath);
              const ext = path.extname(filePath).toLowerCase();

              // Determine document type from extension
              let docType = "text";
              if ([".md", ".markdown"].includes(ext)) docType = "markdown";
              else if ([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".c", ".cpp", ".h", ".css", ".html", ".json", ".yaml", ".yml", ".toml", ".sh", ".bash"].includes(ext)) docType = "code";
              else if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"].includes(ext)) docType = "image";
              else if ([".txt", ".log"].includes(ext)) docType = "note";

              const info = sessionInfo.get(pending.sessionKey);

              void postToMissionControl({
                runId: effectiveRunId,
                action: "document",
                sessionKey: pending.sessionKey,
                timestamp: new Date(evt.ts).toISOString(),
                agentId: info?.agentId,
                document: {
                  title: fileName,
                  content: content.length > 50000 ? content.slice(0, 50000) + "\n\n[Content truncated...]" : content,
                  type: docType,
                  path: filePath,
                },
                eventType: "tool:write",
              });

              console.log(`[mission-control] Document captured: ${fileName} (${docType})`);
            }

            pendingWrites.delete(toolCallId);
          }

          // Capture files from exec/process tool results (e.g., images from nano banana)
          // exec returns "Command still running", the actual output comes via the process tool
          if ((toolName === "exec" || toolName === "process") && phase === "result") {
            // Extract text from the result (can be string or content array)
            const rawResult = evt.data?.result as string | { content?: Array<{ type?: string; text?: string }> } | undefined;
            let text = "";
            if (typeof rawResult === "string") {
              text = rawResult;
            } else if (rawResult && Array.isArray(rawResult.content)) {
              text = rawResult.content
                .filter((c: { type?: string }) => c.type === "text")
                .map((c: { text?: string }) => c.text || "")
                .join("\n");
            }
            const output = evt.data?.output as string | undefined;
            if (!text && output) text = output;

            if (text) {
              // Look for file paths with media extensions in the output
              const fileMatch = text.match(/(\/\S+\.(?:png|jpg|jpeg|gif|webp|svg|mp4|mp3|wav|pdf))/i);

              if (fileMatch && fileMatch[1]) {
                const filePath = fileMatch[1];
                const fileName = path.basename(filePath);
                const ext = path.extname(filePath).toLowerCase();

                let docType = "text";
                if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"].includes(ext)) docType = "image";
                else if ([".mp4", ".mp3", ".wav"].includes(ext)) docType = "media";
                else if ([".pdf"].includes(ext)) docType = "document";

                const info = sessionInfo.get(sessionKey);

                void postToMissionControl({
                  runId: effectiveRunId,
                  action: "document",
                  sessionKey,
                  timestamp: new Date(evt.ts).toISOString(),
                  agentId: info?.agentId,
                  document: {
                    title: fileName,
                    content: filePath,
                    type: docType,
                    path: filePath,
                  },
                  eventType: "exec:file",
                });

                console.log(`[mission-control] Exec file captured: ${fileName} (${docType})`);
              } else {
                console.log(`[mission-control] Exec result (no file found): ${text.slice(0, 150)}`);
              }
            }
          }
        }

        // Assistant message chunks - track significant updates
        if (evt.stream === "assistant") {
          const content = evt.data?.content as string | undefined;
          const chunkType = evt.data?.type as string | undefined;

          // Only send on significant events, not every token
          if (chunkType === "thinking_start") {
            void postToMissionControl({
              runId: evt.runId,
              action: "progress",
              sessionKey,
              timestamp: new Date(evt.ts).toISOString(),
              message: "💭 Thinking...",
              eventType: "assistant:thinking",
            });
          }
        }

        // Log unhandled streams for diagnostics
        if (!["lifecycle", "tool", "exec", "assistant"].includes(evt.stream)) {
          console.log(`[mission-control] Unhandled stream: ${evt.stream}`, JSON.stringify(evt.data).slice(0, 200));
        }
      });

      listenerRegistered = true;
      console.log("[mission-control] Registered event listener");
      console.log("[mission-control] URL:", missionControlUrl);
    } catch (err) {
      console.error("[mission-control] Failed:", err instanceof Error ? err.message : err);
    }
  }
};

export default handler;
