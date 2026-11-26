"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { methodEntry, registerDraftSkills, seedStudies, seedSuggestions } from "@/shared/lib/data";
import { helpKey, type HelpDoc } from "@/shared/lib/help";
import { corporaSeed, readFormat } from "@/shared/lib/corpus";
import type { AddedStep, AddedTask, BriefReading, CatalogSkill, Corpus, CorpusFile, MethodSuggestion, MethodTask, FileCategory, PhaseStatus, RoleId, Study, StudyState } from "@/shared/lib/types";

// The prototype's whole mutable state, persisted in localStorage like the R&R
// prototype (useUserContent). Seeded from /data; "Reset the demo" restores it.

export interface MethodDraft {
	version: string; // the draft's version, e.g. "1.3"
	saved: boolean;
	edits: Record<string, Partial<Pick<MethodTask, "how" | "check" | "output" | "tools" | "what" | "watch_out">>>; // key: task key
	addedSkills: Record<string, string[]>; // key: task key
	addedTools?: Record<string, string[]>; // key: task key; tool ids
	removedTools?: Record<string, string[]>;
	confirmedTools?: Record<string, string[]>; // links to confirm, confirmed by the owner
	addedTasks: { id: string; phase: string; task: string; by: string }[];
	addedPhases: { id: string; name: string; by: string }[];
	renamedPhases?: Record<string, string>; // phase id → new name
	removedPhases?: string[]; // published phases the draft removes
}

interface MartineData {
	role: RoleId;
	studies: Study[];
	suggestions: MethodSuggestion[];
	drafts: Record<string, MethodDraft>; // key: method id
	skillDrafts?: CatalogSkill[]; // skills requested from method steps
	helpDocs?: HelpDoc[]; // guides added from Martine (the library's own are in data/help.json)
	helpLinks?: Record<string, string[]>; // "method|task key" → guides attached by hand
	helpUrls?: Record<string, string>; // guide id → its link, for the library's guides that had none
	corpora?: Record<string, Corpus[]>; // study id → its corpora, once changed (else the seed)
}

const NO_CORPUS: Corpus[] = [];
const today = () => new Date().toISOString().slice(0, 10);

// Bumped when the seed data changes shape (v2: the methods import), so a
// browser that kept an older demo starts again from the new seed (v3: files
// attached to tasks; v4: V1 scope, no ticking, validation or time; v5: one
// document per phase; v6: skill requests; v7: phase status; v8: scope and past studies; v9, v10: outputs traced to tasks, then not: no task state in V1; v11: a document used by two phases; v12: last edition, not previous wave; v13: documents by category; v14: no renaming or removing a method phase in a study; v15, v16: assignees, on tasks then on phases; v17: upload dates; v18: editable standing, then removed).
const KEY = "martine_v18";

const ROLE_PERSON: Record<RoleId, string> = { analyst: "marie", consultant: "claire", method_owner: "bamby", skills_owner: "fabien" };

function seed(): MartineData {
	return {
		role: "analyst",
		studies: structuredClone(seedStudies),
		suggestions: structuredClone(seedSuggestions),
		drafts: {},
		skillDrafts: [],
	};
}

function emptyDraft(version: string | null): MethodDraft {
	const [major, minor] = (version ?? "1.0").split(".").map(Number);
	return { version: `${major}.${minor + 1}`, saved: false, edits: {}, addedSkills: {}, addedTools: {}, removedTools: {}, addedTasks: [], addedPhases: [] };
}

const uid = () => Math.random().toString(36).slice(2, 8);

// "TR-2611-02": method prefix, year and month of creation, then a counter.
function nextStudyId(studies: Study[], methodId: string): string {
	const prefix = methodId.split("_").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
	const now = new Date();
	const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
	const n = studies.filter((s) => s.id.startsWith(`${prefix}-${stamp}`)).length + 1;
	return `${prefix}-${stamp}-${String(n).padStart(2, "0")}`;
}

// A small external store over localStorage. The server (and the first client
// render, during hydration) sees the seed; the browser then reads what was saved.
const SEED = seed();
let current: MartineData | null = null;
const listeners = new Set<() => void>();

