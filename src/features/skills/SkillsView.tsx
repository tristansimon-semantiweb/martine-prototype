"use client";

import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { SkillStatusBadge } from "@/shared/components/ui/SkillStatus";
import { useMartine } from "@/shared/hooks/useMartine";
import { allSkills, methodEntry, personById } from "@/shared/lib/data";
import { toolById } from "@/shared/lib/tools";
import type { CatalogSkill } from "@/shared/lib/types";
import { plural } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { skillUsage } from "@/features/tools/toolUsage";

// The skills: what Claude knows how to do for a task, and the steps of each
// study type that name them. Same source as the catalog drawer.
export function SkillsView() {
	const { drafts, role } = useMartine();
	// Requests stay in their own list until the tech team makes them available.
	const pending = (sk: CatalogSkill) => Boolean(sk.request) && sk.status !== "validated";
	const requests = allSkills().filter(pending);
	const rows = allSkills()
		.filter((sk) => !pending(sk))
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
				{requests.length > 0 && (
					<section aria-labelledby="requests" className="flex flex-col gap-2">
						<h2 id="requests" className="m-0 font-[family-name:var(--font-body)] text-lg font-semibold">
							{role === "skills_owner" ? "Requests waiting for the tech team" : "Requests: skills and automations"}
						</h2>
						<ul className="m-0 list-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-xs)]">
							{requests.map((r) => (
								<li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--color-border)] px-5 py-3 last:border-b-0">
									<Link href={`/skills/${r.id}`} className="min-w-[220px] flex-1 font-semibold text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
										{r.label}
										<span className="ml-2 text-[13px] font-normal text-[var(--color-ink-muted)]">{r.request!.kind === "automation" ? "automation" : "skill"}</span>
										<span className="block text-[13px] font-normal text-[var(--color-ink-muted)]">
											{methodEntry(r.request!.method)?.name}, requested by {personById(r.request!.by)?.name.split(" ")[0]}
										</span>
									</Link>
									<span className="text-sm text-[var(--color-ink-muted)]">
										{r.request!.connectors.length ? `Connectors: ${r.request!.connectors.map((t) => toolById(t)?.label ?? t).join(", ")}` : "No connector to build"}
									</span>
									<SkillStatusBadge status={r.status} />
								</li>
							))}
						</ul>
					</section>
				)}
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
										{s.request && <div className="text-[12px] text-[var(--color-ink-muted)]">requested from “{s.request.taskName}”</div>}
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
