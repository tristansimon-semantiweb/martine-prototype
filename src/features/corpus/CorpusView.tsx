"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, FileUp, Loader2, X } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { Modal } from "@/shared/components/ui/Modal";
import { AddRow, InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { personById } from "@/shared/lib/data";
import { dueDate } from "@/shared/lib/format";
import { depositUrl } from "@/shared/lib/martineContext";
import { STAGES, corpusFigures, corpusStage, fmt, launchQuote, processing, toCheck, type CorpusStage, type Verbatim } from "@/shared/lib/corpus";
import { cn } from "@/shared/lib/cn";
import type { CorpusState, Study } from "@/shared/lib/types";
import { useNow } from "./useNow";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";
const h2 = "m-0 font-[family-name:var(--font-body)] text-[17px] font-semibold";
const first = (id?: string) => (id ? personById(id)?.name.split(" ")[0] : undefined);

// The study's corpus, in the order the work goes: the scope the relevance
// filter works from, the exports deposited, the processing (it takes time:
// the analyst works on other phases meanwhile), the check of what was removed
// and detected, then the Explorer. The data platform does the work; this page
// shows where it stands.
export function CorpusView({ id }: { id: string }) {
	const { studies, corpusOf } = useMartine();
	const study = studies.find((s) => s.id === id);
	const c = corpusOf(id);
	const live = Boolean(c.run && !c.checked);
	const now = useNow(live);
	if (!study) return null;
	const { stage, step } = corpusStage(c, now);

	return (
		<div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-6 py-7">
			<StageCard study={study} c={c} stage={stage} step={step} />
			{c.ready ? (
				<p className={`${card} m-0 px-6 py-4 text-sm text-[var(--color-ink-secondary)]`}>
					Delivered before Martine: its files, scope and check stay in the data platform. The figures above are the corpus as it was delivered.
				</p>
			) : (
				<>
					<Scope study={study} c={c} />
					<Files study={study} c={c} />
					{(stage === "to_check" || stage === "ready") && <ToCheck study={study} stage={stage} />}
				</>
			)}
		</div>
	);
}

function StageCard({ study, c, stage, step }: { study: Study; c: CorpusState; stage: CorpusStage; step: number }) {
	const { launchCorpus, checkCorpus } = useMartine();
	const toast = useToast();
	const [quote, setQuote] = useState(false);
	const f = corpusFigures(c);
	const q = launchQuote(c);
	const unprocessed = c.run ? c.files.filter((x) => x.accepted && !x.processed).length : 0;
	const at = STAGES.findIndex((s) => s.id === stage);
	const blocked = !c.target?.confirmedBy ? "Confirm the scope first: the relevance filter works from it." : stage === "empty" ? "Deposit at least one export first." : null;

	return (
		<section aria-labelledby="corpus-h" className={`${card} flex flex-col gap-5 px-6 py-5`}>
			<div className="flex flex-wrap items-start gap-4">
				<div className="min-w-0 flex-1">
					<div className="text-sm text-[var(--color-ink-muted)]">Processed by the data platform, read in the Explorer</div>
					<h2 id="corpus-h" className="m-0 mt-0.5 font-[family-name:var(--font-heading)] text-[26px] font-medium leading-tight">
						The study’s corpus
					</h2>
				</div>
				{(stage === "files" || stage === "empty") && (
					<button
						onClick={() => (blocked ? toast(blocked) : setQuote(true))}
						aria-disabled={Boolean(blocked)}
						title={blocked ?? undefined}
						className={cn("rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90", blocked && "opacity-40")}
					>
						Process the corpus
					</button>
				)}
				{stage === "to_check" && (
					<button
						onClick={() => {
							checkCorpus(study.id);
							toast("Corpus checked: it is ready in the Explorer");
						}}
						className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
					>
						<Check size={15} aria-hidden /> Corpus checked
					</button>
				)}
				{stage === "ready" && (
					<Link
						href={`/studies/${study.id}/explore`}
						className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white no-underline hover:opacity-90"
					>
						Open in Explore <ArrowRight size={15} aria-hidden />
					</Link>
				)}
			</div>

			{/* Where it stands: four stages, the current one lit. */}
			<ol aria-label="Where the corpus stands" className="m-0 grid list-none gap-2 p-0 sm:grid-cols-4">
				{STAGES.map((s, i) => {
					const done = i < at;
					const current = i === at;
					return (
						<li
							key={s.id}
							aria-current={current ? "step" : undefined}
							className={cn(
								"flex items-center gap-2 rounded-[var(--radius)] border px-3 py-2 text-sm",
								current ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] font-semibold text-[var(--color-accent)]" : "border-[var(--color-border)]",
								done && "text-[var(--color-positive)]",
								!done && !current && "text-[var(--color-ink-muted)]",
							)}
						>
							{done ? <Check size={14} aria-hidden /> : current && s.id === "processing" ? <Loader2 size={14} aria-hidden className="animate-spin" /> : <span aria-hidden className="w-3.5 text-center text-[12px]">{i + 1}</span>}
							{s.label}
						</li>
					);
				})}
			</ol>

			{stage === "empty" && <p className="m-0 text-[15px] text-[var(--color-ink-secondary)]">No export yet. Confirm the scope and deposit the study’s exports below; the data platform reads each one against its source’s format.</p>}
			{stage === "files" && (
				<p className="m-0 text-[15px] text-[var(--color-ink-secondary)]">
					{fmt(f.received)} rows in {c.files.filter((x) => x.accepted).length} accepted files. Processing takes {processing.duration.replace(/,.*/, "")}: the phases that do not need the corpus go on meanwhile.
				</p>
			)}
			{stage === "processing" && (
				<div className="flex flex-col gap-2">
					<ol className="m-0 flex list-none flex-col gap-1.5 p-0 text-[15px]">
						{processing.steps.map((label, i) => (
							<li key={label} className={cn("flex items-center gap-2", i > step && "text-[var(--color-ink-muted)]")}>
								{i < step ? (
									<Check size={15} aria-hidden className="text-[var(--color-positive)]" />
								) : i === step ? (
									<Loader2 size={15} aria-hidden className="animate-spin text-[var(--color-accent)]" />
								) : (
									<span aria-hidden className="w-[15px]" />
								)}
								{label}
							</li>
						))}
					</ol>
					<p className="m-0 text-sm text-[var(--color-ink-muted)]">
						In the real product: {processing.duration}; a few seconds in the prototype. {first(c.run?.by)} is told here and on Slack when it is ready to check.
					</p>
				</div>
			)}
			{(stage === "to_check" || stage === "ready") && <Figures c={c} />}
			{stage === "ready" && unprocessed > 0 && (
				<div className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] bg-[var(--color-attention-bg)] px-4 py-2.5 text-sm text-[var(--color-attention)]">
					<span className="flex-1">
						{unprocessed} new {unprocessed === 1 ? "file is" : "files are"} not in the corpus yet.
					</span>
					<button onClick={() => setQuote(true)} className="font-semibold underline">
						Process again
					</button>
				</div>
			)}

			<Modal open={quote} onClose={() => setQuote(false)} title="Process the corpus">
				<div className="flex flex-col gap-3 text-sm">
					<dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
						<dt className="text-[var(--color-ink-muted)]">Rows</dt>
						<dd className="m-0">{fmt(q.records)}</dd>
						<dt className="text-[var(--color-ink-muted)]">Estimated cost</dt>
						<dd className="m-0">
							about {q.costUsd} USD, under the {q.ceilingUsd} USD ceiling
						</dd>
						<dt className="text-[var(--color-ink-muted)]">Duration</dt>
						<dd className="m-0">{q.duration}</dd>
						<dt className="text-[var(--color-ink-muted)]">Steps</dt>
						<dd className="m-0">{processing.steps.join(", ")}</dd>
					</dl>
					<p className="m-0 text-[var(--color-ink-muted)]">Illustrative figures for the prototype: the data platform gives the real ones before anything starts.</p>
					<button
						onClick={() => {
							launchCorpus(study.id);
							setQuote(false);
							toast("Processing launched: you can work on other phases meanwhile");
						}}
						className="self-start rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white"
					>
						Launch the processing
					</button>
				</div>
			</Modal>
		</section>
	);
}

