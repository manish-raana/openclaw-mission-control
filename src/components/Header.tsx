import React, { useState, useEffect } from "react";
import SignOutButton from "./Signout";
import CreateTaskModal from "./CreateTaskModal";

const THEME_STORAGE_KEY = "mission-control-theme";
type ThemeMode = "light" | "dark" | "system";

const getStoredTheme = () => {
	if (typeof window === "undefined") {
		return null;
	}
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	return stored === "dark" || stored === "light" ? stored : null;
};

const getSystemTheme = () =>
	window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme: "dark" | "light") => {
	document.documentElement.classList.toggle("dark", theme === "dark");
};

const getInitialThemeState = (): { themeMode: ThemeMode; isDark: boolean } => {
	if (typeof window === "undefined") {
		return { themeMode: "system", isDark: false };
	}
	const stored = getStoredTheme();
	const themeMode: ThemeMode = stored ?? "system";
	const resolvedTheme =
		themeMode === "system" ? getSystemTheme() : themeMode;
	return { themeMode, isDark: resolvedTheme === "dark" };
};

const Header: React.FC = () => {
	const [time, setTime] = useState(new Date());
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [themeMode, setThemeMode] = useState<ThemeMode>(
		() => getInitialThemeState().themeMode,
	);
	const [isDark, setIsDark] = useState(
		() => getInitialThemeState().isDark,
	);

	useEffect(() => {
		const timer = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (event: MediaQueryListEvent) => {
			if (themeMode === "system") {
				setIsDark(event.matches);
			}
		};
		media.addEventListener("change", handleChange);
		return () => media.removeEventListener("change", handleChange);
	}, [themeMode]);

	const handleThemeToggle = () => {
		const nextMode: ThemeMode =
			themeMode === "system"
				? "light"
				: themeMode === "light"
					? "dark"
					: "system";
		setThemeMode(nextMode);
		if (nextMode === "system") {
			localStorage.removeItem(THEME_STORAGE_KEY);
			const systemTheme = getSystemTheme();
			applyTheme(systemTheme);
			setIsDark(systemTheme === "dark");
			return;
		}
		localStorage.setItem(THEME_STORAGE_KEY, nextMode);
		applyTheme(nextMode);
		setIsDark(nextMode === "dark");
	};

	const themeLabel =
		themeMode === "system"
			? "System"
			: themeMode === "light"
				? "Light"
				: "Dark";

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
		<header className="[grid-area:header] flex items-center justify-between px-6 bg-card border-b border-border z-10">
			<div className="flex items-center gap-4">
				<div className="flex items-center gap-2">
					<span className="text-2xl text-[var(--accent-orange)]">◇</span>
					<h1 className="text-lg font-semibold tracking-wider text-foreground">
						MISSION CONTROL
					</h1>
				</div>
				<div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
					SiteName
				</div>
			</div>

			<div className="flex items-center gap-10">
				<div className="flex flex-col items-center">
					<div className="text-2xl font-bold text-foreground">11</div>
					<div className="text-[10px] font-semibold text-muted-foreground tracking-tighter">
						AGENTS ACTIVE
					</div>
				</div>
				<div className="w-px h-8 bg-border" />
				<div className="flex flex-col items-center">
					<div className="text-2xl font-bold text-foreground">35</div>
					<div className="text-[10px] font-semibold text-muted-foreground tracking-tighter">
						TASKS IN QUEUE
					</div>
				</div>
			</div>

			<div className="flex items-center gap-6">
				<button
					onClick={() => setIsCreateOpen(true)}
					className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
					type="button"
				>
					<span className="text-base">＋</span>
					New Mission
				</button>
				<button className="flex items-center gap-1.5 bg-muted hover:bg-accent border-none px-4 py-2 rounded-lg text-sm font-medium cursor-pointer text-foreground transition-colors">
					<span className="text-base">📚</span> Docs
				</button>
				<div className="text-right">
					<div className="text-xl font-semibold text-foreground tabular-nums">
						{formatTime(time)}
					</div>
					<div className="text-[10px] font-medium text-muted-foreground tracking-[0.5px]">
						{formatDate(time)}
					</div>
				</div>
				<div className="flex items-center gap-2 bg-[var(--status-working)] text-white px-3 py-1.5 rounded-full text-[11px] font-bold tracking-[0.5px]">
					<span className="w-2 h-2 bg-white rounded-full" />
					ONLINE
				</div>
				<button
					className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
					onClick={handleThemeToggle}
					aria-pressed={isDark}
					aria-label={`Switch theme (currently ${themeMode})`}
					type="button"
				>
					<span
						className="w-2 h-2 rounded-full bg-[var(--accent-orange)]"
						aria-hidden="true"
					/>
					{themeLabel}
				</button>
				<SignOutButton />
			</div>
			<CreateTaskModal
				isOpen={isCreateOpen}
				onClose={() => setIsCreateOpen(false)}
			/>
		</header>
	);
};

export default Header;
