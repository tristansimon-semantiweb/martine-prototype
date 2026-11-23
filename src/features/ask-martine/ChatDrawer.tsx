"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Maximize2, MessageCircle, Plus, X } from "lucide-react";
import { Portal } from "@/shared/components/ui/Portal";
import { useAskMartine, suggestionsFor } from "./AskMartineProvider";
import { EmptyState, TurnBlock } from "./components/ChatThread";
import { ChatInput } from "./components/ChatInput";

// Ported from R&R's ChatDrawer: 460 px, cream background, header with new
// conversation, full page and close. Centred on the study from a study page,
// on all studies elsewhere.
export function ChatDrawer() {
	const pathname = usePathname();
	const router = useRouter();
	const { open, closeChat, scope, turns, ask, newConversation } = useAskMartine();
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [turns.length]);

	// The full page already hosts the conversation.
	if (pathname.startsWith("/ask")) return null;

	return (
		<Portal>
			<div
				onClick={closeChat}
				className={`fixed inset-0 bg-black/20 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
				style={{ zIndex: "var(--z-modal-overlay)" }}
				aria-hidden
			/>
			<aside
				aria-label="Ask Martine"
				aria-hidden={!open}
				inert={!open}
				className={`fixed right-0 top-0 flex h-screen w-full max-w-[460px] flex-col border-l border-[var(--color-border)] bg-[var(--color-canvas)] shadow-[var(--shadow-xl)] transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
				style={{ zIndex: "var(--z-modal)" }}
			>
				<header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
					<div className="flex items-center gap-2">
						<span className="flex h-7 w-7 items-center justify-center rounded-[var(--radius)] bg-[var(--color-accent)]/10">
							<MessageCircle size={15} className="text-[var(--color-accent)]" />
						</span>
						<span className="text-sm font-semibold text-[var(--color-ink)]">Ask Martine</span>
					</div>
					<div className="flex items-center gap-1">
						<button
							onClick={() => newConversation()}
							className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]"
							aria-label="New conversation"
							title="New conversation"
						>
							<Plus size={15} />
						</button>
						<button
							onClick={() => {
								closeChat();
								router.push(scope ? `/ask?study=${scope}` : "/ask");
							}}
							className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]"
							aria-label="Open full page"
							title="Open full page"
						>
							<Maximize2 size={14} />
						</button>
						<button
							onClick={closeChat}
							className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]"
							aria-label="Close"
						>
							<X size={16} />
						</button>
					</div>
				</header>

				<div className="flex-1 overflow-y-auto px-4 py-4">
					{turns.length === 0 ? (
						<EmptyState study={scope} suggestions={suggestionsFor(scope)} onPick={(q) => ask(q)} />
					) : (
						<div className="flex flex-col gap-5">
							{turns.map((t) => (
								<TurnBlock key={t.id} turn={t} study={scope} onNavigate={closeChat} />
							))}
							{suggestionsFor(scope)
								.filter((s) => !turns.some((t) => t.question === s.question))
								.slice(0, 2)
								.map((s) => (
									<button
										key={s.id}
										onClick={() => ask(s.question)}
										className="self-start rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-ink-secondary)] hover:border-[var(--color-border-hover)]"
									>
										{s.question}
									</button>
								))}
							<div ref={bottomRef} />
						</div>
					)}
				</div>

				<div className="border-t border-[var(--color-border)] px-3 py-3">
					<ChatInput study={scope} onSend={(q) => ask(q)} />
				</div>
			</aside>
		</Portal>
	);
}
