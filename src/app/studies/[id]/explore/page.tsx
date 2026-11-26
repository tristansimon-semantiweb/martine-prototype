import { Suspense } from "react";
import { ExploreView } from "@/features/explore/ExploreView";

// ExploreView reads ?phase= (the phase it was opened from), hence the Suspense boundary.
export default async function Page({ params }: PageProps<"/studies/[id]/explore">) {
	const { id } = await params;
	return (
		<Suspense>
			<ExploreView id={decodeURIComponent(id)} />
		</Suspense>
	);
}
