"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { methodEntry, personById, skillById } from "@/shared/lib/data";
import { costedDays } from "@/shared/lib/format";
import { PhaseSheet, TaskFields, ToolList, formatOf, taskMeta, taskRows } from "@/features/phase/PhaseParts";
import { DraftSkill } from "@/features/skills/DraftSkill";
import type { MethodPhaseView, MethodTaskView } from "./methodModel";

// The study's phase drawer in edit mode, for the method owner: accept or
// decline suggestions, edit a task, add skills and tools from the catalog, add
// a task, save to the next draft. Others read it.
export function MethodPhaseDrawer({
	methodId,
	phase,
	onClose,
	onAdd,
}: {
	methodId: string;
	phase: MethodPhaseView | null;
	onClose: () => void;
	onAdd: (taskKey: string) => void;
}) {
	const { drafts, role, saveDraft } = useMartine();
	const toast = useToast();
	const m = methodEntry(methodId);
	const draftVersion = drafts[methodId]?.version ?? nextVersion(m?.version ?? null);
	const isOwner = role === "method_owner";

	return (
		<PhaseSheet
			open={Boolean(phase)}
			onClose={onClose}
			kicker={phase ? `Phase ${phase.id} of the method, ${phase.days ? `planned ${costedDays(phase.days)}` : "not costed in the method file"}` : ""}
			title={phase?.name ?? ""}
			footer={
				!phase ? null : isOwner ? (
					<div className="flex flex-wrap items-center gap-3">
						<button
							onClick={() => {
								saveDraft(methodId, m?.version ?? null);
								toast(`Saved to draft v${draftVersion}`);
							}}
							className="rounded-[var(--radius)] bg-[var(--color-accent)] px-5 py-3 font-semibold text-white hover:opacity-90"
						>
							Save to draft v{draftVersion}
						</button>
						<span className="text-sm text-[var(--color-ink-muted)]">Studies in progress keep v{m?.version} until you publish.</span>
					</div>
				) : (
					<p className="m-0 text-sm text-[var(--color-ink-muted)]">
						{m?.owner ?? "The method owner"} edits this method. To change it, suggest a change from a task in a study. (In the prototype, view as {m?.owner ?? "the method owner"} from the account menu.)
					</p>
				)
			}
		>
			{phase && <Body key={phase.id} methodId={methodId} phase={phase} isOwner={isOwner} onAdd={onAdd} />}
		</PhaseSheet>
	);
}

function nextVersion(v: string | null) {
	const [a, b] = (v ?? "1.0").split(".").map(Number);
	return `${a}.${b + 1}`;
}

function Body({ methodId, phase, isOwner, onAdd }: { methodId: string; phase: MethodPhaseView; isOwner: boolean; onAdd: (k: string) => void }) {
	const { resolveSuggestion, addMethodTask } = useMartine();
	const toast = useToast();
	const m = methodEntry(methodId);
	const [newTask, setNewTask] = useState<string | null>(null);

	return (
		<>
			{phase.suggestions.map((s) => {
				const target = phase.tasks.find((t) => t.key === s.task);
				return (
					<div key={s.id} className="flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-accent-dim)] px-4 py-3 text-[15px]">
						<span>
							<span className="font-semibold">Suggestion from {personById(s.by)?.name.split(" ")[0]}:</span> on “{target?.task.task}”, {s.text}
						</span>
						{isOwner && (
							<div className="flex gap-2">
								<button
									onClick={() => {
										resolveSuggestion(s.id, true, m?.version ?? null, target?.task[s.change.field] ?? "");
										toast("Added to the draft");
									}}
									className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white"
								>
									Add to the method
								</button>
								<button
									onClick={() => resolveSuggestion(s.id, false, m?.version ?? null, "")}
									className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-3.5 py-2 text-sm"
								>
									Decline
								</button>
							</div>
						)}
					</div>
				);
			})}

			{phase.tasks.map((t, i) => (
				<EditableTask key={t.key} methodId={methodId} index={i} view={t} isOwner={isOwner} onAdd={() => onAdd(t.key)} />
			))}
			{phase.tasks.length === 0 && <p className="m-0 text-[var(--color-ink-muted)]">No task in this phase yet.</p>}

			{isOwner &&
				(newTask === null ? (
					<button onClick={() => setNewTask("")} className="self-start text-sm font-semibold text-[var(--color-accent)]">
						Add a task
					</button>
				) : (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (!newTask.trim()) return;
							addMethodTask(methodId, m?.version ?? null, phase.id, newTask.trim());
							setNewTask(null);
						}}
						className="flex flex-wrap gap-2"
					>
						<input autoFocus value={newTask} onChange={(e) => setNewTask(e.target.value)} aria-label="Name of the task" placeholder="Name of the task" className="rr-input min-w-[240px] flex-1" />
						<button type="submit" className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 text-sm font-semibold text-white">
							Add
						</button>
						<button type="button" onClick={() => setNewTask(null)} className="rounded-[var(--radius)] px-3 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]">
							Cancel
						</button>
					</form>
				))}
		</>
	);
}

