import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import TaskDetailModal from "./TaskDetailModal";

const columns = [
	{ id: "inbox", label: "INBOX", color: "var(--text-subtle)" },
	{ id: "assigned", label: "ASSIGNED", color: "var(--accent-orange)" },
	{ id: "in_progress", label: "IN PROGRESS", color: "var(--accent-blue)" },
	{ id: "review", label: "REVIEW", color: "var(--text-main)" },
	{ id: "done", label: "DONE", color: "var(--accent-green)" },
];

const MissionQueue: React.FC = () => {
	const tasks = useQuery(api.queries.listTasks);
	const agents = useQuery(api.queries.listAgents);
	const assignTask = useMutation(api.tasks.assign);
	const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(
		null,
	);
	const [openMenuTaskId, setOpenMenuTaskId] = React.useState<string | null>(
		null,
	);
	const [isAssignOpen, setIsAssignOpen] = React.useState(false);
	const [assignTaskId, setAssignTaskId] = React.useState<string | null>(null);
	const [assigneeId, setAssigneeId] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [now, setNow] = React.useState(() => Date.now());

	React.useEffect(() => {
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

	if (tasks === undefined || agents === undefined) {
		return (
			<main className="[grid-area:main] bg-secondary flex flex-col overflow-hidden animate-pulse">
				<div className="h-[65px] bg-card border-b border-border" />
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

	const handleAssignOpen = (taskId: string, currentAssigneeId?: string) => {
		setAssignTaskId(taskId);
		setAssigneeId(currentAssigneeId || "");
		setIsAssignOpen(true);
		setOpenMenuTaskId(null);
	};

	const handleAssignSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!assignTaskId) {
			return;
		}
		setIsSubmitting(true);
		try {
			await assignTask({
				id: assignTaskId,
				assigneeIds: assigneeId ? [assigneeId] : [],
			});
			setIsAssignOpen(false);
			setAssignTaskId(null);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="[grid-area:main] bg-secondary flex flex-col overflow-hidden">
			<div className="flex items-center justify-between px-6 py-5 bg-card border-b border-border">
				<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
					<span className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full" />{" "}
					MISSION QUEUE
				</div>
				<div className="flex gap-2">
					<div className="text-[11px] font-semibold px-3 py-1 rounded bg-muted text-muted-foreground flex items-center gap-1.5">
						<span className="text-sm">📦</span>{" "}
						{tasks.filter((t) => t.status === "inbox").length}
					</div>
					<div className="text-[11px] font-semibold px-3 py-1 rounded bg-muted text-muted-foreground">
						{tasks.filter((t) => t.status !== "done").length} active
					</div>
				</div>
			</div>

			<div className="flex-1 grid grid-cols-5 gap-px bg-border overflow-x-auto">
				{columns.map((col) => (
					<div
						key={col.id}
						className="bg-secondary flex flex-col min-w-[250px]"
					>
						<div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
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
								.map((task) => (
									<div
										key={task._id}
										className="relative bg-card rounded-lg p-4 shadow-sm flex flex-col gap-3 border border-border transition-shadow transition-transform hover:-translate-y-0.5 hover:shadow-md"
										style={{
											borderLeft: `4px solid ${task.borderColor || "transparent"}`,
										}}
									>
										<button
											className="w-full text-left pr-6"
											onClick={() => {
												setSelectedTaskId(task._id);
												setOpenMenuTaskId(null);
											}}
											type="button"
										>
											<div className="flex justify-between text-muted-foreground text-sm">
												<span className="text-base">↑</span>
												<span className="opacity-0">…</span>
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
												<span className="text-[11px] text-muted-foreground">
													{formatRelativeTime(task.lastActivityAt)}
												</span>
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
										</button>
										<div className="absolute right-3 top-3">
											<div className="relative">
												<button
													onClick={(event) => {
														event.stopPropagation();
														setOpenMenuTaskId((prev) =>
															prev === task._id ? null : task._id,
														);
													}}
													className="tracking-widest text-muted-foreground hover:text-foreground"
													aria-label="Task actions"
													type="button"
												>
													…
												</button>
												{openMenuTaskId === task._id && (
													<div
														className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-card shadow-md z-10"
														onClick={(event) => event.stopPropagation()}
													>
														<button
															onClick={() =>
																handleAssignOpen(
																	task._id,
																	(task.assigneeIds?.[0] as string) || "",
																)
															}
															className="w-full px-4 py-2 text-left text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/70"
															type="button"
														>
															Assign Task
														</button>
													</div>
												)}
											</div>
										</div>
									</div>
								))}
						</div>
					</div>
				))}
			</div>
			<TaskDetailModal
				taskId={selectedTaskId}
				onClose={() => setSelectedTaskId(null)}
			/>
			{isAssignOpen && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6 overscroll-contain"
					onClick={() => setIsAssignOpen(false)}
				>
					<div
						className="w-full max-w-[480px] rounded-xl border border-border bg-card shadow-xl flex flex-col overflow-hidden"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="h-[65px] px-6 flex items-center justify-between border-b border-border">
							<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
								<span className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full" />
								ASSIGN MISSION
							</div>
							<button
								onClick={() => setIsAssignOpen(false)}
								className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
								type="button"
							>
								Close
							</button>
						</div>
						<form
							onSubmit={(event) => {
								void handleAssignSubmit(event);
							}}
							className="p-6 flex flex-col gap-5"
						>
							<div className="flex flex-col gap-2">
								<label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									Assign To
								</label>
								<select
									className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-orange)]"
									value={assigneeId}
									onChange={(event) => setAssigneeId(event.target.value)}
									disabled={agents === undefined}
								>
									<option value="">Unassigned</option>
									{(agents || []).map((agent) => (
										<option key={agent._id} value={agent._id}>
											{agent.name}
										</option>
									))}
								</select>
								<span className="text-[10px] uppercase tracking-widest text-muted-foreground">
									{assigneeId ? "Status: Assigned" : "Status: Inbox"}
								</span>
							</div>
							<div className="flex items-center gap-3 pt-2">
								<button
									type="button"
									onClick={() => setIsAssignOpen(false)}
									className="flex-1 bg-muted text-foreground py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-muted/80 transition-colors"
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="flex-1 bg-foreground text-white py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
									disabled={isSubmitting}
									aria-busy={isSubmitting}
								>
									<span className="inline-flex items-center justify-center gap-2">
										{isSubmitting && (
											<span
												className="h-3 w-3 animate-spin rounded-full border border-white/40 border-t-white"
												aria-hidden="true"
											/>
										)}
										Assign Task
									</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	);
};

export default MissionQueue;
