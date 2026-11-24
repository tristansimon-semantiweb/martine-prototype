"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { AddRow, InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { days, dueDate, fromToday, plural } from "@/shared/lib/format";
import { knownToClaude, statusLine } from "@/shared/lib/martineContext";
import { methodEntry, personById } from "@/shared/lib/data";
import { hasMethodFile, phaseViews, type PhaseView } from "@/shared/lib/studyModel";
import { cn } from "@/shared/lib/cn";
import type { PhaseStatus, Study } from "@/shared/lib/types";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";
const tile = `${card} p-[18px]`;
const prop = "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]";
const h2 = "m-0 font-[family-name:var(--font-body)] text-[15px] font-semibold";
const SEGMENT: Record<PhaseStatus, string> = {
	done: "bg-[var(--color-positive)]",
	in_progress: "bg-[var(--color-accent)]",
	to_start: "bg-[var(--color-elevated)]",
	not_needed: "bg-[var(--color-elevated)] opacity-50",
};
const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// A study at a glance, read like a project page: what it covers and its key
// properties (client, study type, lead, due date, budget); where the phases
// stand, with the one in progress and who is on it; where it stands in words
// and what is open with the client; the decisions and the latest documents.
// On the side: the team, similar studies, and what Claude knows (folded).
export function OverviewView({ id }: { id: string }) {
	const { studies } = useMartine();
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const method = methodEntry(study.method.id);
	const type = method?.name ?? study.method.id;
	const counted = views.filter((v) => v.status !== "not_needed");
	const done = counted.filter((v) => v.status === "done").length;
	const now = views.find((v) => v.status === "in_progress") ?? views.find((v) => v.status === "to_start");
	const next = now ? views.slice(views.indexOf(now) + 1).find((v) => v.status === "to_start") : undefined;
	const late = study.status !== "delivered" && new Date(`${study.due}T23:59:59`) < new Date();
	const similar = studies.filter((s) => s.method.id === study.method.id && s.id !== study.id).sort((a, b) => b.due.localeCompare(a.due));
	const lead = study.team.find((m) => m.role === "consultant");
	const leadPerson = lead ? personById(lead.person) : undefined;
	const nowPerson = now ? personById(study.state.assignees?.[now.id] ?? "") : undefined;
	const recentFiles = [...study.files].sort((a, b) => (b.added ?? "").localeCompare(a.added ?? "")).slice(0, 4);

	// Until someone writes where it stands, Martine writes a line from the phases' status.
	const autoSummary = hasMethodFile(study)
		? `${study.status === "delivered" ? "Delivered." : views.some((v) => v.status === "in_progress" || v.status === "done") ? "Under way." : "Not started yet."} The ${type.toLowerCase()} method: ${views.length} phases, ${statusLine(views)}.`
		: "The method file for this study type is not imported in Martine yet.";

	return (
		<div className="mx-auto grid max-w-[1240px] items-start gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_320px]">
			<div className="flex min-w-0 flex-col gap-5">
				{/* What the study covers, and its key properties. */}
				<section aria-labelledby="recap" className={`${card} flex flex-col gap-4 px-6 py-5`}>
					<div>
						<div className="text-[13px] font-semibold text-[var(--color-accent)]">
							{type} for {study.client}
						</div>
						<h1 id="recap" className="m-0 mt-1 font-[family-name:var(--font-heading)] text-[24px] font-medium leading-snug">
							{study.scope ?? study.title}
						</h1>
					</div>
					<dl className="m-0 grid overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm sm:grid-cols-5 sm:divide-x sm:divide-[var(--color-border)] max-sm:divide-y max-sm:divide-[var(--color-border)]">
						<Prop label="Client">{study.client}</Prop>
						<Prop label="Study type">
							<Link href={`/study-types/${study.method.id}`} className="font-semibold">
								{type}
							</Link>
							<span className="block text-[12px] text-[var(--color-ink-muted)]">{study.method.version ? `method v${study.method.version}` : "not imported yet"}</span>
						</Prop>
						<Prop label="Lead">
							{leadPerson ? (
								<span className="flex items-center gap-2">
									<Avatar initials={leadPerson.initials} />
									{leadPerson.name}
								</span>
							) : (
								<span className="text-[var(--color-ink-muted)]">To name</span>
							)}
						</Prop>
						<Prop label="Due">
							<span className={cn("font-semibold", late && "text-[var(--color-negative)]")}>{dueDate(study.due)}</span>
							<span className={cn("block text-[12px]", late ? "text-[var(--color-negative)]" : "text-[var(--color-ink-muted)]")}>
								{study.status === "delivered" ? "delivered" : late ? `late, ${fromToday(study.due)}` : fromToday(study.due)}
							</span>
						</Prop>
						<Prop label="Budget">{study.daysSold != null ? `${days(study.daysSold)} days sold` : <span className="text-[var(--color-ink-muted)]">[days sold]</span>}</Prop>
					</dl>
				</section>

				{/* Where the phases stand: one segment per phase, then the one in progress. */}
				{hasMethodFile(study) && (
					<section aria-labelledby="phases-h" className={`${card} flex flex-col gap-4 px-6 py-5`}>
						<div className="flex flex-wrap items-baseline gap-x-3">
							<h2 id="phases-h" className={h2}>
								Phases
							</h2>
							<span className="text-sm text-[var(--color-ink-muted)]">
								{done} of {counted.length} done
							</span>
							<Link href={`/studies/${study.id}/steps`} className="ml-auto text-sm font-semibold">
								All the steps
							</Link>
						</div>
						<ol aria-label="Phases, in order" className="m-0 flex list-none gap-1 p-0">
							{views.map((p) => (
								<li key={p.id} className="min-w-0 flex-1">
									<Link href={`/studies/${study.id}/steps?phase=${p.id}`} title={`${p.label}: ${p.status.replace("_", " ")}`} className="group block">
										<span className={cn("block h-2.5 rounded-full transition-opacity group-hover:opacity-80", SEGMENT[p.status], now?.id === p.id && "ring-2 ring-[var(--color-accent)] ring-offset-2")} />
										<span className={cn("mt-1.5 hidden truncate text-[11px] md:block", now?.id === p.id ? "font-semibold text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]")}>
											{p.addedBy ? "+" : p.id}. {p.name}
										</span>
									</Link>
								</li>
							))}
						</ol>
						{now && <Now study={study} phase={now} person={nowPerson} next={next} />}
					</section>
				)}

				<div className="grid gap-5 md:grid-cols-2">
					<Standing study={study} auto={autoSummary} />
					<ToClarify study={study} />
				</div>

				<div className="grid gap-5 md:grid-cols-2">
					<Decisions study={study} />
					<section aria-labelledby="docs" className={tile}>
						<div className="flex items-baseline gap-2">
							<h2 id="docs" className={h2}>
								Latest documents
							</h2>
							<Link href={`/studies/${study.id}/files`} className="ml-auto text-sm font-semibold">
								All files
							</Link>
						</div>
						{recentFiles.length ? (
							<ul className="m-0 mt-2 flex list-none flex-col p-0 text-[15px]">
								{recentFiles.map((f) => (
									<li key={f.id}>
										<Link
											href={`/studies/${study.id}/files?folder=${f.category ?? "production"}&file=${f.id}`}
											className="-mx-2 flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 text-[var(--color-ink)] no-underline hover:bg-[var(--color-hover)]"
										>
											<FileText size={15} aria-hidden className="shrink-0 text-[var(--color-ink-muted)]" />
											<span className="min-w-0 flex-1 truncate">{f.name}</span>
											{f.added && <span className="shrink-0 text-[13px] text-[var(--color-ink-muted)]">{shortDate(f.added)}</span>}
										</Link>
									</li>
								))}
							</ul>
						) : (
							<p className="m-0 mt-2 text-sm text-[var(--color-ink-muted)]">No document yet.</p>
						)}
					</section>
				</div>
			</div>

			<aside className="flex flex-col gap-5">
				<section aria-labelledby="team-h" className={tile}>
					<div className="flex items-baseline gap-2">
						<h2 id="team-h" className={h2}>
							Team
						</h2>
						<Link href={`/studies/${study.id}/team`} className="ml-auto text-sm font-semibold">
							Manage
						</Link>
					</div>
					<ul className="m-0 mt-2.5 flex list-none flex-col gap-2 p-0 text-sm">
						{study.team.map((m) => {
							const p = personById(m.person);
							return (
								<li key={m.person} className="flex items-center gap-2.5">
									<Avatar initials={p?.initials ?? "?"} />
									<span className="flex-1">{p?.name}</span>
									<span className="text-[13px] text-[var(--color-ink-muted)]">{m.role === "method_owner" ? "advisor" : m.role.replace("_", " ")}</span>
								</li>
							);
						})}
					</ul>
				</section>

				<SimilarStudies study={study} similar={similar} type={type} />

				<details className={`${tile} group`}>
					<summary className="flex list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
						<span className={h2}>What Claude knows</span>
						<ChevronDown size={15} aria-hidden className="ml-auto text-[var(--color-ink-muted)] transition-transform group-open:rotate-180" />
					</summary>
					<p className="m-0 mt-1.5 text-[13px] text-[var(--color-ink-muted)]">Claude finds this study by its code and reads the same as this page, through Martine. Nothing else.</p>
					<dl className="m-0 mt-3 flex flex-col gap-2 text-sm">
						{knownToClaude(study, views).map((item) => (
							<div key={item.label}>
								<dt className="text-[12px] text-[var(--color-ink-muted)]">{item.label}</dt>
								<dd className="m-0 flex flex-wrap items-baseline gap-x-2">
									<span>{item.detail}</span>
									{item.ref && <code className="text-[11px] text-[var(--color-ink-muted)]">{item.ref}</code>}
								</dd>
							</div>
						))}
					</dl>
				</details>
			</aside>
		</div>
	);
}

