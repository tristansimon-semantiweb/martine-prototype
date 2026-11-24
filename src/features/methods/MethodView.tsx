"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { Sheet } from "@/shared/components/ui/Sheet";
import { AddRow, CanDo, RemoveButton, RenameButton, RenameField } from "@/shared/components/ui/Editing";
import { methodEntry, skillById } from "@/shared/lib/data";
import { costedDays, plural } from "@/shared/lib/format";
import { useHelp } from "@/shared/hooks/useHelp";
import { cn } from "@/shared/lib/cn";
import { BookOpen } from "lucide-react";
import { taskMeta } from "@/features/phase/PhaseParts";
import { methodPhases, removedPhases, type MethodPhaseView } from "./methodModel";
import { EditableTask, PhaseSuggestions, nextVersion } from "./MethodTask";
import { CatalogDrawer, type Tab } from "./CatalogDrawer";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";
const prop = "text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]";

// A study type's method, laid out like a study's Steps: the phases in a column
// on the left, the open phase on the rest of the page with its tasks as rows;
// a task's detail opens beside it (in edit mode for the method owner), with the
// catalog over it to add a skill, a tool or a document. The URL holds the open
// phase (?phase=), task (&task=) and catalog (&add=&tab=).
export function MethodView({ id }: { id: string }) {
	const { suggestions, drafts, role, addMethodPhase, renameMethodPhase, removeMethodPhase, restoreMethodPhase } = useMartine();
	const toast = useToast();
	const pathname = usePathname();
	const params = useSearchParams();
	const m = methodEntry(id);
	if (!m) return null;

	const draft = drafts[id];
	const phases = methodPhases(id, draft, suggestions);
	const isOwner = role === "method_owner";
	const open = phases.find((p) => p.id === params.get("phase")) ?? phases.find((p) => p.suggestions.length) ?? phases[0];
	const taskKey = params.get("task");
	const addKey = params.get("add");
	const tabParam = params.get("tab");
	const tab: Tab = tabParam === "Tools" || tabParam === "Documents" ? tabParam : "Skills";
	// Native History API: no server round trip (see StepsView).
	const go = (q: Record<string, string | null>) => {
		const next = new URLSearchParams();
		for (const [k, v] of Object.entries(q)) if (v) next.set(k, v);
		window.history.replaceState(null, "", next.size ? `${pathname}?${next}` : pathname);
	};

	if (!open) {
		return (
			<div className="mx-auto max-w-[1240px] [&>*]:max-w-[820px] px-6 py-8">
				<p className={`${card} m-0 border-dashed px-6 py-8 text-[var(--color-ink-secondary)]`}>This method is not written yet. Its phases and tasks show here once it is.</p>
			</div>
		);
	}

	const removed = removedPhases(id, draft);
	return (
		<div className="mx-auto grid max-w-[1240px] items-start gap-7 px-6 py-7 lg:grid-cols-[260px_minmax(0,1fr)]">
			<nav aria-label="Phases of the method" className={`${card} flex flex-col gap-2 p-2.5 lg:sticky lg:top-6`}>
				<div className="px-2 pt-1">
					<div className="text-sm font-semibold">Phases</div>
					<div className="text-[13px] text-[var(--color-ink-muted)]">{plural(phases.length, "phase")}</div>
				</div>
				<ol aria-label="Phases" className="m-0 flex list-none flex-col gap-0.5 p-0">
					{phases.map((p) => (
						<PhaseItem
							key={p.id}
							phase={p}
							active={p.id === open.id}
							canEdit={isOwner}
							onOpen={() => go({ phase: p.id })}
							onRename={(name) => renameMethodPhase(id, m.version, p.id, name)}
							onRemove={() => {
								const added = removeMethodPhase(id, m.version, p.id);
								toast("Phase removed in the draft", { label: "Undo", onClick: () => restoreMethodPhase(id, m.version, p.id, added) });
							}}
						/>
					))}
				</ol>
				{isOwner && <AddRow label="Add a phase" placeholder="Name of the phase" onAdd={(v) => addMethodPhase(id, m.version, v)} />}
				{removed.length > 0 && (
					<div className="flex flex-col gap-1 px-2 pb-1 text-[13px] text-[var(--color-ink-muted)]">
						Removed in the draft:
						{removed.map((r) => (
							<span key={r.id} className="flex items-center gap-1.5">
								<span className="min-w-0 flex-1 truncate line-through">{r.label}</span>
								{isOwner && (
									<button onClick={() => restoreMethodPhase(id, m.version, r.id)} className="font-semibold text-[var(--color-accent)] hover:underline">
										Restore
									</button>
								)}
							</span>
						))}
					</div>
				)}
			</nav>

			<MethodPhasePage key={open.id} methodId={id} phase={open} isOwner={isOwner} onOpenTask={(k) => go({ phase: open.id, task: k })} />

			<Sheet
				open={Boolean(taskKey && open.tasks.some((t) => t.key === taskKey))}
				onClose={() => go({ phase: open.id })}
				width={600}
				level={1}
				label="Task"
				header={
					(() => {
						const v = open.tasks.find((t) => t.key === taskKey);
						return v ? (
							<>
								<div className="text-sm text-[var(--color-ink-muted)]">
									Task {v.key}
									{taskMeta(v.task) && `, ${taskMeta(v.task)}`}
								</div>
								<h2 className="mt-0.5 font-[family-name:var(--font-heading)] text-[26px] font-medium leading-tight">{v.task.task}</h2>
							</>
						) : null;
					})()
				}
			>
				{(() => {
					const v = open.tasks.find((t) => t.key === taskKey);
					return v ? <EditableTask key={v.key} methodId={id} view={v} isOwner={isOwner} onAdd={(t) => go({ phase: open.id, task: v.key, add: v.key, tab: t })} /> : null;
				})()}
			</Sheet>
			<CatalogDrawer key={`${addKey}-${tab}`} methodId={id} phase={open} taskKey={addKey} initialTab={tab} level={2} onClose={() => go({ phase: open.id, task: taskKey })} />
		</div>
	);
}

