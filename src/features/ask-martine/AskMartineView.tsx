"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { TopBand } from "@/shared/components/layout/TopBand";
import { useMartine } from "@/shared/hooks/useMartine";
import { useAskMartine, suggestionsFor } from "./AskMartineProvider";
import { EmptyState, TurnBlock } from "./components/ChatThread";
import { ChatInput } from "./components/ChatInput";

// The drawer's conversation on a full page (R&R's Ask AI page, without the
// history sidebar). ?study= keeps the study the drawer was centred on.
export function AskMartineView() {
	const params = useSearchParams();
	const { studies } = useMartine();
	const { turnsFor, ask, newConversation } = useAskMartine();
	const requested = params.get("study");
	const study = requested && studies.some((s) => s.id === requested) ? requested : null;
	const current = studies.find((s) => s.id === study);
	const turns = turnsFor(study);
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [turns.length]);

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Ask Martine</div>
				<div className="text-sm text-[var(--color-ink-muted)]">
					{current ? (
						<>
							About <Link href={`/studies/${current.id}`}>{current.title}</Link>
						</>
					) : (
						"About all your studies"
					)}
				</div>
			</TopBand>
			<div className="mx-auto flex max-w-[720px] flex-col gap-5 px-6 py-6">
				{turns.length > 0 && (
					<button
						onClick={() => newConversation(study)}
						className="inline-flex items-center gap-1.5 self-end rounded-[var(--radius)] px-3 py-1.5 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]"
					>
						<Plus size={14} aria-hidden /> New conversation
					</button>
				)}
				{turns.length === 0 ? (
					<EmptyState study={study} suggestions={suggestionsFor(study)} onPick={(q) => ask(q, study)} />
				) : (
					turns.map((t) => <TurnBlock key={t.id} turn={t} study={study} />)
				)}
				<div ref={bottomRef} />
				<div className="sticky bottom-4">
					<ChatInput study={study} onSend={(q) => ask(q, study)} />
				</div>
			</div>
		</>
	);
}
