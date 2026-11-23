"use client";

import Link from "next/link";
import { FileText, MessageCircle } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";
import { Markdown } from "./Markdown";
import type { Turn } from "../AskMartineProvider";
import type { AskScript } from "@/shared/lib/types";

// Ported from R&R's ChatThread. Martine's answers always come with their
// sources, as clickable chips under the answer.
export function TurnBlock({ turn, study, onNavigate }: { turn: Turn; study: string | null; onNavigate?: () => void }) {
	return (
		<div className="flex flex-col gap-3">
			<div className="self-end rounded-[var(--radius-lg)] rounded-br-sm bg-[var(--color-accent)] px-4 py-2.5 text-sm text-white">
				{turn.question}
			</div>

			{turn.thinking ? (
				<div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-xs)]">
					<Badge tone="accent">AI</Badge>
					<span className="flex items-center gap-1">
						<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-muted)] [animation-delay:-0.3s]" />
						<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-muted)] [animation-delay:-0.15s]" />
						<span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-ink-muted)]" />
					</span>
					<span className="text-[11px] text-[var(--color-ink-muted)]">{study ? "Reading the study…" : "Reading your studies…"}</span>
				</div>
			) : turn.script ? (
				<div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-xs)]">
					<div className="mb-2 flex items-center gap-2">
						<Badge tone="accent">AI</Badge>
						<span className="text-[11px] text-[var(--color-ink-muted)]">AI-generated</span>
					</div>
					<Markdown source={turn.script.answer} />
					<div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--color-border)] pt-3" aria-label="Sources">
						{turn.script.sources.map((s) => (
							<Link
								key={s.label}
								href={s.href.replace("{study}", study ?? "")}
								onClick={onNavigate}
								className="inline-flex items-center gap-1.5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] hover:border-[var(--color-border-hover)]"
							>
								<FileText size={12} aria-hidden /> {s.label}
							</Link>
						))}
					</div>
				</div>
			) : (
				<div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] px-5 py-4 text-sm text-[var(--color-ink-muted)]">
					I don’t have a scripted answer for that one yet. Try one of the suggested questions: this prototype answers a fixed set of them.
				</div>
			)}
		</div>
	);
}

export function EmptyState({ study, suggestions, onPick }: { study: string | null; suggestions: AskScript[]; onPick: (q: string) => void }) {
	return (
		<div className="pt-6">
			<div className="mb-6">
				<h1 className="font-[family-name:var(--font-heading)] text-[28px] font-normal leading-tight tracking-[-0.01em] text-[var(--color-ink)]">
					{study ? "Ask anything about this study" : "Ask anything about your studies"}
				</h1>
				<p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
					Martine answers from the study’s brief, decisions, notes and files, and cites them.
				</p>
			</div>
			{suggestions.length > 0 ? (
				<div className="flex flex-col gap-2">
					{suggestions.map((s) => (
						<button
							key={s.id}
							onClick={() => onPick(s.question)}
							className="flex items-center gap-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left text-sm text-[var(--color-ink-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-hover)]"
						>
							<MessageCircle size={14} className="shrink-0 text-[var(--color-accent)]" />
							{s.question}
						</button>
					))}
				</div>
			) : (
				<p className="text-sm text-[var(--color-ink-muted)]">No scripted questions for this study in the prototype.</p>
			)}
		</div>
	);
}
