import { query } from "./_generated/server";
import { v } from "convex/values";

export const listAgents = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("agents").collect();
	},
});

export const listTasks = query({
	args: {},
	handler: async (ctx) => {
		const tasks = await ctx.db.query("tasks").collect();

		// Enrich tasks with last message time
		const enrichedTasks = await Promise.all(
			tasks.map(async (task) => {
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
		const allActivities = await ctx.db.query("activities").collect();
        
        // Sort descending by creation time (newest first)
        allActivities.sort((a, b) => b._creationTime - a._creationTime);

        const filtered = allActivities.filter(activity => {
            if (args.agentId && activity.agentId !== args.agentId) return false;
            if (args.taskId && activity.targetId !== args.taskId) return false;
            
            if (args.type) {
                if (args.type === "tasks") {
                    return ["status_update", "assignees_update", "task_update"].includes(activity.type);
                } else if (args.type === "comments") {
                    return ["message", "commented"].includes(activity.type);
                } else if (args.type === "docs") {
                    return activity.type === "document_created";
                } else if (args.type === "status") {
                    return activity.type === "status_update";
                } else {
                    return activity.type === args.type;
                }
            }
            return true;
        });

		const activities = filtered.slice(0, 50);

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
