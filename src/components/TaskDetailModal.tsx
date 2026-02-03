import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const statusMeta = {
	inbox: { label: "INBOX", color: "var(--text-subtle)" },
	assigned: { label: "ASSIGNED", color: "var(--accent-orange)" },
	in_progress: { label: "IN PROGRESS", color: "var(--accent-blue)" },
	review: { label: "REVIEW", color: "var(--text-main)" },
	done: { label: "DONE", color: "var(--accent-green)" },
} as const;

type TaskDetailModalProps = {
	taskId: string | null;
	onClose: () => void;
};

const formatRelativeTime = (timestamp?: number) => {
	if (!timestamp) {
		return "unknown";
	}
	const deltaSeconds = Math.floor((Date.now() - timestamp) / 1000);
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

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
	taskId,
	onClose,
}) => {
	const details = useQuery(
		api.queries.getTaskDetails,
		taskId ? { taskId } : "skip",
	);

	if (!taskId) {
		return null;
	}

	const task = details?.task;
	const status = task ? statusMeta[task.status] : null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-6 overscroll-contain"
			onClick={onClose}
		>
			<div
				className="w-[min(920px,92vw)] max-h-[85vh] rounded-xl border border-border bg-card shadow-xl flex flex-col"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="h-[65px] px-6 flex items-center justify-between border-b border-border">
					<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
						<span className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full" />
						TASK DETAILS
					</div>
					<button
						onClick={onClose}
						className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
						aria-label="Close task details"
						type="button"
					>
						Close
					</button>
				</div>
				<div className="flex-1 overflow-hidden">
					{details === undefined && (
						<div className="p-6 text-sm text-muted-foreground">
							Loading task…
						</div>
					)}
					{details !== undefined && !task && (
						<div className="p-6 text-sm text-muted-foreground">
							Task not found.
						</div>
					)}
					{task && details && (
						<div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6 p-6 h-full overflow-hidden">
							<div className="flex flex-col gap-6 overflow-y-auto pr-2">
								<div className="flex flex-col gap-2">
									<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Title
									</div>
									<h2 className="text-lg font-semibold text-foreground leading-tight">
										{task.title}
									</h2>
								</div>
								<div className="flex flex-col gap-2">
									<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Summary
									</div>
									<p className="text-sm text-muted-foreground leading-relaxed">
										{task.description}
									</p>
								</div>
								<div className="flex items-center gap-3 flex-wrap">
									<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Status
									</div>
									{status && (
										<div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
											<span
												className="w-2 h-2 rounded-full"
												style={{ backgroundColor: status.color }}
											/>
											{status.label}
										</div>
									)}
									<div className="text-[11px] text-muted-foreground">
										Last activity {formatRelativeTime(task.lastActivityAt)}
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Assignees
									</div>
									<div className="flex flex-wrap gap-2">
										{details.assignees.length === 0 && (
											<span className="text-[11px] text-muted-foreground">
												Unassigned
											</span>
										)}
										{details.assignees.map((assignee) => (
											<span
												key={assignee._id}
												className="text-[11px] font-semibold text-foreground bg-muted px-2.5 py-1 rounded-full"
											>
												{assignee.name}
											</span>
										))}
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Tags
									</div>
									<div className="flex flex-wrap gap-2">
										{task.tags.length === 0 && (
											<span className="text-[11px] text-muted-foreground">
												No tags
											</span>
										)}
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
							</div>
							<div className="flex flex-col gap-6 overflow-y-auto pr-2">
								<div className="flex flex-col gap-3">
									<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Activity Log
									</div>
									<div className="flex flex-col gap-2">
										{details.activities.length === 0 && (
											<div className="text-[11px] text-muted-foreground">
												No activity recorded yet.
											</div>
										)}
										{details.activities.map((activity) => (
											<div
												key={activity._id}
												className="bg-secondary rounded-lg border border-border p-3 flex flex-col gap-2"
											>
												<div className="flex items-center justify-between">
													<div className="text-[11px] font-semibold text-foreground">
														{activity.agentName}
													</div>
													<span className="text-[10px] text-muted-foreground">
														{formatRelativeTime(activity.createdAt)}
													</span>
												</div>
												<p className="text-[12px] text-muted-foreground leading-relaxed">
													{activity.message}
												</p>
												<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
													{activity.type}
												</div>
											</div>
										))}
									</div>
								</div>
								<div className="flex flex-col gap-3">
									<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Messages
									</div>
									<div className="flex flex-col gap-2">
										{details.messages.length === 0 && (
											<div className="text-[11px] text-muted-foreground">
												No messages recorded yet.
											</div>
										)}
										{details.messages.map((message) => (
											<div
												key={message._id}
												className="bg-card rounded-lg border border-border p-3 flex flex-col gap-2"
											>
												<div className="flex items-center justify-between">
													<div className="text-[11px] font-semibold text-foreground">
														{message.agentName}
													</div>
													<span className="text-[10px] text-muted-foreground">
														{formatRelativeTime(message.createdAt)}
													</span>
												</div>
												<p className="text-[12px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
													{message.content}
												</p>
											</div>
										))}
									</div>
								</div>
								<div className="flex flex-col gap-3">
									<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
										Documents
									</div>
									<div className="flex flex-col gap-2">
										{details.documents.length === 0 && (
											<div className="text-[11px] text-muted-foreground">
												No documents attached.
											</div>
										)}
										{details.documents.map((document) => (
											<div
												key={document._id}
												className="bg-secondary rounded-lg border border-border p-3 flex items-center justify-between"
											>
												<div>
													<div className="text-[12px] font-semibold text-foreground">
														{document.title}
													</div>
													<div className="text-[10px] uppercase tracking-widest text-muted-foreground">
														{document.type}
													</div>
												</div>
												<span className="text-[10px] text-muted-foreground">
													{formatRelativeTime(document.createdAt)}
												</span>
											</div>
										))}
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default TaskDetailModal;
