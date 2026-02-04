import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const updateStatus = mutation({
  args: {
    id: v.id("agents"),
    status: v.union(
      v.literal("idle"),
      v.literal("active"),
      v.literal("blocked"),
    ),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) throw new Error("Agent not found");

    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const createAgent = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    level: v.union(v.literal("LEAD"), v.literal("INT"), v.literal("SPC")),
    avatar: v.string(),
    status: v.union(v.literal("idle"), v.literal("active"), v.literal("blocked")),
    systemPrompt: v.optional(v.string()),
    character: v.optional(v.string()),
    lore: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      level: args.level,
      avatar: args.avatar,
      status: args.status,
      systemPrompt: args.systemPrompt,
      character: args.character,
      lore: args.lore,
    });
  },
});

export const updateAgent = mutation({
  args: {
    id: v.id("agents"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    level: v.optional(v.union(v.literal("LEAD"), v.literal("INT"), v.literal("SPC"))),
    avatar: v.optional(v.string()),
    status: v.optional(v.union(v.literal("idle"), v.literal("active"), v.literal("blocked"))),
    systemPrompt: v.optional(v.string()),
    character: v.optional(v.string()),
    lore: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) throw new Error("Agent not found");

    const { id, ...updates } = args;
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(id, filteredUpdates);
  },
});

export const deleteAgent = mutation({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) throw new Error("Agent not found");
    await ctx.db.delete(args.id);
  },
});