function read(): MartineData {
	if (current) return current;
	try {
		const saved = localStorage.getItem(KEY);
		current = saved ? (JSON.parse(saved) as MartineData) : SEED;
		registerDraftSkills(current.skillDrafts ?? []);
	} catch {
		current = SEED;
	}
	return current;
}

function write(next: MartineData | null) {
	current = next;
	registerDraftSkills(next?.skillDrafts ?? []);
	try {
		if (next) localStorage.setItem(KEY, JSON.stringify(next));
		else localStorage.removeItem(KEY);
	} catch {}
	listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
	listeners.add(l);
	return () => listeners.delete(l);
}

function useMartineState() {
	const data = useSyncExternalStore(subscribe, read, () => SEED);

	const update = useCallback((fn: (d: MartineData) => MartineData) => write(fn(read())), []);

	const me = ROLE_PERSON[data.role];

	const patchStudy = useCallback(
		(id: string, fn: (s: Study) => Study) =>
			update((d) => ({ ...d, studies: d.studies.map((s) => (s.id === id ? fn(s) : s)) })),
		[update],
	);
	const patchState = useCallback(
		(id: string, fn: (st: StudyState) => StudyState) => patchStudy(id, (s) => ({ ...s, state: fn(s.state) })),
		[patchStudy],
	);
	// A study's corpora as they stand: what changed here, else the seed.
	const corporaOf = useCallback((id: string): Corpus[] => data.corpora?.[id] ?? corporaSeed[id] ?? NO_CORPUS, [data.corpora]);
	const patchCorpora = useCallback(
		(id: string, fn: (list: Corpus[]) => Corpus[]) => update((d) => ({ ...d, corpora: { ...d.corpora, [id]: fn(d.corpora?.[id] ?? corporaSeed[id] ?? NO_CORPUS) } })),
		[update],
	);
	const patchCorpus = useCallback(
		(id: string, corpusId: string, fn: (c: Corpus) => Corpus) => patchCorpora(id, (list) => list.map((c) => (c.id === corpusId ? fn(c) : c))),
		[patchCorpora],
	);
	const patchDraft = useCallback(
		(methodId: string, version: string | null, fn: (dr: MethodDraft) => MethodDraft) =>
			update((d) => {
				const current = d.drafts[methodId] ?? emptyDraft(version);
				return { ...d, drafts: { ...d.drafts, [methodId]: { ...fn(current), saved: false } } };
			}),
		[update],
	);

	const actions = useMemo(
		() => ({
			setRole: (role: RoleId) => update((d) => ({ ...d, role })),
			reset: () => write(null),

			// ── Study notes, added tasks and steps (consultant) ──
			// Assign a phase to someone on the study, or leave it unassigned (null).
			assignPhase: (studyId: string, phase: string, person: string | null) =>
				patchState(studyId, (st) => {
					const assignees = { ...st.assignees };
					if (person) assignees[phase] = person;
					else delete assignees[phase];
					return { ...st, assignees };
				}),
			setPhaseStatus: (studyId: string, phase: string, status: PhaseStatus) =>
				patchState(studyId, (st) => ({ ...st, phaseStatus: { ...st.phaseStatus, [phase]: status } })),
			setNote: (studyId: string, phase: string, text: string) =>
				patchState(studyId, (st) => {
					const notes = { ...st.notes };
					if (text.trim()) notes[phase] = { by: me, text: text.trim() };
					else delete notes[phase];
					return { ...st, notes };
				}),
			addTask: (studyId: string, phase: string, title: string) =>
				patchState(studyId, (st) => ({ ...st, addedTasks: [...st.addedTasks, { id: `x${uid()}`, phase, title, by: me }] })),
			addStep: (studyId: string, name: string) =>
				patchState(studyId, (st) => ({ ...st, addedSteps: [...st.addedSteps, { id: `x${uid()}`, name, by: me }] })),
			renameAddedTask: (studyId: string, id: string, title: string) =>
				patchState(studyId, (st) => ({ ...st, addedTasks: st.addedTasks.map((t) => (t.id === id ? { ...t, title } : t)) })),
			// Removing returns what was removed, so the toast can offer Undo.
			removeAddedTask: (studyId: string, id: string): AddedTask | undefined => {
				const study = read().studies.find((s) => s.id === studyId);
				const removed = study?.state.addedTasks.find((t) => t.id === id);
				patchState(studyId, (st) => ({ ...st, addedTasks: st.addedTasks.filter((t) => t.id !== id) }));
				return removed;
			},
			restoreAddedTask: (studyId: string, task: AddedTask) =>
				patchState(studyId, (st) => ({ ...st, addedTasks: [...st.addedTasks, task] })),
			removeAddedStep: (studyId: string, id: string): AddedStep | undefined => {
				const study = read().studies.find((s) => s.id === studyId);
				const removed = study?.state.addedSteps.find((t) => t.id === id);
				patchState(studyId, (st) => ({ ...st, addedSteps: st.addedSteps.filter((t) => t.id !== id) }));
				return removed;
			},
			restoreAddedStep: (studyId: string, step: AddedStep) =>
				patchState(studyId, (st) => ({ ...st, addedSteps: [...st.addedSteps, step] })),
			// Place a step added for this study: at the start, or after a method phase.
			placeAddedStep: (studyId: string, id: string, after: string) =>
				patchState(studyId, (st) => {
					const step = st.addedSteps.find((s) => s.id === id);
					if (!step) return st;
					return { ...st, addedSteps: [...st.addedSteps.filter((s) => s.id !== id), { ...step, after }] };
				}),

			// ── Study files ──
			markFileChecked: (studyId: string, fileId: string) =>
				patchStudy(studyId, (s) => ({
					...s,
					files: s.files.map((f) => (f.id === fileId && f.from.kind === "claude" ? { ...f, from: { kind: "claude", checkedBy: me } } : f)),
				})),
			// Add a document to the study (a link, an upload, or a copy of a
			// template). Returns its id, so a phase can use it right away.
			attach: (studyId: string, f: { name: string; type: string; phase: string; url?: string; template?: string; category?: FileCategory }): string => {
				const id = `f${uid()}`;
				patchStudy(studyId, (s) => ({
					...s,
					files: [
						...s.files,
						{
							id,
							name: f.name,
							type: f.type,
							phase: f.phase,
							category: f.category ?? "production",
							added: new Date().toISOString().slice(0, 10),
							url: f.url,
							from: f.template ? { kind: "template", template: f.template, by: me } : { kind: "person", by: me },
						},
					],
				}));
				return id;
			},
			setPhaseDoc: (studyId: string, phase: string, fileId: string | null) =>
				patchState(studyId, (st) => {
					const phaseDocs = { ...(st.phaseDocs ?? {}) };
					if (fileId) phaseDocs[phase] = fileId;
					else delete phaseDocs[phase];
					return { ...st, phaseDocs };
				}),
			removeFile: (studyId: string, fileId: string) => patchStudy(studyId, (s) => ({ ...s, files: s.files.filter((f) => f.id !== fileId) })),

			addTeamMember: (studyId: string, person: string, role: RoleId) =>
				patchStudy(studyId, (s) => (s.team.some((m) => m.person === person) ? s : { ...s, team: [...s.team, { person, role }] })),
			removeTeamMember: (studyId: string, person: string) => patchStudy(studyId, (s) => ({ ...s, team: s.team.filter((m) => m.person !== person) })),

			// ── Corpora ──
			addCorpus: (studyId: string, name: string) => patchCorpora(studyId, (list) => [...list, { id: `k${uid()}`, name, files: [] }]),
			renameCorpus: (studyId: string, corpusId: string, name: string) => patchCorpus(studyId, corpusId, (c) => ({ ...c, name })),
			// Deposit exports: each is read against its source's format contract;
			// the processing starts on its own when one is accepted.
			deposit: (studyId: string, corpusId: string, files: { name: string; size: number; source: string }[]): CorpusFile[] => {
				const added = files.map((f) => ({
					id: `c${uid()}`,
					name: f.name,
					source: f.source,
					rows: Math.max(200, Math.round(f.size / 350)),
					added: today(),
					by: me,
					...readFormat(f.name, f.source),
				}));
				patchCorpus(studyId, corpusId, (c) => ({ ...c, files: [...c.files, ...added], processingSince: added.some((f) => f.accepted) ? Date.now() : c.processingSince }));
				return added;
			},
			removeCorpusFile: (studyId: string, corpusId: string, fileId: string) => patchCorpus(studyId, corpusId, (c) => ({ ...c, files: c.files.filter((f) => f.id !== fileId) })),

			// ── New study: what Martine creates with it (simulated) ──
			createStudy: (reading: BriefReading, briefKey: string): string => {
				const id = nextStudyId(read().studies, reading.method);
				update((d) => {
					const study: Study = {
						id,
						title: reading.title,
						short: reading.short,
						client: reading.client,
						scope: reading.scope,
						family: reading.family,
						// A new study starts on the published version and keeps it.
						method: { id: reading.method, version: methodEntry(reading.method)?.version ?? null },
						due: reading.due,
						status: "not_started",
						daysSold: reading.daysSold,
						brief: briefKey,
						team: [
							{ person: "claire", role: "consultant" },
							{ person: "marie", role: "analyst" },
							{ person: "bamby", role: "method_owner" },
						],
						toClarify: reading.toClarify.map((label, i) => ({ id: `c${i + 1}`, label: label.split(":")[0], open: true })),
						decisions: [],
						links: [
							{ kind: "data_platform", label: `Data platform: study ${id}` },
							{ kind: "drive", label: "Drive folder" },
							...(reading.family === "Trends" ? [{ kind: "talkwalker" as const, label: "Talkwalker topic" }] : []),
						],
						files: [{ id: "f1", name: "Client brief", type: "PDF", phase: "0", category: "brief", added: new Date().toISOString().slice(0, 10), from: { kind: "client" } }],
						previousWave: [],
						state: { notes: {}, phaseDocs: {}, addedTasks: [], addedSteps: [] },
					};
					return { ...d, studies: [study, ...d.studies] };
				});
				return id;
			},

			// ── Skills requested from a method step ──
			// The request goes to the tech team (Fabien), who builds the connectors
			// and the skill. Once available, the skill is linked to its step in the
			// method's draft.
			// ── Documentation ──
			addHelpDoc: (doc: { title: string; url: string; kind: string; about?: string }): string => {
				const id = `doc-${uid()}`;
				update((d) => ({ ...d, helpDocs: [...(d.helpDocs ?? []), { id, title: doc.title, url: doc.url, kind: doc.kind, about: doc.about ?? "", by: me }] }));
				return id;
			},
			setHelpUrl: (docId: string, url: string) => update((d) => ({ ...d, helpUrls: { ...d.helpUrls, [docId]: url } })),
			linkHelp: (methodId: string, taskKey: string, docId: string) =>
				update((d) => {
					const k = helpKey(methodId, taskKey);
					const list = d.helpLinks?.[k] ?? [];
					return list.includes(docId) ? d : { ...d, helpLinks: { ...d.helpLinks, [k]: [...list, docId] } };
				}),
			unlinkHelp: (methodId: string, taskKey: string, docId: string) =>
				update((d) => {
					const k = helpKey(methodId, taskKey);
					return { ...d, helpLinks: { ...d.helpLinks, [k]: (d.helpLinks?.[k] ?? []).filter((x) => x !== docId) } };
				}),
			requestSkill: (methodId: string, version: string | null, key: string, task: MethodTask, need: string, connectors: string[], kind: "skill" | "automation" = "skill"): string => {
				const id = `request-${methodId}-${key}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
				const skill: CatalogSkill = {
					id,
					label: task.task,
					does: need,
					produces: task.output || undefined,
					status: "requested",
					request: { kind, method: methodId, version, task: key, taskName: task.task, by: me, date: new Date().toISOString().slice(0, 10), need, connectors },
				};
				update((d) => {
					const list = d.skillDrafts ?? [];
					return list.some((x) => x.id === id) ? d : { ...d, skillDrafts: [...list, skill] };
				});
				return id;
			},
			setSkillStatus: (id: string, status: "in_development" | "validated") =>
				update((d) => {
					const skill = (d.skillDrafts ?? []).find((x) => x.id === id);
					if (!skill) return d;
					const skillDrafts = (d.skillDrafts ?? []).map((x) => (x.id === id ? { ...x, status } : x));
					if (status !== "validated" || !skill.request) return { ...d, skillDrafts };
					const { method, version, task } = skill.request;
					const draft = d.drafts[method] ?? emptyDraft(version);
					const added = draft.addedSkills[task] ?? [];
					return {
						...d,
						skillDrafts,
						drafts: { ...d.drafts, [method]: { ...draft, saved: false, addedSkills: { ...draft.addedSkills, [task]: added.includes(id) ? added : [...added, id] } } },
					};
				}),
			discardSkill: (id: string) =>
				update((d) => ({
					...d,
					skillDrafts: (d.skillDrafts ?? []).filter((x) => x.id !== id),
					drafts: Object.fromEntries(
						Object.entries(d.drafts).map(([m, dr]) => [
							m,
							{ ...dr, addedSkills: Object.fromEntries(Object.entries(dr.addedSkills).map(([k, v]) => [k, v.filter((x) => x !== id)])) },
						]),
					),
				})),

			// ── Methods ──
			suggestChange: (methodId: string, phase: string, task: string, text: string) =>
				update((d) => ({
					...d,
					suggestions: [
						...d.suggestions,
						{ id: `s${uid()}`, method: methodId, phase, task, by: me, text, change: { field: "how", text }, status: "pending" },
					],
				})),
			// `original` is the task field as published, so the accepted text is
			// added to it rather than replacing it.
			resolveSuggestion: (id: string, accept: boolean, methodVersion: string | null, original: string) =>
				update((d) => {
					const s = d.suggestions.find((x) => x.id === id);
					if (!s) return d;
					const suggestions = d.suggestions.map((x) => (x.id === id ? { ...x, status: accept ? ("accepted" as const) : ("declined" as const) } : x));
					if (!accept) return { ...d, suggestions };
					const draft = d.drafts[s.method] ?? emptyDraft(methodVersion);
					const edit = draft.edits[s.task] ?? {};
					const field = s.change.field;
					return {
						...d,
						suggestions,
						drafts: {
							...d.drafts,
							[s.method]: { ...draft, saved: false, edits: { ...draft.edits, [s.task]: { ...edit, [field]: appendSentence(edit[field] ?? original, s.change.text) } } },
						},
					};
				}),
			editMethodTask: (methodId: string, version: string | null, key: string, patch: MethodDraft["edits"][string]) =>
				patchDraft(methodId, version, (dr) => ({ ...dr, edits: { ...dr.edits, [key]: { ...dr.edits[key], ...patch } } })),
			addSkillToTask: (methodId: string, version: string | null, key: string, skillId: string) =>
				patchDraft(methodId, version, (dr) => {
					const list = dr.addedSkills[key] ?? [];
					return list.includes(skillId) ? dr : { ...dr, addedSkills: { ...dr.addedSkills, [key]: [...list, skillId] } };
				}),
			// Link a repository tool to a task of the method, or unlink it (draft).
			linkTool: (methodId: string, version: string | null, key: string, toolId: string) =>
				patchDraft(methodId, version, (dr) => {
					const removed = (dr.removedTools?.[key] ?? []).filter((t) => t !== toolId);
					const added = dr.addedTools?.[key] ?? [];
					return {
						...dr,
						removedTools: { ...dr.removedTools, [key]: removed },
						addedTools: { ...dr.addedTools, [key]: added.includes(toolId) ? added : [...added, toolId] },
					};
				}),
			// A proposed link (read in the task's text): the owner confirms it.
			confirmTool: (methodId: string, version: string | null, key: string, toolId: string) =>
				patchDraft(methodId, version, (dr) => {
					const list = dr.confirmedTools?.[key] ?? [];
					return list.includes(toolId) ? dr : { ...dr, confirmedTools: { ...dr.confirmedTools, [key]: [...list, toolId] } };
				}),
			unlinkTool: (methodId: string, version: string | null, key: string, toolId: string) =>
				patchDraft(methodId, version, (dr) => {
					const added = dr.addedTools?.[key] ?? [];
					const removed = dr.removedTools?.[key] ?? [];
					return {
						...dr,
						addedTools: { ...dr.addedTools, [key]: added.filter((t) => t !== toolId) },
						removedTools: { ...dr.removedTools, [key]: removed.includes(toolId) ? removed : [...removed, toolId] },
					};
				}),
			addMethodTask: (methodId: string, version: string | null, phase: string, task: string) =>
				patchDraft(methodId, version, (dr) => ({ ...dr, addedTasks: [...dr.addedTasks, { id: `t${uid()}`, phase, task, by: me }] })),
			removeMethodTask: (methodId: string, version: string | null, id: string) =>
				patchDraft(methodId, version, (dr) => ({ ...dr, addedTasks: dr.addedTasks.filter((t) => t.id !== id) })),
			restoreMethodTask: (methodId: string, version: string | null, task: MethodDraft["addedTasks"][number]) =>
				patchDraft(methodId, version, (dr) => ({ ...dr, addedTasks: [...dr.addedTasks, task] })),
			addMethodPhase: (methodId: string, version: string | null, name: string) =>
				patchDraft(methodId, version, (dr) => ({ ...dr, addedPhases: [...dr.addedPhases, { id: `p${uid()}`, name, by: me }] })),
			// Rename or remove a phase in the draft. A phase added in the draft is
			// changed in place; a published one is marked, and can be restored.
			renameMethodPhase: (methodId: string, version: string | null, phase: string, name: string) =>
				patchDraft(methodId, version, (dr) =>
					dr.addedPhases.some((p) => p.id === phase)
						? { ...dr, addedPhases: dr.addedPhases.map((p) => (p.id === phase ? { ...p, name } : p)) }
						: { ...dr, renamedPhases: { ...dr.renamedPhases, [phase]: name } },
				),
			removeMethodPhase: (methodId: string, version: string | null, phase: string): MethodDraft["addedPhases"][number] | undefined => {
				const added = read().drafts[methodId]?.addedPhases.find((p) => p.id === phase);
				patchDraft(methodId, version, (dr) =>
					added ? { ...dr, addedPhases: dr.addedPhases.filter((p) => p.id !== phase) } : { ...dr, removedPhases: [...new Set([...(dr.removedPhases ?? []), phase])] },
				);
				return added;
			},
			restoreMethodPhase: (methodId: string, version: string | null, phase: string, added?: MethodDraft["addedPhases"][number]) =>
				patchDraft(methodId, version, (dr) =>
					added ? { ...dr, addedPhases: [...dr.addedPhases, added] } : { ...dr, removedPhases: (dr.removedPhases ?? []).filter((p) => p !== phase) },
				),
			saveDraft: (methodId: string, version: string | null) =>
				update((d) => ({ ...d, drafts: { ...d.drafts, [methodId]: { ...(d.drafts[methodId] ?? emptyDraft(version)), saved: true } } })),
		}),
		[update, patchState, patchStudy, patchDraft, patchCorpora, patchCorpus, me],
	);

	return { ...data, me, corporaOf, ...actions };
}

// Accepting a suggestion adds a sentence to the field, never replaces it, so
// the method owner can still see what was there.
function appendSentence(base: string | undefined, text: string) {
	return base ? `${base.trim()} ${text}` : text;
}

type MartineValue = ReturnType<typeof useMartineState>;
const Ctx = createContext<MartineValue | null>(null);

export function MartineProvider({ children }: { children: React.ReactNode }) {
	const value = useMartineState();
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMartine(): MartineValue {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error("useMartine must be used within MartineProvider");
	return ctx;
}