// A phase in the column: its number and name; new in the draft or waiting
// suggestions show beside it. The owner renames or removes it on hover.
function PhaseItem({
	phase: p,
	active,
	canEdit,
	onOpen,
	onRename,
	onRemove,
}: {
	phase: MethodPhaseView;
	active: boolean;
	canEdit: boolean;
	onOpen: () => void;
	onRename: (name: string) => void;
	onRemove: () => void;
}) {
	const [renaming, setRenaming] = useState(false);
	if (renaming) {
		return (
			<li className="px-1 py-0.5">
				<RenameField value={p.name} label={`New name for the phase “${p.name}”`} onSave={onRename} onDone={() => setRenaming(false)} />
			</li>
		);
	}
	return (
		<li className={cn("group flex items-center rounded-[var(--radius-sm)]", active ? "bg-[var(--color-accent-dim)]" : "hover:bg-[var(--color-hover)]")}>
			<button
				onClick={onOpen}
				aria-current={active ? "step" : undefined}
				className={cn("flex min-w-0 flex-1 items-start gap-2 px-2 py-1.5 text-left text-sm", active && "font-semibold text-[var(--color-accent)]")}
			>
				<span aria-hidden className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[var(--color-border-active)] text-[10px] text-[var(--color-ink-muted)]">
					{p.isNew ? "+" : p.id.replace(/bis$/, "b")}
				</span>
				<span className="min-w-0 flex-1 leading-snug">
					{p.name}
					{p.optional && <span className="ml-1.5 text-[11px] font-normal text-[var(--color-ink-muted)]">optional</span>}
				</span>
				{p.suggestions.length > 0 && (
					<span aria-hidden title={plural(p.suggestions.length, "suggestion")} className="mt-px rounded-[var(--radius-xl)] bg-[var(--color-accent)] px-1.5 text-[10px] font-bold text-white">
						{p.suggestions.length}
					</span>
				)}
			</button>
			{canEdit && (
				<span className="flex w-0 shrink-0 overflow-hidden focus-within:w-auto group-hover:w-auto">
					<RenameButton label={`Rename the phase “${p.name}”`} onClick={() => setRenaming(true)} className="h-6 w-6" />
					<RemoveButton label={`Remove the phase “${p.name}”`} onClick={onRemove} />
				</span>
			)}
		</li>
	);
}

