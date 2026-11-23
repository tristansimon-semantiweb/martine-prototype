"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { FamilyPill } from "@/shared/components/ui/Family";
import { useMartine } from "@/shared/hooks/useMartine";
import { personById } from "@/shared/lib/data";
import { dueDate, plural } from "@/shared/lib/format";
import { currentPhase, phaseLabelForCard, phaseViews, progress } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";

// A milestone is "to approve" when the study's current phase is one the
// consultant validates.
function milestoneToApprove(s: Study): boolean {
	if (s.snapshot) return false;
	const cur = currentPhase(phaseViews(s));
	return Boolean(cur?.milestone && (cur.status === "awaiting" || cur.doneCount > 0));
}

// Server and browser may disagree on the hour: render a fixed greeting first,
// then the real one once mounted (as R&R's Greeting does).
function useGreeting() {
	const h = useSyncExternalStore(noop, () => new Date().getHours(), () => 9);
	return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const noop = () => () => {};

export function MyStudiesView() {
	const { studies, me } = useMartine();
	const greeting = useGreeting();
	const mine = studies.filter((s) => s.status !== "delivered" && s.team.some((m) => m.person === me));
	const inProgress = mine.filter((s) => phaseLabelForCard(s)).length;
	const toApprove = mine.filter(milestoneToApprove).length;
	const firstName = personById(me)?.name.split(" ")[0];

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-2xl font-medium">
					{greeting}, {firstName}
				</div>
				<div className="text-sm text-[var(--color-ink-muted)]">
					{plural(inProgress, "study", "studies")} in progress
					{toApprove > 0 && `, ${plural(toApprove, "milestone")} to approve`}
				</div>
			</TopBand>

			<div className="mx-auto flex max-w-[880px] flex-col gap-5 px-6 py-10">
				<div className="flex flex-wrap items-center gap-4">
					<h1 className="flex-1 font-[family-name:var(--font-heading)] text-[34px] font-medium">My studies</h1>
					<Link
						href="/studies/new"
						className="rounded-[var(--radius)] bg-[var(--color-accent)] px-5 py-3 font-semibold text-white shadow-[var(--shadow-sm)] hover:opacity-90"
					>
						New study
					</Link>
				</div>

				{mine.map((s) => {
					const phase = phaseLabelForCard(s);
					return (
						<Link
							key={s.id}
							href={`/studies/${s.id}`}
							className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[22px] py-5 shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--color-border-hover)]"
						>
							<div className="flex flex-wrap items-baseline gap-2">
								<span className="flex-1 text-[19px] font-semibold">{s.title}</span>
								<span className="text-sm text-[var(--color-ink-muted)]">due {dueDate(s.due)}</span>
							</div>
							<div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink-secondary)]">
								<FamilyPill family={s.family} />
								<span>{s.client}</span>
								{milestoneToApprove(s) && (
									<span className="rounded-[var(--radius-xl)] bg-[var(--color-attention-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-attention)]">
										milestone to approve
									</span>
								)}
							</div>
							{phase ? (
								<div className="mt-4 flex items-center gap-3">
									<div
										className="h-2 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-elevated)]"
										role="progressbar"
										aria-label="Progress"
										aria-valuenow={Math.round(progress(s) * 100)}
										aria-valuemin={0}
										aria-valuemax={100}
									>
										<div className="h-2 bg-[var(--color-accent)]" style={{ width: `${Math.max(progress(s) * 100, 4)}%` }} />
									</div>
									<span className="text-sm">{phase}</span>
								</div>
							) : (
								<div className="mt-4 text-sm text-[var(--color-ink-muted)]">Not started yet</div>
							)}
						</Link>
					);
				})}
			</div>
		</>
	);
}