function Prop({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-1 px-4 py-3">
			<dt className={prop}>{label}</dt>
			<dd className="m-0">{children}</dd>
		</div>
	);
}

function Avatar({ initials }: { initials: string }) {
	return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-elevated)] text-[10px] font-bold text-[var(--color-ink-secondary)]">{initials}</span>;
}

// The phase in progress (else the next to start): who is on it, its tasks,
// Continue; and the phase after it.
function Now({ study, phase, person, next }: { study: Study; phase: PhaseView; person?: { name: string; initials: string }; next?: PhaseView }) {
	return (
		<div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[var(--radius-md)] bg-[var(--color-accent-dim)] px-4 py-3.5">
			<div className="min-w-[220px] flex-1">
				<div className={prop}>{phase.status === "in_progress" ? "In progress" : "Up next"}</div>
				<div className="mt-0.5 text-[17px] font-semibold">
					{phase.addedBy ? "+" : phase.id}. {phase.name}
				</div>
				<div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-[var(--color-ink-secondary)]">
					{person ? (
						<span className="flex items-center gap-1.5">
							<Avatar initials={person.initials} />
							{person.name}
						</span>
					) : (
						<span className="text-[var(--color-ink-muted)]">Not assigned</span>
					)}
					<span className="text-[var(--color-ink-muted)]">· {plural(phase.total, "task")}</span>
					{next && <span className="text-[var(--color-ink-muted)]">· then {next.name}</span>}
				</div>
			</div>
			<Link
				href={`/studies/${study.id}/steps?phase=${phase.id}`}
				className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white no-underline hover:opacity-90"
			>
				Continue
			</Link>
		</div>
	);
}

