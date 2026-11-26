"use client";

import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { STAGE_LABEL, corporaLine, corpusStage } from "@/shared/lib/corpus";
import { cn } from "@/shared/lib/cn";
import type { Study } from "@/shared/lib/types";
import { OpenInExplorer } from "./OpenInExplorer";
import { STAGE_TONE } from "./CorpusView";
import { useCorporaClock } from "./useCorporaClock";

// On a phase that builds or reads the corpora (the method says which): each
// corpus and where it stands, and the way in: the Corpus tab to build them,
// the Explorer (its own application), opened for this phase, to read them.
export function CorpusStrip({ study, phase, phaseName, role }: { study: Study; phase: string; phaseName: string; role: "build" | "analyse" }) {
	const { corporaOf } = useMartine();
	const corpora = corporaOf(study.id);
	const now = useCorporaClock(corpora);
	const ready = corpora.some((c) => corpusStage(c, now) === "ready");

	return (
		<section aria-label="The study’s corpora" className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-dim)] px-6 py-4">
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-accent)]">
					<Database size={18} aria-hidden />
				</span>
				<span className="min-w-[220px] flex-1 text-[15px] font-semibold">{role === "build" ? "This phase builds the study’s corpora" : "This phase reads the corpora in the Explorer"}</span>
				{role === "analyse" && ready ? (
					<OpenInExplorer study={study} phase={phase} phaseName={phaseName} />
				) : (
					<Link
						href={`/studies/${study.id}/corpus`}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-[var(--radius)] px-3.5 py-2 text-sm font-semibold no-underline",
							role === "build" ? "bg-[var(--color-accent)] text-white hover:opacity-90" : "border border-[var(--color-border-hover)] bg-[var(--color-surface)] text-[var(--color-ink)]",
						)}
					>
						{role === "build" ? "Deposit the exports" : "See where they stand"} <ArrowRight size={14} aria-hidden />
					</Link>
				)}
			</div>
			<ul className="m-0 flex list-none flex-wrap gap-2 p-0 pl-[52px]">
				{corpora.map((c) => {
					const stage = corpusStage(c, now);
					return (
						<li key={c.id} className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-surface)] px-3 py-1.5 text-sm">
							{c.name}
							<span className={cn("rounded-[var(--radius-xl)] px-2 py-px text-[12px] font-semibold", STAGE_TONE[stage])}>{STAGE_LABEL[stage]}</span>
						</li>
					);
				})}
				{corpora.length === 0 && <li className="text-sm text-[var(--color-ink-secondary)]">No corpus yet.</li>}
			</ul>
		</section>
	);
}

// On the Overview: the study's corpora in a few words, with the way in.
export function CorpusSummary({ study, className }: { study: Study; className?: string }) {
	const { corporaOf } = useMartine();
	const corpora = corporaOf(study.id);
	const now = useCorporaClock(corpora);
	const ready = corpora.some((c) => corpusStage(c, now) === "ready");
	return (
		<section aria-labelledby="corpus-sum" className={cn("flex flex-wrap items-center gap-x-4 gap-y-1", className)}>
			<h2 id="corpus-sum" className="m-0 flex items-center gap-2 font-[family-name:var(--font-body)] text-[17px] font-semibold">
				<Database size={16} aria-hidden className="text-[var(--color-accent)]" /> Corpora
			</h2>
			<span className="flex-1 text-[15px] text-[var(--color-ink-secondary)]">{corporaLine(corpora, now)}</span>
			<Link href={`/studies/${study.id}/corpus`} className="inline-flex items-center gap-1 text-sm font-semibold">
				Open the corpora <ArrowRight size={14} aria-hidden />
			</Link>
			{ready && <OpenInExplorer study={study} variant="link" />}
		</section>
	);
}
