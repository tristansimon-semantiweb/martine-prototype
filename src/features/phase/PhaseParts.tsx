"use client";

import { Sheet } from "@/shared/components/ui/Sheet";
import { catalog } from "@/shared/lib/data";
import type { MethodTask } from "@/shared/lib/types";

// The pieces a phase drawer is made of, shared by the study (read and tick)
// and the method (edit): the brief asks for "the same drawer, in edit mode".

export function PhaseSheet({
	open,
	onClose,
	kicker,
	title,
	footer,
	children,
}: {
	open: boolean;
	onClose: () => void;
	kicker: React.ReactNode;
	title: string;
	footer?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<Sheet
			open={open}
			onClose={onClose}
			width={640}
			label={title}
			footer={footer}
			header={
				<>
					<div className="text-sm text-[var(--color-ink-muted)]">{kicker}</div>
					<h2 className="mt-1 font-[family-name:var(--font-heading)] text-[30px] font-medium">{title}</h2>
				</>
			}
		>
			<div className="flex flex-col gap-[18px]">{children}</div>
		</Sheet>
	);
}

// The Tools column of the method file mixes apps, documents and skills
// ("Talkwalker, Queries tab, building-talkwalker-queries skill"). Skills show
// on their own (Open in Claude); the rest are chips.
export function toolChips(task: MethodTask): { label: string; kind: "tool" | "document" | "other" }[] {
	return task.tools
		.split(/,\s*/)
		.map((t) => t.trim())
		.filter((t) => t && !/\bskills?\b/i.test(t) && !task.skills.includes(t))
		.map((label) => {
			const lower = label.toLowerCase();
			if (catalog.tools.some((x) => x.label.toLowerCase() === lower)) return { label, kind: "tool" as const };
			if (catalog.documents.some((d) => d.toLowerCase().startsWith(lower))) return { label, kind: "document" as const };
			return { label, kind: "other" as const };
		});
}

export function Chip({ children, title }: { children: React.ReactNode; title?: string }) {
	return (
		<span title={title} className="rounded-[var(--radius-xl)] border border-[var(--color-border-hover)] px-2.5 py-0.5 text-[13px]">
			{children}
		</span>
	);
}

// The four columns of the method file, as a definition list.
export function TaskFields({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
	return (
		<dl className="m-0 grid grid-cols-[130px_minmax(0,1fr)] gap-x-3.5 gap-y-2.5 text-[15px] leading-normal max-sm:grid-cols-1">
			{rows.map((r) => (
				<div key={r.label} className="contents">
					<dt className="text-[var(--color-ink-muted)]">{r.label}</dt>
					<dd className="m-0">{r.value}</dd>
				</div>
			))}
		</dl>
	);
}

export function ownerLabel(owner: string) {
	return owner.toLowerCase();
}
