"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, MessageCircle } from "lucide-react";
import { useAskMartine } from "@/features/ask-martine/AskMartineProvider";
import { useHasNews } from "@/features/whats-new/seen";
import { cn } from "@/shared/lib/cn";

// What's new and Ask Martine, in the top band next to the account menu, on
// every page. Ask Martine opens the drawer (⌘K does too); it is hidden on the
// full Ask Martine page.
export function HeaderActions() {
	const pathname = usePathname();
	const { openChat, scope } = useAskMartine();
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
			{!pathname.startsWith("/ask") && (
				<button
					onClick={openChat}
					title={scope ? "Ask Martine about this study" : "Ask Martine about your studies"}
					className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border-hover)] px-3 text-sm font-semibold hover:bg-[var(--color-hover)]"
				>
					<MessageCircle size={15} aria-hidden className="text-[var(--color-accent)]" />
					<span className="hidden sm:inline">Ask Martine</span>
					<kbd className="hidden rounded-[var(--radius-sm)] border border-[var(--color-border)] px-1.5 py-px text-[10px] font-medium text-[var(--color-ink-muted)] md:inline">⌘K</kbd>
				</button>
			)}
		</div>
	);
}
