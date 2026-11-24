"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, MessageCircle } from "lucide-react";
import { useAskMartine } from "@/features/ask-martine/AskMartineProvider";
import { useHasNews } from "@/features/whats-new/seen";
import { cn } from "@/shared/lib/cn";

// What's new, in the top band next to the account menu, on every page.
export function HeaderActions() {
	const pathname = usePathname();
	const hasNews = useHasNews();
	const onNews = pathname === "/whats-new";

	return (
		<div className="flex shrink-0 items-center gap-1.5">
			<Link
				href="/whats-new"
				aria-current={onNews ? "page" : undefined}
				className={cn(
					"relative inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] px-3 text-sm font-semibold no-underline",
					onNews ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "text-[var(--color-ink)] hover:bg-[var(--color-hover)]",
				)}
			>
				<Megaphone size={15} aria-hidden className="text-[var(--color-accent)]" />
				<span className="hidden sm:inline">What’s new</span>
				{hasNews && !onNews && <span aria-label="new" className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />}
			</Link>
		</div>
	);
}

// Ported from R&R's GlobalAiBar: one launcher, bottom right, that opens the
// drawer directly. Quiet (white, thin border) so it never competes with a
// page's own actions. Hidden on the full Ask Martine page and while the drawer is
// open; sits under the phase and catalog drawers (z 40 < 50).
export function AskMartineButton() {
	const pathname = usePathname();
	const { openChat, open, scope } = useAskMartine();

	if (pathname.startsWith("/ask")) return null;
	if (open) return null;

	return (
		<button
			onClick={openChat}
			className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] shadow-[var(--shadow-md)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
			title={scope ? "Ask Martine about this study" : "Ask Martine about your studies"}
		>
			<MessageCircle size={16} aria-hidden className="text-[var(--color-accent)]" />
			<span className="hidden sm:inline">Ask Martine</span>
			<kbd className="hidden items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-ink-muted)] md:flex">
				⌘K
			</kbd>
		</button>
	);
}
