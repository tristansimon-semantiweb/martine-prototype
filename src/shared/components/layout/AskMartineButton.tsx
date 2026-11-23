"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAskMartine } from "@/features/ask-martine/AskMartineProvider";

// Ported from R&R's GlobalAiBar: one launcher, bottom right, that opens the
// drawer directly. Hidden on the full Ask Martine page and while the drawer is
// open; sits under the phase and catalog drawers (z 40 < 50).
export function AskMartineButton() {
	const pathname = usePathname();
	const { openChat, open, scope } = useAskMartine();

	if (pathname.startsWith("/ask")) return null;
	if (open) return null;

	return (
		<button
			onClick={openChat}
			className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-lg)] transition-opacity hover:opacity-90"
			title={scope ? "Ask Martine about this study" : "Ask Martine about your studies"}
		>
			<MessageCircle size={17} aria-hidden />
			<span className="hidden sm:inline">Ask Martine</span>
			<kbd className="hidden items-center rounded-[var(--radius-sm)] border border-white/30 bg-white/15 px-1.5 py-0.5 text-[10px] font-medium text-white/90 md:flex">
				⌘K
			</kbd>
		</button>
	);
}
