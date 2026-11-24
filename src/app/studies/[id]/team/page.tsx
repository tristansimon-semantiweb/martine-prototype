import { TeamView } from "@/features/study/TeamView";

export default async function Page({ params }: PageProps<"/studies/[id]/team">) {
	const { id } = await params;
	return <TeamView id={decodeURIComponent(id)} />;
}
