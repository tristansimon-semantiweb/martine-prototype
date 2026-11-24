"use client";

import { useMartine } from "@/shared/hooks/useMartine";
import { personById } from "@/shared/lib/data";
import { costedDays } from "@/shared/lib/format";
import type { PhaseView } from "@/shared/lib/studyModel";
import type { RoleId, Study } from "@/shared/lib/types";
import { useToast } from "@/shared/components/ui/Toast";
import { AddRow, CanDo, InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { PhaseSheet, ToolOpenButton, ownerLabel } from "@/features/phase/PhaseParts";
import { PhaseStatusPicker } from "./PhaseStatus";
import { TaskCard } from "./TaskCard";
import { PhaseDocument } from "@/features/files/Documents";

// A phase of a study, opened from Steps: the consultant's note, the method's
// tasks as written in the method file, and the tasks added for this study.
export function PhaseDrawer({ study, phase, onClose }: { study: Study; phase: PhaseView | null; onClose: () => void }) {
	return (
		<PhaseSheet open={Boolean(phase)} onClose={onClose} kicker={phase ? kicker(phase) : ""} title={phase?.name ?? ""}>
			{phase && <Body key={phase.id} study={study} phase={phase} />}
		</PhaseSheet>
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

function Body({ study, phase }: { study: Study; phase: PhaseView }) {
	const { role, setNote, setPhaseStatus, addTask, renameAddedTask, removeAddedTask, restoreAddedTask } = useMartine();
	const toast = useToast();
	const isConsultant = role === "consultant";
	const note = study.state.notes[phase.id];
	const first = (id: string) => personById(id)?.name.split(" ")[0];
	// Every tool the phase's tasks work in, once each: open them from here.
	const tools = [...new Set(phase.tasks.flatMap((t) => t.task.tool_ids))];
	const toConfirm = (id: string) => phase.tasks.every((t) => !t.task.tool_ids.includes(id) || t.task.tool_ids_to_confirm?.includes(id));

	const label = "w-[78px] shrink-0 text-sm text-[var(--color-ink-muted)]";
	const total = phase.tasks.length + phase.added.length;

	// Read top to bottom: where the phase stands and what it works in, the
	// team's note, then its tasks in order. What your role can change closes it.
	return (
		<>
			<section aria-label="This phase" className="flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5">
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
				<div className="rounded-[var(--radius)] bg-[var(--color-attention-bg)] px-3.5 py-2.5 text-[15px] leading-normal">
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
					<div className="px-1 text-sm">
						<InlineEdit value="" onSave={(t) => setNote(study.id, phase.id, t)} canEdit label="the note" placeholder="Add a note for the team on this phase" multiline />
					</div>
				)
			)}

			<section aria-labelledby="tasks-h" className="flex flex-col gap-2">
				<h3 id="tasks-h" className="m-0 flex items-baseline gap-2 font-[family-name:var(--font-body)] text-[15px] font-semibold">
					Tasks <span className="text-sm font-normal text-[var(--color-ink-muted)]">{total}, in order</span>
				</h3>
				<ol className="m-0 list-none overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0">
					{phase.tasks.map((t, i) => (
						<li key={t.key} className="border-b border-[var(--color-border)] last:border-b-0">
							<TaskCard study={study} phase={phase} view={t} number={`${phase.addedBy ? "+" : phase.id}.${i + 1}`} />
						</li>
					))}
					{phase.added.map((t, i) => (
						<li key={t.id} className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-attention-soft)] px-4 py-3 last:border-b-0">
							<span className="w-8 shrink-0 text-[13px] font-semibold text-[var(--color-ink-muted)]">{`${phase.id}.${phase.tasks.length + i + 1}`}</span>
							<span className="min-w-0 flex-1 font-semibold">
								<InlineEdit value={t.title} onSave={(v) => v && renameAddedTask(study.id, t.id, v)} canEdit={isConsultant} label="the task" placeholder="Name the task" />
							</span>
							<span className="shrink-0 text-[13px] text-[var(--color-attention)]">added for this study by {first(t.by)}</span>
							{isConsultant && (
								<RemoveButton
									label={`Remove “${t.title}”`}
									onClick={() => {
										const removed = removeAddedTask(study.id, t.id);
										toast("Task removed", removed && { label: "Undo", onClick: () => restoreAddedTask(study.id, removed) });
									}}
								/>
							)}
						</li>
					))}
					{total === 0 && <li className="px-4 py-3 text-sm text-[var(--color-ink-muted)]">No task yet.</li>}
				</ol>
				{isConsultant && <AddRow label="Add a task for this study" placeholder="What needs doing, for this study only" onAdd={(v) => addTask(study.id, phase.id, v)} />}
			</section>

			<CanDo can={CAN[role].can} locked={CAN[role].locked} />
		</>
	);
}
