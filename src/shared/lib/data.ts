// Typed access to the raw JSON in /data. Nothing here persists: what changes
// while the prototype runs lives in the local store (useMartine).
import methodsIndexRaw from "../../../data/methods-index.json";
import catalogRaw from "../../../data/catalog.json";
import briefsRaw from "../../../data/briefs-exemples.json";
import studiesRaw from "../../../data/studies.json";
import readingsRaw from "../../../data/brief-readings.json";
import askScriptsRaw from "../../../data/ask-martine-scripts.json";
import studyTypesRaw from "../../../data/study-types.json";
import whatsNewRaw from "../../../data/whats-new.json";
import { METHOD_FILES } from "./methodFiles.generated";
import type {
	AskScript,
	BriefReading,
	Catalog,
	MethodFile,
	MethodIndexEntry,
	MethodPhase,
	MethodSuggestion,
	Person,
	Study,
	StudyTypeDefinition,
} from "./types";

export const methodsIndex = methodsIndexRaw.methods as MethodIndexEntry[];
export const catalog = catalogRaw as unknown as Catalog;
export const people = studiesRaw.people as Person[];
export const seedStudies = studiesRaw.studies as unknown as Study[];
export const seedSuggestions = studiesRaw.methodSuggestions as MethodSuggestion[];
export const briefs = briefsRaw as unknown as Record<string, string>;
export const briefReadings = readingsRaw.readings as Record<string, BriefReading>;
export const askScripts = askScriptsRaw.scripts as AskScript[];
export const whatsNew = whatsNewRaw.entries as { date: string; items: string[] }[];
const studyTypes = studyTypesRaw.types as unknown as Record<string, StudyTypeDefinition | null>;

export function studyTypeDefinition(id: string): StudyTypeDefinition | null {
	return studyTypes[id] ?? null;
}

export function methodEntry(id: string): MethodIndexEntry | undefined {
	return methodsIndex.find((m) => m.id === id);
}

export function methodFile(id: string): MethodFile | undefined {
	return METHOD_FILES[id];
}

export function personById(id: string): Person | undefined {
	return people.find((p) => p.id === id);
}

export function skillById(id: string) {
	return catalog.skills.find((s) => s.id === id);
}

// ── Phase and task identifiers ──
// A phase id is its number in the method file without spaces ("2 bis" → "2bis");
// a task key is "<phase id>.<position>" ("2.2"). Both are stable across the UI,
// the local store and what the Martine connector returns.
export function phaseId(p: MethodPhase): string {
	return p.phase.replace(/\s+/g, "");
}

export function taskKey(phaseIdValue: string, index: number): string {
	return `${phaseIdValue}.${index + 1}`;
}

export type DayRange = { min: number; max: number } | null;

// A phase's planned days: the phase's own time when the method file gives one
// (steps format), else the sum of its tasks' figures. Null when nothing is
// costed: shown as "not costed", never as zero.
export function phaseDays(p: MethodPhase): DayRange {
	if (p.days_min != null) return { min: p.days_min, max: p.days_max ?? p.days_min };
	return sumDays(p.tasks.map((t) => (t.days_min == null ? null : { min: t.days_min, max: t.days_max ?? t.days_min })));
}

export function sumDays(ranges: DayRange[]): DayRange {
	const known = ranges.filter((r): r is NonNullable<DayRange> => r != null);
	if (!known.length) return null;
	return known.reduce((a, r) => ({ min: a.min + r.min, max: a.max + r.max }), { min: 0, max: 0 });
}

// The phases a study runs: the ones it lists, else every phase but the
// optional ones (2 bis), which no demo study opts into.
export function studyPhases(methodId: string, only?: string[]): MethodPhase[] {
	const phases = methodFile(methodId)?.phases ?? [];
	return only ? phases.filter((p) => only.includes(phaseId(p))) : phases.filter((p) => !p.optional);
}