// The open phase, as a study's phase page: its header with its properties and
// Save to draft (owner), the suggestions waiting on it, then its tasks as rows.
function MethodPhasePage({ methodId, phase, isOwner, onOpenTask }: { methodId: string; phase: MethodPhaseView; isOwner: boolean; onOpenTask: (key: string) => void }) {
	const { drafts, saveDraft, addMethodTask } = useMartine();
	const docsFor = useHelp().forTask;
	const toast = useToast();
	const m = methodEntry(methodId);
	const draft = drafts[methodId];
	const draftVersion = draft?.version ?? nextVersion(m?.version ?? null);

	return (
		<article aria-labelledby="phase-title" className="flex min-w-0 flex-col gap-4">
			<section aria-label="This phase" className={`${card} flex flex-col gap-3.5 px-6 py-5`}>
				<header className="flex flex-wrap items-start gap-x-4 gap-y-3">
					<div className="min-w-0 flex-1">
						<div className="text-sm text-[var(--color-ink-muted)]">Phase {phase.id} of the method</div>
						<h2 id="phase-title" className="m-0 mt-0.5 font-[family-name:var(--font-heading)] text-[28px] font-medium leading-tight">
							{phase.name}
						</h2>
					</div>
					{isOwner && (
						<button
							onClick={() => {
								saveDraft(methodId, m?.version ?? null);
								toast(`Saved to draft v${draftVersion}`);
							}}
							className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
						>
							Save to draft v{draftVersion}
						</button>
					)}
				</header>
				<dl className="m-0 grid overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm sm:grid-cols-3 sm:divide-x sm:divide-[var(--color-border)] max-sm:divide-y max-sm:divide-[var(--color-border)]">
					<div className="flex flex-col gap-1 px-4 py-3">
						<dt className={prop}>Planned</dt>
						<dd className="m-0 font-semibold">{phase.days ? costedDays(phase.days) : <span className="font-normal text-[var(--color-ink-muted)]">not costed</span>}</dd>
					</div>
					<div className="flex flex-col gap-1 px-4 py-3">
						<dt className={prop}>Skills</dt>
						<dd className={cn("m-0", phase.skillCount ? "font-semibold text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]")}>{phase.skillCount ? plural(phase.skillCount, "skill") : "no skill"}</dd>
					</div>
					<div className="flex flex-col gap-1 px-4 py-3">
						<dt className={prop}>Version</dt>
						<dd className="m-0">
							v{m?.version}
							<span className="block text-[12px] text-[var(--color-ink-muted)]">{draft ? `draft v${draft.version}${draft.saved ? " saved" : " not saved"}` : "no draft yet"}</span>
						</dd>
					</div>
				</dl>
				<PhaseSuggestions methodId={methodId} phase={phase} isOwner={isOwner} />
			</section>

			<section aria-labelledby="tasks-h" className={card}>
				<h3 id="tasks-h" className="m-0 flex items-baseline gap-2 border-b border-[var(--color-border)] px-6 py-3.5 font-[family-name:var(--font-body)] text-lg font-semibold">
					Tasks <span className="text-sm font-normal text-[var(--color-ink-muted)]">{phase.tasks.length}, in order</span>
				</h3>
				{phase.tasks.length === 0 ? (
					<p className="m-0 px-6 py-4 text-sm text-[var(--color-ink-muted)]">No task in this phase yet.</p>
				) : (
					<ol aria-label="Tasks" className="m-0 list-none p-0">
						{phase.tasks.map((t) => {
							const summary = t.task.what || t.task.how.split(/\n|(?<=\.)\s/)[0];
							const help = docsFor(methodId, t.key, t.task);
							return (
								<li key={t.key} className="border-b border-[var(--color-border)] last:border-b-0">
									<button onClick={() => onOpenTask(t.key)} aria-label={`${t.task.task}: details`} className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 text-left hover:bg-[var(--color-hover)]">
										<span className="min-w-[260px] flex-1">
											<span className="flex flex-wrap items-baseline gap-x-2">
												<span className="text-[13px] text-[var(--color-ink-muted)]">{t.key}</span>
												<span className="text-[16px] font-semibold">{t.task.task}</span>
												{t.isNew && <span className="text-[12px] text-[var(--color-attention)]">new in draft</span>}
												{t.edited && <span className="text-[12px] text-[var(--color-attention)]">edited in draft</span>}
											</span>
											{summary && <span className="mt-0.5 line-clamp-2 block text-sm text-[var(--color-ink-secondary)]">{summary}</span>}
											{help.length > 0 && (
												<span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-ink-muted)]">
													<BookOpen size={12} aria-hidden /> {plural(help.length, "doc")} to help
												</span>
											)}
										</span>
										<span className="flex shrink-0 flex-wrap items-center gap-1.5">
											{t.task.skills.map((s) => (
												<span key={s} className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--color-accent)]">
													{skillById(s)?.label ?? s}
												</span>
											))}
											{t.task.skills.length === 0 && <span className="text-[12px] text-[var(--color-ink-muted)]">no skill</span>}
										</span>
									</button>
								</li>
							);
						})}
					</ol>
				)}
				<div className="flex flex-col gap-3 border-t border-[var(--color-border)] bg-[var(--color-canvas)]/50 px-6 py-3.5">
					{isOwner && <AddRow label="Add a task to this phase" placeholder="Name of the task" onAdd={(v) => addMethodTask(methodId, m?.version ?? null, phase.id, v)} />}
					{isOwner ? (
						<CanDo
							can="You edit this method: open a task to change its text, its skills, tools and documents; add, rename or remove phases and tasks."
							locked={`Your changes go to draft v${draftVersion}; studies in progress keep v${m?.version} until you publish.`}
						/>
					) : (
						<CanDo can="You can read this method." locked={`${m?.owner ?? "The method owner"} edits it. Suggest a change from a task in a study.`} />
					)}
				</div>
			</section>
		</article>
	);
}
