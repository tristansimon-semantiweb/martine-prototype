"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { AddRow, RemoveButton, RenameButton, RenameField } from "@/shared/components/ui/Editing";
import { useState } from "react";
import { methodEntry, skillById } from "@/shared/lib/data";
import { costed, plural } from "@/shared/lib/format";
import { hasMethodFile, phaseViews, removedSteps, type PhaseView } from "@/shared/lib/studyModel";
import { statusLine } from "@/shared/lib/martineContext";
import { toolById } from "@/shared/lib/tools";
import { cn } from "@/shared/lib/cn";
import type { PhaseStatus } from "@/shared/lib/types";
import { PhaseStatusPicker } from "./PhaseStatus";
import { PhasePage } from "./PhasePage";

// The phases of the study's method, in order. The open phase is in the URL
// (?phase=2) so Ask Martine's sources and Overview's Continue can link to it.
export function StepsView({ id }: { id: string }) {
	const { studies, addStep, removeAddedStep, restoreAddedStep, setPhaseStatus, renameStep, removeStep, restoreStep } = useMartine();
	const toast = useToast();
	const pathname = usePathname();
	const params = useSearchParams();
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const openId = params.get("phase");
	const open = views.find((p) => p.id === openId) ?? null;
	// The native History API keeps the URL (and useSearchParams) in sync
	// without a round trip to the server, so a phase opens on the click.
	const setOpen = (p: string | null) => window.history.replaceState(null, "", p ? `${pathname}?phase=${p}` : pathname);
	const method = methodEntry(study.method.id);

	if (!hasMethodFile(study)) {
		return (
			<div className="mx-auto max-w-[820px] px-6 py-8">
				<div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-6 py-8 text-[var(--color-ink-secondary)]">
					<p className="m-0 font-semibold text-[var(--color-ink)]">The {method?.name.toLowerCase() ?? "study"} method is not in Martine yet.</p>
					<p className="mb-0 mt-1.5 text-[15px]">
						Its tab in the method file is still empty: its phases and tasks show here once it is written. <Link href="/study-types">See the study types</Link>
					</p>
				</div>
			</div>
		);
	}

	// An open phase takes the page: the phases in a narrow column on the left
	// to move between them, the phase on the rest of the width.
	if (open) {
		return (
			<div className="mx-auto grid max-w-[1240px] items-start gap-7 px-6 py-7 lg:grid-cols-[240px_minmax(0,1fr)]">
				<nav aria-label="Phases of the study" className="flex flex-col gap-1 lg:sticky lg:top-[64px]">
					<button onClick={() => setOpen(null)} className="mb-1 self-start rounded-[var(--radius-sm)] px-2 py-1 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]">
						← All phases
					</button>
					<ol className="m-0 flex list-none flex-col gap-0.5 p-0">
						{views.map((p) => (
							<li key={p.id}>
								<button
									onClick={() => setOpen(p.id)}
									aria-current={p.id === open.id ? "step" : undefined}
									className={cn(
										"flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm",
										p.id === open.id ? "bg-[var(--color-accent-dim)] font-semibold text-[var(--color-accent)]" : "hover:bg-[var(--color-hover)]",
										p.status === "not_needed" && "text-[var(--color-ink-muted)]",
									)}
								>
									<span
										aria-hidden
										className={cn(
											"flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px]",
											p.status === "done"
												? "border-[var(--color-positive)] bg-[var(--color-positive)] text-white"
												: p.status === "in_progress"
													? "border-[var(--color-accent)] text-[var(--color-accent)]"
													: "border-[var(--color-border-active)] text-[var(--color-ink-muted)]",
										)}
									>
										{p.status === "done" ? <Check size={11} /> : p.addedBy ? "+" : p.id.replace(/bis$/, "b")}
									</span>
									<span className="min-w-0 flex-1 truncate">{p.name}</span>
								</button>
							</li>
						))}
					</ol>
				</nav>
				<PhasePage key={open.id} study={study} phase={open} />
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-[980px] flex-col gap-4 px-6 py-8">
			<p className="m-0 text-[15px] text-[var(--color-ink-secondary)]">
				The phases of the {method?.name.toLowerCase()} method, in order. Open one to see its tasks, their tools and their deliverables.
				<span className="mt-1 block text-sm text-[var(--color-ink-muted)]">Where it stands: {statusLine(views)}.</span>
			</p>

			<ol
				aria-label="Phases"
				className="m-0 list-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-xs)]"
			>
				{views.map((p) => (
					<PhaseRow
						key={p.id}
						phase={p}
						onOpen={() => setOpen(p.id)}
						canSetStatus
						onStatus={(s) => setPhaseStatus(study.id, p.id, s)}
						onRename={(name) => renameStep(study.id, p.id, name)}
						onRemove={() => {
							if (p.addedBy) {
								const removed = removeAddedStep(study.id, p.id);
								toast("Step removed", removed && { label: "Undo", onClick: () => restoreAddedStep(study.id, removed) });
							} else {
								removeStep(study.id, p.id);
								toast("Step removed for this study; the method keeps it", { label: "Undo", onClick: () => restoreStep(study.id, p.id) });
							}
						}}
					/>
				))}
			</ol>

			<AddRow label="Add a step for this study" placeholder="Name of the step, for this study only" onAdd={(v) => addStep(study.id, v)} />

			{removedSteps(study).length > 0 && (
				<p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-ink-muted)]">
					Left out of this study:
					{removedSteps(study).map((r) => (
						<span key={r.id} className="inline-flex items-center gap-1.5">
							<span className="line-through">{r.label}</span>
							<button onClick={() => restoreStep(study.id, r.id)} className="font-semibold text-[var(--color-accent)] hover:underline">
								Restore
							</button>
						</span>
					))}
				</p>
			)}

		</div>
	);
}

