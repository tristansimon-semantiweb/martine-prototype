import { StudyFrame } from "@/features/study/StudyFrame";

export default async function Layout({ children, params }: LayoutProps<"/studies/[id]">) {
	const { id } = await params;
	return <StudyFrame id={decodeURIComponent(id)}>{children}</StudyFrame>;
}
