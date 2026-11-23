import { AccessView } from "@/features/access/AccessView";
import { safeNext } from "@/shared/lib/access";

export default async function Page({ searchParams }: PageProps<"/access">) {
	const { next } = await searchParams;
	return <AccessView next={safeNext(typeof next === "string" ? next : null)} />;
}
