"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FolderKanban, Layers, Puzzle, Wrench, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useSidebar } from "@/shared/hooks/useSidebar";

// Adapted from R&R's FilterRail: same structure (an 88 px logo band lined up
// with the page header, then the content), without the filters. The work
// comes first (Studies, lit on any study); below, quieter, each under its
// label: the methodology (the study types, how a study is run), then the
// library it is run with. Search, Mine and New study are on the Studies page;
// What's new is in the top band, Ask Martine bottom right.
const GROUPS = [
	{ label: "Methodology", items: [{ href: "/study-types", label: "Study types", icon: Layers }] },
	{
		label: "Library",
		items: [
			{ href: "/tools", label: "Tools", icon: Wrench },
			{ href: "/skills", label: "Skills", icon: Puzzle },
			{ href: "/documentation", label: "Documentation", icon: BookOpen },
		],
	},
];

export function Sidebar() {
	const pathname = usePathname();
	const { mobileOpen, setMobileOpen } = useSidebar();
	const onStudies = pathname === "/" || pathname.startsWith("/studies");

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
							onStudies ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "text-[var(--color-ink)] hover:bg-[var(--color-hover)]",
						)}
					>
						<FolderKanban size={17} aria-hidden className="text-[var(--color-accent)]" />
						Studies
					</Link>
					{GROUPS.map((g) => (
						<div key={g.label} role="group" aria-labelledby={`nav-${g.label}`} className="flex flex-col gap-0.5">
							<div id={`nav-${g.label}`} className="mx-2.5 mb-1 mt-4 border-t border-[var(--color-border)] pt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
								{g.label}
							</div>
							{g.items.map((n) => {
								const active = pathname.startsWith(n.href);
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
						</div>
					))}
				</nav>
			</aside>
		</>
	);
}
