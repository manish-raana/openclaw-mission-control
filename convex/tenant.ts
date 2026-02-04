const AUTH_REQUIRED = process.env.MISSION_CONTROL_AUTH_REQUIRED === "true";

type AuthCtx = {
	auth: {
		getUserIdentity: () => Promise<{ subject: string } | null>;
	};
};

export function isAuthRequired(): boolean {
	return AUTH_REQUIRED;
}

export async function getTenantId(ctx: AuthCtx): Promise<string | null> {
	const identity = await ctx.auth.getUserIdentity();
	return identity?.subject ?? null;
}

export async function requireTenantId(ctx: AuthCtx): Promise<string> {
	const tenantId = await getTenantId(ctx);
	if (!tenantId) throw new Error("Authentication required");
	return tenantId;
}

export async function getTenantFilter(ctx: AuthCtx): Promise<{
	tenantId: string | null;
	allowUnscoped: boolean;
}> {
	const tenantId = await getTenantId(ctx);
	return {
		tenantId,
		allowUnscoped: !AUTH_REQUIRED,
	};
}

export function canAccessTenantRecord(
	recordTenantId: string | undefined,
	tenantId: string | null,
	allowUnscoped: boolean,
): boolean {
	if (recordTenantId) return recordTenantId === tenantId;
	if (allowUnscoped) return true;
	return false;
}
