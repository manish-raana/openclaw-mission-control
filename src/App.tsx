"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import Header from "./components/Header";
import AgentsSidebar from "./components/AgentsSidebar";
import MissionQueue from "./components/MissionQueue";
import LiveFeed from "./components/LiveFeed";
import SignInForm from "./components/SignIn";

export default function App() {
	return (
		<>
			<Authenticated>
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground"
				>
					Skip to content
				</a>
				<main id="main-content" className="app-container">
					<Header />
					<AgentsSidebar />
					<MissionQueue />
					<LiveFeed />
				</main>
			</Authenticated>
			<Unauthenticated>
				<SignInForm />
			</Unauthenticated>
		</>
	);
}