type Field = "how" | "check" | "output" | "what" | "watch_out";
const FIELDS: Record<"tasks" | "steps", { key: Field; label: string }[]> = {
	tasks: [
		{ key: "how", label: "How to do it" },
		{ key: "check", label: "Check before moving on" },
		{ key: "output", label: "Output" },
	],
	steps: [
		{ key: "what", label: "What" },
		{ key: "how", label: "How" },
		{ key: "watch_out", label: "Watch out" },
		{ key: "output", label: "Deliverable" },
	],
};

function EditableTask({ methodId, index, view, isOwner, onAdd }: { methodId: string; index: number; view: MethodTaskView; isOwner: boolean; onAdd: () => void }) {
	const { editMethodTask, unlinkTool } = useMartine();
	const m = methodEntry(methodId);
	const format = formatOf(methodId);
	const fields = FIELDS[format];
	const [editing, setEditing] = useState(false);
	const current = () => Object.fromEntries(fields.map((f) => [f.key, view.task[f.key] ?? ""])) as Partial<Record<Field, string>>;
	const [values, setValues] = useState(current);
	const { task } = view;

	const editor = (f: { key: Field; label: string }) => (
		<textarea
			value={values[f.key] ?? ""}
			onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
			rows={f.key === "how" ? 4 : 2}
			aria-label={f.label}
			className="rr-input resize-y"
		/>
	);
	const tools = (
		<ToolList task={task} newIds={view.addedTools} onUnlink={isOwner ? (t) => unlinkTool(methodId, m?.version ?? null, view.key, t) : undefined}>
			{task.skills.map((s) => (
				<span key={s} className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-accent)]">
					Skill: {skillById(s)?.label ?? s}
					{view.addedSkills.includes(s) && <span className="font-normal"> (new)</span>}
				</span>
			))}
			{isOwner && (
				<button
					onClick={onAdd}
					className="inline-flex items-center gap-0.5 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-active)] px-2.5 py-0.5 text-[13px] font-semibold"
				>
					<Plus size={12} aria-hidden /> Add
				</button>
			)}
			{!isOwner && !task.tool_ids.length && !task.skills.length && !task.tools && <span className="text-[var(--color-ink-muted)]">None named</span>}
			{!(view.original?.skills.length ?? 0) && <DraftSkill methodId={methodId} version={m?.version ?? null} taskKey={view.key} task={task} />}
		</ToolList>
	);


	return (
		<article className="flex flex-col gap-3.5 rounded-[14px] border border-[var(--color-border)] p-[18px]">
			<div className="flex flex-wrap items-center gap-3">
				<h3 className="m-0 flex-1 font-[family-name:var(--font-body)] text-lg font-semibold">
					{index + 1}. {task.task}
					{view.isNew && <span className="ml-2 text-[13px] font-normal text-[var(--color-attention)]">new in draft</span>}
					{view.edited && <span className="ml-2 text-[13px] font-normal text-[var(--color-attention)]">edited in draft</span>}
				</h3>
				<span className="text-[13px] text-[var(--color-ink-muted)]">{taskMeta(task)}</span>
				{isOwner &&
					(editing ? (
						<button
							onClick={() => {
								editMethodTask(methodId, m?.version ?? null, view.key, values);
								setEditing(false);
							}}
							className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white"
						>
							Done
						</button>
					) : (
						<button
							onClick={() => {
								setValues(current());
								setEditing(true);
							}}
							className="rounded-[var(--radius)] border border-[var(--color-border-hover)] px-3 py-1.5 text-sm hover:bg-[var(--color-hover)]"
						>
							Edit
						</button>
					))}
			</div>
			<TaskFields rows={taskRows(task, format, { tools, ...(editing ? Object.fromEntries(fields.map((f) => [f.key, editor(f)])) : {}) })} />
		</article>
	);
}
