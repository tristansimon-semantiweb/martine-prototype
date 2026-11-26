import { CorpusView } from "@/features/corpus/CorpusView";

export default async function Page({ params }: PageProps<"/studies/[id]/corpus">) {
	const { id } = await params;
	return <CorpusView id={decodeURIComponent(id)} />;
}
