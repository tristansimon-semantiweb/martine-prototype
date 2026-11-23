import { OverviewView } from "@/features/study/OverviewView";

export default async function Page({ params }: PageProps<"/studies/[id]">) {
	const { id } = await params;
	return <OverviewView id={decodeURIComponent(id)} />;
}
