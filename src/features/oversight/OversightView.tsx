"use client";

import { TopBand } from "@/shared/components/layout/TopBand";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodFile, phaseDays, phaseId } from "@/shared/lib/data";
import { dayRange, days, plural } from "@/shared/lib/format";
import { daysActual, daysPlanned, phaseViews } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

// The trend report steps the brief tracks, by phase of the method file.
const TRACKED = [
	{ label: "Queries", phase: "2" },
	{ label: "Measurement", phase: "3" },
	{ label: "Sample and verbatims", phase: "4" },
	{ label: "Deck", phase: "7" },
];

function median(values: number[]): number | null {
	if (!values.length) return null;
	const s = [...values].sort((a, b) => a - b);
	const mid = Math.floor(s.length / 2);
	return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Real days spent on a completed phase of a study (time entered per task).
function phaseActual(study: Study, phase: string): number | null {
	const v = phaseViews(study).find((p) => p.id === phase);
	if (!v || v.status !== "done") return null;
	return v.tasks.reduce((n, t) => n + (t.state.days ?? 0), 0) + v.added.reduce((n, t) => n + (t.days ?? 0), 0);
}

// Days sold, planned and actual by study, then where the time goes. A figure
// that is not measured yet stays in brackets, never shown as zero.
export function OversightView() {
	const { studies } = useMartine();
	const rows = studies.filter((s) => s.daysSold != null && (s.snapshot || daysActual(s) > 0));
	const inProgress = studies.filter((s) => s.status !== "delivered" && (s.snapshot || daysActual(s) > 0)).length;
	const over = rows.filter((s) => daysActual(s) > (s.daysSold ?? Infinity)).length;
	const trend = studies.filter((s) => s.method.id === "trend_report");
	const file = methodFile("trend_report");

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Oversight</div>
				<div className="text-sm text-[var(--color-ink-muted)]">Time and budget across studies</div>
			</TopBand>
			<div className="mx-auto flex max-w-[1120px] flex-col gap-5 px-6 py-8">
				<section aria-labelledby="sum" className={`${card} px-[26px] py-6`}>
					<div className="text-[13px] font-semibold text-[var(--color-accent)]">This quarter</div>
					<h1 id="sum" className="mt-1.5 font-[family-name:var(--font-heading)] text-[28px] font-medium leading-tight">
						{plural(inProgress, "study", "studies")} in progress; {over} over the days sold.
					</h1>
					<p className="mt-2 text-[15px] text-[var(--color-ink-muted)]">
						Actual days add up the time entered on each task. The figures in brackets only exist once time is tracked per step in Martine.
					</p>
				</section>

				<section aria-labelledby="by-study" className={`${card} overflow-x-auto`}>
					<h2 id="by-study" className="m-0 px-5 pt-4 font-[family-name:var(--font-body)] text-[17px] font-semibold">
						Days sold, planned and actual, by study
					</h2>
					<table className="mt-2 w-full min-w-[640px] border-collapse text-[15px]">
						<thead>
							<tr className="border-b border-[var(--color-border)] text-left text-[13px] text-[var(--color-ink-muted)]">
								<th className="px-5 py-2.5 font-semibold">Study</th>
								<th className="px-3 py-2.5 text-right font-semibold">Sold</th>
								<th className="px-3 py-2.5 text-right font-semibold">Planned</th>
								<th className="px-3 py-2.5 text-right font-semibold">Actual</th>
								<th className="w-[30%] px-5 py-2.5 font-semibold">Used</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((s) => {
								const actual = daysActual(s);
								const sold = s.daysSold ?? 0;
								const planned = daysPlanned(s);
								const isOver = actual > sold;
								return (
									<tr key={s.id} className="border-b border-[var(--color-border)] last:border-b-0">
										<td className="px-5 py-3">
											<span className="font-semibold">{s.short}</span>
											<span className="ml-2 font-mono text-[12px] text-[var(--color-ink-muted)]">{s.id}</span>
										</td>
										<td className="px-3 py-3 text-right">{days(sold)} d</td>
										<td className="px-3 py-3 text-right">{planned ? dayRange(planned.min, planned.max) : "[x] d"}</td>
										<td className="px-3 py-3 text-right">{days(actual)} d</td>
										<td className="px-5 py-3">
											<div className="flex items-center gap-2.5">
												<div className="h-2 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-elevated)]">
													<div
														className={isOver ? "h-2 bg-[var(--color-negative)]" : "h-2 bg-[var(--color-accent)]"}
														style={{ width: `${Math.min((actual / sold) * 100, 100)}%` }}
													/>
												</div>
												{isOver && (
													<span className="whitespace-nowrap text-sm font-semibold text-[var(--color-negative)]">
														{days(actual - sold)} d over
													</span>
												)}
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</section>

				<section aria-labelledby="where" className={`${card} p-5`}>
					<h2 id="where" className="m-0 font-[family-name:var(--font-body)] text-[17px] font-semibold">
						Where the time goes: trend reports
					</h2>
					<p className="m-0 mt-0.5 text-sm text-[var(--color-ink-muted)]">Median actual time per step, against the method’s planned range.</p>
					<dl className="m-0 mt-4 grid gap-3 sm:grid-cols-4">
						{TRACKED.map((t) => {
							const p = file?.phases.find((x) => phaseId(x) === t.phase);
							const range = p ? phaseDays(p) : null;
							const values = trend.map((s) => phaseActual(s, t.phase)).filter((v): v is number => v != null);
							const med = median(values);
							return (
								<div key={t.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3">
									<dt className="text-[13px] text-[var(--color-ink-muted)]">{t.label}</dt>
									<dd className="m-0 mt-0.5">
										<span className="text-xl font-semibold">{med == null ? "[x] d" : `${days(med)} d`}</span>
										<span className="block text-[13px] text-[var(--color-ink-muted)]">
											planned {range ? dayRange(range.min, range.max) : "[x] d"}
											{values.length > 0 && `, ${plural(values.length, "study", "studies")}`}
										</span>
									</dd>
								</div>
							);
						})}
					</dl>
				</section>
			</div>
		</>
	);
}
