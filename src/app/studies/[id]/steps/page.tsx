import { Suspense } from "react";
import { StepsView } from "@/features/steps/StepsView";

// StepsView reads ?phase= (the open phase), hence the Suspense boundary.
export default async function Page({ params }: PageProps<"/studies/[id]/steps">) {
	const { id } = await params;
	return (
		<Suspense>
			<StepsView id={decodeURIComponent(id)} />
		</Suspense>
	);
}
