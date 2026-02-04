import React, { useEffect, useState } from "react";
import SignOutButton from "./Signout";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type HeaderProps = {
	onOpenAgents?: () => void;
	onOpenLiveFeed?: () => void;
};

const Header: React.FC<HeaderProps> = ({ onOpenAgents, onOpenLiveFeed }) => {
	const [time, setTime] = useState(new Date());
	
	// Fetch data for dynamic counts
	const agents = useQuery(api.queries.listAgents);
	const tasks = useQuery(api.queries.listTasks);

	// Calculate counts
	const activeAgentsCount = agents ? agents.filter(a => a.status === "active").length : 0;
	const tasksInQueueCount = tasks
		? tasks.filter((t) => t.status !== "done" && t.status !== "archived").length
		: 0;

	useEffect(() => {
		const timer = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString("en-US", {
			hour12: false,
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	const formatDate = (date: Date) => {
		return date
			.toLocaleDateString("en-US", {
				weekday: "short",
				month: "short",
				day: "numeric",
			})
			.toUpperCase();
	};

	return (
		<header className="[grid-area:header] flex items-center justify-between px-3 md:px-6 bg-white border-b border-border z-10">
			<div className="flex items-center gap-2 md:gap-4 min-w-0">
				<div className="flex md:hidden items-center gap-2">
					<button
						type="button"
						className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
						onClick={onOpenAgents}
						aria-label="Open agents sidebar"
					>
						<span aria-hidden="true">☰</span>
					</button>
				</div>
				<div className="flex items-center gap-2 min-w-0">
					<span className="text-2xl text-[var(--accent-orange)]">◇</span>
					<h1 className="text-base md:text-lg font-semibold tracking-wider text-foreground truncate">
						MISSION CONTROL
					</h1>
				</div>
				<div className="hidden sm:block text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
					SiteName
				</div>
			</div>

			<div className="hidden md:flex items-center gap-10">
				<div className="flex flex-col items-center">
					<div className="text-2xl font-bold text-foreground">
						{agents ? activeAgentsCount : "-"}
					</div>
					<div className="text-[10px] font-semibold text-muted-foreground tracking-tighter">
						AGENTS ACTIVE
					</div>
				</div>
				<div className="w-px h-8 bg-border" />
				<div className="flex flex-col items-center">
					<div className="text-2xl font-bold text-foreground">
						{tasks ? tasksInQueueCount : "-"}
					</div>
					<div className="text-[10px] font-semibold text-muted-foreground tracking-tighter">
						TASKS IN QUEUE
					</div>
				</div>
			</div>

			<div className="flex items-center gap-2 md:gap-6">
				<button className="hidden md:flex items-center gap-1.5 bg-muted hover:bg-accent border-none px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-foreground transition-colors">
					<span className="text-base">📚</span> Docs
				</button>
				<button
					type="button"
					className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-accent transition-colors"
					onClick={onOpenLiveFeed}
					aria-label="Open live feed sidebar"
				>
					<span aria-hidden="true">☰</span>
				</button>
				<div className="text-right">
					<div className="text-xl font-semibold text-foreground tabular-nums">
						{formatTime(time)}
					</div>
					<div className="text-[10px] font-medium text-muted-foreground tracking-[0.5px]">
						{formatDate(time)}
					</div>
				</div>
				<div className="flex items-center gap-2 bg-[#e6fcf5] text-[#0ca678] px-3 py-1.5 rounded-full text-[11px] font-bold tracking-[0.5px]">
					<span className="w-2 h-2 bg-[#0ca678] rounded-full" />
					ONLINE
				</div>
				<SignOutButton />
			</div>
		</header>
	);
};

export default Header;
