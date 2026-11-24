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
	tools?: string[];
	skills?: string[];
	words?: string[]; // patterns found in the task's text
}

const DOCS = (helpRaw as { docs: HelpDoc[] }).docs;

export function helpFor(task: MethodTask): HelpDoc[] {
	const text = [task.task, task.what, task.how, task.tools, task.check].filter(Boolean).join(" ");
	return DOCS.filter(
		(d) =>
			d.tools?.some((t) => task.tool_ids.includes(t)) ||
			d.skills?.some((s) => task.skills.includes(s)) ||
			d.words?.some((w) => new RegExp(w, "i").test(text)),
	);
}
