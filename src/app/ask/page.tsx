import { Suspense } from "react";
import { AskMartineView } from "@/features/ask-martine/AskMartineView";

// The view reads ?study= (the conversation's scope), hence the Suspense boundary.
export default function Page() {
	return (
		<Suspense>
			<AskMartineView />
		</Suspense>
	);
}
