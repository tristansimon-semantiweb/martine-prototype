import { MethodFrame } from "@/features/methods/MethodFrame";

export default async function Layout({ children, params }: LayoutProps<"/study-types/[id]">) {
	const { id } = await params;
	return <MethodFrame id={decodeURIComponent(id)}>{children}</MethodFrame>;
}
