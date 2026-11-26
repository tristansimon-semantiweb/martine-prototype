"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TopBand } from "@/shared/components/layout/TopBand";
import { PillTabs } from "@/shared/components/layout/PillTabs";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry } from "@/shared/lib/data";
import { dueDate } from "@/shared/lib/format";
import { methodLabel } from "@/shared/lib/martineContext";

// The study header and its tabs, shared by Overview, Steps, Files and Team;
// tomorrow, Corpus too (the analysis then happens in the Explorer, its own
// application).
// The header shows the study's identifier and method version: what the
// Martine connector knows it by.
export function StudyFrame({ id, children }: { id: string; children: React.ReactNode }) {
	const pathname = usePathname();
	const { studies, tomorrow } = useMartine();
	const study = studies.find((s) => s.id === id);

	if (!study) {
		return (
			<>
				<TopBand>
					<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Study not found</div>
				</TopBand>
				<div className="mx-auto max-w-[820px] px-6 py-10 text-[var(--color-ink-secondary)]">
					No study {id} in this prototype. <Link href="/">Back to the studies</Link>
				</div>
			</>
		);
	}

	const method = methodEntry(study.method.id);
	const base = `/studies/${study.id}`;
	const onSteps = pathname === `${base}/steps`;

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">{study.title}</div>
				<div className="flex flex-wrap items-center gap-x-2 text-sm text-[var(--color-ink-muted)]">
					<span>
						{method?.name ?? "Study"} for {study.client}, due {dueDate(study.due)}
					</span>
					<span
						className="rounded-[var(--radius-xs)] bg-[var(--color-elevated)] px-1.5 py-px font-mono text-[12px] text-[var(--color-ink-secondary)]"
						title="The study’s identifier: Martine, Claude and the data platform know it by this code"
					>
						{study.id} · {methodLabel(study)}
					</span>
				</div>
			</TopBand>
			<PillTabs
				label="Study tabs"
				items={[
					{ href: base, label: "Overview" },
					{ href: `${base}/steps`, label: "Steps" },
					...(tomorrow ? [{ href: `${base}/corpus`, label: "Corpus" }] : []),
					{ href: `${base}/files`, label: "Files" },
					{ href: `${base}/team`, label: "Team" },
				]}
				aside={
					onSteps && method?.version ? (
						<Link href={`/study-types/${method.id}`} className="text-[var(--color-ink-muted)]">
							Method: {method.name.toLowerCase()} v{study.method.version}, owned by {method.owner ?? "[to name]"}
						</Link>
					) : (
						<Link href="/" className="text-[var(--color-ink-muted)]">
							All studies
						</Link>
					)
				}
			/>
			{children}
		</>
	);
}
