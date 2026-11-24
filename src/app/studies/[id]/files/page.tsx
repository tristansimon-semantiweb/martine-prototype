import { Suspense } from "react";
import { FilesView } from "@/features/study/FilesView";

// FilesView reads ?folder= and ?file= (a document pointed at from a task), hence the Suspense boundary.
export default async function Page({ params }: PageProps<"/studies/[id]/files">) {
	const { id } = await params;
	return (
		<Suspense>
			<FilesView id={decodeURIComponent(id)} />
		</Suspense>
	);
}
