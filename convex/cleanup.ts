import { internalMutation } from "./_generated/server";

const DEFAULT_RETENTION_DAYS = 30;

export const runRetentionCleanup = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const settingsList = await ctx.db.query("tenantSettings").collect();
		const settingsMap = new Map(
			settingsList.map((s) => [s.tenantId, s.retentionDays]),
		);

		const tokens = await ctx.db.query("apiTokens").collect();
		const tenantIds = new Set(tokens.map((t) => t.tenantId));

		for (const tenantId of tenantIds) {
			const retentionDays = settingsMap.get(tenantId) ?? DEFAULT_RETENTION_DAYS;
			const cutoff = now - retentionDays * 24 * 60 * 60 * 1000;

			const oldActivities = await ctx.db
				.query("activities")
				.filter((q) => q.eq(q.field("tenantId"), tenantId))
				.filter((q) => q.lt(q.field("_creationTime"), cutoff))
				.collect();
			for (const activity of oldActivities) {
				await ctx.db.delete(activity._id);
			}

			const oldMessages = await ctx.db
				.query("messages")
				.filter((q) => q.eq(q.field("tenantId"), tenantId))
				.filter((q) => q.lt(q.field("_creationTime"), cutoff))
				.collect();
			for (const message of oldMessages) {
				await ctx.db.delete(message._id);
			}

			const oldDocuments = await ctx.db
				.query("documents")
				.filter((q) => q.eq(q.field("tenantId"), tenantId))
				.filter((q) => q.lt(q.field("_creationTime"), cutoff))
				.collect();
			for (const doc of oldDocuments) {
				await ctx.db.delete(doc._id);
			}
		}
	},
});
