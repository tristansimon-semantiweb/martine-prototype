// What a study looks like once its method and its local state are put
// together: the method's phases and tasks, plus what was added for this study.
// V1 leaves out ticking tasks, validating phases and tracking time; a phase
// carries a status the team sets (to start, in progress, done, not needed).
import { methodFile, phaseDays, phaseId, studyPhases, taskKey, type DayRange } from "./data";
import type { AddedTask, MethodTask, PhaseStatus, Study, StudyFile } from "./types";

export interface TaskView {
	key: string; // "2.2"
	task: MethodTask;
}

export interface PhaseView {
	id: string; // "2"
	label: string; // "2. Talkwalker set-up & queries"
	name: string;
	tasks: TaskView[];
	added: AddedTask[];
	days: DayRange; // null: not costed in the method file
	time?: string | null; // the phase's time as the method file writes it ("3 hours")
	total: number;
	addedBy?: string; // a step the consultant added for this study only
	status: PhaseStatus;
}

export const PHASE_STATUS: Record<PhaseStatus, string> = {
	to_start: "To start",
	in_progress: "In progress",
	done: "Done",
	not_needed: "Not needed",
};

export function hasMethodFile(study: Study): boolean {
	return Boolean(methodFile(study.method.id));
}

export function phaseViews(study: Study): PhaseView[] {
	const st = study.state;
	// The method's phases, less the ones this study leaves out, with this study's names.
	const base = studyPhases(study.method.id, study.phases)
		.filter((p) => !st.removedSteps?.includes(phaseId(p)))
		.map((p) => {
			const id = phaseId(p);
			const name = st.stepNames?.[id] ?? p.name;
			const tasks = p.tasks.map((task, i) => ({ key: taskKey(id, i), task }));
			return { id, label: `${p.phase}. ${name}`, name, tasks, days: phaseDays(p), time: p.time };
		});
	const extra = st.addedSteps.map((s, i) => ({
		id: s.id,
		label: `${base.length + i}. ${s.name}`,
		name: s.name,
		tasks: [] as TaskView[],
		days: null as DayRange,
		addedBy: s.by,
	}));
	return [...base, ...extra].map((p) => {
		const added = st.addedTasks.filter((t) => t.phase === p.id);
		return { ...p, added, total: p.tasks.length + added.length, status: st.phaseStatus?.[p.id] ?? "to_start" };
	});
}

// The method steps this study leaves out, to restore them.
export function removedSteps(study: Study): { id: string; label: string }[] {
	const removed = study.state.removedSteps ?? [];
	return studyPhases(study.method.id, study.phases)
		.filter((p) => removed.includes(phaseId(p)))
		.map((p) => ({ id: phaseId(p), label: `${p.phase}. ${study.state.stepNames?.[phaseId(p)] ?? p.name}` }));
}

// What an execution left behind: the output a task produced. A person's
// output, or Claude's once someone checked it, means the task is done; Claude's
// unchecked output is still to check. A phase marked done carries its tasks.
// No ticking: the state comes from the traces (V1).
export interface TaskTrace {
	state: "done" | "to_check";
	file?: StudyFile;
}

export function taskTrace(study: Study, phase: PhaseView, key: string): TaskTrace | null {
	const file = study.files.find((f) => f.task === key);
	if (file) return { state: file.from.kind === "claude" && !file.from.checkedBy ? "to_check" : "done", file };
	return phase.status === "done" ? { state: "done" } : null;
}
