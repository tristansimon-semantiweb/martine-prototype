"use client";

import Link from "next/link";
import { ArrowRight, Database, Loader2 } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { STAGE_LABEL, corpusFigures, corpusStage, fmt } from "@/shared/lib/corpus";
import { OpenInExplorer } from "./OpenInExplorer";
import { cn } from "@/shared/lib/cn";
import type { Study } from "@/shared/lib/types";
import { useNow } from "./useNow";

// On a phase that builds or reads the corpus (the method says which), where
// the corpus stands and the one way in: the Corpus tab to build it, the
// Explorer (its own application), opened for this phase, to read it. In place
// of an "Open tool" link.
export function CorpusStrip({ study, phase, phaseName, role }: { study: Study; phase: string; phaseName: string; role: "build" | "analyse" }) {
	const { corpusOf } = useMartine();
	const c = corpusOf(study.id);
	const now = useNow(Boolean(c.run && !c.checked));
	const { stage } = corpusStage(c, now);
	const ready = stage === "ready";
	const toExplore = role === "analyse" && ready;

	return (
		<section
			aria-label="The study’s corpus"
			className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-dim)] px-6 py-4"
		>
			<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-accent)]">
				{stage === "processing" ? <Loader2 size={18} aria-hidden className="animate-spin" /> : <Database size={18} aria-hidden />}
			</span>
			<span className="min-w-[220px] flex-1">
				<span className="block text-[15px] font-semibold">{role === "build" ? "This phase builds the study’s corpus" : "This phase reads the corpus in the Explorer"}</span>
				<span className="block text-sm text-[var(--color-ink-secondary)]">
					{STAGE_LABEL[stage]}
					{ready && `, ${fmt(corpusFigures(c).kept)} verbatims`}
					{role === "analyse" && !ready && ": it opens in the Explorer once processed and checked"}
				</span>
			</span>
			{toExplore ? (
				<OpenInExplorer study={study} phase={phase} phaseName={phaseName} />
			) : (
				<Link
					href={`/studies/${study.id}/corpus`}
					className={cn(
						"inline-flex items-center gap-1.5 rounded-[var(--radius)] px-3.5 py-2 text-sm font-semibold no-underline",
						role === "build" ? "bg-[var(--color-accent)] text-white hover:opacity-90" : "border border-[var(--color-border-hover)] bg-[var(--color-surface)] text-[var(--color-ink)]",
					)}
				>
					{role === "build" ? "Open the corpus" : "See where it stands"} <ArrowRight size={14} aria-hidden />
				</Link>
			)}
		</section>
	);
}

// On the Overview: where the study's corpus stands, in one line, with its way in.
export function CorpusSummary({ study, className }: { study: Study; className?: string }) {
	const { corpusOf } = useMartine();
	const c = corpusOf(study.id);
	const now = useNow(Boolean(c.run && !c.checked));
	const { stage } = corpusStage(c, now);
	const f = corpusFigures(c);
	const ready = stage === "ready";
	return (
		<section aria-labelledby="corpus-sum" className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
			<h2 id="corpus-sum" className="m-0 flex items-center gap-2 font-[family-name:var(--font-body)] text-[17px] font-semibold">
				<Database size={16} aria-hidden className="text-[var(--color-accent)]" /> Corpus
			</h2>
			<span className="flex-1 text-[15px] text-[var(--color-ink-secondary)]">
				{STAGE_LABEL[stage]}
				{ready ? `, ${fmt(f.kept)} verbatims` : f.received ? `, ${fmt(f.received)} rows in` : ""}
			</span>
			{ready ? (
				<OpenInExplorer study={study} variant="link" />
			) : (
				<Link href={`/studies/${study.id}/corpus`} className="inline-flex items-center gap-1 text-sm font-semibold">
					Open the corpus <ArrowRight size={14} aria-hidden />
				</Link>
			)}
		</section>
	);
}
