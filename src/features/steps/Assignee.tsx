"use client";

import { Check, UserPlus } from "lucide-react";
import { Popover } from "@/shared/components/ui/Popover";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { personById } from "@/shared/lib/data";
import { cn } from "@/shared/lib/cn";
import type { Study } from "@/shared/lib/types";

// Who is in charge of a phase: an avatar, or a dashed "Assign"; the list is
// the study's team. Anyone on the study can assign.
export function Assignee({ study, phase, phaseName, withName }: { study: Study; phase: string; phaseName: string; withName?: boolean }) {
	const { assignPhase } = useMartine();
	const toast = useToast();
	const current = study.state.assignees?.[phase];
	const person = current ? personById(current) : undefined;

	return (
		<Popover
			align={withName ? "start" : "end"}
			width={240}
			trigger={({ open, toggle }) => (
				<button
					onClick={(e) => {
						e.stopPropagation();
						toggle();
					}}
					aria-expanded={open}
					aria-label={person ? `${phaseName}: assigned to ${person.name}. Change` : `Assign ${phaseName}`}
					title={person ? `Assigned to ${person.name}` : "Assign"}
					className="inline-flex items-center gap-2 rounded-full text-sm hover:opacity-80"
				>
					{person ? (
						<span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-elevated)] text-[11px] font-bold text-[var(--color-ink-secondary)] ring-1 ring-[var(--color-border-hover)]">
							{person.initials}
						</span>
					) : (
						<span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-[var(--color-border-active)] text-[var(--color-ink-muted)]">
							<UserPlus size={14} aria-hidden />
						</span>
					)}
					{withName && <span className={cn(!person && "text-[var(--color-ink-muted)]")}>{person ? person.name : "Assign"}</span>}
				</button>
			)}
		>
			{(close) => (
				<ul role="listbox" aria-label={`Assign ${phaseName}`} className="m-0 list-none p-0 text-sm" onClick={(e) => e.stopPropagation()}>
					{study.team.map((m) => {
						const p = personById(m.person);
						if (!p) return null;
						return (
							<li key={m.person}>
								<button
									role="option"
									aria-selected={current === m.person}
									onClick={() => {
										assignPhase(study.id, phase, m.person);
										toast(`${p.name} assigned to “${phaseName}”`);
										close();
									}}
									className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[var(--color-hover)]"
								>
									<span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-elevated)] text-[10px] font-bold">{p.initials}</span>
									<span className="flex-1">{p.name}</span>
									{current === m.person && <Check size={14} aria-hidden className="text-[var(--color-ink-muted)]" />}
								</button>
							</li>
						);
					})}
					{current && (
						<li className="mt-1 border-t border-[var(--color-border)] pt-1">
							<button
								onClick={() => {
									assignPhase(study.id, phase, null);
									close();
								}}
								className="w-full rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)]"
							>
								Unassigned
							</button>
						</li>
					)}
				</ul>
			)}
		</Popover>
	);
}
