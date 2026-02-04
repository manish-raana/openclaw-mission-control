import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { IconArchive } from "@tabler/icons-react";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	useSensor,
	useSensors,
	DragStartEvent,
	DragEndEvent,
} from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import KanbanColumn from "./KanbanColumn";

type TaskStatus = "inbox" | "assigned" | "in_progress" | "review" | "done" | "archived";

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

const baseColumns = [
	{ id: "inbox", label: "INBOX", color: "var(--text-subtle)" },
	{ id: "assigned", label: "ASSIGNED", color: "var(--accent-orange)" },
	{ id: "in_progress", label: "IN PROGRESS", color: "var(--accent-blue)" },
	{ id: "review", label: "REVIEW", color: "var(--text-main)" },
	{ id: "done", label: "DONE", color: "var(--accent-green)" },
];

interface MissionQueueProps {
	selectedTaskId: Id<"tasks"> | null;
	onSelectTask: (id: Id<"tasks">) => void;
}

const MissionQueue: React.FC<MissionQueueProps> = ({ selectedTaskId, onSelectTask }) => {
	const tasks = useQuery(api.queries.listTasks);
	const agents = useQuery(api.queries.listAgents);
	const [showArchived, setShowArchived] = useState(false);

	const currentUserAgent = agents?.find(a => a.name === "Manish");
	const updateStatus = useMutation(api.tasks.updateStatus);
	const [activeTask, setActiveTask] = useState<Task | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // 8px movement required to start drag
			},
		})
	);

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

	const archivedCount = tasks.filter((t) => t.status === "archived").length;
	const columns = showArchived
		? [...baseColumns, { id: "archived", label: "ARCHIVED", color: "var(--text-subtle)" }]
		: baseColumns;
	const handleDragStart = (event: DragStartEvent) => {
		const task = tasks.find((t) => t._id === event.active.id);
		if (task) {
			setActiveTask(task as Task);
		}
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveTask(null);

		if (!over || !currentUserAgent) return;

		const taskId = active.id as Id<"tasks">;
		const newStatus = over.id as TaskStatus;
		const task = tasks.find((t) => t._id === taskId);

		if (task && task.status !== newStatus) {
			await updateStatus({
				taskId,
				status: newStatus,
				agentId: currentUserAgent._id,
			});
		}
	};

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

			<DndContext
				sensors={sensors}
				onDragStart={handleDragStart}
				onDragEnd={handleDragEnd}
			>
				<div
					className={`flex-1 grid gap-px bg-border overflow-x-auto ${
						showArchived ? "grid-cols-6" : "grid-cols-5"
					}`}
				>
					{columns.map((col) => (
						<KanbanColumn
							key={col.id}
							column={col}
							taskCount={tasks.filter((t) => t.status === col.id).length}
						>
							{tasks
								.filter((t) => t.status === col.id)
								.map((task) => (
									<TaskCard
										key={task._id}
										task={task as Task}
										isSelected={selectedTaskId === task._id}
										onClick={() => onSelectTask(task._id)}
										getAgentName={getAgentName}
										formatRelativeTime={formatRelativeTime}
										columnId={col.id}
										currentUserAgentId={currentUserAgent?._id}
									/>
								))}
						</KanbanColumn>
					))}
				</div>

				<DragOverlay>
					{activeTask ? (
						<TaskCard
							task={activeTask}
							isSelected={false}
							onClick={() => {}}
							getAgentName={getAgentName}
							formatRelativeTime={formatRelativeTime}
							columnId={activeTask.status}
							isOverlay={true}
						/>
					) : null}
				</DragOverlay>
			</DndContext>
		</main>
	);
};

export default MissionQueue;
