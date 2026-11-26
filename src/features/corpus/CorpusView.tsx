"use client";

import { useRef, useState } from "react";
import { ExternalLink, FileUp, Loader2 } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { AddRow, InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { personById } from "@/shared/lib/data";
import { dueDate } from "@/shared/lib/format";
import { depositUrl } from "@/shared/lib/martineContext";
import { STAGE_LABEL, corpusRows, corpusStage, fmt, processing, type CorpusStage } from "@/shared/lib/corpus";
import { cn } from "@/shared/lib/cn";
import type { Corpus, Study } from "@/shared/lib/types";
import { useCorporaClock } from "./useCorporaClock";
import { OpenInExplorer } from "./OpenInExplorer";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";
const first = (id: string) => personById(id)?.name.split(" ")[0];

export const STAGE_TONE: Record<CorpusStage, string> = {
	empty: "bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]",
	processing: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
	ready: "bg-[var(--color-positive-bg)] text-[var(--color-positive)]",
};

// The study's corpora: one card each. Deposit the exports, each accepted or
// refused with its reason; the processing starts on its own; once ready, the
// corpus opens in the Explorer, its own application.
export function CorpusView({ id }: { id: string }) {
	const { studies, corporaOf, addCorpus } = useMartine();
	const study = studies.find((s) => s.id === id);
	const corpora = corporaOf(id);
	const now = useCorporaClock(corpora);
	if (!study) return null;

	return (
		<div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-7">
			<p className="m-0 text-[15px] text-[var(--color-ink-secondary)]">
				Deposit the exports of each corpus. The data platform reads each file against its source’s format, then processes the corpus ({processing.does}). Once ready, it opens in the Explorer. Or{" "}
				<a href={depositUrl(study)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold">
					deposit from Claude <ExternalLink size={12} aria-hidden />
				</a>
				.
			</p>
			{corpora.map((c) => (
				<CorpusCard key={c.id} study={study} c={c} stage={corpusStage(c, now)} />
			))}
			<AddRow label="Add a corpus" placeholder="e.g. Competitor corpus, Reviews" onAdd={(v) => addCorpus(study.id, v)} />
		</div>
	);
}

function CorpusCard({ study, c, stage }: { study: Study; c: Corpus; stage: CorpusStage }) {
	const { deposit, removeCorpusFile, renameCorpus } = useMartine();
	const toast = useToast();
	const input = useRef<HTMLInputElement>(null);
	const [source, setSource] = useState(processing.sources[0]);
	const [over, setOver] = useState(false);
	const take = (list: FileList | null) => {
		if (!list?.length) return;
		const added = deposit(
			study.id,
			c.id,
			[...list].map((f) => ({ name: f.name, size: f.size, source })),
		);
		const refused = added.filter((f) => !f.accepted).length;
		toast(refused ? `${added.length - refused} accepted, ${refused} not accepted: see why in the list` : `${added.length} accepted: processing`);
	};

	return (
		<section aria-label={c.name} className={`${card} flex flex-col gap-3 px-6 py-5`}>
			<div className="flex flex-wrap items-center gap-3">
				<div className="min-w-[200px] flex-1 text-[18px] font-semibold">
					<InlineEdit value={c.name} onSave={(v) => v && renameCorpus(study.id, c.id, v)} canEdit label="the corpus name" placeholder="Name the corpus" />
				</div>
				<span className={cn("inline-flex items-center gap-1.5 rounded-[var(--radius-xl)] px-2.5 py-0.5 text-[13px] font-semibold", STAGE_TONE[stage])}>
					{stage === "processing" && <Loader2 size={12} aria-hidden className="animate-spin" />}
					{STAGE_LABEL[stage]}
				</span>
				{stage !== "empty" && <span className="text-sm text-[var(--color-ink-muted)]">{fmt(corpusRows(c))} rows</span>}
				{stage === "ready" && <OpenInExplorer study={study} corpus={c.name} />}
			</div>

			<div
				onDragOver={(e) => {
					e.preventDefault();
					setOver(true);
				}}
				onDragLeave={() => setOver(false)}
				onDrop={(e) => {
					e.preventDefault();
					setOver(false);
					take(e.dataTransfer.files);
				}}
				className={cn("flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-dashed px-4 py-3", over ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)]" : "border-[var(--color-border-active)]")}
			>
				<FileUp size={18} aria-hidden className="text-[var(--color-ink-muted)]" />
				<span className="flex-1 text-sm text-[var(--color-ink-secondary)]">Drop exports here, or</span>
				<label className="flex items-center gap-2 text-sm">
					<span className="text-[var(--color-ink-muted)]">Exported from</span>
					<select value={source} onChange={(e) => setSource(e.target.value)} className="rr-input w-auto py-1.5">
						{[...processing.sources, "Other"].map((s) => (
							<option key={s}>{s}</option>
						))}
					</select>
				</label>
				<button onClick={() => input.current?.click()} className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-semibold hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
					Choose files
				</button>
				<input
					ref={input}
					type="file"
					multiple
					hidden
					aria-label={`Files for ${c.name}`}
					onChange={(e) => {
						take(e.target.files);
						e.target.value = "";
					}}
				/>
			</div>

			{c.files.length > 0 && (
				<ul className="m-0 flex list-none flex-col p-0">
					{c.files.map((f) => (
						<li key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--color-border)] py-2.5">
							<span className="min-w-[240px] flex-1">
								<span className="block text-[15px] font-semibold">{f.name}</span>
								<span className="block text-[13px] text-[var(--color-ink-muted)]">
									{f.source}, {dueDate(f.added)}, by {first(f.by)}
									{f.accepted && `, ${fmt(f.rows)} rows`}
								</span>
								{!f.accepted && <span className="block text-[13px] text-[var(--color-attention)]">{f.reason}</span>}
							</span>
							<span
								className={cn(
									"rounded-[var(--radius-xl)] px-2.5 py-0.5 text-[13px] font-semibold",
									f.accepted ? "bg-[var(--color-positive-bg)] text-[var(--color-positive)]" : "bg-[var(--color-attention-bg)] text-[var(--color-attention)]",
								)}
							>
								{f.accepted ? "Accepted" : "Format not accepted"}
							</span>
							<RemoveButton
								label={`Remove ${f.name}`}
								onClick={() => {
									removeCorpusFile(study.id, c.id, f.id);
									toast(`${f.name} removed from ${c.name}`);
								}}
							/>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
