import React, { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

type AgentDetailTrayProps = {
	agentId: Id<"agents"> | null;
	onClose: () => void;
};

const AgentDetailTray: React.FC<AgentDetailTrayProps> = ({ agentId, onClose }) => {
	const agents = useQuery(api.queries.listAgents);
	const updateAgent = useMutation(api.agents.updateAgent);

	const agent = agents?.find((a) => a._id === agentId) ?? null;

	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState("");
	const [editRole, setEditRole] = useState("");
	const [editLevel, setEditLevel] = useState<"LEAD" | "INT" | "SPC">("SPC");
	const [editAvatar, setEditAvatar] = useState("");
	const [editStatus, setEditStatus] = useState<"idle" | "active" | "blocked">("active");
	const [editSystemPrompt, setEditSystemPrompt] = useState("");
	const [editCharacter, setEditCharacter] = useState("");
	const [editLore, setEditLore] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (agent) {
			setEditName(agent.name);
			setEditRole(agent.role);
			setEditLevel(agent.level);
			setEditAvatar(agent.avatar);
			setEditStatus(agent.status);
			setEditSystemPrompt(agent.systemPrompt ?? "");
			setEditCharacter(agent.character ?? "");
			setEditLore(agent.lore ?? "");
		}
		setIsEditing(false);
	}, [agent?._id]);

	const handleSave = useCallback(async () => {
		if (!agentId) return;
		setSaving(true);
		try {
			await updateAgent({
				id: agentId,
				name: editName,
				role: editRole,
				level: editLevel,
				avatar: editAvatar,
				status: editStatus,
				systemPrompt: editSystemPrompt,
				character: editCharacter,
				lore: editLore,
			});
			setIsEditing(false);
		} finally {
			setSaving(false);
		}
	}, [agentId, editName, editRole, editLevel, editAvatar, editStatus, editSystemPrompt, editCharacter, editLore, updateAgent]);

	const handleCancel = useCallback(() => {
		if (agent) {
			setEditName(agent.name);
			setEditRole(agent.role);
			setEditLevel(agent.level);
			setEditAvatar(agent.avatar);
			setEditStatus(agent.status);
			setEditSystemPrompt(agent.systemPrompt ?? "");
			setEditCharacter(agent.character ?? "");
			setEditLore(agent.lore ?? "");
		}
		setIsEditing(false);
	}, [agent]);

	const isOpen = agentId !== null;

	return (
		<div className={`agent-tray ${isOpen ? "is-open" : ""}`}>
			{agent && (
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="flex items-center justify-between px-5 py-4 border-b border-border">
						<h2 className="text-sm font-bold tracking-wide text-foreground">
							Agent Details
						</h2>
						<button
							type="button"
							onClick={onClose}
							className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
							aria-label="Close tray"
						>
							✕
						</button>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
						{/* Avatar + Name header */}
						<div className="flex items-center gap-4">
							{isEditing ? (
								<input
									type="text"
									value={editAvatar}
									onChange={(e) => setEditAvatar(e.target.value)}
									className="w-14 h-14 text-center text-2xl border border-border rounded-full bg-muted focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
									maxLength={4}
								/>
							) : (
								<div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center text-2xl border border-border">
									{agent.avatar}
								</div>
							)}
							<div className="flex-1">
								{isEditing ? (
									<input
										type="text"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										className="w-full text-lg font-bold text-foreground border border-border rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
									/>
								) : (
									<div className="text-lg font-bold text-foreground">{agent.name}</div>
								)}
								{isEditing ? (
									<input
										type="text"
										value={editRole}
										onChange={(e) => setEditRole(e.target.value)}
										className="w-full text-xs text-muted-foreground border border-border rounded-lg px-2 py-1 mt-1 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
									/>
								) : (
									<div className="text-xs text-muted-foreground">{agent.role}</div>
								)}
							</div>
						</div>

						{/* Level + Status row */}
						<div className="flex items-center gap-3">
							{isEditing ? (
								<select
									value={editLevel}
									onChange={(e) => setEditLevel(e.target.value as "LEAD" | "INT" | "SPC")}
									className="text-[10px] font-bold px-2 py-1 rounded text-white border-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
									style={{
										backgroundColor: editLevel === "LEAD" ? "var(--status-lead)" : editLevel === "INT" ? "var(--status-int)" : "var(--status-spc)",
									}}
								>
									<option value="LEAD">LEAD</option>
									<option value="INT">INT</option>
									<option value="SPC">SPC</option>
								</select>
							) : (
								<span
									className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
										agent.level === "LEAD"
											? "bg-[var(--status-lead)]"
											: agent.level === "INT"
												? "bg-[var(--status-int)]"
												: "bg-[var(--status-spc)]"
									}`}
								>
									{agent.level}
								</span>
							)}

							{isEditing ? (
								<select
									value={editStatus}
									onChange={(e) => setEditStatus(e.target.value as "idle" | "active" | "blocked")}
									className="text-[10px] font-bold px-2 py-1 rounded border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
								>
									<option value="active">Active</option>
									<option value="idle">Idle</option>
									<option value="blocked">Blocked</option>
								</select>
							) : (
								<div
									className={`text-[10px] font-bold flex items-center gap-1 tracking-wider uppercase ${
										agent.status === "active"
											? "text-[var(--status-working)]"
											: agent.status === "blocked"
												? "text-[var(--accent-red)]"
												: "text-muted-foreground"
									}`}
								>
									<span
										className={`w-1.5 h-1.5 rounded-full ${
											agent.status === "active"
												? "bg-[var(--status-working)]"
												: agent.status === "blocked"
													? "bg-[var(--accent-red)]"
													: "bg-muted-foreground"
										}`}
									/>
									{agent.status}
								</div>
							)}
						</div>

						{/* System Prompt */}
						<div>
							<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
								SYSTEM PROMPT
							</label>
							{isEditing ? (
								<textarea
									value={editSystemPrompt}
									onChange={(e) => setEditSystemPrompt(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent resize-none"
									rows={4}
								/>
							) : (
								<p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg px-3 py-2">
									{agent.systemPrompt || <span className="text-muted-foreground italic">Not set</span>}
								</p>
							)}
						</div>

						{/* Character */}
						<div>
							<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
								CHARACTER
							</label>
							{isEditing ? (
								<textarea
									value={editCharacter}
									onChange={(e) => setEditCharacter(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent resize-none"
									rows={4}
								/>
							) : (
								<p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg px-3 py-2">
									{agent.character || <span className="text-muted-foreground italic">Not set</span>}
								</p>
							)}
						</div>

						{/* Lore */}
						<div>
							<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
								LORE
							</label>
							{isEditing ? (
								<textarea
									value={editLore}
									onChange={(e) => setEditLore(e.target.value)}
									className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent resize-none"
									rows={4}
								/>
							) : (
								<p className="text-sm text-foreground leading-relaxed bg-muted/50 rounded-lg px-3 py-2">
									{agent.lore || <span className="text-muted-foreground italic">Not set</span>}
								</p>
							)}
						</div>
					</div>

					{/* Footer actions */}
					<div className="px-5 py-4 border-t border-border">
						{isEditing ? (
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleCancel}
									className="flex-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleSave}
									disabled={saving || !editName.trim()}
									className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{saving ? "Saving..." : "Save"}
								</button>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setIsEditing(true)}
								className="w-full px-4 py-2 text-sm font-semibold text-white bg-[var(--accent-blue)] rounded-lg hover:opacity-90 transition-opacity"
							>
								Edit Agent
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default AgentDetailTray;
