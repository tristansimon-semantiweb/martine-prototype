"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FolderKanban, Layers, Puzzle, Wrench, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useSidebar } from "@/shared/hooks/useSidebar";
import { useMartine } from "@/shared/hooks/useMartine";
import { FamilyDot } from "@/shared/components/ui/Family";

// Adapted from R&R's FilterRail: same structure (an 88 px logo band lined up
// with the page header, then the content), without the filters. Content per
// the brief: Studies and the studies in progress, then the library. Search and New study are
// on the Studies page; What's new is in the top band, Ask Martine bottom right.
// The work comes first (Studies, then the studies in progress); below, the
// library the studies are run with (study types, tools, skills, documentation),
// quieter, under its own label.
const LIBRARY = [
	{ href: "/study-types", label: "Study types", icon: Layers, match: (p: string) => p.startsWith("/study-types") },
	{ href: "/tools", label: "Tools", icon: Wrench, match: (p: string) => p.startsWith("/tools") },
	{ href: "/skills", label: "Skills", icon: Puzzle, match: (p: string) => p.startsWith("/skills") },
	{ href: "/documentation", label: "Documentation", icon: BookOpen, match: (p: string) => p.startsWith("/documentation") },
];

export function Sidebar() {
	const pathname = usePathname();
	const { mobileOpen, setMobileOpen } = useSidebar();
	const { studies, me } = useMartine();

	const recent = studies.filter((s) => s.status !== "delivered" && s.team.some((m) => m.person === me));

	const item = (active: boolean) =>
		cn(
			"flex items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-colors",
			active
				? "bg-[var(--color-accent-dim)] font-semibold text-[var(--color-accent)]"
				: "text-[var(--color-ink)] hover:bg-[var(--color-hover)]",
		);

	return (
		<>
			{mobileOpen && (
				<div
					onClick={() => setMobileOpen(false)}
					className="fixed inset-0 bg-[var(--overlay-modal)] md:hidden"
					style={{ zIndex: "var(--z-overlay)" }}
					aria-hidden
				/>
			)}
			<aside
				aria-label="Studies"
				className={cn(
					"flex w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]",
					"fixed inset-y-0 left-0 transition-transform md:static md:translate-x-0",
					mobileOpen ? "translate-x-0" : "-translate-x-full",
				)}
				style={{ zIndex: "var(--z-sidebar)" }}
			>
				<div className="flex h-[var(--band-h)] shrink-0 items-center gap-2.5 border-b border-[var(--color-border)] px-[18px]">
					<span className="flex h-7 items-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] px-2.5 text-sm font-bold text-white">M</span>
					<span className="leading-tight">
						<span className="block text-[13px] font-semibold">Martine</span>
						<span className="block text-[11px] text-[var(--color-ink-muted)]">powered by Semantiweb</span>
					</span>
					<button
						onClick={() => setMobileOpen(false)}
						aria-label="Close the menu"
						className="ml-auto flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)] md:hidden"
					>
						<X size={18} />
					</button>
				</div>


				<nav aria-label="Sections" className="flex flex-col gap-0.5 overflow-y-auto p-3">
					<Link
						href="/"
						aria-current={pathname === "/" ? "page" : undefined}
						className={cn(
							"flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-[15px] font-semibold transition-colors",
							pathname === "/" ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "text-[var(--color-ink)] hover:bg-[var(--color-hover)]",
						)}
					>
						<FolderKanban size={17} aria-hidden className="text-[var(--color-accent)]" />
						<span className="flex-1">Studies</span>
						<span aria-hidden title="Studies in progress" className="text-[12px] font-normal text-[var(--color-ink-muted)]">{studies.filter((s) => s.status !== "delivered").length}</span>
					</Link>
					<div className="ml-[18px] flex flex-col gap-0.5 border-l border-[var(--color-border)] pl-2">
						{recent.map((s) => {
							const active = pathname.startsWith(`/studies/${s.id}`);
							return (
								<Link key={s.id} href={`/studies/${s.id}`} className={item(active)} aria-current={active ? "page" : undefined}>
									<FamilyDot family={s.family} />
									<span className="truncate">{s.short}</span>
								</Link>
							);
						})}
						{recent.length === 0 && <p className="m-0 px-2.5 py-1.5 text-[13px] text-[var(--color-ink-muted)]">No study in progress.</p>}
					</div>

					<div className="mx-2.5 mb-1 mt-4 border-t border-[var(--color-border)] pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Library</div>
					{LIBRARY.map((n) => {
						const active = n.match(pathname);
						const Icon = n.icon;
						return (
							<Link
								key={n.href}
								href={n.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-[13px] transition-colors",
									active ? "bg-[var(--color-accent-dim)] font-semibold text-[var(--color-accent)]" : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]",
								)}
							>
								<Icon size={15} aria-hidden className={active ? undefined : "text-[var(--color-ink-muted)]"} />
								{n.label}
							</Link>
						);
					})}
				</nav>
			</aside>
		</>
	);
}
