import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const checkAndIncrement = internalMutation({
	args: {
		tenantId: v.string(),
		limit: v.number(),
		now: v.number(),
	},
	handler: async (ctx, args) => {
		const windowMs = 60 * 1000;
		const existing = await ctx.db
			.query("rateLimits")
			.withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
			.first();

		if (!existing) {
			await ctx.db.insert("rateLimits", {
				tenantId: args.tenantId,
				windowStartMs: args.now,
				count: 1,
			});
			return { allowed: true };
		}

		const windowElapsed = args.now - existing.windowStartMs;
		if (windowElapsed >= windowMs) {
			await ctx.db.patch(existing._id, {
				windowStartMs: args.now,
				count: 1,
			});
			return { allowed: true };
		}

		if (existing.count + 1 > args.limit) {
			return { allowed: false };
		}

		await ctx.db.patch(existing._id, {
			count: existing.count + 1,
		});

		return { allowed: true };
	},
});
