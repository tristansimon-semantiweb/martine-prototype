"use client";

import { useState } from "react";
import { ArrowUp } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";

// The input bubble of R&R's ChatDrawer, with the context row ported from
// ChatContextBar: it says what Martine is looking at.
export function ChatInput({ study, onSend }: { study: string | null; onSend: (q: string) => void }) {
	const [input, setInput] = useState("");
	const { studies } = useMartine();
	const current = study ? studies.find((s) => s.id === study) : null;

	const submit = () => {
		if (!input.trim()) return;
		onSend(input);
		setInput("");
	};

	return (
		<div>
			<div className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-accent)]/20">
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="inline-flex items-center gap-1 rounded-[var(--radius-xl)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-dim)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-accent)]">
						{current ? `This study: ${current.short}` : "All your studies"}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<textarea
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								submit();
							}
						}}
						rows={1}
						aria-label="Your question"
						placeholder={current ? "Ask anything about this study" : "Ask anything about your studies"}
						className="max-h-28 flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-[var(--color-ink-muted)]"
					/>
					<button
						onClick={submit}
						disabled={!input.trim()}
						className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-[var(--color-accent)] text-white transition-opacity hover:opacity-90 disabled:opacity-30"
						aria-label="Send"
					>
						<ArrowUp size={14} />
					</button>
				</div>
			</div>
			<p className="mt-1.5 text-center text-[11px] text-[var(--color-ink-muted)]">AI-generated and can be wrong. Check the cited sources.</p>
		</div>
	);
}
