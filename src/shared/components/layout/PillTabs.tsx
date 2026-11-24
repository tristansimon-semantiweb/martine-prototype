"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";

// Adapted from R&R's FeatureTabs: the same pill tab bar on the surface band,
// rounded active pill. Martine's study tabs are fixed (Overview, Steps, Team,
// Files), so there is no "New" button; the right edge holds a quiet link.
export function PillTabs({
	label,
	items,
	aside,
}: {
	label: string;
	items: { href: string; label: string }[];
	aside?: React.ReactNode;
}) {
	const pathname = usePathname();
	return (
		<div className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
			<nav
				aria-label={label}
				className="mx-auto flex min-h-[calc(var(--band-h)/2)] max-w-[1240px] flex-wrap items-center gap-1 px-6 py-1.5"
			>
				{items.map((i) => {
					const active = i.href === pathname;
					return (
						<Link
							key={i.href}
							href={i.href}
							aria-current={active ? "page" : undefined}
							className={cn(
								"flex shrink-0 items-center whitespace-nowrap rounded-[var(--radius-sm)] px-3 py-1 text-[15px] font-semibold transition-colors",
								active
									? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]"
									: "text-[var(--color-ink)] hover:bg-[var(--color-hover)] hover:text-[var(--color-accent)]",
							)}
						>
							{i.label}
						</Link>
					);
				})}
				{aside && <div className="ml-auto text-sm text-[var(--color-ink-muted)]">{aside}</div>}
			</nav>
		</div>
	);
}
