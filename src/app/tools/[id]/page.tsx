import { ToolDetailView } from "@/features/tools/ToolDetailView";

export default async function Page({ params }: PageProps<"/tools/[id]">) {
	const { id } = await params;
	return <ToolDetailView id={decodeURIComponent(id)} />;
}
