"use client";

import { Sheet } from "@/shared/components/ui/Sheet";
import Link from "next/link";
import { Check, ExternalLink, X } from "lucide-react";
import { methodFile } from "@/shared/lib/data";
import { otherToolItems, toolById } from "@/shared/lib/tools";
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

// One tool of a task, as a button that opens the tool (its public address,
// in a new tab), or its page in the repository for internal tools.
// A link to confirm (read in the task's text, not named in its Tools column)
// shows dashed, with "to confirm"; the method owner confirms it in one click.
export function ToolChip({
	id,
	isNew,
	toConfirm,
	onUnlink,
	onConfirm,
}: {
	id: string;
	isNew?: boolean;
	toConfirm?: boolean;
	onUnlink?: (id: string) => void;
	onConfirm?: (id: string) => void;
}) {
	const t = toolById(id);
	const parent = t?.part_of ? toolById(t.part_of) : undefined;
	const label = (
		<>
			<span>
				{t?.label ?? id}
				{parent && <span className="font-normal text-[var(--color-ink-muted)]">, {parent.label}</span>}
			</span>
			{isNew && <span className="font-normal text-[var(--color-ink-muted)]"> (new)</span>}
			{toConfirm && <span className="font-normal text-[var(--color-attention)]"> to confirm</span>}
			{t?.url && <ExternalLink size={12} aria-hidden className="text-[var(--color-ink-muted)]" />}
		</>
	);
	const cls = "inline-flex items-center gap-1 px-2.5 py-1 font-medium text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]";
	return (
		<span
			title={toConfirm ? "Read in the task’s text, not in its Tools column: the method owner confirms it" : undefined}
			className={`inline-flex items-center rounded-[var(--radius-sm)] border bg-[var(--color-surface)] text-[13px] hover:border-[var(--color-accent)] ${toConfirm ? "border-dashed border-[var(--color-border-active)]" : "border-[var(--color-border-hover)] shadow-[var(--shadow-xs)]"}`}
		>
			{t?.url ? (
				<a href={t.url} target="_blank" rel="noopener noreferrer" title={`Open ${t.label}`} className={cls}>
					{label}
				</a>
			) : (
				<Link href={`/tools/${id}`} title={`${t?.label ?? id}: internal tool`} className={cls}>
					{label}
				</Link>
			)}
			{toConfirm && onConfirm && (
				<button
					onClick={() => onConfirm(id)}
					aria-label={`Confirm ${t?.label ?? id}`}
					title="Confirm this link"
					className="-ml-1 px-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-positive)]"
				>
					<Check size={12} aria-hidden />
				</button>
			)}
			{onUnlink && (
				<button onClick={() => onUnlink(id)} aria-label={`Unlink ${t?.label ?? id}`} className="-ml-1 px-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-negative)]">
					<X size={12} aria-hidden />
				</button>
			)}
		</span>
	);
}

// A task's tools: the repository tools it is linked to (links to their page,
// removable by the method owner), then what else the Tools column names
// (documents, sources) as plain text.
export function ToolList({
	task,
	onUnlink,
	onConfirm,
	newIds = [],
	toConfirm = [],
	children,
}: {
	task: MethodTask;
	onUnlink?: (toolId: string) => void;
	onConfirm?: (toolId: string) => void;
	newIds?: string[];
	toConfirm?: string[];
	children?: React.ReactNode;
}) {
	const others = otherToolItems(task);
	return (
		<span className="flex flex-wrap items-center gap-1.5">
			{task.tool_ids.map((id) => (
				<ToolChip key={id} id={id} isNew={newIds.includes(id)} toConfirm={toConfirm.includes(id)} onUnlink={onUnlink} onConfirm={onConfirm} />
			))}
			{others.map((o) => (
				<span key={o} title="Named in the method file, not a tool of the repository" className="px-1 text-[13px] text-[var(--color-ink-secondary)]">
					{o}
				</span>
			))}
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
