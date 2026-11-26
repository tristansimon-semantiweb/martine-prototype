// A study's corpora: where each stands and what it holds. The data platform
// does the work (reading the files, the processing); Martine is where the
// analyst deposits the exports and follows them, then opens the Explorer, its
// own application. Fictional data: data/corpus.json.
import corpusRaw from "../../../data/corpus.json";
import { methodFile, phaseId } from "./data";
import type { Corpus, CorpusFile, Study } from "./types";

export const processing = corpusRaw.processing;
export const corporaSeed = corpusRaw.seed as unknown as Record<string, Corpus[]>;

export type CorpusStage = "empty" | "processing" | "ready";

export const STAGE_LABEL: Record<CorpusStage, string> = {
	empty: "No files yet",
	processing: "Processing",
	ready: "Ready in the Explorer",
};

// After a deposit the processing runs; in the prototype it takes a few seconds.
export function corpusStage(c: Corpus, now: number): CorpusStage {
	if (!c.files.some((f) => f.accepted)) return "empty";
	if (c.processingSince && now - c.processingSince < processing.demoSeconds * 1000) return "processing";
	return "ready";
}

export const corpusRows = (c: Corpus) => c.files.filter((f) => f.accepted).reduce((n, f) => n + f.rows, 0);

// "1 ready, 1 processing": a study's corpora in a few words.
export function corporaLine(list: Corpus[], now: number): string {
	if (!list.length) return "No corpus yet";
	return (["ready", "processing", "empty"] as const)
		.map((k) => [k, list.filter((c) => corpusStage(c, now) === k).length] as const)
		.filter(([, n]) => n > 0)
		.map(([k, n]) => `${n} ${k === "ready" ? "ready" : k === "processing" ? "processing" : "without files"}`)
		.join(", ");
}

// Each source has a format contract on the data platform: an export from a
// known source, as a table, is accepted; anything else is refused, and says why.
export function readFormat(name: string, source: string): Pick<CorpusFile, "accepted" | "reason"> {
	const ext = name.split(".").pop()?.toLowerCase() ?? "";
	if (!processing.sources.includes(source)) return { accepted: false, reason: `No format contract for ${source} yet: ask the data team to add one.` };
	if (!processing.formats.includes(ext)) return { accepted: false, reason: `A .${ext || "?"} file is not a table: export it from ${source} as Excel, CSV or JSON.` };
	return { accepted: true };
}

// The phases of the study's method that build or read the corpora.
export function corpusRole(study: Study, phase: string): "build" | "analyse" | undefined {
	return methodFile(study.method.id)?.phases.find((p) => phaseId(p) === phase)?.corpus;
}

export const fmt = (n: number) => n.toLocaleString("en-GB");

// Tomorrow, what changes for a task the method writes for today's chain: its
// text still names the Corpus Manager or the ICC, this line says what replaces it.
export function tomorrowNote(task: { tool_ids: string[] }): string | null {
	if (task.tool_ids.some((t) => t === "corpus_manager" || t === "files_tool")) return "Tomorrow: deposit the exports in the study’s Corpus tab, no Files Tools or Corpus Manager.";
	if (task.tool_ids.includes("icc")) return "Tomorrow: in the Explorer, in place of the ICC.";
	return null;
}
