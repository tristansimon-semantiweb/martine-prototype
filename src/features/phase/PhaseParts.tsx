"use client";

import { Sheet } from "@/shared/components/ui/Sheet";
import { catalog, methodFile } from "@/shared/lib/data";
import { dayRange } from "@/shared/lib/format";
import type { MethodFormat, MethodTask } from "@/shared/lib/types";

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

export function formatOf(methodId: string): MethodFormat {
	return methodFile(methodId)?._meta.format ?? "tasks";
}

// "1 to 2 d" from the figures, else the time as the method file writes it.
export function taskTime(task: MethodTask): string | null {
	if (task.days_min != null) return dayRange(task.days_min, task.days_max ?? task.days_min);
	return task.time ?? null;
}

// "1 to 2 d, analyst", leaving out what the method file doesn't give.
export function taskMeta(task: MethodTask): string {
	return [taskTime(task), task.owner && ownerLabel(task.owner)].filter(Boolean).join(", ");
}

// A field written as one point per line (steps format).
export function Lines({ text, tone }: { text: string; tone?: "attention" }) {
	const lines = text.split("\n").filter(Boolean);
	const cls = tone === "attention" ? "text-[var(--color-attention)]" : undefined;
	if (lines.length < 2) return <span className={cls}>{text}</span>;
	return (
		<ul className={`m-0 flex list-disc flex-col gap-1 pl-5 ${cls ?? ""}`}>
			{lines.map((l, i) => (
				<li key={i}>{l}</li>
			))}
		</ul>
	);
}

// The rows a task shows, by format. Each row's value can be replaced (an
// editor, the tools with their skills) through `slots`.
type Slot = "how" | "tools" | "check" | "output" | "what" | "watch_out";
export function taskRows(task: MethodTask, format: MethodFormat, slots: Partial<Record<Slot, React.ReactNode>> = {}) {
	const empty = <span className="text-[var(--color-ink-muted)]">[not in the method file]</span>;
	const v = (k: Slot, node: React.ReactNode, has: boolean) => (k in slots ? slots[k] : has ? node : empty);
	if (format === "steps") {
		return [
			{ label: "What", value: v("what", task.what, Boolean(task.what)) },
			{ label: "How", value: v("how", <Lines text={task.how} />, Boolean(task.how)) },
			{ label: "Watch out", value: v("watch_out", <Lines text={task.watch_out ?? ""} tone="attention" />, Boolean(task.watch_out)) },
			// Tools are read from the step's text (the SML file has no Tools column).
			...("tools" in slots ? [{ label: "Tools", value: slots.tools }] : task.tools ? [{ label: "Tools", value: task.tools }] : []),
			{ label: "Deliverable", value: v("output", task.output, Boolean(task.output)) },
		].filter((r) => !(r.label === "Watch out" && !task.watch_out && !("watch_out" in slots)));
	}
	return [
		{ label: "How to do it", value: v("how", task.how, Boolean(task.how)) },
		{ label: "Tools", value: v("tools", task.tools, Boolean(task.tools)) },
		{ label: "Check before moving on", value: v("check", task.check, Boolean(task.check)) },
		{ label: "Output", value: v("output", task.output, Boolean(task.output)) },
	];
}
