import { Suspense } from "react";
import { MethodView } from "@/features/methods/MethodView";

// The view reads ?phase=, ?task= and ?add= (open phase, task, catalog), hence the Suspense boundary.
export default async function Page({ params }: PageProps<"/study-types/[id]/method">) {
	const { id } = await params;
	return (
		<Suspense>
			<MethodView id={decodeURIComponent(id)} />
		</Suspense>
	);
}
