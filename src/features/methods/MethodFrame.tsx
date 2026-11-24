"use client";

import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { PillTabs } from "@/shared/components/layout/PillTabs";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry } from "@/shared/lib/data";
import { FamilyPill } from "@/shared/components/ui/Family";

// A study type's header and its tabs, as a study has its own: Overview (what
// the study type is) and Method (its phases and tasks, laid out like Steps).
export function MethodFrame({ id, children }: { id: string; children: React.ReactNode }) {
	const { drafts } = useMartine();
	const m = methodEntry(id);

	if (!m) {
		return (
			<>
				<TopBand>
					<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Study type not found</div>
				</TopBand>
				<div className="mx-auto max-w-[1240px] [&>*]:max-w-[820px] px-6 py-10">
					<Link href="/study-types">Back to the study types</Link>
				</div>
			</>
		);
	}

	const draft = drafts[id];
	const base = `/study-types/${id}`;
	return (
		<>
			<TopBand>
				<div className="text-sm text-[var(--color-ink-muted)]">
					<Link href="/study-types" className="text-[var(--color-ink-muted)]">
						Study types
					</Link>{" "}
					/ {m.name}
				</div>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<span className="font-[family-name:var(--font-heading)] text-[23px] font-medium">{m.name}</span>
					<FamilyPill family={m.family} />
					<span className="text-sm text-[var(--color-ink-muted)]">
						{m.version ? `method v${m.version}${draft ? `, draft v${draft.version}${draft.saved ? " saved" : ""}` : ""}` : "method to document"}
						{m.owner && `, owned by ${m.owner}`}
					</span>
				</div>
			</TopBand>
			<PillTabs
				label="Study type tabs"
				items={[
					{ href: base, label: "Overview" },
					{ href: `${base}/method`, label: "Method" },
				]}
			/>
			{children}
		</>
	);
}
