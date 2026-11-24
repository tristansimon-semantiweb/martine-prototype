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
import { ToolOpenButton, ownerLabel } from "@/features/phase/PhaseParts";
import { PhaseDocument } from "@/features/files/Documents";
import { PhaseStatusPicker } from "./PhaseStatus";
import { TaskPipeline } from "./TaskPipeline";
import { TaskDetail } from "./TaskDetail";

// A phase of a study, on the full width of the page: where it stands and what
// it works in, the team's note, then its tasks as a run, top to bottom. A
// task's detail opens over it. "Walk me through in Claude" takes the whole
// phase in Claude, task by task.
export function PhasePage({ study, phase }: { study: Study; phase: PhaseView }) {
	const { role, setNote, setPhaseStatus, addTask } = useMartine();
	const [openTask, setOpenTask] = useState<string | null>(null);
	const isConsultant = role === "consultant";
	const note = study.state.notes[phase.id];
	const first = (id: string) => personById(id)?.name.split(" ")[0];
	// Every tool the phase's tasks work in, once each: open them from here.
	const tools = [...new Set(phase.tasks.flatMap((t) => t.task.tool_ids))];
	const toConfirm = (id: string) => phase.tasks.every((t) => !t.task.tool_ids.includes(id) || t.task.tool_ids_to_confirm?.includes(id));
	const label = "w-[78px] shrink-0 text-sm text-[var(--color-ink-muted)]";
	const total = phase.tasks.length + phase.added.length;

	return (
		<article aria-labelledby="phase-title" className="flex min-w-0 flex-col gap-5">
			<header className="flex flex-wrap items-start gap-x-4 gap-y-3">
				<div className="min-w-0 flex-1">
					<div className="text-sm text-[var(--color-ink-muted)]">{kicker(phase)}</div>
					<h2 id="phase-title" className="m-0 mt-0.5 font-[family-name:var(--font-heading)] text-[30px] font-medium leading-tight">
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

			<section aria-label="This phase" className="flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
				<div className="flex items-center gap-3">
					<span className={label}>Status</span>
					<PhaseStatusPicker status={phase.status} canEdit onChange={(s) => setPhaseStatus(study.id, phase.id, s)} label={`Status of phase ${phase.id}`} />
				</div>
				{!phase.addedBy && (
					<div className="flex items-center gap-3">
						<span className={label}>Document</span>
						<PhaseDocument study={study} phase={phase.id} tasks={phase.tasks.map((t) => t.task)} inline />
					</div>
				)}
				{tools.length > 0 && (
					<div className="flex items-start gap-3">
						<span className={`${label} pt-1.5`}>Tools</span>
						<span className="flex flex-wrap gap-1.5">
							{tools.map((id) => (
								<ToolOpenButton key={id} id={id} toConfirm={toConfirm(id)} />
							))}
						</span>
					</div>
				)}
			</section>

			{note ? (
				<div className="rounded-[var(--radius)] bg-[var(--color-attention-bg)] px-4 py-3 text-[15px] leading-normal">
					<div className="mb-0.5 text-[13px] font-bold text-[var(--color-attention)]">Note from {first(note.by)}</div>
					<InlineEdit value={note.text} onSave={(t) => setNote(study.id, phase.id, t)} canEdit={isConsultant} label="the note" placeholder="Add a note for the team on this phase" multiline />
				</div>
			) : (
				isConsultant && (
					<div className="px-1 text-sm">
						<InlineEdit value="" onSave={(t) => setNote(study.id, phase.id, t)} canEdit label="the note" placeholder="Add a note for the team on this phase" multiline />
					</div>
				)
			)}

			<section aria-labelledby="tasks-h" className="flex flex-col gap-2">
				<h3 id="tasks-h" className="m-0 flex items-baseline gap-2 font-[family-name:var(--font-body)] text-[15px] font-semibold">
					Tasks <span className="text-sm font-normal text-[var(--color-ink-muted)]">{total}, in order</span>
				</h3>
				{total === 0 ? <p className="m-0 text-sm text-[var(--color-ink-muted)]">No task yet.</p> : <TaskPipeline study={study} phase={phase} onOpen={setOpenTask} />}
				{isConsultant && <AddRow label="Add a task for this study" placeholder="What needs doing, for this study only" onAdd={(v) => addTask(study.id, phase.id, v)} />}
			</section>

			<CanDo can={CAN[role].can} locked={CAN[role].locked} />

			<TaskDetail study={study} phase={phase} taskKey={openTask} onClose={() => setOpenTask(null)} />
		</article>
	);
}

function kicker(p: PhaseView) {
	const owners = [...new Set(p.tasks.map((t) => ownerLabel(t.task.owner)).filter(Boolean))];
	const owner = owners.length === 1 ? `, ${owners[0]}` : "";
	if (p.addedBy) return `Phase ${p.id}, added for this study by ${personById(p.addedBy)?.name}`;
	return p.days ? `Phase ${p.id}, planned ${p.time ?? costedDays(p.days)}${owner}` : `Phase ${p.id}, not costed in the method file${owner}`;
}

// What each role can do in a study's phase, said up front so nothing is a
// guess and nothing silently disappears.
const CAN: Record<RoleId, { can: string; locked: string }> = {
	consultant: {
		can: "You can set the phase’s status, write the note, add, rename or remove tasks for this study, and choose the phase document.",
		locked: "The method’s tasks come from the method file: suggest a change from a task.",
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

