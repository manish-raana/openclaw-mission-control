import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { auth } from "./auth";
import { hashApiTokenAsync } from "./apiTokens";

const http = httpRouter();

auth.addHttpRoutes(http);

// OpenClaw webhook endpoint
http.route({
	path: "/openclaw/event",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		const authRequired = process.env.MISSION_CONTROL_AUTH_REQUIRED === "true";
		const authHeader = request.headers.get("authorization") || "";
		const bearerPrefix = "Bearer ";
		let tenantId: string | undefined;

		if (authHeader.startsWith(bearerPrefix)) {
			const token = authHeader.slice(bearerPrefix.length).trim();
			if (token) {
				const tokenHash = await hashApiTokenAsync(token);
				const tokenRecord = await ctx.runQuery(
					internal.apiTokens.lookupTokenByHash,
					{ tokenHash },
				);
				if (!tokenRecord || tokenRecord.revokedAt) {
					return new Response(JSON.stringify({ ok: false, error: "Invalid token" }), {
						status: 403,
						headers: { "Content-Type": "application/json" },
					});
				}
				tenantId = tokenRecord.tenantId;
				await ctx.runMutation(internal.apiTokens.markTokenUsed, {
					tokenId: tokenRecord._id,
				});
			}
		}

		if (authRequired && !tenantId) {
			return new Response(JSON.stringify({ ok: false, error: "Authorization required" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = await request.json();
		await ctx.runMutation(api.openclaw.receiveAgentEvent, {
			...body,
			tenantId,
		});
		return new Response(JSON.stringify({ ok: true }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

export default http;
