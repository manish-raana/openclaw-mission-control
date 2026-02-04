import React, { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type AddAgentModalProps = {
	onClose: () => void;
	onCreated: () => void;
};

const AddAgentModal: React.FC<AddAgentModalProps> = ({ onClose, onCreated }) => {
	const createAgent = useMutation(api.agents.createAgent);

	const [name, setName] = useState("");
	const [role, setRole] = useState("");
	const [level, setLevel] = useState<"LEAD" | "INT" | "SPC">("SPC");
	const [avatar, setAvatar] = useState("");
	const [status, setStatus] = useState<"idle" | "active" | "blocked">("active");
	const [systemPrompt, setSystemPrompt] = useState("");
	const [character, setCharacter] = useState("");
	const [lore, setLore] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!name.trim()) return;
			setSubmitting(true);

			try {
				await createAgent({
					name: name.trim(),
					role: role.trim() || "Agent",
					level,
					avatar: avatar.trim() || "🤖",
					status,
					systemPrompt: systemPrompt.trim() || undefined,
					character: character.trim() || undefined,
					lore: lore.trim() || undefined,
				});
				onCreated();
			} catch {
				setSubmitting(false);
			}
		},
		[name, role, level, avatar, status, systemPrompt, character, lore, createAgent, onCreated],
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
						New Agent
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
					{/* Name + Avatar row */}
					<div className="flex gap-3">
						<div className="flex-shrink-0">
							<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
								AVATAR
							</label>
							<input
								type="text"
								value={avatar}
								onChange={(e) => setAvatar(e.target.value)}
								className="w-14 h-14 text-center text-2xl border border-border rounded-full bg-muted focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
								placeholder="🤖"
								maxLength={4}
							/>
						</div>
						<div className="flex-1">
							<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
								NAME
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
								placeholder="e.g. Nova"
								required
								autoFocus
							/>
						</div>
					</div>

					{/* Role */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							ROLE
						</label>
						<input
							type="text"
							value={role}
							onChange={(e) => setRole(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
							placeholder="e.g. QA Engineer, Growth Hacker, DevOps"
						/>
					</div>

					{/* Level + Status row */}
					<div className="flex gap-3">
						<div className="flex-1">
							<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
								LEVEL
							</label>
							<select
								value={level}
								onChange={(e) => setLevel(e.target.value as "LEAD" | "INT" | "SPC")}
								className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
							>
								<option value="LEAD">LEAD</option>
								<option value="INT">INT</option>
								<option value="SPC">SPC</option>
							</select>
						</div>
						<div className="flex-1">
							<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
								STATUS
							</label>
							<select
								value={status}
								onChange={(e) => setStatus(e.target.value as "idle" | "active" | "blocked")}
								className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent"
							>
								<option value="active">Active</option>
								<option value="idle">Idle</option>
								<option value="blocked">Blocked</option>
							</select>
						</div>
					</div>

					{/* System Prompt */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							SYSTEM PROMPT
						</label>
						<textarea
							value={systemPrompt}
							onChange={(e) => setSystemPrompt(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent resize-none"
							placeholder="e.g. You are a QA specialist. Test features thoroughly, write bug reports, and ensure quality standards are met."
							rows={3}
						/>
					</div>

					{/* Character */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							CHARACTER
						</label>
						<textarea
							value={character}
							onChange={(e) => setCharacter(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent resize-none"
							placeholder="e.g. Detail-oriented, methodical, and relentless about edge cases. Finds bugs others miss."
							rows={3}
						/>
					</div>

					{/* Lore */}
					<div>
						<label className="block text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
							LORE
						</label>
						<textarea
							value={lore}
							onChange={(e) => setLore(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] focus:border-transparent resize-none"
							placeholder="e.g. Built from years of QA experience across startups. Has a sixth sense for regression bugs."
							rows={3}
						/>
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
							disabled={submitting || !name.trim()}
							className="px-4 py-2 text-sm font-semibold text-white bg-[var(--accent-green)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{submitting ? "Creating..." : "Create Agent"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddAgentModal;
