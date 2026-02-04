import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getTenantId, requireTenantId } from "./tenant";

const DEFAULT_RETENTION_DAYS = 30;

export const getViewerInfo = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		return {
			tenantId: identity?.subject ?? null,
			email: identity?.email ?? null,
			name: identity?.name ?? null,
		};
	},
});

export const getTenantSettings = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await getTenantId(ctx);
		if (!tenantId) {
			return {
				retentionDays: DEFAULT_RETENTION_DAYS,
			};
		}

		const settings = await ctx.db
			.query("tenantSettings")
			.withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
			.first();

		return {
			retentionDays: settings?.retentionDays ?? DEFAULT_RETENTION_DAYS,
		};
	},
});

export const updateTenantSettings = mutation({
	args: { retentionDays: v.number() },
	handler: async (ctx, args) => {
		const tenantId = await requireTenantId(ctx);
		const now = Date.now();
		const retentionDays = Math.max(1, Math.min(args.retentionDays, 3650));

		const existing = await ctx.db
			.query("tenantSettings")
			.withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				retentionDays,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("tenantSettings", {
				tenantId,
				retentionDays,
				createdAt: now,
				updatedAt: now,
			});
		}

		return { ok: true };
	},
});
