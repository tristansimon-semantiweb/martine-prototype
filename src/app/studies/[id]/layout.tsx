import { StudyFrame } from "@/features/study/StudyFrame";
import { seedStudies } from "@/shared/lib/data";

// The demo's studies are built ahead, so a click opens them at once; a study
// created during the demo still renders on demand.
export function generateStaticParams() {
	return seedStudies.map((s) => ({ id: s.id }));
}

export default async function Layout({ children, params }: LayoutProps<"/studies/[id]">) {
	const { id } = await params;
	return <StudyFrame id={decodeURIComponent(id)}>{children}</StudyFrame>;
}
