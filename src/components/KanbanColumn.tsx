import React from "react";
import { useDroppable } from "@dnd-kit/core";

interface Column {
	id: string;
	label: string;
	color: string;
}

interface KanbanColumnProps {
	column: Column;
	taskCount: number;
	children: React.ReactNode;
	isOver?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
	column,
	taskCount,
	children,
}) => {
	const { isOver, setNodeRef } = useDroppable({
		id: column.id,
	});

	return (
		<div
			ref={setNodeRef}
			className={`bg-secondary flex flex-col min-w-[250px] transition-colors ${
				isOver ? "drop-zone-active" : ""
			}`}
		>
			<div className="flex items-center gap-2 px-4 py-3 bg-[#f8f9fa] border-b border-border">
				<span
					className="w-2 h-2 rounded-full"
					style={{ backgroundColor: column.color }}
				/>
				<span className="text-[10px] font-bold text-muted-foreground flex-1 uppercase tracking-tighter">
					{column.label}
				</span>
				<span className="text-[10px] text-muted-foreground bg-border px-1.5 py-0.25 rounded-full">
					{taskCount}
				</span>
			</div>
			<div className="flex-1 p-3 flex flex-col gap-3 overflow-y-auto">
				{children}
			</div>
		</div>
	);
};

export default KanbanColumn;
