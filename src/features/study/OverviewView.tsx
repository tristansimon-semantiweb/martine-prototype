"use client";

import Link from "next/link";
import { useMartine } from "@/shared/hooks/useMartine";
import { days, dueDate, fromToday, plural } from "@/shared/lib/format";
import { knownToClaude, statusLine } from "@/shared/lib/martineContext";
import { methodEntry, personById } from "@/shared/lib/data";
import { hasMethodFile, phaseViews } from "@/shared/lib/studyModel";
import { cn } from "@/shared/lib/cn";
import type { Study } from "@/shared/lib/types";

const tile = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[18px]";
const label = "text-[13px] text-[var(--color-ink-muted)]";

// A study at a glance: what it is (recap), where it stands, the four
// landmarks (study type, due date, steps done, budget), what is open with the
// client, and the similar studies, to see how the team ran them before.
export function OverviewView({ id }: { id: string }) {
	const { studies } = useMartine();
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const open = study.toClarify.filter((c) => c.open);
	const method = methodEntry(study.method.id);
	const type = method?.name ?? study.method.id;
	const counted = views.filter((v) => v.status !== "not_needed");
	const done = counted.filter((v) => v.status === "done").length;
	const inProgress = views.find((v) => v.status === "in_progress");
	const late = study.status !== "delivered" && new Date(`${study.due}T23:59:59`) < new Date();
	const similar = studies.filter((s) => s.method.id === study.method.id && s.id !== study.id).sort((a, b) => b.due.localeCompare(a.due));

	// Seeded studies carry a written summary; a new study gets a plain one.
	const summary = study.summary ?? {
		headline: study.status === "delivered" ? "Delivered." : views.some((v) => v.status === "in_progress" || v.status === "done") ? "Under way." : "Not started yet.",
		body: [
			hasMethodFile(study)
				? `The ${type.toLowerCase()} method: ${views.length} phases, ${statusLine(views)}.`
				: "The method file for this study type is not imported in Martine yet.",
			open.length ? `${plural(open.length, "point")} to clarify with the client.` : "",
		]
			.filter(Boolean)
			.join(" "),
	};

	return (
		<div className="mx-auto grid max-w-[1180px] items-start gap-5 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
			<div className="flex min-w-0 flex-col gap-[18px]">
				<section
					aria-labelledby="recap"
					className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[26px] py-6 shadow-[var(--shadow-xs)]"
				>
					<div className="text-[13px] font-semibold text-[var(--color-accent)]">
						{type} for {study.client}
					</div>
					<h1 id="recap" className="mt-1.5 font-[family-name:var(--font-heading)] text-[24px] font-medium leading-snug">
						{study.scope ?? study.title}
					</h1>
					<div className="mt-4 border-t border-[var(--color-border)] pt-4">
						<div className={label}>Where it stands</div>
						<p className="m-0 mt-1 text-[17px] leading-[1.6]">
							<span className="font-semibold">{summary.headline}</span> <span className="text-[var(--color-ink-secondary)]">{summary.body}</span>
						</p>
					</div>
				</section>

				<div className="grid gap-3.5 sm:grid-cols-2">
					<div className={tile}>
						<div className={label}>Study type</div>
						<div className="mt-1 text-lg font-semibold">{type}</div>
						<div className="text-sm text-[var(--color-ink-muted)]">{study.method.version ? `method v${study.method.version}` : "method not imported yet"}</div>
						<Link href={`/study-types/${study.method.id}`} className="mt-2 inline-block text-sm font-semibold">
							See the study type
						</Link>
					</div>
					<div className={tile}>
						<div className={label}>Due date</div>
						<div className={cn("mt-1 text-lg font-semibold", late && "text-[var(--color-negative)]")}>{dueDate(study.due)}</div>
						<div className={cn("text-sm", late ? "text-[var(--color-negative)]" : "text-[var(--color-ink-muted)]")}>
							{study.status === "delivered" ? "delivered" : late ? `late, ${fromToday(study.due)}` : fromToday(study.due)}
						</div>
					</div>
					<div className={tile}>
						<div className={label}>Steps</div>
						{hasMethodFile(study) ? (
							<>
								<div className="mt-1 text-lg font-semibold">
									{done} / {counted.length} done
								</div>
								<div
									role="progressbar"
									aria-label="Steps done"
									aria-valuemin={0}
									aria-valuemax={counted.length}
									aria-valuenow={done}
									className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-elevated)]"
								>
									<div className="h-full rounded-full bg-[var(--color-positive)]" style={{ width: `${counted.length ? (done / counted.length) * 100 : 0}%` }} />
								</div>
								<Link href={`/studies/${study.id}/steps${inProgress ? `?phase=${inProgress.id}` : ""}`} className="mt-2 inline-block text-sm font-semibold">
									{inProgress ? `Continue: ${inProgress.name}` : "See the steps"}
								</Link>
							</>
						) : (
							<div className="mt-1 text-sm text-[var(--color-ink-muted)]">Method not imported yet</div>
						)}
					</div>
					<div className={tile}>
						<div className={label}>Budget</div>
						<div className="mt-1 text-lg font-semibold">{study.daysSold != null ? `${days(study.daysSold)} days sold` : "[days sold]"}</div>
					</div>
				</div>

				{open.length > 0 && (
					<section aria-labelledby="clarify" className={tile}>
						<h2 id="clarify" className="font-[family-name:var(--font-body)] text-[15px] font-semibold">
							To clarify with the client
						</h2>
						<div className="mt-2.5 flex flex-wrap gap-1.5">
							{open.map((c) => (
								<span key={c.id} className="rounded-[var(--radius-sm)] bg-[var(--color-attention-bg)] px-2.5 py-1.5 text-sm text-[var(--color-attention)]">
									{c.label}
								</span>
							))}
						</div>
					</section>
				)}

				{study.decisions.length > 0 && (
					<section aria-labelledby="dec" className={tile}>
						<h2 id="dec" className="font-[family-name:var(--font-body)] text-[15px] font-semibold">
							Decisions
						</h2>
						<ul className="mt-2 flex flex-col gap-1.5 text-[15px] text-[var(--color-ink-secondary)]">
							{study.decisions.map((d) => (
								<li key={d.id}>
									<span className="font-semibold text-[var(--color-ink)]">{d.date}:</span> {d.text}
								</li>
							))}
						</ul>
					</section>
				)}
			</div>

			<aside className="flex flex-col gap-[18px]">
				<SimilarStudies study={study} similar={similar} type={type} />

				<section aria-labelledby="known" className={tile}>
					<h2 id="known" className="font-[family-name:var(--font-body)] text-[15px] font-semibold">
						Known to Claude
					</h2>
					<p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">Claude finds this study by its code and reads the same as this page, through Martine. Nothing else.</p>
					<dl className="mt-3 flex flex-col gap-2 text-sm">
						{knownToClaude(study, views).map((item) => (
							<div key={item.label}>
								<dt className="text-[13px] text-[var(--color-ink-muted)]">{item.label}</dt>
								<dd className="m-0 flex flex-wrap items-baseline gap-x-2">
									<span>{item.detail}</span>
									{item.ref && <code className="text-[12px] text-[var(--color-ink-muted)]">{item.ref}</code>}
								</dd>
							</div>
						))}
					</dl>
				</section>
			</aside>
		</div>
	);
}

// The other studies of the same type, newest first: open one to see how the
// team ran it (its steps, its tools, its documents). Another client's study
// is for internal reference: its material stays in that study.
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
