"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { useState } from "react";
import Header from "./components/Header";
import AgentsSidebar from "./components/AgentsSidebar";
import MissionQueue from "./components/MissionQueue";
import LiveFeed from "./components/LiveFeed";
import SignInForm from "./components/SignIn";
import SignUpForm from "./components/SignUp";

export default function App() {
	const [authView, setAuthView] = useState<"signIn" | "signUp">("signIn");

	return (
		<>
			<Authenticated>
				<main className="app-container">
					<Header />
					<AgentsSidebar />
					<MissionQueue />
					<LiveFeed />
				</main>
			</Authenticated>
			<Unauthenticated>
				{authView === "signIn" ? (
					<SignInForm onShowSignUp={() => setAuthView("signUp")} />
				) : (
					<SignUpForm onShowSignIn={() => setAuthView("signIn")} />
				)}
			</Unauthenticated>
		</>
	);
}