// A phase: its number and name, its tasks and planned days. The whole row
// opens it.
function PhaseRow({
	phase: p,
	onOpen,
	onRename,
	onRemove,
	canSetStatus,
	onStatus,
}: {
	phase: PhaseView;
	onOpen: () => void;
	onRename: (name: string) => void;
	onRemove: () => void;
	canSetStatus: boolean;
	onStatus: (s: PhaseStatus) => void;
}) {
	const tools = [...new Set(p.tasks.flatMap((t) => t.task.tool_ids))].map((id) => toolById(id)?.label ?? id);
	const skills = [...new Set(p.tasks.flatMap((t) => t.task.skills))].map((id) => skillById(id)?.label ?? id);
	const off = p.status === "not_needed";
	const [renaming, setRenaming] = useState(false);
	if (renaming) {
		return (
			<li className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-2.5 last:border-b-0">
				<span className="w-[30px] shrink-0 text-center text-[13px] text-[var(--color-ink-muted)]">{p.addedBy ? "+" : p.id}</span>
				<RenameField value={p.name} label={`New name for the step “${p.name}”`} onSave={onRename} onDone={() => setRenaming(false)} />
			</li>
		);
	}
	return (
		<li className="flex items-center border-b border-[var(--color-border)] transition-colors last:border-b-0 hover:bg-[var(--color-hover)]">
			<button
				onClick={onOpen}
				className="grid min-w-0 flex-1 grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 py-3.5 pl-5 pr-2 text-left sm:grid-cols-[30px_minmax(0,1fr)_64px_64px_64px_110px]"
			>
				<span
					aria-hidden
					className={cn(
						"box-border flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] text-[13px]",
						p.status === "done"
							? "border-[var(--color-positive)] bg-[var(--color-positive)] text-white"
							: p.status === "in_progress"
								? "border-[var(--color-accent)] text-[var(--color-accent)]"
								: "border-[var(--color-border-active)] text-[var(--color-ink-secondary)]",
					)}
				>
					{p.status === "done" ? <Check size={14} /> : p.addedBy ? "+" : p.id.replace(/bis$/, "b")}
				</span>
				<span className={cn("min-w-0", off && "text-[var(--color-ink-muted)]")}>
					<span className="font-semibold">
						{p.label}
						{p.addedBy && <span className="ml-2 text-[13px] font-normal text-[var(--color-attention)]">added for this study</span>}
					</span>
				</span>
				<span className="hidden text-sm text-[var(--color-ink-muted)] sm:block">{plural(p.total, "task")}</span>
				<span title={tools.join(", ")} className="hidden text-sm text-[var(--color-ink-muted)] sm:block">
					{tools.length ? plural(tools.length, "tool") : "no tool"}
				</span>
				<span title={skills.join(", ")} className={cn("hidden text-sm sm:block", skills.length ? "font-semibold text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]")}>
					{skills.length ? plural(skills.length, "skill") : "no skill"}
				</span>
				<span className="text-sm text-[var(--color-ink-muted)]">{p.addedBy ? "" : costed(p.days)}</span>
			</button>
			<span className="flex w-[124px] shrink-0">
				<PhaseStatusPicker status={p.status} canEdit={canSetStatus} onChange={onStatus} label={`Status of phase ${p.id}`} />
			</span>
			<RenameButton label={`Rename the step “${p.name}”`} onClick={() => setRenaming(true)} className="ml-1" />
			<RemoveButton label={`Remove the step “${p.name}”`} onClick={onRemove} />
			<span aria-hidden onClick={onOpen} className="flex cursor-pointer self-stretch items-center pl-1 pr-5 text-[var(--color-ink-muted)]">
				<ChevronRight size={16} />
			</span>
		</li>
	);
}
