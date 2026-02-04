import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type AgentsSidebarProps = {
	isOpen?: boolean;
	onClose?: () => void;
	onAddTask?: (preselectedAgentId?: string) => void;
	onAddAgent?: () => void;
	onSelectAgent?: (agentId: string) => void;
};

const AgentsSidebar: React.FC<AgentsSidebarProps> = ({
	isOpen = false,
	onClose,
	onAddTask,
	onAddAgent,
	onSelectAgent,
}) => {
	const agents = useQuery(api.queries.listAgents);
	const updateStatus = useMutation(api.agents.updateStatus);
	const deleteAgent = useMutation(api.agents.deleteAgent);

	if (agents === undefined) {
		return (
			<aside
				className={`[grid-area:left-sidebar] sidebar-drawer sidebar-drawer--left bg-white border-r border-border flex flex-col overflow-hidden animate-pulse ${isOpen ? "is-open" : ""}`}
				aria-label="Agents"
			>
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
		<aside
			className={`[grid-area:left-sidebar] sidebar-drawer sidebar-drawer--left bg-white border-r border-border flex flex-col overflow-hidden ${isOpen ? "is-open" : ""}`}
			aria-label="Agents"
		>
			<div className="flex items-center justify-between px-6 py-5 border-b border-border">
				<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
					<span className="w-1.5 h-1.5 bg-[var(--accent-green)] rounded-full" />{" "}
					AGENTS
					{onAddAgent && (
						<button
							type="button"
							onClick={onAddAgent}
							className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-white bg-[var(--accent-green)] rounded hover:opacity-90 transition-opacity"
							aria-label="Add agent"
						>
							<span className="text-xs leading-none">+</span> Add Agent
						</button>
					)}
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
						onClick={onClose}
						aria-label="Close agents sidebar"
					>
						<span aria-hidden="true">✕</span>
					</button>
					<div className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-semibold">
						{agents.length}
					</div>
				</div>
			</div>

			{onAddTask && (
				<div className="px-6 py-3 border-b border-border">
					<button
						type="button"
						onClick={onAddTask}
						className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90 transition-opacity"
					>
						<span className="text-base leading-none">+</span> Add Task
					</button>
				</div>
			)}

			<div className="flex-1 overflow-y-auto py-3">
				{agents.map((agent) => (
					<div
						key={agent._id}
						className="relative flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-muted transition-colors group"
						onClick={() => onSelectAgent?.(agent._id)}
					>
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								if (confirm(`Delete ${agent.name}?`)) {
									deleteAgent({ id: agent._id });
								}
							}}
							className="absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-[22px] w-[22px] items-center justify-center rounded hover:bg-[var(--accent-red)]/10 text-[var(--accent-red)] z-10"
							aria-label={`Delete ${agent.name}`}
							title={`Delete ${agent.name}`}
						>
							<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
						</button>
						<div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-xl border border-border group-hover:bg-white transition-colors">
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
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									updateStatus({
										id: agent._id,
										status: agent.status === "active" ? "idle" : "active",
									});
								}}
								className={`text-[9px] font-bold flex items-center gap-1 tracking-wider uppercase cursor-pointer hover:opacity-70 transition-opacity ${
									agent.status === "active"
										? "text-[var(--status-working)]"
										: agent.status === "blocked"
											? "text-[var(--accent-red)]"
											: "text-muted-foreground"
								}`}
								title={agent.status === "active" ? "Set idle" : "Set active"}
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
							</button>
							{onAddTask && (
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										onAddTask(agent._id);
									}}
									disabled={agent.status !== "active"}
									className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded text-white text-base font-bold leading-none transition-opacity ${
										agent.status !== "active"
											? "bg-muted-foreground/40 cursor-not-allowed"
											: "bg-[var(--accent-blue)] hover:opacity-90"
									}`}
									aria-label={`Add task for ${agent.name}`}
									title={agent.status !== "active" ? `${agent.name} is idle` : `Add task for ${agent.name}`}
								>
									+
								</button>
							)}
						</div>
					</div>
				))}
			</div>
		</aside>
	);
};

export default AgentsSidebar;
