// Shapes of the mocked data in /data. A study and a method are known objects
// with stable identifiers: the Martine connector (MCP) resolves them, so the UI
// and Claude read the same thing. See docs/MCP-CONTEXT.md.

export type Family = "Trends" | "Monitoring" | "SML";
export type RoleId = "analyst" | "consultant" | "method_owner";

// ── Method (from the method file) ──
export interface MethodTask {
	task: string;
	how: string;
	tools: string;
	check: string;
	output: string;
	days_min: number;
	days_max: number;
	owner: string;
	skills: string[];
}

export interface MethodPhase {
	phase: string; // "0", "2", "2 bis"
	name: string;
	optional: boolean;
	tasks: MethodTask[];
}

export interface MethodFile {
	_meta: { type: string; version: string; owner: string; source: string; columns: string };
	phases: MethodPhase[];
}

export interface MethodIndexEntry {
	id: string;
	name: string;
	family: Family;
	owner: string | null;
	version: string | null;
	status: "published" | "to_import";
	phases?: number;
	tasks?: number;
	skills?: number;
	file?: string;
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
	status: SkillStatus;
}

export interface CatalogTool {
	id: string;
	label: string;
	claude_connector: boolean;
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
	| { kind: "claude"; checkedBy?: string };

export interface StudyFile {
	id: string;
	name: string;
	type: string;
	phase: string;
	from: FileOrigin;
}

export interface StudyLink {
	kind: "data_platform" | "slack" | "drive" | "talkwalker";
	label: string;
}

export interface TaskState {
	done: boolean;
	days?: number;
}

export interface AddedTask {
	id: string;
	phase: string;
	title: string;
	by: string;
	done?: boolean;
	days?: number;
}

export interface AddedStep {
	id: string; // "x1"
	name: string;
	by: string;
}

// Everything that changes while the study runs. Persisted locally.
export interface StudyState {
	tasks: Record<string, TaskState>; // key: "<phase>.<n>", e.g. "2.2"
	completedPhases: string[];
	awaitingApproval?: string[];
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
	// For studies whose method file is not imported in the prototype.
	snapshot?: { phaseLabel: string; progress: number; daysPlanned: number; daysActual: number };
	milestones: string[];
	team: { person: string; role: RoleId; steps?: number }[];
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
