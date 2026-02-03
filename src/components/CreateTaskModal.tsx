import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type CreateTaskModalProps = {
	isOpen: boolean;
	onClose: () => void;
};

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
	isOpen,
	onClose,
}) => {
	const createTask = useMutation(api.tasks.create);
	const agents = useQuery(api.queries.listAgents);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [assigneeId, setAssigneeId] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const resetForm = () => {
		setTitle("");
		setDescription("");
		setAssigneeId("");
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!title.trim() || !description.trim()) {
			return;
		}
		setIsSubmitting(true);
		try {
			await createTask({
				title: title.trim(),
				description: description.trim(),
				tags: ["mission"],
				assigneeIds: assigneeId ? [assigneeId] : [],
			});
			handleClose();
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-6 overscroll-contain"
			onClick={handleClose}
		>
			<div
				className="w-full max-w-[540px] rounded-xl border border-border bg-card shadow-xl flex flex-col overflow-hidden"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="h-[65px] px-6 flex items-center justify-between border-b border-border">
					<div className="text-[11px] font-bold tracking-widest text-muted-foreground flex items-center gap-2">
						<span className="w-1.5 h-1.5 bg-[var(--accent-orange)] rounded-full" />
						INITIATE NEW MISSION
					</div>
					<button
						onClick={handleClose}
						className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
						type="button"
					>
						Close
					</button>
				</div>
				<form
					onSubmit={(event) => {
						void handleSubmit(event);
					}}
					className="p-6 flex flex-col gap-5"
				>
					<div className="flex flex-col gap-2">
						<label
							className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
							htmlFor="mission-title"
						>
							Mission Objective
						</label>
						<input
							id="mission-title"
							name="title"
							autoComplete="off"
							className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--accent-orange)]"
							placeholder="e.g., Research SiteGPT competitor pricing…"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label
							className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
							htmlFor="mission-description"
						>
							Briefing Details
						</label>
						<textarea
							id="mission-description"
							name="description"
							className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-base text-foreground min-h-[140px] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-orange)]"
							placeholder="Describe the specific outcome required…"
							value={description}
							onChange={(event) => setDescription(event.target.value)}
							required
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label
							className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
							htmlFor="mission-assignee"
						>
							Assignee
						</label>
						<select
							id="mission-assignee"
							name="assignee"
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
							onClick={handleClose}
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
								Deploy Mission
							</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default CreateTaskModal;
