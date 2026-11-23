"use client";

import Link from "next/link";
import { useMartine } from "@/shared/hooks/useMartine";
import { days, plural } from "@/shared/lib/format";
import { knownToClaude } from "@/shared/lib/martineContext";
import { currentPhase, daysActual, hasMethodFile, phaseViews } from "@/shared/lib/studyModel";

const tile = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[18px]";

export function OverviewView({ id }: { id: string }) {
	const { studies } = useMartine();
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const cur = currentPhase(views);
	const used = daysActual(study);
	const open = study.toClarify.filter((c) => c.open);
	const started = used > 0 || views.some((p) => p.status === "done");

	// Seeded studies carry Martine's written summary; a new study gets one
	// derived from where it stands.
	const summary = study.summary ?? {
		headline: started ? "Under way." : "Not started yet.",
		body: [
			cur ? `Phase ${cur.id}, ${cur.name}, is ${started ? "in progress" : "next"}.` : hasMethodFile(study) ? "" : "The method file for this study type is not imported in Martine yet.",
			study.daysSold != null ? `${days(used)} days used out of ${days(study.daysSold)} sold.` : "No budget in days yet.",
			open.length ? `${plural(open.length, "point")} to clarify with the client.` : "",
		]
			.filter(Boolean)
			.join(" "),
	};

	return (
		<div className="mx-auto flex max-w-[880px] flex-col gap-[18px] px-6 py-8">
			<section aria-labelledby="sum" className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[26px] py-6 shadow-[var(--shadow-xs)]">
				<div className="text-[13px] font-semibold text-[var(--color-accent)]">Where the study stands</div>
				<h1 id="sum" className="mt-1.5 font-[family-name:var(--font-heading)] text-[28px] font-medium leading-tight">
					{summary.headline}
				</h1>
				<p className="mt-3 text-[17px] leading-[1.65] text-[var(--color-ink-secondary)]">{summary.body}</p>
			</section>

			<div className="grid gap-3.5 sm:grid-cols-3">
				<div className={tile}>
					<div className="text-[13px] text-[var(--color-ink-muted)]">Current phase</div>
					{cur ? (
						<>
							<div className="mt-1 text-lg font-semibold">
								{cur.id}. {cur.name}
							</div>
							<Link
								href={`/studies/${study.id}/steps?phase=${cur.id}`}
								className="mt-3 inline-block rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
							>
								{started ? "Continue" : "Start"}
							</Link>
						</>
					) : (
						<div className="mt-1 text-lg font-semibold">{study.snapshot?.phaseLabel ?? "No phases yet"}</div>
					)}
				</div>
				<div className={tile}>
					<div className="text-[13px] text-[var(--color-ink-muted)]">Days</div>
					{study.daysSold != null ? (
						<>
							<div className="mt-1 text-lg font-semibold">
								{days(used)} of {days(study.daysSold)} sold
							</div>
							<div className="mt-3.5 h-2 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-elevated)]">
								<div
									className={used > study.daysSold ? "h-2 bg-[var(--color-negative)]" : "h-2 bg-[var(--color-accent)]"}
									style={{ width: `${Math.min((used / study.daysSold) * 100, 100)}%` }}
								/>
							</div>
						</>
					) : (
						<div className="mt-1 text-lg font-semibold">[days sold]</div>
					)}
				</div>
				<div className={tile}>
					<div className="text-[13px] text-[var(--color-ink-muted)]">To clarify</div>
					<div className="mt-1 text-lg font-semibold">{open.length ? `${plural(open.length, "point")} with the client` : "Nothing open"}</div>
					<div className="mt-2.5 flex flex-wrap gap-1.5">
						{open.map((c) => (
							<span key={c.id} className="rounded-[var(--radius-sm)] bg-[var(--color-attention-bg)] px-2.5 py-1.5 text-sm text-[var(--color-attention)]">
								{c.label}
							</span>
						))}
					</div>
				</div>
			</div>

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

			<section aria-labelledby="known" className={tile}>
				<h2 id="known" className="font-[family-name:var(--font-body)] text-[15px] font-semibold">
					Known to Claude
				</h2>
				<p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">
					Claude finds this study by its code and reads the same as this page, through Martine. Nothing else.
				</p>
				<dl className="mt-3 grid grid-cols-[130px_minmax(0,1fr)] gap-x-3.5 gap-y-2 text-sm">
					{knownToClaude(study, views).map((item) => (
						<div key={item.label} className="contents">
							<dt className="text-[var(--color-ink-muted)]">{item.label}</dt>
							<dd className="m-0 flex flex-wrap items-baseline gap-x-2">
								<span>{item.detail}</span>
								{item.ref && <code className="text-[12px] text-[var(--color-ink-muted)]">{item.ref}</code>}
							</dd>
						</div>
					))}
				</dl>
			</section>
		</div>
	);
}
