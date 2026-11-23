"use client";

import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { SkillStatusBadge } from "@/shared/components/ui/SkillStatus";
import { useMartine } from "@/shared/hooks/useMartine";
import { catalog } from "@/shared/lib/data";
import { plural } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { skillUsage } from "@/features/tools/toolUsage";

// The skills: what Claude knows how to do for a task, and the steps of each
// study type that name them. Same source as the catalog drawer.
export function SkillsView() {
	const { drafts } = useMartine();
	const rows = catalog.skills
		.map((s) => {
			const uses = skillUsage(s.id, drafts);
			return { s, steps: uses.length, types: new Set(uses.map((u) => u.methodId)).size };
		})
		.sort((a, b) => b.steps - a.steps);

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Skills</div>
				<div className="text-sm text-[var(--color-ink-muted)]">What Claude does for a task, and the steps of each study type that use it</div>
			</TopBand>
			<div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-6 py-7">
				<div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
					<table className="w-full min-w-[760px] border-collapse text-[15px]">
						<thead>
							<tr className="border-b border-[var(--color-border)] text-left text-[13px] text-[var(--color-ink-muted)]">
								<th className="px-5 py-3 font-semibold">Skill</th>
								<th className="px-3 py-3 font-semibold">What it does</th>
								<th className="px-3 py-3 font-semibold">Status</th>
								<th className="px-5 py-3 font-semibold">Used in</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(({ s, steps, types }) => (
								<tr key={s.id} className="border-b border-[var(--color-border)] align-top last:border-b-0 hover:bg-[var(--color-hover)]">
									<td className="px-5 py-3">
										<Link href={`/skills/${s.id}`} className="font-semibold text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
											{s.label}
										</Link>
										<div className="font-mono text-[12px] text-[var(--color-ink-muted)]">{s.id}</div>
									</td>
									<td className={cn("max-w-[420px] px-3 py-3 text-sm", s.does.startsWith("[") ? "text-[var(--color-ink-muted)]" : "text-[var(--color-ink-secondary)]")}>{s.does}</td>
									<td className="px-3 py-3">
										<SkillStatusBadge status={s.status} />
									</td>
									<td className={cn("whitespace-nowrap px-5 py-3 text-sm", steps === 0 && "text-[var(--color-ink-muted)]")}>
										{steps === 0 ? "No step yet" : `${plural(steps, "step")}, ${plural(types, "study type")}`}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p className="m-0 text-sm text-[var(--color-ink-muted)]">
					A study type’s owner adds a skill to a step from the catalog, in the method’s draft.
				</p>
			</div>
		</>
	);
}
