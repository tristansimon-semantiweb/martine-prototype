"use client";

import { useMartine } from "@/shared/hooks/useMartine";
import { personById } from "@/shared/lib/data";
import { costedDays } from "@/shared/lib/format";
import type { PhaseView } from "@/shared/lib/studyModel";
import type { RoleId, Study } from "@/shared/lib/types";
import { useToast } from "@/shared/components/ui/Toast";
import { AddRow, CanDo, InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { PhaseSheet, ownerLabel } from "@/features/phase/PhaseParts";
import { TaskCard } from "./TaskCard";
import { PhaseDocument } from "@/features/files/Documents";

// A phase of a study, opened from Steps: the consultant's note, the method's
// tasks as written in the method file, and the tasks added for this study.
export function PhaseDrawer({ study, phase, onClose }: { study: Study; phase: PhaseView | null; onClose: () => void }) {
	return (
		<PhaseSheet
			open={Boolean(phase)}
			onClose={onClose}
			kicker={phase ? kicker(phase) : ""}
			title={phase?.name ?? ""}
		>
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
		can: "You can write the note, add, rename or remove tasks for this study, and choose the phase document.",
		locked: "The method’s tasks come from the method file: suggest a change from a task.",
	},
	analyst: {
		can: "You can choose the phase document, open skills in Claude, suggest a change to a task or request a skill.",
		locked: "The note and the tasks added for this study are the consultant’s.",
	},
	method_owner: {
		can: "You can choose the phase document. The method itself is edited in Study types.",
		locked: "The note and the tasks added for this study are the consultant’s.",
	},
	skills_owner: {
		can: "You can choose the phase document and follow skill requests in Skills.",
		locked: "The note and the tasks added for this study are the consultant’s.",
	},
};

function Body({ study, phase }: { study: Study; phase: PhaseView }) {
	const { role, setNote, addTask, renameAddedTask, removeAddedTask, restoreAddedTask } = useMartine();
	const toast = useToast();
	const isConsultant = role === "consultant";
	const note = study.state.notes[phase.id];
	const first = (id: string) => personById(id)?.name.split(" ")[0];

	return (
		<>
			<CanDo can={CAN[role].can} locked={CAN[role].locked} />

			{(note || isConsultant) && (
				<div className="rounded-[var(--radius)] bg-[var(--color-attention-bg)] px-3 py-2.5 text-[15px] leading-normal">
					<div className="mb-0.5 text-[13px] font-bold text-[var(--color-attention)]">{note ? `Note from ${first(note.by)}` : "Note for the team"}</div>
					<InlineEdit
						value={note?.text ?? ""}
						onSave={(t) => setNote(study.id, phase.id, t)}
						canEdit={isConsultant}
						label="the note"
						placeholder="Add a note for the team on this phase"
						multiline
					/>
				</div>
			)}

			{!phase.addedBy && <PhaseDocument study={study} phase={phase.id} tasks={phase.tasks.map((t) => t.task)} />}

			{phase.tasks.map((t) => (
				<TaskCard key={t.key} study={study} phase={phase} view={t} />
			))}

			{(phase.added.length > 0 || isConsultant) && (
				<section aria-label="Tasks added for this study" className="flex flex-col gap-2">
					<div className="text-xs font-bold text-[var(--color-ink-muted)]">Added for this study</div>
					{phase.added.map((t) => (
						<article key={t.id} className="flex items-center gap-3 rounded-[12px] bg-[var(--color-attention-soft)] px-4 py-2.5">
							<span className="min-w-0 flex-1 font-semibold">
								<InlineEdit value={t.title} onSave={(v) => v && renameAddedTask(study.id, t.id, v)} canEdit={isConsultant} label="the task" placeholder="Name the task" />
							</span>
							<span className="shrink-0 text-[13px] text-[var(--color-attention)]">added by {first(t.by)}</span>
							{isConsultant && (
								<RemoveButton
									label={`Remove “${t.title}”`}
									onClick={() => {
										const removed = removeAddedTask(study.id, t.id);
										toast("Task removed", removed && { label: "Undo", onClick: () => restoreAddedTask(study.id, removed) });
									}}
								/>
							)}
						</article>
					))}
					{isConsultant && <AddRow label="Add a task for this study" placeholder="What needs doing, for this study only" onAdd={(v) => addTask(study.id, phase.id, v)} />}
				</section>
			)}
		</>
	);
}
