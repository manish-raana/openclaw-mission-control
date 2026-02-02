import { useAuthActions } from "@convex-dev/auth/react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";

type SignUpFormProps = {
	onShowSignIn?: () => void;
};

function SignUpForm({ onShowSignIn }: SignUpFormProps) {
	const { signIn } = useAuthActions();
	const [error, setError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const handleSignUp = async (formData: FormData) => {
		formData.set("flow", "signUp");
		const result = await signIn("password", formData);
		if (result.signingIn) {
			const email = formData.get("email");
			const password = formData.get("password");
			if (typeof email === "string" && typeof password === "string") {
				const signInData = new FormData();
				signInData.set("flow", "signIn");
				signInData.set("email", email);
				signInData.set("password", password);
				await signIn("password", signInData);
			} else {
				setError("Account created. Please sign in.");
			}
		}
	};

	const errorMessage = error?.includes("already exists")
		? "That email already exists. Try signing in instead."
		: error
			? "Unable to create credentials."
			: null;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans">
			<div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl transition-all duration-300 hover:shadow-2xl">
				<div className="bg-muted/30 p-8 text-center border-b border-border">
					<div className="mb-4 flex justify-center">
						<span className="text-4xl text-[var(--accent-orange)] drop-shadow-sm">
							◇
						</span>
					</div>
					<h1 className="text-2xl font-bold tracking-wider text-foreground uppercase">
						Mission Control
					</h1>
					<p className="mt-2 text-sm text-muted-foreground font-medium">
						Create your commander credentials.
					</p>
				</div>

				<div className="p-8">
					<form
						className="space-y-5"
						onSubmit={async (e) => {
							e.preventDefault();
							setError(null);
							setIsLoading(true);
							try {
								await handleSignUp(new FormData(e.target as HTMLFormElement));
							} catch (err) {
								setError(err instanceof Error ? err.message : "Sign up failed");
							} finally {
								setIsLoading(false);
							}
						}}
					>
						<div className="space-y-4">
							<div className="space-y-1.5">
								<label
									className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
									htmlFor="email"
								>
									Email Address
								</label>
								<input
									id="email"
									className="w-full bg-background text-foreground rounded-lg p-3 border border-border focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all placeholder:text-muted-foreground/50"
									type="email"
									autoComplete="email"
									name="email"
									placeholder="commander@mission.control"
									required
								/>
							</div>
							<div className="space-y-1.5">
								<label
									className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
									htmlFor="password"
								>
									Password
								</label>
								<div className="relative">
									<input
										id="password"
										className="w-full bg-background text-foreground rounded-lg p-3 border border-border focus:border-[var(--accent-orange)] focus:ring-1 focus:ring-[var(--accent-orange)] outline-none transition-all placeholder:text-muted-foreground/50"
										type={showPassword ? "text" : "password"}
										autoComplete="new-password"
										name="password"
										placeholder="••••••••"
										required
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
									>
										{showPassword ? (
											<IconEyeOff className="w-5 h-5" />
										) : (
											<IconEye className="w-5 h-5" />
										)}
									</button>
								</div>
							</div>
						</div>

						<button
							className="w-full bg-foreground text-background font-bold py-3 px-4 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-md uppercase tracking-widest cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
							type="submit"
							disabled={isLoading}
						>
							{isLoading ? "Creating..." : "Create Account"}
						</button>

						<div className="text-center text-xs text-muted-foreground">
							<span className="mr-2">Already have credentials?</span>
							<button
								type="button"
								onClick={onShowSignIn}
								className="font-semibold text-foreground hover:text-[var(--accent-orange)] transition-colors"
							>
								Return to Sign In
							</button>
						</div>

						{errorMessage && (
							<div className="mt-4 animate-in fade-in slide-in-from-top-2">
								<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
									<span className="text-destructive text-lg">⚠️</span>
									<p className="text-foreground/80 font-mono text-xs leading-relaxed pt-1">
										{errorMessage}
									</p>
								</div>
							</div>
						)}
					</form>
				</div>
			</div>
		</div>
	);
}

export default SignUpForm;