function SimilarStudies({ study, similar, type }: { study: Study; similar: Study[]; type: string }) {
	const others = similar.some((s) => s.client !== study.client);
	return (
		<section aria-labelledby="similar" className={tile}>
			<h2 id="similar" className="font-[family-name:var(--font-body)] text-[15px] font-semibold">
				Similar studies
			</h2>
			<p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
				{similar.length ? `Other ${type.toLowerCase()}s: see how the team ran them.` : `No other ${type.toLowerCase()} in Martine yet.`}
			</p>
			{similar.length > 0 && (
				<ul className="m-0 mt-2 flex list-none flex-col p-0">
					{similar.map((s) => {
						const people = s.team.filter((m) => m.role === "consultant" || m.role === "analyst").map((m) => personById(m.person)?.name.split(" ")[0]);
						return (
							<li key={s.id} className="border-b border-[var(--color-border)] last:border-b-0">
								<Link
									href={`/studies/${s.id}/steps`}
									className="-mx-2 block rounded-[var(--radius-sm)] px-2 py-2.5 text-[var(--color-ink)] no-underline hover:bg-[var(--color-hover)]"
								>
									<span className="block font-semibold leading-snug">{s.title}</span>
									<span className="block text-[13px] text-[var(--color-ink-muted)]">
										{s.client}
										{s.client === study.client && <span className="font-semibold text-[var(--color-accent)]"> (same client)</span>}
										{", "}
										{s.status === "delivered" ? `delivered ${dueDate(s.due)}` : `due ${dueDate(s.due)}`}
									</span>
									{people.length > 0 && <span className="block text-[13px] text-[var(--color-ink-muted)]">{people.join(", ")}</span>}
								</Link>
							</li>
						);
					})}
				</ul>
			)}
			{others && (
				<p className="m-0 mt-2.5 text-[13px] text-[var(--color-ink-muted)]">
					Another client’s study is there to see how the team ran it: reuse the approach, not its material. Claude does not read it from this study.
				</p>
			)}
		</section>
	);
}

