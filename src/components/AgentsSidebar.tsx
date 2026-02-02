import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AgentsSidebar: React.FC = () => {
	const agents = useQuery(api.queries.listAgents);

	if (agents === undefined) {
		return (
			<aside className="[grid-area:left-sidebar] bg-card border-r border-border flex flex-col overflow-hidden animate-pulse">
				<div className="px-6 py-5 border-b border-border h-[65px] bg-muted/20" />
				<div className="flex-1 space-y-4 p-6">
					{[...Array(8)].map((_, i) => (
						<div key={i} className="flex gap-3 items-center">
							<div className="w-10 h-10 bg-muted rounded-full" />
							<div className="flex-1 space-y-2">
								<div className="h-3 bg-muted rounded w-24" />
								<div className="h-2 bg-muted rounded w-16" />
							</div>
						</div>
					))}
				</div>
			</aside>
		);
	}

	return (
		<aside className="[grid-area:left-sidebar] bg-card border-r border-border flex flex-col overflow-hidden">
			<div className="flex items-center justify-between px-6 py-5 border-b border-border">
				<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
					<span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full" />{" "}
					AGENTS
				</div>
				<div className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-semibold">
					{agents.length}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto py-3">
				{agents.map((agent) => (
					<div key={agent._id} className="flex items-center gap-3 px-6 py-3">
						<div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xl border border-border">
							{agent.avatar}
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-1.5 mb-0.5">
								<span className="text-sm font-semibold text-foreground">
									{agent.name}
								</span>
								<span
									className={`text-[9px] font-bold px-1 py-0.5 rounded text-white ${
										agent.level === "LEAD"
											? "bg-[var(--status-lead)]"
											: agent.level === "INT"
												? "bg-[var(--status-int)]"
												: "bg-[var(--status-spc)]"
									}`}
								>
									{agent.level}
								</span>
							</div>
							<div className="text-xs text-muted-foreground">{agent.role}</div>
						</div>
						<div
							className={`text-[9px] font-bold flex items-center gap-1 tracking-wider uppercase ${
								agent.status === "active"
									? "text-[var(--status-working)]"
									: agent.status === "blocked"
										? "text-[var(--accent-red)]"
										: "text-muted-foreground"
							}`}
						>
							<span
								className={`w-1.5 h-1.5 rounded-full ${
									agent.status === "active"
										? "bg-[var(--status-working)]"
										: agent.status === "blocked"
											? "bg-[var(--accent-red)]"
											: "bg-muted-foreground"
								}`}
							/>
							{agent.status}
						</div>
					</div>
				))}
			</div>
		</aside>
	);
};

export default AgentsSidebar;
