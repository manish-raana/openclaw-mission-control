import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Id } from "../../convex/_generated/dataModel";
import { IconArchive } from "@tabler/icons-react";

interface Task {
	_id: Id<"tasks">;
	title: string;
	description: string;
	status: string;
	assigneeIds: Id<"agents">[];
	tags: string[];
	borderColor?: string;
	lastMessageTime?: number;
}

interface TaskCardProps {
	task: Task;
	isSelected: boolean;
	onClick: () => void;
	getAgentName: (id: string) => string;
	formatRelativeTime: (timestamp: number | null) => string;
	columnId: string;
	currentUserAgentId?: Id<"agents">;
	onArchive?: (taskId: Id<"tasks">) => void;
	isOverlay?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
	task,
	isSelected,
	onClick,
	getAgentName,
	formatRelativeTime,
	columnId,
	currentUserAgentId,
	onArchive,
	isOverlay = false,
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		isDragging,
	} = useDraggable({
		id: task._id,
		data: { task },
	});

	const style = transform
		? {
				transform: CSS.Translate.toString(transform),
		  }
		: undefined;

	return (
		<div
			ref={setNodeRef}
			style={{
				...style,
				borderLeft:
					isSelected || isOverlay
						? undefined
						: `4px solid ${task.borderColor || "transparent"}`,
			}}
			className={`bg-white rounded-lg p-4 shadow-sm flex flex-col gap-3 border transition-all cursor-pointer select-none ${
				isDragging ? "dragging-card" : "hover:-translate-y-0.5 hover:shadow-md"
			} ${
				isSelected
					? "ring-2 ring-[var(--accent-blue)] border-transparent"
					: "border-border"
			} ${columnId === "archived" ? "opacity-60" : ""} ${
				isOverlay ? "drag-overlay" : ""
			}`}
			onClick={onClick}
			{...listeners}
			{...attributes}
		>
			<div className="flex justify-between text-muted-foreground text-sm">
				<span className="text-base">↑</span>
				<div className="flex items-center gap-2">
					{columnId === "done" && currentUserAgentId && onArchive && (
						<button
							onClick={(e) => {
								e.stopPropagation();
								onArchive(task._id);
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
};

export default TaskCard;
