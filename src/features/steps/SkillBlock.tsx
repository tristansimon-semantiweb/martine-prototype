"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { skillById, personById } from "@/shared/lib/data";
import { openInClaudeUrl, refs, whatClaudeReads } from "@/shared/lib/martineContext";
import type { PhaseView } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";

// A skill named in the task's Tools: what it does, what Claude receives, and
// Open in Claude. The link carries identifiers only; "What Claude reads" lists
// what Claude then fetches through the Martine connector.
export function SkillBlock({ study, phase, taskKey, skillId }: { study: Study; phase: PhaseView; taskKey: string; skillId: string }) {
	const [open, setOpen] = useState(false);
	const skill = skillById(skillId);
	const note = study.state.notes[phase.id];
	const reads = whatClaudeReads(study, phase, taskKey);
	const task = phase.tasks.find((t) => t.key === taskKey)?.task;

	return (
		<div className="rounded-[var(--radius)] bg-[var(--color-accent-dim)] px-3 py-2.5">
			<div className="flex flex-wrap items-center gap-2.5">
				<div className="min-w-[240px] flex-1 text-sm">
					<span className="font-bold text-[var(--color-accent)]">Skill: {skill?.label ?? skillId}.</span> {skill?.does}
					<br />
					<span className="text-[var(--color-ink-secondary)]">
						Claude receives the study {refs.study(study)}: the brief, this {task?.check ? "task and its check" : "step and its points of attention"}
						{note ? `, ${personById(note.by)?.name.split(" ")[0]}’s note` : ""}, and the study’s data on the data platform.
					</span>
				</div>
				<a
					href={openInClaudeUrl(study, phase, taskKey, skillId)}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
				>
					Open in Claude <ExternalLink size={13} aria-hidden />
				</a>
			</div>
			<button
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-accent)]"
			>
				What Claude reads
				<ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} aria-hidden />
			</button>
			{open && (
				<ul className="mt-1.5 flex flex-col gap-1 border-t border-[var(--color-accent)]/15 pt-2 text-[13px]">
					{reads.map((r) => (
						<li key={r.label} className="flex flex-wrap gap-x-1.5">
							<span className="font-semibold">{r.label}:</span>
							<span className="text-[var(--color-ink-secondary)]">{r.detail}</span>
							{r.ref && <code className="text-[11px] text-[var(--color-ink-muted)]">{r.ref}</code>}
						</li>
					))}
					<li className="pt-1 text-[var(--color-ink-muted)]">The link itself only carries the codes; the brief’s text never leaves Martine through it.</li>
				</ul>
			)}
		</div>
	);
}