const firstName = (id?: string) => (id ? personById(id)?.name.split(" ")[0] : undefined);

// Where it stands, in words: anyone on the study rewrites it in place. Until
// then, Martine's line from the phases' status, said as such.
function Standing({ study, auto }: { study: Study; auto: string }) {
	const { setSummary } = useMartine();
	const written = study.summary ? [study.summary.headline, study.summary.body].filter(Boolean).join(" ") : "";
	return (
		<section aria-labelledby="stands" className={tile}>
			<h2 id="stands" className={h2}>
				Where it stands
			</h2>
			<div className="mt-2 text-[15px] leading-relaxed text-[var(--color-ink-secondary)]">
				<InlineEdit value={written} onSave={(t) => setSummary(study.id, t)} canEdit multiline label="where it stands" placeholder={auto}>
					{written || undefined}
				</InlineEdit>
			</div>
			<p className="m-0 mt-2 text-[12px] text-[var(--color-ink-muted)]">
				{study.summary?.by
					? `Updated by ${firstName(study.summary.by)}${study.summary.date ? `, ${shortDate(study.summary.date)}` : ""}. Claude reads it.`
					: written
						? "Claude reads it."
						: "Written by Martine from the phases’ status. Click to write your own; Claude reads it."}
			</p>
		</section>
	);
}

