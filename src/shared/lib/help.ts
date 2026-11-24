// Semantiweb's documentation for analysts (data/help.json): what helps to do
// a task. A task gets the entries that apply to its tools, its skills or the
// words of its text.
import helpRaw from "../../../data/help.json";
import type { MethodTask } from "./types";

export interface HelpDoc {
	id: string;
	title: string;
	kind: string; // "Guide", "Methodology", "Skill guide", "Tool guide", "Reference"
	about: string;
	url?: string; // where it lives (Notion, Drive, the intranet); absent: not linked yet
	by?: string; // who added it from Martine
	tools?: string[];
	skills?: string[];
	words?: string[]; // patterns found in the task's text
}

export const HELP_DOCS = (helpRaw as { docs: HelpDoc[] }).docs;

// `linked`: guides someone attached to this task by hand; they come first.
export function helpFor(task: MethodTask, linked: HelpDoc[] = []): HelpDoc[] {
	const text = [task.task, task.what, task.how, task.tools, task.check].filter(Boolean).join(" ");
	const auto = HELP_DOCS.filter(
		(d) =>
			d.tools?.some((t) => task.tool_ids.includes(t)) ||
			d.skills?.some((s) => task.skills.includes(s)) ||
			d.words?.some((w) => new RegExp(w, "i").test(text)),
	);
	return [...linked, ...auto.filter((d) => !linked.some((l) => l.id === d.id))];
}

// Where a hand-made link between a guide and a task is kept.
export const helpKey = (methodId: string, taskKey: string) => `${methodId}|${taskKey}`;
