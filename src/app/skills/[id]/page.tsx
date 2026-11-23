import { SkillDetailView } from "@/features/skills/SkillDetailView";

export default async function Page({ params }: PageProps<"/skills/[id]">) {
	const { id } = await params;
	return <SkillDetailView id={decodeURIComponent(id)} />;
}
