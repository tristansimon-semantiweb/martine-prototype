"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useSidebar } from "@/shared/hooks/useSidebar";
import { useMartine } from "@/shared/hooks/useMartine";
import { FamilyDot } from "@/shared/components/ui/Family";

// Adapted from R&R's FilterRail: same structure (an 88 px logo band lined up
// with the page header, then the content), without the filters. Content per
// the brief: New study, search, the three sections, then recent studies.
const NAV = [
	{ href: "/", label: "Studies", match: (p: string) => p === "/" },
	{ href: "/study-types", label: "Study types", match: (p: string) => p.startsWith("/study-types") },
	{ href: "/tools", label: "Tools", match: (p: string) => p.startsWith("/tools") },
	{ href: "/skills", label: "Skills", match: (p: string) => p.startsWith("/skills") },
];

export function Sidebar() {
	const pathname = usePathname();
	const { mobileOpen, setMobileOpen } = useSidebar();
	const { studies, me } = useMartine();
	const [query, setQuery] = useState("");

	const recent = studies
		.filter((s) => s.status !== "delivered" && s.team.some((m) => m.person === me))
		.filter((s) => !query.trim() || `${s.title} ${s.client}`.toLowerCase().includes(query.trim().toLowerCase()));

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

				<div className="flex flex-col gap-2.5 border-b border-[var(--color-border)] px-3 py-3.5">
					<Link
						href="/studies/new"
						className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90"
					>
						New study
					</Link>
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						aria-label="Search studies"
						placeholder="Search studies"
						className="rr-input"
					/>
				</div>

				<nav aria-label="Sections" className="flex flex-col gap-0.5 overflow-y-auto p-3">
					{NAV.map((n) => (
						<Link key={n.href} href={n.href} className={item(n.match(pathname))} aria-current={n.match(pathname) ? "page" : undefined}>
							{n.label}
						</Link>
					))}
					<div className="px-2.5 pb-1.5 pt-3.5 text-xs font-bold text-[var(--color-ink-muted)]">Recent studies</div>
					{recent.map((s) => {
						const active = pathname.startsWith(`/studies/${s.id}`);
						return (
							<Link key={s.id} href={`/studies/${s.id}`} className={item(active)} aria-current={active ? "page" : undefined}>
								<FamilyDot family={s.family} />
								<span className="truncate">{s.short}</span>
							</Link>
						);
					})}
					{recent.length === 0 && <p className="px-2.5 py-2 text-sm text-[var(--color-ink-muted)]">No study matches.</p>}
				</nav>
			</aside>
		</>
	);
}
