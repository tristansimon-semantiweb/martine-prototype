import { SkillDetailView } from "@/features/skills/SkillDetailView";
import { catalog } from "@/shared/lib/data";

// The catalog's skill pages are built ahead; a requested skill renders on demand.
export function generateStaticParams() {
	return catalog.skills.map((s) => ({ id: s.id }));
}

export default async function Page({ params }: PageProps<"/skills/[id]">) {
	const { id } = await params;
	return <SkillDetailView id={decodeURIComponent(id)} />;
}
