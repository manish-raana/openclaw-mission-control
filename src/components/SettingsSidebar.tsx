import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type SettingsSidebarProps = {
	isOpen?: boolean;
	onClose?: () => void;
};

type CreatedToken = {
	token: string;
	tokenId: Id<"apiTokens">;
	createdAt: number;
	tokenPrefix: string;
};

const DEFAULT_WEBHOOK_LOCAL = "http://127.0.0.1:3211/openclaw/event";

function formatDateTime(value?: number) {
	if (!value) return "—";
	return new Date(value).toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function getWebhookUrl() {
	const envUrl = import.meta.env.VITE_MISSION_CONTROL_WEBHOOK_URL;
	if (envUrl) return envUrl as string;
	if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
		return DEFAULT_WEBHOOK_LOCAL;
	}
	return `${window.location.origin}/openclaw/event`;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
	isOpen = false,
	onClose,
}) => {
	const tokens = useQuery(api.apiTokens.listApiTokens);
	const settings = useQuery(api.settings.getTenantSettings);
	const viewer = useQuery(api.settings.getViewerInfo);
	const createToken = useMutation(api.apiTokens.createApiToken);
	const revokeToken = useMutation(api.apiTokens.revokeApiToken);
	const updateTenantSettings = useMutation(api.settings.updateTenantSettings);
	const sendTestEvent = useMutation(api.openclaw.sendTestEvent);
	const resetOnboarding = useMutation(api.settings.resetOnboarding);

	const [tokenName, setTokenName] = useState("");
	const [createdToken, setCreatedToken] = useState<CreatedToken | null>(null);
	const [retentionDays, setRetentionDays] = useState(30);
	const [isSavingRetention, setIsSavingRetention] = useState(false);
	const [isTesting, setIsTesting] = useState(false);
	const [copyState, setCopyState] = useState<string | null>(null);

	useEffect(() => {
		if (settings?.retentionDays) {
			setRetentionDays(settings.retentionDays);
		}
	}, [settings?.retentionDays]);

	const webhookUrl = useMemo(() => getWebhookUrl(), []);
	const needsWebhookOverride =
		!import.meta.env.VITE_MISSION_CONTROL_WEBHOOK_URL &&
		!["localhost", "127.0.0.1"].includes(window.location.hostname);
	const rateLimitLabel =
		import.meta.env.VITE_MISSION_CONTROL_RATE_LIMIT_PER_MINUTE || "60";
	const configSnippet = useMemo(() => {
		const tokenValue = createdToken?.token ?? "<YOUR_TOKEN>";
		return JSON.stringify(
			{
				hooks: {
					internal: {
						enabled: true,
						entries: {
							"mission-control": {
								enabled: true,
								env: {
									MISSION_CONTROL_URL: webhookUrl,
									MISSION_CONTROL_TOKEN: tokenValue,
								},
							},
						},
					},
				},
			},
			null,
			2,
		);
	}, [createdToken?.token, webhookUrl]);

	const handleCreateToken = async () => {
		const result = await createToken({ name: tokenName || undefined });
		setCreatedToken(result);
		setTokenName("");
	};

	const handleCopy = async (value: string, label: string) => {
		await navigator.clipboard.writeText(value);
		setCopyState(label);
		setTimeout(() => setCopyState(null), 1500);
	};

	const handleDownloadConfig = () => {
		const blob = new Blob([configSnippet], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "openclaw-mission-control.json";
		link.click();
		URL.revokeObjectURL(url);
	};

	const handleSaveRetention = async () => {
		setIsSavingRetention(true);
		await updateTenantSettings({ retentionDays });
		setIsSavingRetention(false);
	};

	const handleTestEvent = async () => {
		setIsTesting(true);
		await sendTestEvent();
		setIsTesting(false);
	};

	return (
		<aside
			className={`[grid-area:right-sidebar] sidebar-drawer sidebar-drawer--right bg-white border-l border-border flex flex-col overflow-hidden ${isOpen ? "is-open" : ""}`}
			aria-label="Settings"
		>
			<div className="px-6 py-5 border-b border-border flex items-center justify-between">
				<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
					<span className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full" />{" "}
					SETTINGS
				</div>
				<button
					type="button"
					className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
					onClick={onClose}
					aria-label="Close settings sidebar"
				>
					<span aria-hidden="true">✕</span>
				</button>
			</div>

			<div className="flex-1 flex flex-col overflow-y-auto p-4 gap-5">
				<section className="rounded-xl border border-border bg-secondary p-4">
					<div className="text-xs font-semibold text-muted-foreground tracking-widest">
						QUICKSTART
					</div>
					<div className="mt-3 text-sm text-foreground">
						Create a token, paste it into your OpenClaw config, then restart
						the gateway.
					</div>
					<div className="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-orange)] text-white"
							onClick={handleCreateToken}
						>
							Create Token
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border"
							onClick={() => handleCopy(configSnippet, "config")}
						>
							{copyState === "config" ? "Copied" : "Copy Config"}
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border"
							onClick={handleDownloadConfig}
						>
							Download Config
						</button>
						<button
							type="button"
							className="px-3 py-2 rounded-lg text-xs font-semibold bg-muted text-foreground border border-border"
							onClick={handleTestEvent}
							disabled={isTesting}
						>
							{isTesting ? "Testing..." : "Test Connection"}
						</button>
					</div>
					<div className="mt-3 text-[11px] text-muted-foreground">
						Restart gateway: <span className="font-mono">openclaw gateway restart</span>
					</div>
				</section>

				<section className="rounded-xl border border-border bg-white p-4">
					<div className="text-xs font-semibold text-muted-foreground tracking-widest">
						TENANT INFO
					</div>
					<div className="mt-3 grid gap-2 text-sm">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Onboarding</span>
							<div className="flex items-center gap-2">
								<span className="text-[11px] text-muted-foreground">
									{settings?.onboardingCompletedAt ? "Completed" : "Not completed"}
								</span>
								<button
									type="button"
									className="text-[11px] font-semibold text-[var(--accent-orange)]"
									onClick={() => resetOnboarding()}
								>
									Show Banner
								</button>
							</div>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Tenant ID</span>
							<span className="max-w-[160px] break-all text-right font-mono text-xs text-foreground">
								{viewer?.tenantId ?? "—"}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground">Email</span>
							<span className="text-foreground">{viewer?.email ?? "—"}</span>
						</div>
					</div>
				</section>

				<section className="rounded-xl border border-border bg-white p-4">
					<div className="text-xs font-semibold text-muted-foreground tracking-widest">
						API TOKENS
					</div>

					<div className="mt-3 flex items-center gap-2">
						<input
							type="text"
							placeholder="Label (optional)"
							className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-xs"
							value={tokenName}
							onChange={(e) => setTokenName(e.target.value)}
						/>
						<button
							type="button"
							className="px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-orange)] text-white"
							onClick={handleCreateToken}
						>
							Create
						</button>
					</div>

					{createdToken && (
						<div className="mt-3 rounded-lg border border-border bg-muted p-3 text-xs">
							<div className="font-semibold text-foreground">
								Token created (copy now)
							</div>
							<div className="mt-2 flex items-center gap-2">
								<span className="font-mono text-[11px] break-all">
									{createdToken.token}
								</span>
								<button
									type="button"
									className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white border border-border"
									onClick={() => handleCopy(createdToken.token, "token")}
								>
									{copyState === "token" ? "Copied" : "Copy"}
								</button>
							</div>
							<div className="mt-2 text-[11px] text-muted-foreground">
								This token will not be shown again.
							</div>
						</div>
					)}

					<div className="mt-4 grid gap-2 text-xs">
						{tokens?.map((token) => (
							<div
								key={token._id}
								className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
							>
								<div>
									<div className="font-semibold text-foreground">
										{token.name ?? "Untitled Token"}
									</div>
									<div className="text-[11px] text-muted-foreground">
										{token.tokenPrefix}… · Created {formatDateTime(token.createdAt)}
										{" · "}Last used {formatDateTime(token.lastUsedAt)}
									</div>
								</div>
								<button
									type="button"
									className="px-2 py-1 rounded-md text-[11px] font-semibold border border-border text-[var(--accent-red)]"
									onClick={() => revokeToken({ tokenId: token._id })}
								>
									Revoke
								</button>
							</div>
						))}
						{tokens && tokens.length === 0 && (
							<div className="text-[11px] text-muted-foreground">
								No tokens yet. Create one to connect OpenClaw.
							</div>
						)}
					</div>
				</section>

				<section className="rounded-xl border border-border bg-white p-4">
					<div className="text-xs font-semibold text-muted-foreground tracking-widest">
						DATA RETENTION
					</div>
					<div className="mt-3 flex items-center gap-2">
						<input
							type="number"
							min={1}
							className="w-24 rounded-lg border border-border bg-white px-3 py-2 text-xs"
							value={retentionDays}
							onChange={(e) => setRetentionDays(Number(e.target.value))}
						/>
						<span className="text-xs text-muted-foreground">days</span>
						<button
							type="button"
							className="ml-auto px-3 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-orange)] text-white"
							onClick={handleSaveRetention}
							disabled={isSavingRetention}
						>
							{isSavingRetention ? "Saving..." : "Save"}
						</button>
					</div>
					<div className="mt-2 text-[11px] text-muted-foreground">
						Deletes activity, messages, and documents older than this window.
					</div>
				</section>

				<section className="rounded-xl border border-border bg-white p-4">
					<div className="text-xs font-semibold text-muted-foreground tracking-widest">
						HOOK SETUP
					</div>
					<div className="mt-3 text-[11px] text-muted-foreground">
						Use this snippet in <span className="font-mono">~/.openclaw/openclaw.json</span>.
					</div>
					<pre className="mt-2 rounded-lg border border-border bg-muted p-3 text-[11px] overflow-auto">
						{configSnippet}
					</pre>
					<div className="mt-2 text-[11px] text-muted-foreground">
						Webhook URL: <span className="font-mono">{webhookUrl}</span>
					</div>
					<div className="mt-2 text-[11px] text-muted-foreground">
						Rate limit: <span className="font-mono">{rateLimitLabel}</span> req/min
					</div>
					{needsWebhookOverride && (
						<div className="mt-2 text-[11px] text-muted-foreground">
							Set <span className="font-mono">VITE_MISSION_CONTROL_WEBHOOK_URL</span> to
							ensure this URL matches your Convex deployment.
						</div>
					)}
				</section>
			</div>
		</aside>
	);
};

export default SettingsSidebar;
