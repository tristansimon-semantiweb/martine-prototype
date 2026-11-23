// What a study looks like once its method and its local state are put
// together: phases with their tasks, the current phase, days used.
import { methodFile, phaseDays, phaseId, studyPhases, sumDays, taskKey, type DayRange } from "./data";
import type { AddedTask, MethodTask, Study, TaskState } from "./types";

export interface TaskView {
	key: string; // "2.2"
	task: MethodTask;
	state: TaskState;
}

export type PhaseStatus = "done" | "awaiting" | "current" | "todo";

export interface PhaseView {
	id: string; // "2"
	label: string; // "2. Talkwalker set-up & queries"
	name: string;
	tasks: TaskView[];
	added: AddedTask[];
	days: DayRange; // null: not costed in the method file
	time?: string | null; // the phase's time as the method file writes it ("3 hours")
	doneCount: number;
	total: number;
	status: PhaseStatus;
	milestone: boolean;
	addedBy?: string; // a step the consultant added for this study only
}

export function hasMethodFile(study: Study): boolean {
	return Boolean(methodFile(study.method.id));
}

export function phaseViews(study: Study): PhaseView[] {
	const st = study.state;
	const awaiting = st.awaitingApproval ?? [];
	const base = studyPhases(study.method.id, study.phases).map((p) => {
		const id = phaseId(p);
		const tasks = p.tasks.map((task, i) => {
			const key = taskKey(id, i);
			return { key, task, state: st.tasks[key] ?? { done: false } };
		});
		return { id, label: `${p.phase}. ${p.name}`, name: p.name, tasks, days: phaseDays(p), time: p.time };
	});
	const extra = st.addedSteps.map((s, i) => ({
		id: s.id,
		label: `${base.length + i}. ${s.name}`,
		name: s.name,
		tasks: [] as TaskView[],
		days: null as DayRange,
		addedBy: s.by,
	}));

	let currentFound = false;
	return [...base, ...extra].map((p) => {
		const added = st.addedTasks.filter((t) => t.phase === p.id);
		const doneCount = p.tasks.filter((t) => t.state.done).length + added.filter((t) => t.done).length;
		const total = p.tasks.length + added.length;
		let status: PhaseStatus = "todo";
		if (st.completedPhases.includes(p.id)) status = "done";
		else if (!currentFound) {
			status = awaiting.includes(p.id) ? "awaiting" : "current";
			currentFound = true;
		}
		return { ...p, added, doneCount, total, status, milestone: study.milestones.includes(p.id) };
	});
}

export function currentPhase(views: PhaseView[]): PhaseView | undefined {
	return views.find((p) => p.status === "current" || p.status === "awaiting");
}

export function daysActual(study: Study): number {
	if (study.snapshot) return study.snapshot.daysActual;
	const tasks = Object.values(study.state.tasks).reduce((n, t) => n + (t.done ? (t.days ?? 0) : 0), 0);
	return tasks + study.state.addedTasks.reduce((n, t) => n + (t.done ? (t.days ?? 0) : 0), 0);
}

export function daysPlanned(study: Study): DayRange {
	if (study.snapshot) return { min: study.snapshot.daysPlanned, max: study.snapshot.daysPlanned };
	return sumDays(phaseViews(study).map((p) => p.days));
}

// Share of the study's phases that are done (0 to 1).
export function progress(study: Study): number {
	if (study.snapshot) return study.snapshot.progress;
	const views = phaseViews(study);
	return views.length ? views.filter((p) => p.status === "done").length / views.length : 0;
}

export function phaseLabelForCard(study: Study): string | null {
	if (study.snapshot) return study.snapshot.phaseLabel;
	const views = phaseViews(study);
	const cur = currentPhase(views);
	const started = views.some((p) => p.doneCount > 0 || p.status === "done");
	if (!cur || !started) return null; // "Not started yet"
	return `Phase ${cur.id}: ${cur.name}`;
}
