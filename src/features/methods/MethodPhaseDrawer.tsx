"use client";

import { Plus } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { methodEntry, personById, skillById } from "@/shared/lib/data";
import { costedDays } from "@/shared/lib/format";
import { Lines, PhaseSheet, TaskFields, ToolList, formatOf, taskMeta, taskRows } from "@/features/phase/PhaseParts";
import { AddRow, CanDo, InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { RequestSkill } from "@/features/skills/RequestSkill";
import { otherToolItems } from "@/shared/lib/tools";
import type { Tab } from "./CatalogDrawer";
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
	onAdd: (taskKey: string, tab: Tab) => void;
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

export function nextVersion(v: string | null) {
	const [a, b] = (v ?? "1.0").split(".").map(Number);
	return `${a}.${b + 1}`;
}

function Body({ methodId, phase, isOwner, onAdd }: { methodId: string; phase: MethodPhaseView; isOwner: boolean; onAdd: (k: string, tab: Tab) => void }) {
	const { resolveSuggestion, addMethodTask, drafts } = useMartine();
	const toast = useToast();
	const m = methodEntry(methodId);
	const draftVersion = drafts[methodId]?.version ?? nextVersion(m?.version ?? null);

	return (
		<>
			{isOwner ? (
				<CanDo
					can="You edit this method: click any text to change it, add or remove tools and skills, add tasks."
					locked={`Your changes go to draft v${draftVersion}; studies in progress keep v${m?.version} until you publish.`}
				/>
			) : (
				<CanDo can="You can read this method." locked={`${m?.owner ?? "The method owner"} edits it. Suggest a change from a task in a study.`} />
			)}
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
				<EditableTask key={t.key} methodId={methodId} index={i} view={t} isOwner={isOwner} onAdd={(tab) => onAdd(t.key, tab)} />
			))}
			{phase.tasks.length === 0 && <p className="m-0 text-[var(--color-ink-muted)]">No task in this phase yet.</p>}

			{isOwner && <AddRow label="Add a task to this phase" placeholder="Name of the task" onAdd={(v) => addMethodTask(methodId, m?.version ?? null, phase.id, v)} />}
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

function EditableTask({ methodId, index, view, isOwner, onAdd }: { methodId: string; index: number; view: MethodTaskView; isOwner: boolean; onAdd: (tab: Tab) => void }) {
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
	const docs = otherToolItems(task).documents;
	const documents = (
		<span className="flex flex-wrap items-center gap-1.5">
			{docs.length ? <span>{docs.join(", ")}</span> : !isOwner && <span className="text-[var(--color-ink-muted)]">None named</span>}
			{isOwner && <AddChip label="Add a document" onClick={() => onAdd("Documents")} />}
		</span>
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
				{isOwner && added && (
					<RemoveButton
						label={`Remove “${task.task}” from the draft`}
						onClick={() => {
							removeMethodTask(methodId, version, added.id);
							toast("Task removed from the draft", { label: "Undo", onClick: () => restoreMethodTask(methodId, version, added) });
						}}
					/>
				)}
			</div>
			<TaskFields rows={taskRows(task, format, { skills, tools, documents, ...editors })} />
		</article>
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
