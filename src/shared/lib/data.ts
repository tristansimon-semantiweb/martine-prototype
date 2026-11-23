// Typed access to the raw JSON in /data. Nothing here persists: what changes
// while the prototype runs lives in the local store (useMartine).
import methodTrendReport from "../../../data/methodo-trend-report.json";
import methodsIndexRaw from "../../../data/methods-index.json";
import catalogRaw from "../../../data/catalog.json";
import briefsRaw from "../../../data/briefs-exemples.json";
import studiesRaw from "../../../data/studies.json";
import readingsRaw from "../../../data/brief-readings.json";
import askScriptsRaw from "../../../data/ask-martine-scripts.json";
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
} from "./types";

export const methodsIndex = methodsIndexRaw.methods as MethodIndexEntry[];
export const catalog = catalogRaw as unknown as Catalog;
export const people = studiesRaw.people as Person[];
export const seedStudies = studiesRaw.studies as unknown as Study[];
export const seedSuggestions = studiesRaw.methodSuggestions as MethodSuggestion[];
export const briefs = briefsRaw as unknown as Record<string, string>;
export const briefReadings = readingsRaw.readings as Record<string, BriefReading>;
export const askScripts = askScriptsRaw.scripts as AskScript[];

// Only the trend report method file is provided; the others are listed in the
// index with their counts but have no phases in the prototype.
const METHOD_FILES: Record<string, MethodFile> = {
	trend_report: methodTrendReport as MethodFile,
};

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

export function phaseDays(p: MethodPhase): { min: number; max: number } {
	return p.tasks.reduce(
		(acc, t) => ({ min: acc.min + t.days_min, max: acc.max + t.days_max }),
		{ min: 0, max: 0 },
	);
}

// The phases a study runs: the optional ones (2 bis) only when the study opts in,
// which no demo study does.
export function studyPhases(methodId: string): MethodPhase[] {
	return methodFile(methodId)?.phases.filter((p) => !p.optional) ?? [];
}
