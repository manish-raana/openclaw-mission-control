import React, { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const STATUS_OPTIONS = [
	{ value: "inbox", label: "Inbox" },
	{ value: "assigned", label: "Assigned" },
	{ value: "in_progress", label: "In Progress" },
	{ value: "review", label: "Review" },
	{ value: "done", label: "Done" },
] as const;

const COLOR_SWATCHES = [
	"#3b82f6",
	"#8b5cf6",
	"#ec4899",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#06b6d4",
	"#64748b",
];

type AddTaskModalProps = {
	onClose: () => void;
	onCreated: (taskId: Id<"tasks">) => void;
	initialAssigneeId?: string;
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onCreated, initialAssigneeId }) => {
	const agents = useQuery(api.queries.listAgents);
	const createTask = useMutation(api.tasks.createTask);
	const updateAssignees = useMutation(api.tasks.updateAssignees);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [status, setStatus] = useState(initialAssigneeId ? "assigned" : "inbox");
	const [tagInput, setTagInput] = useState("");
	const [tags, setTags] = useState<string[]>([]);
	const [assigneeId, setAssigneeId] = useState(initialAssigneeId ?? "");
	const [borderColor, setBorderColor] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleAddTag = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				const newTag = tagInput.trim().replace(/,$/g, "");
				if (newTag && !tags.includes(newTag)) {
					setTags((prev) => [...prev, newTag]);
				}
				setTagInput("");
			}
		},
		[tagInput, tags],
	);

	const handleRemoveTag = useCallback((tag: string) => {
		setTags((prev) => prev.filter((t) => t !== tag));
	}, []);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!title.trim()) return;
			setSubmitting(true);

			try {
				const taskId = await createTask({
					title: title.trim(),
					description: description.trim() || title.trim(),
					status,
					tags,
					borderColor: borderColor || undefined,
				});

				if (assigneeId && agents) {
					const agent = agents.find((a) => a._id === assigneeId);
					if (agent) {
						await updateAssignees({
							taskId,
							assigneeIds: [assigneeId as Id<"agents">],
							agentId: agent._id,
						});
					}
				}

				onCreated(taskId);
			} catch {
				setSubmitting(false);
			}
		},
		[
			title,
			description,
			status,
			tags,
			borderColor,
			assigneeId,
			agents,
			createTask,
			updateAssignees,
			onCreated,
		],
	);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			onClick={onClose}
			aria-hidden="true"
		>
			<div className="absolute inset-0 bg-black/40" />
			<div
				className="relative bg-white rounded-xl border border-border shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-6 py-4 border-b border-border">
					<h2 className="text-sm font-bold tracking-wide text-foreground">
						New Task
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
						aria-label="Close modal"
					>
						✕
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
					{/* Title */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							TITLE
						</label>
						<input
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
							placeholder="Task title"
							required
							autoFocus
						/>
					</div>

					{/* Description */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							DESCRIPTION
						</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent resize-none"
							placeholder="Optional — defaults to title"
							rows={3}
						/>
					</div>

					{/* Status */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							STATUS
						</label>
						<select
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
						>
							{STATUS_OPTIONS.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>
					</div>

					{/* Tags */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							TAGS
						</label>
						{tags.length > 0 && (
							<div className="flex flex-wrap gap-1.5 mb-2">
								{tags.map((tag) => (
									<span
										key={tag}
										className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-muted rounded font-medium text-muted-foreground"
									>
										{tag}
										<button
											type="button"
											onClick={() => handleRemoveTag(tag)}
											className="hover:text-foreground transition-colors"
											aria-label={`Remove tag ${tag}`}
										>
											✕
										</button>
									</span>
								))}
							</div>
						)}
						<input
							type="text"
							value={tagInput}
							onChange={(e) => setTagInput(e.target.value)}
							onKeyDown={handleAddTag}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
							placeholder="Type a tag and press Enter"
						/>
					</div>

					{/* Assignee */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							ASSIGNEE
						</label>
						<select
							value={assigneeId}
							onChange={(e) => {
								const newId = e.target.value;
								setAssigneeId(newId);
								if (newId && status === "inbox") {
									setStatus("assigned");
								}
							}}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
						>
							<option value="">Unassigned</option>
							{agents?.map((agent) => (
								<option key={agent._id} value={agent._id}>
									{agent.avatar} {agent.name} — {agent.role}
								</option>
							))}
						</select>
					</div>

					{/* Border Color */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							BORDER COLOR
						</label>
						<div className="flex items-center gap-2">
							{COLOR_SWATCHES.map((color) => (
								<button
									key={color}
									type="button"
									onClick={() =>
										setBorderColor(borderColor === color ? "" : color)
									}
									className={`w-7 h-7 rounded-full border-2 transition-all ${
										borderColor === color
											? "border-foreground scale-110"
											: "border-transparent hover:scale-105"
									}`}
									style={{ backgroundColor: color }}
									aria-label={`Select color ${color}`}
								/>
							))}
							{borderColor && (
								<button
									type="button"
									onClick={() => setBorderColor("")}
									className="text-[11px] text-muted-foreground hover:text-foreground transition-colors ml-1"
								>
									Clear
								</button>
							)}
						</div>
					</div>

					{/* Actions */}
					<div className="flex justify-end gap-2 pt-2 border-t border-border">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={submitting || !title.trim()}
							className="px-4 py-2 text-sm font-semibold text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting ? "Creating..." : "Create Task"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddTaskModal;
