"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import Header from "./components/Header";
import AgentsSidebar from "./components/AgentsSidebar";
import MissionQueue from "./components/MissionQueue";
import LiveFeed from "./components/LiveFeed";
import SignInForm from "./components/SignIn";
import TaskDetailPanel from "./components/TaskDetailPanel";

export default function App() {
	const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
	const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

	const closeSidebars = useCallback(() => {
		setIsLeftSidebarOpen(false);
		setIsRightSidebarOpen(false);
	}, []);

	const isAnySidebarOpen = useMemo(
		() => isLeftSidebarOpen || isRightSidebarOpen,
		[isLeftSidebarOpen, isRightSidebarOpen],
	);

	useEffect(() => {
		if (!isAnySidebarOpen) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				closeSidebars();
			}
		};

		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [closeSidebars, isAnySidebarOpen]);
	const [selectedTaskId, setSelectedTaskId] = useState<Id<"tasks"> | null>(null);

	return (
		<>
			<Authenticated>
				<main className="app-container">
					<Header
						onOpenAgents={() => {
							setIsLeftSidebarOpen(true);
							setIsRightSidebarOpen(false);
						}}
						onOpenLiveFeed={() => {
							setIsRightSidebarOpen(true);
							setIsLeftSidebarOpen(false);
						}}
					/>

					{isAnySidebarOpen && (
						<div
							className="drawer-backdrop"
							onClick={closeSidebars}
							aria-hidden="true"
						/>
					)}

					<AgentsSidebar
						isOpen={isLeftSidebarOpen}
						onClose={() => setIsLeftSidebarOpen(false)}
					/>
					<MissionQueue 
						selectedTaskId={selectedTaskId} 
						onSelectTask={setSelectedTaskId} 
					/>
					<LiveFeed
						isOpen={isRightSidebarOpen}
						onClose={() => setIsRightSidebarOpen(false)}
					/>
          {selectedTaskId && (
						<>
							<div
								className="fixed inset-0 z-40"
								onClick={() => setSelectedTaskId(null)}
								aria-hidden="true"
							/>
							<TaskDetailPanel
								taskId={selectedTaskId}
								onClose={() => setSelectedTaskId(null)}
							/>
						</>
					)}
				</main>
			</Authenticated>
			<Unauthenticated>
				<SignInForm />
			</Unauthenticated>
		</>
	);
}