function Figures({ c }: { c: CorpusState }) {
	const f = corpusFigures(c);
	const cells = [
		{ label: "Received", value: fmt(f.received) },
		{ label: "Duplicates removed", value: fmt(f.duplicates) },
		{ label: "Off topic removed", value: fmt(f.offTopic) },
		{ label: "Kept", value: fmt(f.kept), strong: true },
	];
	return (
		<div className="flex flex-col gap-2">
			<dl className="m-0 grid grid-cols-2 rounded-[var(--radius-md)] border border-[var(--color-border)] sm:grid-cols-4 sm:divide-x sm:divide-[var(--color-border)]">
				{cells.map((x) => (
					<div key={x.label} className="px-4 py-3">
						<dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">{x.label}</dt>
						<dd className={cn("m-0 mt-1 text-[20px]", x.strong && "font-semibold text-[var(--color-accent)]")}>{x.value}</dd>
					</div>
				))}
			</dl>
			{f.period && (
				<p className="m-0 text-sm text-[var(--color-ink-muted)]">
					{f.period}, in {f.languages.join(" and ")}.
				</p>
			)}
		</div>
	);
}

// The scope the relevance filter works from: the study's scope, and what it
// leaves out. Nothing is filtered as off topic until the analyst confirms it.
function Scope({ study, c }: { study: Study; c: CorpusState }) {
	const { confirmTarget, editTarget } = useMartine();
	const toast = useToast();
	const scope = c.target?.scope ?? study.scope ?? "";
	const exclusions = c.target?.exclusions ?? [];
	const confirmed = c.target?.confirmedBy;
	const set = (s: string, ex: string[]) => editTarget(study.id, s, ex);

	return (
		<section aria-labelledby="scope-h" className={`${card} flex flex-col gap-3 px-6 py-5`}>
			<div className="flex flex-wrap items-center gap-3">
				<h2 id="scope-h" className={cn(h2, "flex-1")}>
					1. The scope the relevance filter works from
				</h2>
				{confirmed ? (
					<span className="inline-flex items-center gap-1 text-sm text-[var(--color-positive)]">
						<Check size={14} aria-hidden /> Confirmed by {first(confirmed)}
						{c.target?.confirmedOn && `, ${dueDate(c.target.confirmedOn)}`}
					</span>
				) : (
					<button
						onClick={() => {
							confirmTarget(study.id, scope, exclusions);
							toast("Scope confirmed: the off topic filter will work from it");
						}}
						disabled={!scope.trim()}
						className="rounded-[var(--radius)] border border-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)] disabled:opacity-40"
					>
						Confirm the scope
					</button>
				)}
			</div>
			<p className="m-0 text-sm text-[var(--color-ink-muted)]">From the study’s scope. What it leaves out is removed as off topic; you see examples before reading the corpus.</p>
			<div className="text-[15px]">
				<InlineEdit value={scope} onSave={(v) => set(v, exclusions)} canEdit label="the scope" placeholder="What the study covers" multiline />
			</div>
			<div className="flex flex-col gap-1.5">
				<div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Leaves out</div>
				<ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
					{exclusions.map((x) => (
						<li key={x} className="inline-flex items-center gap-1 rounded-[var(--radius-xl)] border border-[var(--color-border)] py-0.5 pl-3 pr-1 text-sm">
							{x}
							<button onClick={() => set(scope, exclusions.filter((y) => y !== x))} aria-label={`Remove “${x}”`} className="rounded-full p-0.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)]">
								<X size={13} aria-hidden />
							</button>
						</li>
					))}
				</ul>
				<AddRow label="Add what the study leaves out" placeholder="e.g. Barber “skin fade” haircuts" onAdd={(v) => set(scope, [...exclusions, v])} />
			</div>
		</section>
	);
}

