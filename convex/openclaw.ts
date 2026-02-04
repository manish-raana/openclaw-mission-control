import { v } from "convex/values";
import { mutation } from "./_generated/server";

const SYSTEM_AGENT_NAME = "OpenClaw";

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
		sessionKey: v.optional(v.string()),
		agentId: v.optional(v.string()),
		timestamp: v.optional(v.string()),
		error: v.optional(v.string()),
		prompt: v.optional(v.string()),
		source: v.optional(v.string()),
		message: v.optional(v.string()),
		response: v.optional(v.string()),
		eventType: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Find existing task by runId
		const task = await ctx.db
			.query("tasks")
			.filter((q) => q.eq(q.field("openclawRunId"), args.runId))
			.first();

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
					sessionKey: args.sessionKey,
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
				// Update start time for existing task
				await ctx.db.patch(task._id, { startedAt: now });
			}
		} else if (args.action === "progress" && task && agent) {
			await ctx.db.insert("messages", {
				taskId: task._id,
				fromAgentId: agent._id,
				content: args.message || "Progress update",
				attachments: [],
			});
		} else if (args.action === "end" && task) {
			await ctx.db.patch(task._id, { status: "done" });

			// Calculate duration
			const startTime = task.startedAt || task._creationTime;
			const duration = now - startTime;
			const durationStr = formatDuration(duration);

			if (agent) {
				// Include the response and duration in the completion message
				let completionMsg = `✅ **Completed** in **${durationStr}**`;
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
					message: `completed "${task.title}" in ${durationStr}`,
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
