// What a study looks like once its method and its local state are put
// together: the method's phases and tasks, plus what was added for this study.
// V1 leaves out ticking tasks, validating phases and tracking time; a phase
// carries a status the team sets (to start, in progress, done, not needed).
import { methodFile, phaseDays, phaseId, studyPhases, taskKey, type DayRange } from "./data";
import type { AddedStep, AddedTask, MethodTask, PhaseStatus, Study } from "./types";

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
	const base = studyPhases(study.method.id, study.phases).map((p) => {
		const id = phaseId(p);
		const tasks = p.tasks.map((task, i) => ({ key: taskKey(id, i), task }));
		return { id, label: `${p.phase}. ${p.name}`, name: p.name, tasks, days: phaseDays(p), time: p.time };
	});
	const extra = (s: AddedStep) => ({
		id: s.id,
		label: `+ ${s.name}`,
		name: s.name,
		tasks: [] as TaskView[],
		days: null as DayRange,
		addedBy: s.by,
	});
	// A step added for this study sits where it was placed: at the start, after
	// a method phase, or at the end.
	const at = (anchor: string) => st.addedSteps.filter((s) => s.after === anchor).map(extra);
	const placed = [...at("start"), ...base.flatMap((p) => [p, ...at(p.id)])];
	const rest = st.addedSteps.filter((s) => !placed.some((p) => p.id === s.id)).map(extra);
	return [...placed, ...rest].map((p) => {
		const added = st.addedTasks.filter((t) => t.phase === p.id);
		return { ...p, added, total: p.tasks.length + added.length, status: st.phaseStatus?.[p.id] ?? "to_start" };
	});
}
