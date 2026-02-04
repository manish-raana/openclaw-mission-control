import { query } from "./_generated/server";
import { v } from "convex/values";
import { canAccessTenantRecord, getTenantFilter } from "./tenant";

export const listAgents = query({
	args: {},
	handler: async (ctx) => {
		const { tenantId, allowUnscoped } = await getTenantFilter(ctx);
		const agents = await ctx.db.query("agents").collect();
		return agents.filter((agent) =>
			canAccessTenantRecord(agent.tenantId, tenantId, allowUnscoped),
		);
	},
});

export const listTasks = query({
	args: {},
	handler: async (ctx) => {
		const { tenantId, allowUnscoped } = await getTenantFilter(ctx);
		const tasks = await ctx.db.query("tasks").collect();
		const visibleTasks = tasks.filter((task) =>
			canAccessTenantRecord(task.tenantId, tenantId, allowUnscoped),
		);

		// Enrich tasks with last message time
		const enrichedTasks = await Promise.all(
			visibleTasks.map(async (task) => {
				const lastMessage = await ctx.db
					.query("messages")
					.filter((q) => q.eq(q.field("taskId"), task._id))
					.order("desc")
					.first();

				return {
					...task,
					lastMessageTime: lastMessage?._creationTime ?? null,
				};
			})
		);

		return enrichedTasks;
	},
});

export const listActivities = query({
	args: {
		agentId: v.optional(v.id("agents")),
		type: v.optional(v.string()),
		taskId: v.optional(v.id("tasks")),
	},
	handler: async (ctx, args) => {
		const { tenantId, allowUnscoped } = await getTenantFilter(ctx);
		let activitiesQuery = ctx.db.query("activities").order("desc");

		if (args.agentId || args.type || args.taskId || tenantId) {
			activitiesQuery = activitiesQuery.filter((q) => {
				const filters = [];
				if (tenantId) {
					filters.push(q.eq(q.field("tenantId"), tenantId));
				}
				if (args.agentId) filters.push(q.eq(q.field("agentId"), args.agentId));
				if (args.taskId) filters.push(q.eq(q.field("targetId"), args.taskId));

				if (args.type) {
					if (args.type === "tasks") {
						filters.push(
							q.or(
								q.eq(q.field("type"), "status_update"),
								q.eq(q.field("type"), "assignees_update"),
								q.eq(q.field("type"), "task_update"),
							),
						);
					} else if (args.type === "comments") {
						filters.push(
							q.or(
								q.eq(q.field("type"), "message"),
								q.eq(q.field("type"), "commented"),
							),
						);
					} else if (args.type === "docs") {
						filters.push(q.eq(q.field("type"), "document_created"));
					} else if (args.type === "status") {
						filters.push(q.eq(q.field("type"), "status_update"));
					} else {
						filters.push(q.eq(q.field("type"), args.type));
					}
				}

				return q.and(...filters);
			});
		}

		let activities = await activitiesQuery.take(50);
		if (!tenantId && allowUnscoped) {
			activities = activities.filter((activity) =>
				canAccessTenantRecord(activity.tenantId, tenantId, allowUnscoped),
			);
		}

		// Join with agents to get names for the feed
		const enrichedFeed = await Promise.all(
			activities.map(async (activity) => {
				const agent = await ctx.db.get(activity.agentId);
				return {
					...activity,
					agentName: agent?.name ?? "Unknown Agent",
				};
			}),
		);

		return enrichedFeed;
	},
});

export const listMessages = query({
	args: { taskId: v.id("tasks") },
	handler: async (ctx, args) => {
		const { tenantId, allowUnscoped } = await getTenantFilter(ctx);
		const task = await ctx.db.get(args.taskId);
		if (!task) throw new Error("Task not found");
		if (!canAccessTenantRecord(task.tenantId, tenantId, allowUnscoped)) {
			return [];
		}

		const messages = await ctx.db
			.query("messages")
			.filter((q) => q.eq(q.field("taskId"), args.taskId))
			.collect();

        // Join with agents to get names/avatars
        const enrichedMessages = await Promise.all(
            messages.map(async (msg) => {
                const agent = await ctx.db.get(msg.fromAgentId);
                return {
                    ...msg,
                    agentName: agent?.name ?? "Unknown",
                    agentAvatar: agent?.avatar,
                };
            })
        );
        
        return enrichedMessages;
	},
});
