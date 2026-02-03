import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const THEME_STORAGE_KEY = "mission-control-theme";
type ThemeMode = "light" | "dark" | "system";

const getStoredTheme = () => {
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	return stored === "dark" || stored === "light" ? stored : null;
};

const getSystemTheme = () =>
	window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (theme: "dark" | "light") => {
	document.documentElement.classList.toggle("dark", theme === "dark");
};

const initTheme = () => {
	const stored = getStoredTheme();
	const mode: ThemeMode = stored ?? "system";
	applyTheme(mode === "system" ? getSystemTheme() : mode);

	const media = window.matchMedia("(prefers-color-scheme: dark)");
	media.addEventListener("change", (event) => {
		if (!getStoredTheme()) {
			applyTheme(event.matches ? "dark" : "light");
		}
	});
};

if (typeof window !== "undefined") {
	initTheme();
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<ConvexAuthProvider client={convex}>
			<App />
		</ConvexAuthProvider>
	</StrictMode>,
);
