"use client";

import Link from "next/link";
import { MoreLink } from "@/shared/components/ui/MoreLink";
import { ChevronDown, FileText, Lock } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { days, dueDate, fromToday, plural } from "@/shared/lib/format";
import { knownToClaude } from "@/shared/lib/martineContext";
import { methodEntry, personById } from "@/shared/lib/data";
import { hasMethodFile, phaseViews, type PhaseView } from "@/shared/lib/studyModel";
import { CorpusSummary } from "@/features/corpus/CorpusStrip";
import { corporaLine } from "@/shared/lib/corpus";
import { useCorporaClock } from "@/features/corpus/useCorporaClock";
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
	const { studies, corporaOf, tomorrow } = useMartine();
	const study = studies.find((s) => s.id === id);
	const corpora = corporaOf(id);
	const clock = useCorporaClock(corpora);
	if (!study) return null;
	const corpusLine = tomorrow ? corporaLine(corpora, clock) : undefined;

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
							<MoreLink href={`/studies/${study.id}/steps`} className="ml-auto">
								All the steps
							</MoreLink>
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

				{tomorrow && <CorpusSummary study={study} className={`${card} px-6 py-4`} />}

				<div>
					<section aria-labelledby="docs" className={tile}>
						<div className="flex items-baseline gap-2">
							<h2 id="docs" className={h2}>
								Latest documents
							</h2>
							<MoreLink href={`/studies/${study.id}/files`} className="ml-auto">
								All files
							</MoreLink>
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
						<MoreLink href={`/studies/${study.id}/team`} className="ml-auto">
							Manage
						</MoreLink>
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
						{knownToClaude(study, views, corpusLine).map((item) => (
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

// The other studies of the same type, newest first: one row each, to open and
// see how the team ran it. Another client's study is flagged: the approach can
// be reused, not its material, and Claude does not read it from this study.
function SimilarStudies({ study, similar, type }: { study: Study; similar: Study[]; type: string }) {
	return (
		<section aria-labelledby="similar" className={tile}>
			<h2 id="similar" className={h2}>
				Similar studies <span className="font-normal text-[var(--color-ink-muted)]">{similar.length}</span>
			</h2>
			<p className="m-0 mt-0.5 text-[13px] text-[var(--color-ink-muted)]">Other {type.toLowerCase()}s, newest first</p>
			{similar.length === 0 ? (
				<p className="m-0 mt-2 text-sm text-[var(--color-ink-muted)]">None in Martine yet.</p>
			) : (
				<ul className="m-0 mt-2 flex list-none flex-col p-0">
					{similar.map((s) => {
						const same = s.client === study.client;
						return (
							<li key={s.id} className="border-b border-[var(--color-border)] last:border-b-0">
								<Link href={`/studies/${s.id}`} className="-mx-2 block rounded-[var(--radius-sm)] px-2 py-2.5 text-[var(--color-ink)] no-underline hover:bg-[var(--color-hover)]">
									<span className="block font-semibold leading-snug">{s.title}</span>
									<span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--color-ink-muted)]">
										{same ? (
											<span className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2 py-px font-semibold text-[var(--color-accent)]">Same client</span>
										) : (
											<span
												title="Another client: reuse the approach, not the material. Claude does not read it from this study."
												className="inline-flex items-center gap-1 rounded-[var(--radius-xl)] bg-[var(--color-elevated)] px-2 py-px font-semibold text-[var(--color-ink-secondary)]"
											>
												<Lock size={10} aria-hidden /> Other client
											</span>
										)}
										<span>{s.status === "delivered" ? `Delivered ${shortDate(s.due)}` : `Due ${shortDate(s.due)}`}</span>
										<span className="ml-auto flex -space-x-1.5">
											{s.team
												.filter((m) => m.role === "consultant" || m.role === "analyst")
												.map((m) => (
													<span
														key={m.person}
														title={personById(m.person)?.name}
														className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-elevated)] text-[8px] font-bold text-[var(--color-ink-secondary)] ring-2 ring-[var(--color-surface)]"
													>
														{personById(m.person)?.initials}
													</span>
												))}
										</span>
									</span>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
