import { v } from "convex/values";
import { mutation } from "./_generated/server";

const SYSTEM_AGENT_NAME = "OpenClaw";
// Tools that reliably indicate coding work (write excluded — it's used for markdown/docs too)
const CODING_TOOLS = ["edit", "exec", "bash", "run", "process"];

function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);

	if (hours > 0) {
		const remainingMinutes = minutes % 60;
		return `${hours}h ${remainingMinutes}m`;
	}
	if (minutes > 0) {
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}
	return `${seconds}s`;
}

export const receiveAgentEvent = mutation({
	args: {
		runId: v.string(),
		action: v.string(),
		sessionKey: v.optional(v.union(v.string(), v.null())),
		agentId: v.optional(v.union(v.string(), v.null())),
		timestamp: v.optional(v.union(v.string(), v.null())),
		error: v.optional(v.union(v.string(), v.null())),
		prompt: v.optional(v.union(v.string(), v.null())),
		source: v.optional(v.union(v.string(), v.null())),
		message: v.optional(v.union(v.string(), v.null())),
		response: v.optional(v.union(v.string(), v.null())),
		eventType: v.optional(v.union(v.string(), v.null())),
		document: v.optional(
			v.object({
				title: v.string(),
				content: v.string(),
				type: v.string(),
				path: v.optional(v.string()),
			})
		),
	},
	handler: async (ctx, args) => {
		// Find existing task by runId
		let task = await ctx.db
			.query("tasks")
			.filter((q) => q.eq(q.field("openclawRunId"), args.runId))
			.first();

		// Fallback: find by sessionKey (e.g. "agent:main:mission:<taskId>")
		if (!task && args.sessionKey) {
			const match = args.sessionKey.match(/mission:(.+)$/);
			if (match) {
				const taskId = ctx.db.normalizeId("tasks", match[1]);
				if (taskId) {
					const candidate = await ctx.db.get(taskId);
					if (candidate) {
						task = candidate;
						// Link the runId for future lookups
						await ctx.db.patch(task._id, { openclawRunId: args.runId });
					}
				}
			}
		}

		// Find or create system agent
		let systemAgent = await ctx.db
			.query("agents")
			.filter((q) => q.eq(q.field("name"), SYSTEM_AGENT_NAME))
			.first();

		if (!systemAgent) {
			const agentId = await ctx.db.insert("agents", {
				name: SYSTEM_AGENT_NAME,
				role: "AI Assistant",
				status: "active",
				level: "SPC",
				avatar: "🤖",
			});
			systemAgent = await ctx.db.get(agentId);
		}

		const namedAgent = args.agentId
			? await ctx.db
					.query("agents")
					.filter((q) => q.eq(q.field("name"), args.agentId))
					.first()
			: null;

		const agent = namedAgent || systemAgent;
		const now = Date.now();

		if (args.action === "start") {
			if (!task) {
				const title = args.prompt
					? summarizePrompt(args.prompt)
					: `Agent task ${args.runId.slice(0, 8)}`;

				const description = args.prompt || `OpenClaw agent task\nRun ID: ${args.runId}`;

				const taskId = await ctx.db.insert("tasks", {
					title,
					description,
					status: "in_progress",
					assigneeIds: agent ? [agent._id] : [],
					tags: ["openclaw"],
					sessionKey: args.sessionKey ?? undefined,
					openclawRunId: args.runId,
					startedAt: now,
				});

				if (agent) {
					const sourcePrefix = args.source ? `**${args.source}:** ` : "";
					await ctx.db.insert("messages", {
						taskId,
						fromAgentId: agent._id,
						content: `🚀 **Started**\n\n${sourcePrefix}${args.prompt || "N/A"}`,
						attachments: [],
					});

					await ctx.db.insert("activities", {
						type: "status_update",
						agentId: agent._id,
						message: `started "${title}"`,
						targetId: taskId,
					});
				}
			} else if (args.prompt && task.title.startsWith("Agent task")) {
				const title = summarizePrompt(args.prompt);
				await ctx.db.patch(task._id, {
					title,
					description: args.prompt,
					startedAt: now,
				});
			} else {
				// Update start time for existing task and reset coding tools flag
				await ctx.db.patch(task._id, { startedAt: now, usedCodingTools: false });
			}
		} else if (args.action === "progress" && task && agent) {
			await ctx.db.insert("messages", {
				taskId: task._id,
				fromAgentId: agent._id,
				content: args.message || "Progress update",
				attachments: [],
			});

			// Flag coding tool usage based on tool:start events
			if (args.eventType === "tool:start" && args.message && !task.usedCodingTools) {
				const toolMatch = args.message.match(/Using tool:\s*(\S+)/);
				if (toolMatch && CODING_TOOLS.includes(toolMatch[1])) {
					await ctx.db.patch(task._id, { usedCodingTools: true });
				}
			}
		} else if (args.action === "end" && task) {
			// Move to review if:
			// - The agent asks a question (needs user feedback), or
			// - Coding tools (edit, exec, bash) were used, or
			// - Code-type documents were created for this task
			// Otherwise, mark as done.
			const needsFeedback = args.response ? args.response.includes("?") : false;

			let isCodingTask = task.usedCodingTools ?? false;
			if (!isCodingTask) {
				const codeDocs = await ctx.db
					.query("documents")
					.filter((q) =>
						q.and(
							q.eq(q.field("taskId"), task._id),
							q.eq(q.field("type"), "code")
						)
					)
					.first();
				isCodingTask = codeDocs !== null;
			}

			const endStatus = needsFeedback || isCodingTask ? "review" : "done";
			await ctx.db.patch(task._id, { status: endStatus });

			// Calculate duration
			const startTime = task.startedAt || task._creationTime;
			const duration = now - startTime;
			const durationStr = formatDuration(duration);

			if (agent) {
				// Include the response and duration in the completion message
				const icon = needsFeedback ? "❓" : "✅";
				let completionMsg = `${icon} **${needsFeedback ? "Needs Input" : "Completed"}** in **${durationStr}**`;
				if (args.response) {
					completionMsg += `\n\n${args.response}`;
				}

				await ctx.db.insert("messages", {
					taskId: task._id,
					fromAgentId: agent._id,
					content: completionMsg,
					attachments: [],
				});

				await ctx.db.insert("activities", {
					type: "status_update",
					agentId: agent._id,
					message: `${needsFeedback ? "needs input on" : "completed"} "${task.title}" in ${durationStr}`,
					targetId: task._id,
				});
			}
		} else if (args.action === "error" && task) {
			await ctx.db.patch(task._id, { status: "review" });

			// Calculate duration even for errors
			const startTime = task.startedAt || task._creationTime;
			const duration = now - startTime;
			const durationStr = formatDuration(duration);

			if (agent) {
				await ctx.db.insert("messages", {
					taskId: task._id,
					fromAgentId: agent._id,
					content: `❌ **Error** after **${durationStr}**\n\n${args.error || "Unknown error"}`,
					attachments: [],
				});

				await ctx.db.insert("activities", {
					type: "status_update",
					agentId: agent._id,
					message: `error on "${task.title}" after ${durationStr}`,
					targetId: task._id,
				});
			}
		} else if (args.action === "document" && args.document && agent) {
			// Create document linked to the task
			const docId = await ctx.db.insert("documents", {
				title: args.document.title,
				content: args.document.content,
				type: args.document.type,
				path: args.document.path,
				taskId: task?._id,
				createdByAgentId: agent._id,
			});

			// Add activity for document creation
			let activityMsg = `created document "${args.document.title}"`;
			if (task) {
				activityMsg += ` for "${task.title}"`;
			}

			await ctx.db.insert("activities", {
				type: "document_created",
				agentId: agent._id,
				message: activityMsg,
				targetId: task?._id,
			});

			// If there's an associated task, add a comment about the document
			if (task) {
				await ctx.db.insert("messages", {
					taskId: task._id,
					fromAgentId: agent._id,
					content: `📄 Created document: **${args.document.title}**\n\nType: ${args.document.type}${args.document.path ? `\nPath: \`${args.document.path}\`` : ""}`,
					attachments: [docId],
				});
			}
		}
	},
});

function summarizePrompt(prompt: string): string {
	const cleaned = prompt.trim();
	const firstLine = cleaned.split("\n")[0].trim();
	if (firstLine.length <= 80) return firstLine;
	const truncated = firstLine.slice(0, 77);
	const lastSpace = truncated.lastIndexOf(" ");
	if (lastSpace > 50) return truncated.slice(0, lastSpace) + "...";
	return truncated + "...";
}
