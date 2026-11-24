import { ToolDetailView } from "@/features/tools/ToolDetailView";
import { catalog } from "@/shared/lib/data";

// Every tool page is built ahead, so a click opens it at once.
export function generateStaticParams() {
	return catalog.tools.map((t) => ({ id: t.id }));
}

export default async function Page({ params }: PageProps<"/tools/[id]">) {
	const { id } = await params;
	return <ToolDetailView id={decodeURIComponent(id)} />;
}
