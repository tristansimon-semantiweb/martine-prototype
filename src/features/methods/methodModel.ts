// A method as its owner edits it: the published method file with the draft
// (edits, added skills, tasks and phases) laid over it. Studies never read
// this: they keep the published version they started on.
import { methodFile, phaseDays, phaseId, sumDays, taskKey, type DayRange } from "@/shared/lib/data";
import type { MethodDraft } from "@/shared/hooks/useMartine";
import type { MethodPhase, MethodSuggestion, MethodTask } from "@/shared/lib/types";

export interface MethodTaskView {
	key: string;
	task: MethodTask; // with the draft's edits applied
	original?: MethodTask; // as published (absent for a task added in the draft)
	addedSkills: string[];
	addedTools: string[]; // linked in the draft
	toConfirm: string[]; // proposed links the owner has not confirmed yet
	edited: boolean;
	isNew: boolean;
	draftId?: string; // a task added in the draft: its id, to remove it
}

export interface MethodPhaseView {
	id: string;
	label: string;
	name: string;
	optional: boolean;
	tasks: MethodTaskView[];
	days: DayRange;
	skillCount: number;
	suggestions: MethodSuggestion[]; // pending
	isNew: boolean;
}

const blankTask = (task: string): MethodTask => ({
	task,
	how: "",
	tools: "",
	check: "",
	output: "",
	days_min: null,
	days_max: null,
	owner: "Analyst",
	skills: [],
	tool_ids: [],
});

// The task's tools once the draft's links and unlinks are applied.
function draftTools(base: string[], draft: MethodDraft | undefined, key: string) {
	const removed = draft?.removedTools?.[key] ?? [];
	const added = (draft?.addedTools?.[key] ?? []).filter((t) => !base.includes(t));
	return { tool_ids: [...base.filter((t) => !removed.includes(t)), ...added], added };
}

export function methodPhases(methodId: string, draft: MethodDraft | undefined, suggestions: MethodSuggestion[]): MethodPhaseView[] {
	const file = methodFile(methodId);
	if (!file) return [];
	const pending = suggestions.filter((s) => s.method === methodId && s.status === "pending");

	const build = (id: string, label: string, name: string, optional: boolean, base: MethodTask[], isNew: boolean, phase?: MethodPhase): MethodPhaseView => {
		const fromFile = base.map((t, i) => {
			const key = taskKey(id, i);
			const edits = draft?.edits[key];
			const added = draft?.addedSkills[key] ?? [];
			const tools = draftTools(t.tool_ids ?? [], draft, key);
			const confirmed = draft?.confirmedTools?.[key] ?? [];
			return {
				key,
				task: { ...t, ...edits, skills: [...t.skills, ...added], tool_ids: tools.tool_ids },
				original: t,
				addedSkills: added,
				addedTools: tools.added,
				toConfirm: (t.tool_ids_to_confirm ?? []).filter((id) => tools.tool_ids.includes(id) && !confirmed.includes(id)),
				edited: Boolean(edits && Object.keys(edits).length),
				isNew: false,
			};
		});
		const fromDraft = (draft?.addedTasks ?? [])
			.filter((t) => t.phase === id)
			.map((t, i) => {
				const key = taskKey(id, base.length + i);
				const added = draft?.addedSkills[key] ?? [];
				const tools = draftTools([], draft, key);
				return {
					key,
					task: { ...blankTask(t.task), ...draft?.edits[key], skills: added, tool_ids: tools.tool_ids },
					addedSkills: added,
					addedTools: tools.added,
					toConfirm: [],
					edited: false,
					isNew: true,
					draftId: t.id,
				};
			});
		const tasks = [...fromFile, ...fromDraft];
		// The phase's own time when the method file gives one, else its tasks' figures.
		const days = phase?.days_min != null ? phaseDays(phase) : sumDays(tasks.map((t) => (t.task.days_min == null ? null : { min: t.task.days_min, max: t.task.days_max ?? t.task.days_min })));
		return {
			id,
			label,
			name,
			optional,
			tasks,
			days,
			skillCount: new Set(tasks.flatMap((t) => t.task.skills)).size,
			suggestions: pending.filter((s) => s.phase === id),
			isNew,
		};
	};

	const phases = file.phases.map((p) => build(phaseId(p), `${p.phase}. ${p.name}`, p.name, p.optional, p.tasks, false, p));
	const numbered = file.phases.filter((p) => !p.optional).length;
	const added = (draft?.addedPhases ?? []).map((p, i) => build(p.id, `${numbered + i}. ${p.name}`, p.name, false, [], true));
	return [...phases, ...added];
}

// Planned days of the method: the phases every study runs (optional ones aside).
export function methodDays(methodId: string): DayRange {
	const file = methodFile(methodId);
	if (!file) return null;
	return sumDays(file.phases.filter((p) => !p.optional).map(phaseDays));
}
