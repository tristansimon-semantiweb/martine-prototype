// What the Martine connector (MCP) knows, built from the same data the screens
// show. One module, three uses:
//   1. "Open in Claude" carries identifiers only; Claude resolves them here.
//   2. Ask Martine answers from this context and cites it.
//   3. The UI shows it ("What Claude reads", "Known to Claude") so the analyst
//      sees what Claude will work from.
// The contract, written product-level, is docs/MCP-CONTEXT.md. In the
// prototype nothing is sent anywhere: this module only describes it.
import { methodEntry, personById, skillById } from "./data";
import { dueDate } from "./format";
import { PHASE_STATUS, type PhaseView } from "./studyModel";
import type { Study } from "./types";

// ── Identifiers ──
// A study is known by its id ("TR-2611-01"); its method by id and version
// ("trend_report@1.2"); a phase or task by its key inside the study
// ("TR-2611-01/2", "TR-2611-01/2.2"). Studies keep the method version they
// started on.
export const refs = {
	study: (s: Study) => s.id,
	method: (s: Study) => `${s.method.id}@${s.method.version ?? "unpublished"}`,
	phase: (s: Study, phase: string) => `${s.id}/${phase}`,
	task: (s: Study, key: string) => `${s.id}/${key}`,
};

export interface ContextItem {
	label: string;
	detail: string;
	ref?: string;
}

// The method as a reader sees it: "Trend report v1.2".
export function methodLabel(s: Study): string {
	const m = methodEntry(s.method.id);
	const name = m?.name ?? s.method.id;
	return s.method.version ? `${name} v${s.method.version}` : `${name}, not imported yet`;
}

// What Claude reads when a task's skill opens in Claude. Order matters: it is
// the order the analyst reads it in the task card.
export function whatClaudeReads(s: Study, phase: PhaseView, key: string): ContextItem[] {
	const task = phase.tasks.find((t) => t.key === key);
	const note = s.state.notes[phase.id];
	const items: ContextItem[] = [
		{ label: "The study", detail: `${s.title}, ${s.client}, due ${dueDate(s.due)}`, ref: refs.study(s) },
		{ label: "The brief", detail: "the client brief, and the decisions taken since", ref: `${s.id}/brief` },
		{ label: "The method", detail: `${methodLabel(s)}, phase ${phase.id} (${PHASE_STATUS[phase.status].toLowerCase()})`, ref: refs.method(s) },
	];
	if (task) {
		// Steps-format methods have no check column: their points of attention play that part.
		const check = task.task.check || task.task.watch_out?.replace(/\n/g, " ") || task.task.what || "";
		items.push({ label: task.task.check ? "This task and its check" : "This step and its points of attention", detail: check, ref: refs.task(s, key) });
	}
	const doc = s.files.find((f) => f.id === s.state.phaseDocs?.[phase.id]);
	if (doc) items.push({ label: "The phase’s document", detail: doc.name, ref: `${refs.phase(s, phase.id)}/document` });
	if (note) items.push({ label: `${personById(note.by)?.name ?? "Consultant"}’s note`, detail: note.text });
	items.push({ label: "The study’s data", detail: "through the data platform connector", ref: `data-platform:${s.id}` });
	return items;
}

// "2 done, 1 in progress, 7 to start": where the study's phases stand.
export function statusLine(views: PhaseView[]): string {
	return (["done", "in_progress", "to_start", "not_needed"] as const)
		.map((k) => [k, views.filter((v) => v.status === k).length] as const)
		.filter(([, n]) => n > 0)
		.map(([k, n]) => `${n} ${PHASE_STATUS[k].toLowerCase()}`)
		.join(", ");
}

// What the connector holds for a study, as the Overview lists it.
// `corpus`: where the study's corpora stand, as the Corpus tab says it.
export function knownToClaude(s: Study, views: PhaseView[], corpus?: string): ContextItem[] {
	const notes = Object.keys(s.state.notes).length;
	const added = s.state.addedTasks.length;
	return [
		{ label: "Study", detail: `${s.title}, ${s.client}`, ref: refs.study(s) },
		...(s.scope ? [{ label: "Scope", detail: s.scope }] : []),
		{ label: "Method", detail: methodLabel(s), ref: refs.method(s) },
		{ label: "Steps", detail: views.length ? `${views.length} phases: ${statusLine(views)}` : "none yet" },
		{ label: "Notes and added tasks", detail: `${notes} note${notes === 1 ? "" : "s"}, ${added} added task${added === 1 ? "" : "s"}` },
		{
			label: "Files",
			detail: `${s.files.length} document${s.files.length === 1 ? "" : "s"}, ${Object.keys(s.state.phaseDocs ?? {}).length} used as a phase’s document`,
		},
		{ label: "Corpora", detail: corpus ? `${corpus}, through the data platform connector` : "through the data platform connector", ref: `data-platform:${s.id}` },
	];
}

// "Walk me through in Claude": Claude takes the phase task by task. The same
// rule as Open in Claude: identifiers only, Claude reads the rest through the
// Martine connector.
export function walkthroughUrl(s: Study, phase: PhaseView): string {
	const message = [
		`Martine study ${refs.study(s)} (${refs.method(s)}).`,
		`Walk me through phase ${phase.id}: ${phase.name}, task by task.`,
		"For each task: say what to do, run its skill when it has one, tell me which tool to open, and go through its check with me before the next one.",
		"Read the study context through the Martine connector.",
	].join(" ");
	return `https://claude.ai/new?q=${encodeURIComponent(message)}`;
}

// "Open in Claude": a short message with identifiers only. Claude reads the
// rest through the Martine connector; the brief's text never goes in the link.
export function openInClaudeUrl(s: Study, phase: PhaseView, key: string, skillId: string): string {
	const task = phase.tasks.find((t) => t.key === key);
	const skill = skillById(skillId);
	const message = [
		`Martine study ${refs.study(s)} (${refs.method(s)}).`,
		`Phase ${phase.id}: ${phase.name}. Task ${key}: ${task?.task.task ?? ""}.`,
		`Use the ${skill?.label ?? skillId} skill (${skillId}) and read the study context through the Martine connector.`,
	].join(" ");
	return `https://claude.ai/new?q=${encodeURIComponent(message)}`;
}

// ── Corpus ──
// Depositing from Claude: Claude asks the data platform for an upload link and
// hands it over; the file goes from the browser to the data platform, never
// through Claude, so its size is not Claude's limit. Then Claude follows it.
export function depositUrl(s: Study): string {
	const message = [
		`Martine study ${refs.study(s)} (${refs.method(s)}).`,
		"I want to deposit exports into one of the study's corpora. Give me an upload link from the data platform for each file,",
		"then tell me whether each file was accepted for its source, and why not if it was refused.",
	].join(" ");
	return `https://claude.ai/new?q=${encodeURIComponent(message)}`;
}
