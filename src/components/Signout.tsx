import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

function SignOutButton() {
	const { isAuthenticated } = useConvexAuth();
	const { signOut } = useAuthActions();
	return (
		<>
			{isAuthenticated && (
				<button
					className="bg-destructive text-destructive-foreground rounded-md px-2 py-1 cursor-pointer hover:bg-destructive/80"
					onClick={() => void signOut()}
				>
					Sign Out
				</button>
			)}
		</>
	);
}

export default SignOutButton;
