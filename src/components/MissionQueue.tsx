import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { IconArchive } from "@tabler/icons-react";

function formatRelativeTime(timestamp: number | null): string {
	if (!timestamp) return "";

	const now = Date.now();
	const diff = now - timestamp;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;

	return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const columns = [
	{ id: "inbox", label: "INBOX", color: "var(--text-subtle)" },
	{ id: "assigned", label: "ASSIGNED", color: "var(--accent-orange)" },
	{ id: "in_progress", label: "IN PROGRESS", color: "var(--accent-blue)" },
	{ id: "review", label: "REVIEW", color: "var(--text-main)" },
	{ id: "done", label: "DONE", color: "var(--accent-green)" },
];

const archivedColumn = { id: "archived", label: "ARCHIVED", color: "var(--text-subtle)" };

interface MissionQueueProps {
	selectedTaskId: Id<"tasks"> | null;
	onSelectTask: (id: Id<"tasks">) => void;
}

const MissionQueue: React.FC<MissionQueueProps> = ({ selectedTaskId, onSelectTask }) => {
	const tasks = useQuery(api.queries.listTasks);
	const agents = useQuery(api.queries.listAgents);
	const archiveTask = useMutation(api.tasks.archiveTask);
	const [showArchived, setShowArchived] = useState(false);

	const currentUserAgent = agents?.find(a => a.name === "Manish");

	if (tasks === undefined || agents === undefined) {
		return (
			<main className="[grid-area:main] bg-secondary flex flex-col overflow-hidden animate-pulse">
				<div className="h-[65px] bg-white border-b border-border" />
				<div className="flex-1 grid grid-cols-5 gap-px bg-border">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="bg-secondary" />
					))}
				</div>
			</main>
		);
	}

	const getAgentName = (id: string) => {
		return agents.find((a) => a._id === id)?.name || "Unknown";
	};

	const displayColumns = showArchived ? [...columns, archivedColumn] : columns;
	const archivedCount = tasks.filter((t) => t.status === "archived").length;

	return (
		<main className="[grid-area:main] bg-secondary flex flex-col overflow-hidden">
			<div className="flex items-center justify-between px-6 py-5 bg-white border-b border-border">
				<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
					<span className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full" />{" "}
					MISSION QUEUE
				</div>
				<div className="flex gap-2">
					<div className="text-[11px] font-semibold px-3 py-1 rounded bg-muted text-muted-foreground flex items-center gap-1.5">
						<span className="text-sm">📦</span>{" "}
						{tasks.filter((t) => t.status === "inbox").length}
					</div>
					<div className="text-[11px] font-semibold px-3 py-1 rounded bg-[#f0f0f0] text-[#999]">
						{tasks.filter((t) => t.status !== "done" && t.status !== "archived").length} active
					</div>
					<button
						onClick={() => setShowArchived(!showArchived)}
						className={`text-[11px] font-semibold px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
							showArchived
								? "bg-[var(--accent-blue)] text-white"
								: "bg-[#f0f0f0] text-[#999] hover:bg-[#e5e5e5]"
						}`}
					>
						<IconArchive size={14} />
						{showArchived ? "Hide Archived" : "Show Archived"}
						{archivedCount > 0 && (
							<span className={`px-1.5 rounded-full text-[10px] ${showArchived ? "bg-white/20" : "bg-[#d0d0d0]"}`}>
								{archivedCount}
							</span>
						)}
					</button>
				</div>
			</div>

			<div className={`flex-1 grid gap-px bg-border overflow-x-auto ${showArchived ? "grid-cols-6" : "grid-cols-5"}`}>
				{displayColumns.map((col) => (
					<div
						key={col.id}
						className="bg-secondary flex flex-col min-w-[250px]"
					>
						<div className="flex items-center gap-2 px-4 py-3 bg-[#f8f9fa] border-b border-border">
							<span
								className="w-2 h-2 rounded-full"
								style={{ backgroundColor: col.color }}
							/>
							<span className="text-[10px] font-bold text-muted-foreground flex-1 uppercase tracking-tighter">
								{col.label}
							</span>
							<span className="text-[10px] text-muted-foreground bg-border px-1.5 py-0.25 rounded-full">
								{tasks.filter((t) => t.status === col.id).length}
							</span>
						</div>
						<div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
							{tasks
								.filter((t) => t.status === col.id)
								.map((task) => {
									const isSelected = selectedTaskId === task._id;
									return (
										<div
											key={task._id}
											onClick={() => onSelectTask(task._id)}
											className={`bg-white rounded-lg p-4 shadow-sm flex flex-col gap-3 border transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
												isSelected
													? "ring-2 ring-[var(--accent-blue)] border-transparent"
													: "border-border"
											} ${col.id === "archived" ? "opacity-60" : ""}`}
											style={{
												borderLeft: isSelected ? undefined : `4px solid ${task.borderColor || "transparent"}`,
											}}
										>
											<div className="flex justify-between text-muted-foreground text-sm">
												<span className="text-base">↑</span>
												<div className="flex items-center gap-2">
													{col.id === "done" && currentUserAgent && (
														<button
															onClick={(e) => {
																e.stopPropagation();
																archiveTask({ taskId: task._id, agentId: currentUserAgent._id });
															}}
															className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
															title="Archive task"
														>
															<IconArchive size={14} />
														</button>
													)}
													<span className="tracking-widest">...</span>
												</div>
											</div>
											<h3 className="text-sm font-semibold text-foreground leading-tight">
												{task.title}
											</h3>
											<p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
												{task.description}
											</p>
											<div className="flex justify-between items-center mt-1">
												{task.assigneeIds && task.assigneeIds.length > 0 && (
													<div className="flex items-center gap-1.5">
														<span className="text-xs">👤</span>
														<span className="text-[11px] font-semibold text-foreground">
															{getAgentName(task.assigneeIds[0] as string)}
														</span>
													</div>
												)}
												{task.lastMessageTime && (
												<span className="text-[11px] text-muted-foreground">
													{formatRelativeTime(task.lastMessageTime)}
												</span>
											)}
											</div>
											<div className="flex flex-wrap gap-1.5">
												{task.tags.map((tag) => (
													<span
														key={tag}
														className="text-[10px] px-2 py-0.5 bg-muted rounded font-medium text-muted-foreground"
													>
														{tag}
													</span>
												))}
											</div>
										</div>
									);
								})}
						</div>
					</div>
				))}
			</div>
		</main>
	);
};

export default MissionQueue;
