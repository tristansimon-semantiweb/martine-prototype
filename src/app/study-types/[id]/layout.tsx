import { MethodFrame } from "@/features/methods/MethodFrame";
import { methodsIndex } from "@/shared/lib/data";

// Every study type is built ahead, so a click opens it at once.
export function generateStaticParams() {
	return methodsIndex.map((m) => ({ id: m.id }));
}

export default async function Layout({ children, params }: LayoutProps<"/study-types/[id]">) {
	const { id } = await params;
	return <MethodFrame id={decodeURIComponent(id)}>{children}</MethodFrame>;
}
