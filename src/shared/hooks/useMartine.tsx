"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { methodEntry, registerDraftSkills, seedStudies, seedSuggestions } from "@/shared/lib/data";
import { toolById } from "@/shared/lib/tools";
import type { BriefReading, CatalogSkill, MethodSuggestion, MethodTask, RoleId, Study, StudyState } from "@/shared/lib/types";

// The prototype's whole mutable state, persisted in localStorage like the R&R
// prototype (useUserContent). Seeded from /data; "Reset the demo" restores it.

export interface MethodDraft {
	version: string; // the draft's version, e.g. "1.3"
	saved: boolean;
	edits: Record<string, Partial<Pick<MethodTask, "how" | "check" | "output" | "tools" | "what" | "watch_out">>>; // key: task key
	addedSkills: Record<string, string[]>; // key: task key
	addedTools?: Record<string, string[]>; // key: task key; tool ids
	removedTools?: Record<string, string[]>;
	addedTasks: { id: string; phase: string; task: string; by: string }[];
	addedPhases: { id: string; name: string; by: string }[];
}

interface MartineData {
	role: RoleId;
	studies: Study[];
	suggestions: MethodSuggestion[];
	drafts: Record<string, MethodDraft>; // key: method id
	skillDrafts?: CatalogSkill[]; // skills drafted from method steps, to review
}

// Bumped when the seed data changes shape (v2: the methods import), so a
// browser that kept an older demo starts again from the new seed (v3: files
// attached to tasks; v4: V1 scope, no ticking, validation or time; v5: one
// document per phase).
const KEY = "martine_v5";

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

			// ── Study files ──
			markFileChecked: (studyId: string, fileId: string) =>
				patchStudy(studyId, (s) => ({
					...s,
					files: s.files.map((f) => (f.id === fileId && f.from.kind === "claude" ? { ...f, from: { kind: "claude", checkedBy: me } } : f)),
				})),
			// Add a document to the study (a link, an upload, or a copy of a
			// template). Returns its id, so a phase can use it right away.
			attach: (studyId: string, f: { name: string; type: string; phase: string; url?: string; template?: string }): string => {
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
				patchStudy(studyId, (s) => ({ ...s, team: [...s.team, { person, role }] })),

			// ── New study: what Martine creates with it (simulated) ──
			createStudy: (reading: BriefReading, briefKey: string): string => {
				const id = nextStudyId(read().studies, reading.method);
				update((d) => {
					const study: Study = {
						id,
						title: reading.title,
						short: reading.short,
						client: reading.client,
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
						files: [{ id: "f1", name: "Client brief", type: "PDF", phase: "0", from: { kind: "client" } }],
						previousWave: [],
						state: { notes: {}, phaseDocs: {}, addedTasks: [], addedSteps: [] },
					};
					return { ...d, studies: [study, ...d.studies] };
				});
				return id;
			},

			// ── Skills drafted from a method step ──
			// In the real product Claude drafts the skill with skill-creator from
			// the step it reads through the Martine connector; the prototype
			// writes a draft from the step's own columns. It is linked to the step
			// in the method's draft and waits for the method owner's review.
			draftSkill: (methodId: string, version: string | null, key: string, task: MethodTask): string => {
				const id = `draft-${methodId}-${key}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
				const firstSentence = (t: string) => t.split(/\n|(?<=\.)\s/)[0]?.trim() ?? "";
				const tools = task.tool_ids.map((t) => toolById(t)?.label ?? t);
				const skill: CatalogSkill = {
					id,
					label: task.task,
					does: firstSentence(task.what || task.how) || "[to describe]",
					needs: tools.length ? `The study context from Martine; works with ${tools.join(", ")}` : "The study context from Martine",
					produces: task.output || "[to define]",
					status: "draft",
					origin: { method: methodId, version, task: key, taskName: task.task, by: me, date: new Date().toISOString().slice(0, 10) },
				};
				update((d) => {
					const list = d.skillDrafts ?? [];
					if (list.some((x) => x.id === id)) return d;
					const draft = d.drafts[methodId] ?? emptyDraft(version);
					const added = draft.addedSkills[key] ?? [];
					return {
						...d,
						skillDrafts: [...list, skill],
						drafts: { ...d.drafts, [methodId]: { ...draft, saved: false, addedSkills: { ...draft.addedSkills, [key]: [...added, id] } } },
					};
				});
				return id;
			},
			// Two reviews: the method owner approves it for the method, then the
			// skills owner validates it, which makes it available to everyone.
			setSkillStatus: (id: string, status: "approved" | "validated") =>
				update((d) => ({ ...d, skillDrafts: (d.skillDrafts ?? []).map((x) => (x.id === id ? { ...x, status } : x)) })),
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
			addMethodPhase: (methodId: string, version: string | null, name: string) =>
				patchDraft(methodId, version, (dr) => ({ ...dr, addedPhases: [...dr.addedPhases, { id: `p${uid()}`, name, by: me }] })),
			saveDraft: (methodId: string, version: string | null) =>
				update((d) => ({ ...d, drafts: { ...d.drafts, [methodId]: { ...(d.drafts[methodId] ?? emptyDraft(version)), saved: true } } })),
		}),
		[update, patchState, patchStudy, patchDraft, me],
	);

	return { ...data, me, ...actions };
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
