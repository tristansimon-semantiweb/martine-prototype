"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { personById } from "@/shared/lib/data";
import { costedDays } from "@/shared/lib/format";
import { walkthroughUrl } from "@/shared/lib/martineContext";
import type { PhaseView } from "@/shared/lib/studyModel";
import type { RoleId, Study } from "@/shared/lib/types";
import { AddRow, CanDo, InlineEdit } from "@/shared/components/ui/Editing";
import { ownerLabel } from "@/features/phase/PhaseParts";
import { PhaseDocument } from "@/features/files/Documents";
import { PhaseStatusPicker } from "./PhaseStatus";
import { TaskPipeline } from "./TaskPipeline";
import { TaskDetail } from "./TaskDetail";
import { Assignee } from "./Assignee";
import { CorpusStrip } from "@/features/corpus/CorpusStrip";
import { corpusRole } from "@/shared/lib/corpus";

// A phase of a study, on the full width of the page: where it stands and what
// it works in, the team's note, then its tasks as a run, top to bottom. A
// task's detail opens over it. "Walk me through in Claude" takes the whole
// phase in Claude, task by task.
export function PhasePage({ study, phase }: { study: Study; phase: PhaseView }) {
	const { role, setNote, setPhaseStatus, addTask, tomorrow } = useMartine();
	const [openTask, setOpenTask] = useState<string | null>(null);
	const isConsultant = role === "consultant";
	const note = study.state.notes[phase.id];
	const first = (id: string) => personById(id)?.name.split(" ")[0];
	const total = phase.tasks.length + phase.added.length;
	const corpus = tomorrow ? corpusRole(study, phase.id) : undefined;
	const prop = "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]";

	return (
		<article aria-labelledby="phase-title" className="flex min-w-0 flex-col gap-4">
			{/* The phase: what it is, where it stands, the document it works in, the team's note. */}
			<section
				aria-label="This phase"
				className="flex flex-col gap-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)] px-6 py-5"
			>
				<header className="flex flex-wrap items-start gap-x-4 gap-y-3">
					<div className="min-w-0 flex-1">
						<div className="text-sm text-[var(--color-ink-muted)]">{kicker(phase)}</div>
						<h2 id="phase-title" className="m-0 mt-0.5 font-[family-name:var(--font-heading)] text-[28px] font-medium leading-tight">
							{phase.name}
						</h2>
					</div>
					{phase.tasks.length > 0 && (
						<a
							href={walkthroughUrl(study, phase)}
							target="_blank"
							rel="noopener noreferrer"
							title="Claude takes the phase task by task: what to do, the skill to run, the tool to open, the check before the next one"
							className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white no-underline hover:opacity-90"
						>
							<Play size={14} aria-hidden className="fill-current" /> Walk me through in Claude <ExternalLink size={13} aria-hidden />
						</a>
					)}
				</header>
				{/* Three properties, each in its own cell: a small label over its value. */}
				<dl className="m-0 grid rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)] sm:divide-x sm:divide-[var(--color-border)] max-sm:divide-y max-sm:divide-[var(--color-border)]">
					<div className="flex flex-col gap-1.5 px-4 py-3">
						<dt className={prop}>Assigned to</dt>
						<dd className="m-0">
							<Assignee study={study} phase={phase.id} phaseName={phase.name} withName />
						</dd>
					</div>
					<div className="flex flex-col gap-1.5 px-4 py-3">
						<dt className={prop}>Status</dt>
						<dd className="m-0">
							<PhaseStatusPicker status={phase.status} canEdit onChange={(s) => setPhaseStatus(study.id, phase.id, s)} label={`Status of phase ${phase.id}`} />
						</dd>
					</div>
					{!phase.addedBy && (
						<div className="flex flex-col gap-1.5 px-4 py-3">
							<dt className={prop}>Document</dt>
							<dd className="m-0">
								<PhaseDocument study={study} phase={phase.id} tasks={phase.tasks.map((t) => t.task)} inline />
							</dd>
						</div>
					)}
				</dl>
				{note ? (
					<div className="border-l-[3px] border-[var(--color-attention)] py-0.5 pl-3.5 text-[15px] leading-normal">
						<div className="mb-0.5 text-[13px] font-bold text-[var(--color-attention)]">Note from {first(note.by)}</div>
						<InlineEdit
							value={note.text}
							onSave={(t) => setNote(study.id, phase.id, t)}
							canEdit={isConsultant}
							label="the note"
							placeholder="Add a note for the team on this phase"
							multiline
						/>
					</div>
				) : (
					isConsultant && (
						<div className="text-sm">
							<InlineEdit value="" onSave={(t) => setNote(study.id, phase.id, t)} canEdit label="the note" placeholder="Add a note for the team on this phase" multiline />
						</div>
					)
				)}
			</section>

			{corpus && <CorpusStrip study={study} phase={phase.id} phaseName={phase.name} role={corpus} />}

			{/* Its tasks, in one card, one row each; adding and what your role can change close it. */}
			<section
				aria-labelledby="tasks-h"
				className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]"
			>
				<h3 id="tasks-h" className="m-0 flex items-baseline gap-2 border-b border-[var(--color-border)] px-6 py-3.5 font-[family-name:var(--font-body)] text-lg font-semibold">
					Tasks <span className="text-sm font-normal text-[var(--color-ink-muted)]">{total}, in order</span>
				</h3>
				{total === 0 ? <p className="m-0 px-6 py-4 text-sm text-[var(--color-ink-muted)]">No task yet.</p> : <TaskPipeline study={study} phase={phase} onOpen={setOpenTask} />}
				<div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-canvas)]/50 px-6 py-3.5">
					{isConsultant && <AddRow label="Add a task for this study" placeholder="What needs doing, for this study only" onAdd={(v) => addTask(study.id, phase.id, v)} />}
					<CanDo can={CAN[role].can} locked={CAN[role].locked} />
				</div>
			</section>

			<TaskDetail study={study} phase={phase} taskKey={openTask} onClose={() => setOpenTask(null)} />
		</article>
	);
}

function kicker(p: PhaseView) {
	const owners = [...new Set(p.tasks.map((t) => ownerLabel(t.task.owner)).filter(Boolean))];
	const owner = owners.length === 1 ? `, ${owners[0]}` : "";
	if (p.addedBy) return `Phase ${p.id}, added for this study by ${personById(p.addedBy)?.name}`;
	return p.days ? `Phase ${p.id}, planned ${p.time ?? costedDays(p.days)}${owner}` : `Phase ${p.id}, not costed in the method${owner}`;
}

// What each role can do in a study's phase, said up front so nothing is a
// guess and nothing silently disappears.
const CAN: Record<RoleId, { can: string; locked: string }> = {
	consultant: {
		can: "You can set the phase’s status, write the note, add, rename or remove tasks for this study, and choose the phase document.",
		locked: "The tasks come from the method: suggest a change from a task.",
	},
	analyst: {
		can: "You can set the phase’s status, choose the phase document, open skills in Claude, suggest a change to a task or request a skill.",
		locked: "The note and the tasks added for this study are the consultant’s.",
	},
	method_owner: {
		can: "You can set the phase’s status and choose the phase document. The method itself is edited in Study types.",
		locked: "The note and the tasks added for this study are the consultant’s.",
	},
	skills_owner: {
		can: "You can set the phase’s status, choose the phase document and follow skill requests in Skills.",
		locked: "The note and the tasks added for this study are the consultant’s.",
	},
};
