import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("documents")
      .filter((q) => q.eq(q.field("taskId"), args.taskId))
      .collect();
  },
});

export const listAll = query({
  args: {
    type: v.optional(v.string()),
    agentId: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    let documents = await ctx.db.query("documents").order("desc").collect();

    if (args.type) {
      documents = documents.filter((doc) => doc.type === args.type);
    }

    if (args.agentId) {
      documents = documents.filter((doc) => doc.createdByAgentId === args.agentId);
    }

    // Join with agent info
    const documentsWithAgent = await Promise.all(
      documents.map(async (doc) => {
        const agent = doc.createdByAgentId
          ? await ctx.db.get(doc.createdByAgentId)
          : null;
        return {
          ...doc,
          agentName: agent?.name ?? null,
          agentAvatar: agent?.avatar ?? null,
        };
      })
    );

    return documentsWithAgent;
  },
});

export const getWithContext = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) return null;

    const agent = document.createdByAgentId
      ? await ctx.db.get(document.createdByAgentId)
      : null;

    const task = document.taskId ? await ctx.db.get(document.taskId) : null;

    const message = document.messageId
      ? await ctx.db.get(document.messageId)
      : null;

    // Get all messages for conversation context (full thread)
    let conversationMessages: Array<{
      _id: string;
      content: string;
      agentName: string | null;
      agentAvatar: string | null;
      _creationTime: number;
    }> = [];

    if (document.taskId) {
      const taskMessages = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("taskId"), document.taskId))
        .order("asc")
        .collect();

      conversationMessages = await Promise.all(
        taskMessages.map(async (msg) => {
          const msgAgent = await ctx.db.get(msg.fromAgentId);
          return {
            _id: msg._id,
            content: msg.content,
            agentName: msgAgent?.name ?? null,
            agentAvatar: msgAgent?.avatar ?? null,
            _creationTime: msg._creationTime,
          };
        })
      );
    }

    return {
      ...document,
      agentName: agent?.name ?? null,
      agentAvatar: agent?.avatar ?? null,
      agentRole: agent?.role ?? null,
      taskTitle: task?.title ?? null,
      taskStatus: task?.status ?? null,
      taskDescription: task?.description ?? null,
      originMessage: message?.content ?? null,
      conversationMessages,
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    type: v.string(),
    path: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    agentId: v.id("agents"),
    messageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      type: args.type,
      path: args.path,
      taskId: args.taskId,
      createdByAgentId: args.agentId,
      messageId: args.messageId,
    });

    let message = `created document "${args.title}"`;
    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (task) {
        message += ` for "${task.title}"`;
      }
    }

    await ctx.db.insert("activities", {
      type: "document_created",
      agentId: args.agentId,
      message: message,
      targetId: args.taskId,
    });

    return docId;
  },
});
