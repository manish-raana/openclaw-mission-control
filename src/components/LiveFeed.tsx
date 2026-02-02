import React, { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const filters = [
	{ id: "all", label: "All", active: true },
	{ id: "tasks", label: "Tasks", count: 0 },
	{ id: "comments", label: "Comments", count: 0 },
	{ id: "decisions", label: "Decisions", count: 0 },
	{ id: "docs", label: "Docs", count: 0 },
	{ id: "status", label: "Status", count: 0 },
];

const LiveFeed: React.FC = () => {
	const activities = useQuery(api.queries.listActivities);
	const agents = useQuery(api.queries.listAgents);
	const [activeFilter, setActiveFilter] = useState("all");
	const [activeAgent, setActiveAgent] = useState("all");
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 10000);
		return () => clearInterval(interval);
	}, []);

	const formatRelativeTime = (timestamp?: number) => {
		if (!timestamp) {
			return "unknown";
		}
		const deltaSeconds = Math.floor((now - timestamp) / 1000);
		if (deltaSeconds < 60) {
			return "just now";
		}
		const deltaMinutes = Math.floor(deltaSeconds / 60);
		if (deltaMinutes < 60) {
			return `${deltaMinutes}m ago`;
		}
		const deltaHours = Math.floor(deltaMinutes / 60);
		if (deltaHours < 24) {
			return `${deltaHours}h ago`;
		}
		const deltaDays = Math.floor(deltaHours / 24);
		return `${deltaDays}d ago`;
	};

	if (activities === undefined || agents === undefined) {
		return (
			<aside className="[grid-area:right-sidebar] bg-card border-l border-border flex flex-col overflow-hidden animate-pulse">
				<div className="px-6 py-5 border-b border-border h-[65px] bg-muted/20" />
				<div className="flex-1 p-4 space-y-4">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="h-16 bg-muted rounded-lg" />
					))}
				</div>
			</aside>
		);
	}

	return (
		<aside className="[grid-area:right-sidebar] bg-card border-l border-border flex flex-col overflow-hidden">
			<div className="px-6 py-5 border-b border-border">
				<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
					<span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full" />{" "}
					LIVE FEED
				</div>
			</div>

			<div className="flex-1 flex flex-col overflow-y-auto p-4 gap-5">
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap gap-1.5">
						{filters.map((f) => {
							const isActive = activeFilter === f.id;
							return (
								<button
									key={f.id}
									type="button"
									onClick={() => setActiveFilter(f.id)}
									aria-pressed={isActive}
									className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border border-border flex items-center gap-1 transition-colors ${
										isActive
											? "bg-[var(--accent-orange)] text-white border-[var(--accent-orange)]"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{f.label}
								</button>
							);
						})}
					</div>

					<div className="flex flex-wrap gap-1.5">
						<button
							type="button"
							onClick={() => setActiveAgent("all")}
							aria-pressed={activeAgent === "all"}
							className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border border-[var(--accent-orange)] text-[var(--accent-orange)] bg-card transition-colors ${
								activeAgent === "all"
									? "bg-[var(--accent-orange)] text-white"
									: ""
							}`}
						>
							All Agents
						</button>
						{agents.slice(0, 8).map((a) => (
							<button
								key={a._id}
								type="button"
								onClick={() => setActiveAgent(a._id)}
								aria-pressed={activeAgent === a._id}
								className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border border-border bg-card text-muted-foreground flex items-center gap-1 transition-colors ${
									activeAgent === a._id ? "bg-muted text-foreground" : ""
								}`}
							>
								{a.name}
							</button>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-3">
					{activities.map((item) => (
						<div
							key={item._id}
							className="flex gap-3 p-3 bg-secondary border border-border rounded-lg"
						>
							<div className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full mt-1.5 shrink-0" />
							<div className="text-xs leading-tight text-foreground">
								<span className="font-bold text-[var(--accent-orange)]">
									{item.agentName}
								</span>{" "}
								{item.message}
								<div className="text-[10px] text-muted-foreground mt-1">
									{formatRelativeTime(item.createdAt)}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="p-3 flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--accent-green)] bg-muted border-t border-border">
				<span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full" />{" "}
				LIVE
			</div>
		</aside>
	);
};

export default LiveFeed;