// The exports, each read against its source's format contract: accepted, or
// refused with the reason. Never a silent refusal.
function Files({ study, c }: { study: Study; c: CorpusState }) {
	const { deposit, removeCorpusFile } = useMartine();
	const toast = useToast();
	const input = useRef<HTMLInputElement>(null);
	const [source, setSource] = useState(processing.sources[0]);
	const [over, setOver] = useState(false);
	const take = (list: FileList | null) => {
		if (!list?.length) return;
		const added = deposit(
			study.id,
			[...list].map((f) => ({ name: f.name, size: f.size, source })),
		);
		const refused = added.filter((f) => !f.accepted).length;
		toast(refused ? `${added.length - refused} accepted, ${refused} not accepted: see why in the list` : `${plural(added.length)} accepted`);
	};

	return (
		<section aria-labelledby="files-h" className={`${card} flex flex-col gap-3 px-6 py-5`}>
			<h2 id="files-h" className={h2}>
				2. The exports
			</h2>
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
				className={cn(
					"flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-dashed px-4 py-4",
					over ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)]" : "border-[var(--color-border-active)]",
				)}
			>
				<FileUp size={20} aria-hidden className="text-[var(--color-ink-muted)]" />
				<span className="flex-1 text-sm text-[var(--color-ink-secondary)]">Drop the exports here, or</span>
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
					onChange={(e) => {
						take(e.target.files);
						e.target.value = "";
					}}
				/>
			</div>
			<p className="m-0 text-sm text-[var(--color-ink-muted)]">
				Each file goes straight to the data platform, whatever its size. Or{" "}
				<a href={depositUrl(study)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold">
					deposit from Claude <ExternalLink size={12} aria-hidden />
				</a>
				: it gives you an upload link and tells you what became of each file.
			</p>

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
							{f.accepted ? (
								<span className="rounded-[var(--radius-xl)] bg-[var(--color-positive-bg)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-positive)]">
									{c.run && !f.processed ? "Accepted, not processed yet" : "Accepted"}
								</span>
							) : (
								<span className="rounded-[var(--radius-xl)] bg-[var(--color-attention-bg)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-attention)]">Format not accepted</span>
							)}
							<RemoveButton
								label={`Remove ${f.name}`}
								onClick={() => {
									removeCorpusFile(study.id, f.id);
									toast(`${f.name} removed from the corpus`);
								}}
							/>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

const plural = (n: number) => `${n} ${n === 1 ? "file" : "files"}`;

// Before reading the corpus: what the processing removed as off topic, and
// what the AI detected, on examples. The analyst puts back what was wrongly
// removed and flags a detection that misreads.
function ToCheck({ study, stage }: { study: Study; stage: CorpusStage }) {
	const sample = toCheck[study.id];
	const [kept, setKept] = useState<string[]>([]);
	const [verdict, setVerdict] = useState<Record<string, "right" | "fix">>({});
	if (!sample) return null;
	return (
		<section aria-labelledby="check-h" className={`${card} flex flex-col gap-4 px-6 py-5`}>
			<div>
				<h2 id="check-h" className={h2}>
					3. What the processing removed and detected
				</h2>
				<p className="m-0 mt-1 text-sm text-[var(--color-ink-muted)]">
					{stage === "to_check" ? "Examples to check before reading the corpus. " : ""}Fictional verbatims written for the prototype.
				</p>
			</div>
			<div className="flex flex-col gap-2">
				<h3 className="m-0 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Removed as off topic</h3>
				{sample.offTopic.map((v) => (
					<VerbatimRow key={v.id} v={v}>
						<button
							onClick={() => setKept((k) => (k.includes(v.id) ? k.filter((x) => x !== v.id) : [...k, v.id]))}
							aria-pressed={kept.includes(v.id)}
							className={cn("shrink-0 rounded-[var(--radius)] border px-2.5 py-1 text-[13px] font-semibold", kept.includes(v.id) ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "border-[var(--color-border-hover)] hover:border-[var(--color-accent)]")}
						>
							{kept.includes(v.id) ? "Will be put back" : "Put it back"}
						</button>
					</VerbatimRow>
				))}
			</div>
			{sample.detections.map((d) => (
				<div key={d.filter} className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="m-0 flex-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">Detected by the AI: {d.filter}</h3>
						{(["right", "fix"] as const).map((k) => (
							<button
								key={k}
								onClick={() => setVerdict((x) => ({ ...x, [d.filter]: k }))}
								aria-pressed={verdict[d.filter] === k}
								className={cn("rounded-[var(--radius)] border px-2.5 py-1 text-[13px] font-semibold", verdict[d.filter] === k ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "border-[var(--color-border-hover)] hover:border-[var(--color-accent)]")}
							>
								{k === "right" ? "Reads right" : "Needs fixing"}
							</button>
						))}
					</div>
					{d.examples.map((v) => (
						<VerbatimRow key={v.id} v={v} />
					))}
				</div>
			))}
		</section>
	);
}

export function VerbatimRow({ v, meta, children }: { v: Verbatim; meta?: string; children?: React.ReactNode }) {
	return (
		<div className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--color-canvas)] px-4 py-3">
			<div className="min-w-0 flex-1">
				<p className="m-0 text-[15px]">“{v.text}”</p>
				{v.translation && <p className="m-0 mt-0.5 text-sm text-[var(--color-ink-secondary)]">Translation: {v.translation}</p>}
				<p className="m-0 mt-1 font-mono text-[12px] text-[var(--color-ink-muted)]">
					{v.id}
					{meta && <span className="font-[family-name:var(--font-body)]"> · {meta}</span>}
					{v.why && <span className="font-[family-name:var(--font-body)]"> · {v.why}</span>}
				</p>
			</div>
			{children}
		</div>
	);
}
