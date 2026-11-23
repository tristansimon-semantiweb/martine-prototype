import { Suspense } from "react";
import { MethodDetailView } from "@/features/methods/MethodDetailView";

// The view reads ?phase= and ?add= (open phase, catalog), hence the Suspense boundary.
export default async function Page({ params }: PageProps<"/study-types/[id]">) {
	const { id } = await params;
	return (
		<Suspense>
			<MethodDetailView id={decodeURIComponent(id)} />
		</Suspense>
	);
}
