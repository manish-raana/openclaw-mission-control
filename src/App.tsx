"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import Header from "./components/Header";
import AgentsSidebar from "./components/AgentsSidebar";
import MissionQueue from "./components/MissionQueue";
import RightSidebar from "./components/RightSidebar";
import TrayContainer from "./components/Trays/TrayContainer";
import SettingsSidebar from "./components/SettingsSidebar";
import SignInForm from "./components/SignIn";
import TaskDetailPanel from "./components/TaskDetailPanel";
import AddTaskModal from "./components/AddTaskModal";
import AddAgentModal from "./components/AddAgentModal";
import AgentDetailTray from "./components/AgentDetailTray";

export default function App() {
	const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
	const [rightPanel, setRightPanel] = useState<"right" | "settings" | null>(
		"right",
	);

	const closeSidebars = useCallback(() => {
		setIsLeftSidebarOpen(false);
		setRightPanel(null);
	}, []);

	const isAnySidebarOpen = useMemo(
		() => isLeftSidebarOpen || rightPanel !== null,
		[isLeftSidebarOpen, rightPanel],
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
	const [showAddTaskModal, setShowAddTaskModal] = useState(false);
	const [addTaskPreselectedAgentId, setAddTaskPreselectedAgentId] = useState<
		string | undefined
	>(undefined);
	const [selectedAgentId, setSelectedAgentId] = useState<Id<"agents"> | null>(
		null,
	);
	const [showAddAgentModal, setShowAddAgentModal] = useState(false);

	// Document tray state
	const [selectedDocumentId, setSelectedDocumentId] = useState<
		Id<"documents"> | null
	>(null);
	const [showConversationTray, setShowConversationTray] = useState(false);
	const [showPreviewTray, setShowPreviewTray] = useState(false);

	const handleSelectDocument = useCallback((id: Id<"documents"> | null) => {
		if (id === null) {
			setSelectedDocumentId(null);
			setShowConversationTray(false);
			setShowPreviewTray(false);
		} else {
			setSelectedDocumentId(id);
			setShowConversationTray(true);
			setShowPreviewTray(true);
		}
	}, []);

	const handlePreviewDocument = useCallback((id: Id<"documents">) => {
		setSelectedDocumentId(id);
		setShowConversationTray(true);
		setShowPreviewTray(true);
	}, []);

	const handleCloseConversation = useCallback(() => {
		setShowConversationTray(false);
		setShowPreviewTray(false);
		setSelectedDocumentId(null);
	}, []);

	const handleClosePreview = useCallback(() => {
		setShowPreviewTray(false);
	}, []);

	const handleOpenPreview = useCallback(() => {
		setShowPreviewTray(true);
	}, []);

	return (
		<>
			<Authenticated>
				<main className="app-container">
					<Header
						onOpenAgents={() => {
							setIsLeftSidebarOpen(true);
							setRightPanel(null);
						}}
						onOpenLiveFeed={() => {
							setIsLeftSidebarOpen(false);
							setRightPanel("right");
						}}
						onOpenSettings={() => {
							setIsLeftSidebarOpen(false);
							setRightPanel((current) =>
								current === "settings" ? "right" : "settings",
							);
						}}
						isSettingsOpen={rightPanel === "settings"}
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
						onAddTask={(preselectedAgentId) => {
							setAddTaskPreselectedAgentId(preselectedAgentId);
							setShowAddTaskModal(true);
						}}
						onAddAgent={() => setShowAddAgentModal(true)}
						onSelectAgent={(agentId) =>
							setSelectedAgentId(agentId as Id<"agents">)
						}
					/>
					<MissionQueue
						selectedTaskId={selectedTaskId}
						onSelectTask={setSelectedTaskId}
					/>

					{rightPanel !== "settings" && (
						<RightSidebar
							isOpen={rightPanel === "right"}
							onClose={() => setRightPanel(null)}
							selectedDocumentId={selectedDocumentId}
							onSelectDocument={handleSelectDocument}
							onPreviewDocument={handlePreviewDocument}
						/>
					)}
					{rightPanel === "settings" && (
						<SettingsSidebar
							isOpen={rightPanel === "settings"}
							onClose={() => setRightPanel(null)}
						/>
					)}

					<TrayContainer
						selectedDocumentId={selectedDocumentId}
						showConversation={showConversationTray}
						showPreview={showPreviewTray}
						onCloseConversation={handleCloseConversation}
						onClosePreview={handleClosePreview}
						onOpenPreview={handleOpenPreview}
					/>

					{showAddTaskModal && (
						<AddTaskModal
							onClose={() => {
								setShowAddTaskModal(false);
								setAddTaskPreselectedAgentId(undefined);
							}}
							onCreated={(taskId) => {
								setShowAddTaskModal(false);
								setAddTaskPreselectedAgentId(undefined);
								setSelectedTaskId(taskId);
							}}
							initialAssigneeId={addTaskPreselectedAgentId}
						/>
					)}

					{selectedAgentId && (
						<div
							className="fixed inset-0 z-[99]"
							onClick={() => setSelectedAgentId(null)}
							aria-hidden="true"
						/>
					)}
					<AgentDetailTray
						agentId={selectedAgentId}
						onClose={() => setSelectedAgentId(null)}
					/>

					{showAddAgentModal && (
						<AddAgentModal
							onClose={() => setShowAddAgentModal(false)}
							onCreated={() => setShowAddAgentModal(false)}
						/>
					)}

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
								onPreviewDocument={handlePreviewDocument}
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
