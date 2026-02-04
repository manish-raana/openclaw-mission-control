import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateLoki = mutation({
  args: {},
  handler: async (ctx) => {
    const loki = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("name"), "Loki"))
      .first();

    if (loki) {
      await ctx.db.patch(loki._id, {
        role: "Co-founder / Orchestrator",
        level: "LEAD",
        avatar: "🔱"
      });
      return "Loki updated successfully";
    }
    return "Loki not found";
  },
});
