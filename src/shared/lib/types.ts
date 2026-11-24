// Shapes of the mocked data in /data. A study and a method are known objects
// with stable identifiers: the Martine connector (MCP) resolves them, so the UI
// and Claude read the same thing. See docs/MCP-CONTEXT.md.

export type Family = "Trends" | "Monitoring" | "SML";
export type RoleId = "analyst" | "consultant" | "method_owner";

// ── Method (from the method files, imported by scripts/import-methods.mjs) ──
// Two formats: "tasks" (M&T file: task, how, tools, check, output, days, owner)
// and "steps" (SML file: step, what, how, watch out, owner, time, deliverable).
export type MethodFormat = "tasks" | "steps";

export interface MethodTask {
	task: string;
	how: string; // steps format: one point per line
	tools: string;
	check: string;
	output: string;
	days_min: number | null; // null when the method file gives no figure
	days_max: number | null;
	owner: string;
	skills: string[];
	tool_ids: string[]; // tools of the repository this task uses
	what?: string; // steps format
	watch_out?: string; // steps format, one point per line
	time?: string | null; // steps format, as written ("2 to 4 days", "Ongoing")
}

export interface MethodPhase {
	phase: string; // "0", "2", "2 bis", "F"
	name: string;
	optional: boolean;
	tasks: MethodTask[];
	// Steps format: the phase's time, as written and as figures.
	time?: string | null;
	days_min?: number | null;
	days_max?: number | null;
}

export interface MethodFile {
	_meta: {
		id: string;
		name: string;
		family: Family;
		format: MethodFormat;
		owner: string | null;
		version: string;
		source: string;
		planned: string | null; // as the method file's summary states it
	};
	phases: MethodPhase[];
	deck?: { title: string; description: string; columns: string[]; rows: string[][] };
	glossary?: { term: string; definition: string }[];
	notes?: string[];
}

export interface MethodIndexEntry {
	id: string;
	name: string;
	family: Family;
	format: MethodFormat | null;
	owner: string | null;
	version: string | null;
	status: "published" | "to_document";
	phases?: number;
	tasks?: number;
	skills?: number;
	planned?: string | null;
}

// What a study type is, and the question it answers (data/study-types.json).
export interface StudyTypeDefinition {
	source: "journeys" | "draft"; // written by the team, or drafted for the prototype
	question: string | null;
	definition: string;
}

export interface MethodSuggestion {
	id: string;
	method: string;
	phase: string;
	task: string; // task key, "2.3"
	by: string;
	text: string;
	// What accepting the suggestion writes into the method draft.
	change: { field: "how" | "check"; text: string };
	status: "pending" | "accepted" | "declined";
}

// ── Catalog ──
export type SkillStatus = "validated" | "experimental" | "deprecated";

export interface CatalogSkill {
	id: string;
	label: string;
	does: string;
	needs?: string;
	produces?: string;
	status: SkillStatus | null; // null: not set yet
}

// A tool: an application people work in. The catalog's tools are the tool
// repository; method tasks link to them (MethodTask.tool_ids).
export interface CatalogTool {
	id: string;
	label: string;
	kind: string; // "Social listening", "AI assistant"…
	claude_connector: boolean | null; // null: not checked yet
	aliases?: string[]; // patterns that find the tool in the method files' text
	url: string | null; // where to open it (null: internal, not in the prototype)
}

export interface Catalog {
	skills: CatalogSkill[];
	tools: CatalogTool[];
	documents: string[];
	guides: string[];
}

// ── People and studies ──
export interface Person {
	id: string;
	name: string;
	initials: string;
	role: RoleId;
}

export type FileOrigin =
	| { kind: "client" }
	| { kind: "person"; by: string }
	| { kind: "claude"; checkedBy?: string }
	| { kind: "template"; template: string; by: string }; // started from a catalog template

export interface StudyFile {
	id: string;
	name: string;
	type: string;
	phase: string;
	from: FileOrigin;
	url?: string; // a link (Sheet, Doc, deck…) rather than an uploaded file
	task?: string; // the task whose deliverable it is ("2.2"); none: another file of the study
}

export interface StudyLink {
	kind: "data_platform" | "drive" | "talkwalker";
	label: string;
}

export interface AddedTask {
	id: string;
	phase: string;
	title: string;
	by: string;
}

export interface AddedStep {
	id: string; // "x1"
	name: string;
	by: string;
}

// Everything that changes while the study runs. Persisted locally.
export interface StudyState {
	notes: Record<string, { by: string; text: string }>; // key: phase id
	addedTasks: AddedTask[];
	addedSteps: AddedStep[];
}

export interface Study {
	id: string; // "TR-2611-01": the identifier the Martine connector resolves
	title: string;
	short: string;
	client: string;
	family: Family;
	method: { id: string; version: string | null };
	due: string; // ISO date
	status: "not_started" | "in_progress" | "delivered";
	daysSold: number | null;
	brief?: string; // key in data/briefs-exemples.json
	summary?: { headline: string; body: string };
	// The method phases this study runs, when it runs only some of them (a
	// method file can hold several report cycles). Absent: all but the optional ones.
	phases?: string[];
	team: { person: string; role: RoleId }[];
	toClarify: { id: string; label: string; open: boolean; decision?: string }[];
	decisions: { id: string; date: string; text: string }[];
	links: StudyLink[];
	files: StudyFile[];
	previousWave: { id: string; name: string; type: string }[];
	state: StudyState;
}

export interface BriefReading {
	method: string;
	type: string;
	family: Family;
	client: string;
	title: string;
	short: string;
	due: string;
	scope: string;
	daysSold: number | null;
	toClarify: string[];
}

// ── Ask Martine ──
export interface AskSource {
	label: string;
	href: string;
}

export interface AskScript {
	id: string;
	scope: "study" | "all";
	study?: string; // for "study" answers: the study they were written for
	question: string;
	keywords: string[];
	answer: string;
	sources: AskSource[];
}
