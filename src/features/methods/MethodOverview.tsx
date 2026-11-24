"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, methodFile, personById, studyTypeDefinition } from "@/shared/lib/data";
import { costed, costedDays, plannedLabel, plural } from "@/shared/lib/format";
import { MoreLink } from "@/shared/components/ui/MoreLink";
import { methodDays, methodPhases } from "./methodModel";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";
const prop = "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]";
const h2 = "m-0 font-[family-name:var(--font-body)] text-[15px] font-semibold";

// What a study type is, at a glance, as a study's Overview: the question it
// answers and its definition; its properties (owner, version, studies using
// it, planned days); the suggestions waiting for the owner; its phases (each
// opens in the Method tab); the method file's terms and notes.
export function MethodOverview({ id }: { id: string }) {
	const { studies, suggestions, drafts } = useMartine();
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const phaseParam = params.get("phase");
	// An older link opened a phase here (?phase=2): it now opens in the Method tab.
	useEffect(() => {
		if (phaseParam) router.replace(`${pathname}/method?${params.toString()}`);
	}, [phaseParam, pathname, params, router]);

	const m = methodEntry(id);
	if (!m || phaseParam) return null;
	const draft = drafts[id];
	const phases = methodPhases(id, draft, suggestions);
	const pending = suggestions.filter((s) => s.method === id && s.status === "pending");
	const using = studies.filter((s) => s.method.id === id && s.status !== "delivered");
	const planned = plannedLabel(m.planned) ?? costedDays(methodDays(id));
	const file = methodFile(id);
	const def = studyTypeDefinition(id);
	const base = `/study-types/${id}/method`;

	return (
		<div className="mx-auto flex max-w-[1080px] flex-col gap-5 px-6 py-7">
			<section aria-label="What this study type is" className={`${card} flex flex-col gap-4 px-6 py-5`}>
				{def ? (
					<div>
						{def.question && <p className="m-0 font-[family-name:var(--font-heading)] text-[24px] font-medium leading-snug">{def.question}</p>}
						<p className="m-0 mt-2 text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">{def.definition}</p>
						{def.source === "draft" && (
							<p className="m-0 mt-2.5 inline-block rounded-[var(--radius-sm)] bg-[var(--color-attention-bg)] px-2.5 py-1 text-[13px] text-[var(--color-attention)]">
								Draft, to validate by the method owner
							</p>
						)}
					</div>
				) : (
					<p className="m-0 text-[var(--color-ink-muted)]">[Definition to write: what this study type is and the question it answers]</p>
				)}
				<dl className="m-0 grid overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm sm:grid-cols-4 sm:divide-x sm:divide-[var(--color-border)] max-sm:divide-y max-sm:divide-[var(--color-border)]">
					{[
						["Method owner", m.owner ?? "To name"],
						["Version", m.version ? `v${m.version}, published${draft ? `; draft v${draft.version}${draft.saved ? " saved" : ""}` : ""}` : "To document"],
						["Used by", plural(using.length, "study in progress", "studies in progress")],
						["Planned", m.version ? planned : "[not documented]"],
					].map(([k, v]) => (
						<div key={k} className="flex flex-col gap-1 px-4 py-3">
							<dt className={prop}>{k}</dt>
							<dd className="m-0 font-semibold">{v}</dd>
						</div>
					))}
				</dl>
			</section>

			{!m.version && (
				<p className={`${card} m-0 border-dashed px-6 py-6 text-[var(--color-ink-secondary)]`}>
					This method is not written yet. Its phases and tasks show here once it is.
				</p>
			)}

			{pending.length > 0 && (
				<section aria-labelledby="sugg" className={`${card} flex flex-col gap-2.5 px-6 py-5`}>
					<h2 id="sugg" className={h2}>
						Suggestions to review <span className="font-normal text-[var(--color-ink-muted)]">{pending.length}</span>
					</h2>
					{pending.map((s) => (
						<div key={s.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-accent-dim)] px-4 py-3 text-[15px]">
							<span className="flex-1">
								<span className="font-semibold">{personById(s.by)?.name.split(" ")[0] ?? "An analyst"}</span>, phase {s.phase}: {s.text}
							</span>
							<Link href={`${base}?phase=${s.phase}`} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white no-underline">
								Review
							</Link>
						</div>
					))}
				</section>
			)}

			{phases.length > 0 && (
				<section aria-labelledby="phases-h" className={card}>
					<div className="flex items-baseline gap-2 border-b border-[var(--color-border)] px-6 py-3.5">
						<h2 id="phases-h" className={h2}>
							Phases <span className="font-normal text-[var(--color-ink-muted)]">{phases.length}</span>
						</h2>
						<MoreLink href={base} className="ml-auto">
							Open the method
						</MoreLink>
					</div>
					<ol aria-label="Phases" className="m-0 list-none p-0">
						{phases.map((p) => (
							<li key={p.id} className="border-b border-[var(--color-border)] last:border-b-0">
								<Link
									href={`${base}?phase=${p.id}`}
									className="flex flex-wrap items-center gap-x-4 gap-y-1 px-6 py-3 text-[var(--color-ink)] no-underline hover:bg-[var(--color-hover)]"
								>
									<span className="min-w-[220px] flex-1">
										{p.label}
										{p.optional && <span className="ml-2 text-[13px] text-[var(--color-ink-muted)]">optional</span>}
										{p.isNew && <span className="ml-2 text-[13px] text-[var(--color-attention)]">new in draft</span>}
									</span>
									<span className="w-16 text-sm text-[var(--color-ink-muted)]">{plural(p.tasks.length, "task")}</span>
									<span className="w-28 text-sm text-[var(--color-ink-muted)]">{costed(p.days)}</span>
									<span className={p.skillCount ? "w-16 text-sm font-semibold text-[var(--color-accent)]" : "w-16 text-sm text-[var(--color-ink-muted)]"}>
										{p.skillCount ? plural(p.skillCount, "skill") : "no skill"}
									</span>
								</Link>
							</li>
						))}
					</ol>
				</section>
			)}

			{(file?.glossary || file?.notes) && (
				<div className="grid gap-5 md:grid-cols-2">
					{file?.glossary && (
						<section aria-labelledby="terms" className={`${card} px-6 py-5`}>
							<h2 id="terms" className={h2}>
								Terms
							</h2>
							<dl className="m-0 mt-2.5 grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[15px]">
								{file.glossary.map((g) => (
									<div key={g.term} className="contents">
										<dt className="font-semibold">{g.term}</dt>
										<dd className="m-0 text-[var(--color-ink-secondary)]">{g.definition}</dd>
									</div>
								))}
							</dl>
						</section>
					)}
					{file?.notes && (
						<section aria-labelledby="notes" className={`${card} px-6 py-5`}>
							<h2 id="notes" className={h2}>
								Notes on the method
							</h2>
							<ul className="m-0 mt-2.5 flex flex-col gap-1.5 pl-5 text-[15px] text-[var(--color-ink-secondary)]">
								{file.notes.map((n, i) => (
									<li key={i}>{n}</li>
								))}
							</ul>
						</section>
					)}
				</div>
			)}
		</div>
	);
}
