import { FilesView } from "@/features/study/FilesView";

export default async function Page({ params }: PageProps<"/studies/[id]/files">) {
	const { id } = await params;
	return <FilesView id={decodeURIComponent(id)} />;
}
