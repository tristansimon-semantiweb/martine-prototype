// A study's corpus: where it stands and what it holds. The data platform does
// the work (reading the files, processing, AI detections); Martine shows where
// it stands and hands over to the Explorer. Fictional figures: data/corpus.json.
import corpusRaw from "../../../data/corpus.json";
import { methodFile, phaseId } from "./data";
import type { CorpusFile, CorpusState, Study } from "./types";

export const processing = corpusRaw.processing;
export const corpusSeed = corpusRaw.seed as unknown as Record<string, CorpusState>;

export interface Verbatim {
	id: string;
	text: string;
	translation?: string;
	why?: string;
}
export interface ExplorerVerbatim extends Verbatim {
	market: string;
	code: string;
	sentiment: string;
	source: string;
	date: string;
}
export interface ExplorerData {
	markets: Record<string, number>;
	languages: Record<string, number>;
	sentiment: Record<string, number>;
	codes: Record<string, Record<string, number>>;
	months: { month: string; n: number }[];
	verbatims: ExplorerVerbatim[];
}
export const toCheck = corpusRaw.toCheck as unknown as Record<string, { offTopic: Verbatim[]; detections: { filter: string; examples: Verbatim[] }[] }>;
export const explorerData = corpusRaw.explorer as unknown as Record<string, ExplorerData>;

export type CorpusStage = "empty" | "files" | "processing" | "to_check" | "ready";

export const STAGES: { id: CorpusStage; label: string }[] = [
	{ id: "files", label: "Files" },
	{ id: "processing", label: "Processing" },
	{ id: "to_check", label: "To check" },
	{ id: "ready", label: "Ready in the Explorer" },
];

export const STAGE_LABEL: Record<CorpusStage, string> = {
	empty: "No files yet",
	files: "Files in, not processed",
	processing: "Processing",
	to_check: "To check",
	ready: "Ready in the Explorer",
};

const STEP_MS = processing.demoSecondsPerStep * 1000;

// Where the corpus stands. While it runs, the step comes from the time since
// launch: in the prototype a step takes a few seconds, not the real hours.
export function corpusStage(c: CorpusState, now: number): { stage: CorpusStage; step: number } {
	if (c.ready || c.checked) return { stage: "ready", step: processing.steps.length };
	if (c.run) {
		const step = Math.max(0, Math.floor((now - c.run.startedAt) / STEP_MS));
		return step >= processing.steps.length ? { stage: "to_check", step } : { stage: "processing", step };
	}
	return { stage: c.files.some((f) => f.accepted) ? "files" : "empty", step: 0 };
}

// What came in, what was removed, what is kept.
export function corpusFigures(c: CorpusState) {
	if (c.ready) return c.ready;
	const received = c.files.filter((f) => f.accepted).reduce((n, f) => n + f.rows, 0);
	const duplicates = Math.round(received * processing.duplicateRate);
	const offTopic = Math.round(received * processing.offTopicRate);
	return { received, duplicates, offTopic, kept: received - duplicates - offTopic, period: null, languages: [] as string[] };
}

export function launchQuote(c: CorpusState) {
	const records = corpusFigures(c).received;
	return { records, costUsd: Math.max(1, Math.round(records * processing.costPerRecordUsd)), ceilingUsd: processing.ceilingUsd, duration: processing.duration };
}

// Each source has a format contract on the data platform: an export from a
// known source, as a table, is accepted; anything else is refused, and says why.
export function readFormat(name: string, source: string): Pick<CorpusFile, "accepted" | "reason"> {
	const ext = name.split(".").pop()?.toLowerCase() ?? "";
	if (!processing.sources.includes(source)) return { accepted: false, reason: `No format contract for ${source} yet: ask the data team to add one.` };
	if (!processing.formats.includes(ext)) return { accepted: false, reason: `A .${ext || "?"} file is not a table: export it from ${source} as Excel, CSV or JSON.` };
	return { accepted: true };
}

// The phases of the study's method that build or read the corpus.
export function corpusRole(study: Study, phase: string): "build" | "analyse" | undefined {
	return methodFile(study.method.id)?.phases.find((p) => phaseId(p) === phase)?.corpus;
}

export const fmt = (n: number) => n.toLocaleString("en-GB");
