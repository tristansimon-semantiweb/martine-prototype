"use client";

import { Plus } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { methodEntry, personById, skillById } from "@/shared/lib/data";
import { Lines, TaskFields, ToolList, formatOf, taskRows } from "@/features/phase/PhaseParts";
import { InlineEdit } from "@/shared/components/ui/Editing";
import { RequestSkill } from "@/features/skills/RequestSkill";
import { TaskHelp } from "@/features/steps/TaskHelp";
import { otherToolItems } from "@/shared/lib/tools";
import type { Tab } from "./CatalogDrawer";
import type { MethodPhaseView, MethodTaskView } from "./methodModel";

export function nextVersion(v: string | null) {
	const [a, b] = (v ?? "1.0").split(".").map(Number);
	return `${a}.${b + 1}`;
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

export function EditableTask({ methodId, view, isOwner, onAdd }: { methodId: string; view: MethodTaskView; isOwner: boolean; onAdd: (tab: Tab) => void }) {
	const { editMethodTask, unlinkTool, linkTool, confirmTool, removeMethodTask, restoreMethodTask, drafts } = useMartine();
	const toast = useToast();
	const m = methodEntry(methodId);
	const version = m?.version ?? null;
	const format = formatOf(methodId);
	const fields = FIELDS[format];
	const { task } = view;
	const added = view.draftId ? drafts[methodId]?.addedTasks.find((t) => t.id === view.draftId) : undefined;

	// Every field of the task edits in place for the method owner.
	const editors = isOwner
		? Object.fromEntries(
				fields.map((f) => [
					f.key,
					<InlineEdit
						key={f.key}
						value={task[f.key] ?? ""}
						onSave={(v) => editMethodTask(methodId, version, view.key, { [f.key]: v })}
						canEdit
						multiline
						label={f.label.toLowerCase()}
						placeholder={`Add ${f.label.toLowerCase()}`}
					>
						{f.key === "how" || f.key === "watch_out" ? <Lines text={task[f.key] ?? ""} /> : task[f.key]}
					</InlineEdit>,
				]),
			)
		: {};
	const tools = (
		<ToolList
			task={task}
			newIds={view.addedTools}
			toConfirm={view.toConfirm}
			onConfirm={
				isOwner
					? (t) => {
							confirmTool(methodId, version, view.key, t);
							toast("Link confirmed in the draft");
						}
					: undefined
			}
			onUnlink={
				isOwner
					? (t) => {
							unlinkTool(methodId, version, view.key, t);
							toast("Tool unlinked", { label: "Undo", onClick: () => linkTool(methodId, version, view.key, t) });
						}
					: undefined
			}
		>
			{isOwner && <AddChip label="Add a tool" onClick={() => onAdd("Tools")} />}
		</ToolList>
	);
	// Skills and documents have their own rows, each with its own Add.
	const skills = (
		<span className="flex flex-wrap items-center gap-1.5">
			{task.skills.map((s) => (
				<span key={s} className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-accent)]">
					{skillById(s)?.label ?? s}
					{view.addedSkills.includes(s) && <span className="font-normal"> (new)</span>}
				</span>
			))}
			{!isOwner && !task.skills.length && <span className="text-[var(--color-ink-muted)]">No skill</span>}
			{isOwner && <AddChip label="Add a skill" onClick={() => onAdd("Skills")} />}
			{!(view.original?.skills.length ?? 0) && <RequestSkill methodId={methodId} version={m?.version ?? null} taskKey={view.key} task={task} />}
		</span>
	);
	// The method owner sees documents and guides together: what the catalog's Documents tab adds.
	const docs = [...otherToolItems(task).documents, ...otherToolItems(task).guides];
	const documents = (
		<span className="flex flex-wrap items-center gap-1.5">
			{docs.length ? <span>{docs.join(", ")}</span> : !isOwner && <span className="text-[var(--color-ink-muted)]">None named</span>}
			{isOwner && <AddChip label="Add a document" onClick={() => onAdd("Documents")} />}
		</span>
	);


	return (
		<div className="flex flex-col gap-4">
			{(view.isNew || view.edited || (isOwner && added)) && (
				<div className="flex flex-wrap items-center gap-3 text-[13px]">
					{view.isNew && <span className="text-[var(--color-attention)]">New in the draft</span>}
					{view.edited && <span className="text-[var(--color-attention)]">Edited in the draft</span>}
					{isOwner && added && (
						<button
							onClick={() => {
								removeMethodTask(methodId, version, added.id);
								toast("Task removed from the draft", { label: "Undo", onClick: () => restoreMethodTask(methodId, version, added) });
							}}
							className="ml-auto font-semibold text-[var(--color-negative)] hover:underline"
						>
							Remove from the draft
						</button>
					)}
				</div>
			)}
			<TaskHelp task={task} />
			<TaskFields rows={taskRows(task, format, { skills, tools, documents, ...editors })} />
		</div>
	);
}

// "+ Add a tool": opens the catalog on the matching tab.
function AddChip({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<button
			onClick={onClick}
			aria-label={label}
			className="inline-flex items-center gap-0.5 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-active)] px-2.5 py-0.5 text-[13px] font-semibold hover:bg-[var(--color-hover)]"
		>
			<Plus size={12} aria-hidden /> Add
		</button>
	);
}

// The suggestions waiting on a phase: the owner adds one to the draft or declines it.
export function PhaseSuggestions({ methodId, phase, isOwner }: { methodId: string; phase: MethodPhaseView; isOwner: boolean }) {
	const { resolveSuggestion } = useMartine();
	const toast = useToast();
	const m = methodEntry(methodId);
	if (!phase.suggestions.length) return null;
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
		</>
	);
}
