import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireTenantId } from "./tenant";

const TOKEN_PREFIX = "mc_live_";

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function hashToken(token: string): Promise<string> {
	const data = new TextEncoder().encode(token);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return toHex(new Uint8Array(digest));
}

function generateToken(): string {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	const base64url = btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/g, "");
	return `${TOKEN_PREFIX}${base64url}`;
}

export const listApiTokens = query({
	args: {},
	handler: async (ctx) => {
		const tenantId = await requireTenantId(ctx);
		const tokens = await ctx.db
			.query("apiTokens")
			.filter((q) => q.eq(q.field("tenantId"), tenantId))
			.collect();
		return tokens.filter((token) => !token.revokedAt);
	},
});

export const createApiToken = mutation({
	args: { name: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const tenantId = await requireTenantId(ctx);
		const token = generateToken();
		const tokenHash = await hashToken(token);
		const tokenPrefix = token.slice(0, 8);
		const createdAt = Date.now();

		const tokenId = await ctx.db.insert("apiTokens", {
			tokenHash,
			tokenPrefix,
			tenantId,
			name: args.name,
			createdAt,
		});

		return { token, tokenId, tokenPrefix, createdAt };
	},
});

export const revokeApiToken = mutation({
	args: { tokenId: v.id("apiTokens") },
	handler: async (ctx, args) => {
		const tenantId = await requireTenantId(ctx);
		const token = await ctx.db.get(args.tokenId);
		if (!token || token.tenantId !== tenantId) {
			throw new Error("Token not found");
		}
		if (token.revokedAt) return { ok: true };

		await ctx.db.patch(args.tokenId, { revokedAt: Date.now() });
		return { ok: true };
	},
});

export const lookupTokenByHash = internalQuery({
	args: { tokenHash: v.string() },
	handler: async (ctx, args) => {
		const token = await ctx.db
			.query("apiTokens")
			.withIndex("by_tokenHash", (q) => q.eq("tokenHash", args.tokenHash))
			.first();
		return token ?? null;
	},
});

export const markTokenUsed = internalMutation({
	args: { tokenId: v.id("apiTokens") },
	handler: async (ctx, args) => {
		await ctx.db.patch(args.tokenId, { lastUsedAt: Date.now() });
	},
});

export async function hashApiTokenAsync(token: string): Promise<string> {
	return await hashToken(token);
}
