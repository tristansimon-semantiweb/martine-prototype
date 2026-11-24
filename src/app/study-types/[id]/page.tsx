import { Suspense } from "react";
import { MethodOverview } from "@/features/methods/MethodOverview";

// The overview forwards an old ?phase= link to the Method tab, hence the Suspense boundary.
export default async function Page({ params }: PageProps<"/study-types/[id]">) {
	const { id } = await params;
	return (
		<Suspense>
			<MethodOverview id={decodeURIComponent(id)} />
		</Suspense>
	);
}
