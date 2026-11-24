"use client";

import { Check, ChevronDown } from "lucide-react";
import { Popover } from "@/shared/components/ui/Popover";
import { cn } from "@/shared/lib/cn";
import { PHASE_STATUS } from "@/shared/lib/studyModel";
import type { PhaseStatus } from "@/shared/lib/types";

const ORDER: PhaseStatus[] = ["to_start", "in_progress", "done", "not_needed"];

// Each status reads by its word first; the colour only backs it up.
const TONE: Record<PhaseStatus, string> = {
	to_start: "border-[var(--color-border-hover)] bg-[var(--color-surface)] text-[var(--color-ink-secondary)]",
	in_progress: "border-transparent bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
	done: "border-transparent bg-[var(--color-positive-bg)] text-[var(--color-positive)]",
	not_needed: "border-dashed border-[var(--color-border-hover)] bg-transparent text-[var(--color-ink-muted)]",
};

export function StatusPill({ status, className, trailing }: { status: PhaseStatus; className?: string; trailing?: React.ReactNode }) {
	return (
		<span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-xl)] border px-2.5 py-0.5 text-[13px] font-semibold", TONE[status], className)}>
			{status === "done" && <Check size={12} aria-hidden />}
			{PHASE_STATUS[status]}
			{trailing}
		</span>
	);
}

// The phase's status as a pill; the team changes it from a short list.
export function PhaseStatusPicker({
	status,
	canEdit,
	onChange,
	label,
}: {
	status: PhaseStatus;
	canEdit: boolean;
	onChange: (s: PhaseStatus) => void;
	label: string; // "Status of phase 2"
}) {
	if (!canEdit) return <StatusPill status={status} />;
	return (
		<Popover
			align="end"
			width={190}
			trigger={({ open, toggle }) => (
				<button onClick={toggle} aria-expanded={open} aria-label={`${label}: ${PHASE_STATUS[status]}. Change`} className="rounded-[var(--radius-xl)] hover:opacity-80">
					<StatusPill status={status} trailing={<ChevronDown size={12} aria-hidden className="opacity-70" />} />
				</button>
			)}
		>
			{(close) => (
				<ul role="listbox" aria-label={label} className="m-0 list-none p-0">
					{ORDER.map((s) => (
						<li key={s}>
							<button
								role="option"
								aria-selected={s === status}
								onClick={() => {
									onChange(s);
									close();
								}}
								className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[var(--color-hover)]"
							>
								<StatusPill status={s} />
								{s === status && <Check size={14} aria-hidden className="ml-auto text-[var(--color-ink-muted)]" />}
							</button>
						</li>
					))}
				</ul>
			)}
		</Popover>
	);
}