// What is open with the client. A point is added, removed, or resolved: the
// client's answer closes it and becomes a dated decision.
function ToClarify({ study }: { study: Study }) {
	const { addClarify, removeClarify, restoreClarify, resolveClarify } = useMartine();
	const toast = useToast();
	const [resolving, setResolving] = useState<string | null>(null);
	const [answer, setAnswer] = useState("");
	const open = study.toClarify.filter((c) => c.open);
	return (
		<section aria-labelledby="clarify" className={tile}>
			<h2 id="clarify" className={h2}>
				To clarify with the client <span className="font-normal text-[var(--color-ink-muted)]">{open.length}</span>
			</h2>
			<ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-[15px]">
				{open.map((c) => (
					<li key={c.id} className="group rounded-[var(--radius-sm)] py-1">
						<div className="flex items-start gap-2">
							<span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-attention)]" />
							<span className="min-w-0 flex-1">
								{c.label}
								<span className="ml-1.5 text-[12px] text-[var(--color-ink-muted)]">{c.by ? `added by ${firstName(c.by)}` : "from the brief"}</span>
							</span>
							{resolving !== c.id && (
								<button
									onClick={() => {
										setResolving(c.id);
										setAnswer("");
									}}
									className="shrink-0 rounded-[var(--radius-sm)] px-2 py-0.5 text-[13px] font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]"
								>
									Resolve
								</button>
							)}
							<RemoveButton
								label={`Remove “${c.label}”`}
								onClick={() => {
									const r = removeClarify(study.id, c.id);
									toast("Point removed", r && { label: "Undo", onClick: () => restoreClarify(study.id, r) });
								}}
							/>
						</div>
						{resolving === c.id && (
							<form
								onSubmit={(e) => {
									e.preventDefault();
									if (!answer.trim()) return;
									resolveClarify(study.id, c.id, answer.trim());
									toast("Resolved: the answer is now a decision");
									setResolving(null);
								}}
								className="ml-3.5 mt-1.5 flex gap-2"
							>
								<input
									autoFocus
									value={answer}
									onChange={(e) => setAnswer(e.target.value)}
									onKeyDown={(e) => e.key === "Escape" && setResolving(null)}
									aria-label={`What did the client decide on “${c.label}”?`}
									placeholder="What did the client decide?"
									className="rr-input min-w-0 flex-1 py-1.5 text-sm"
								/>
								<button type="submit" disabled={!answer.trim()} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 text-sm font-semibold text-white disabled:opacity-40">
									Record
								</button>
							</form>
						)}
					</li>
				))}
				{open.length === 0 && <li className="text-sm text-[var(--color-ink-muted)]">Nothing open.</li>}
			</ul>
			<div className="mt-2.5">
				<AddRow label="Add a point" placeholder="What to clarify with the client" onAdd={(v) => addClarify(study.id, v)} />
			</div>
		</section>
	);
}

// What was decided, dated: from a resolved point (it says which) or added directly.
function Decisions({ study }: { study: Study }) {
	const { addDecision, removeDecision, restoreDecision } = useMartine();
	const toast = useToast();
	return (
		<section aria-labelledby="dec" className={tile}>
			<h2 id="dec" className={h2}>
				Decisions <span className="font-normal text-[var(--color-ink-muted)]">{study.decisions.length}</span>
			</h2>
			{study.decisions.length ? (
				<ol className="m-0 mt-2 flex list-none flex-col gap-2.5 p-0 text-[15px]">
					{study.decisions.map((d) => (
						<li key={d.id} className="flex gap-3">
							<span className="w-[92px] shrink-0 text-[13px] font-semibold text-[var(--color-ink-muted)]">{d.date}</span>
							<span className="min-w-0 flex-1 text-[var(--color-ink-secondary)]">
								{d.answers && <span className="font-semibold text-[var(--color-ink)]">{d.answers}: </span>}
								{d.text}
								{d.by && <span className="ml-1.5 text-[12px] text-[var(--color-ink-muted)]">by {firstName(d.by)}</span>}
							</span>
							<RemoveButton
								label="Remove this decision"
								onClick={() => {
									const r = removeDecision(study.id, d.id);
									toast("Decision removed", r && { label: "Undo", onClick: () => restoreDecision(study.id, r) });
								}}
							/>
						</li>
					))}
				</ol>
			) : (
				<p className="m-0 mt-2 text-sm text-[var(--color-ink-muted)]">No decision yet. Resolving a point to clarify records one.</p>
			)}
			<div className="mt-2.5">
				<AddRow label="Add a decision" placeholder="What was decided" onAdd={(v) => addDecision(study.id, v)} />
			</div>
		</section>
	);
}
