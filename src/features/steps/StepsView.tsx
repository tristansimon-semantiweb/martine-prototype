"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { AddRow, RemoveButton, RenameButton, RenameField } from "@/shared/components/ui/Editing";
import { methodEntry } from "@/shared/lib/data";
import { hasMethodFile, phaseViews, removedSteps, type PhaseView } from "@/shared/lib/studyModel";
import { cn } from "@/shared/lib/cn";
import { PhasePage } from "./PhasePage";

// The study's steps: the phases in a column on the left, to move between them
// and to rename, remove or add one; the open phase on the rest of the page.
// Steps opens on the phase in progress (else the first not done). The open
// phase is in the URL (?phase=2) so Ask Martine's sources and Overview's
// Continue can link to it.
export function StepsView({ id }: { id: string }) {
	const { studies, addStep, removeAddedStep, restoreAddedStep, renameStep, removeStep, restoreStep } = useMartine();
	const toast = useToast();
	const pathname = usePathname();
	const params = useSearchParams();
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const fallback = views.find((p) => p.status === "in_progress") ?? views.find((p) => p.status !== "done" && p.status !== "not_needed") ?? views[0];
	const open = views.find((p) => p.id === params.get("phase")) ?? fallback;
	// The native History API keeps the URL (and useSearchParams) in sync
	// without a round trip to the server, so a phase opens on the click.
	const setOpen = (p: string) => window.history.replaceState(null, "", `${pathname}?phase=${p}`);
	const method = methodEntry(study.method.id);

	if (!hasMethodFile(study) || !open) {
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

	const counted = views.filter((p) => p.status !== "not_needed");
	const done = counted.filter((p) => p.status === "done").length;
	const removed = removedSteps(study);

	const remove = (p: PhaseView) => {
		if (p.addedBy) {
			const r = removeAddedStep(study.id, p.id);
			toast("Step removed", r && { label: "Undo", onClick: () => restoreAddedStep(study.id, r) });
		} else {
			removeStep(study.id, p.id);
			toast("Step removed for this study; the method keeps it", { label: "Undo", onClick: () => restoreStep(study.id, p.id) });
		}
	};

	return (
		<div className="mx-auto grid max-w-[1240px] items-start gap-7 px-6 py-7 lg:grid-cols-[260px_minmax(0,1fr)]">
			<nav
				aria-label="Phases of the study"
				className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-[var(--shadow-xs)] lg:sticky lg:top-6"
			>
				<div className="px-2 pt-1">
					<div className="text-sm font-semibold">Phases</div>
					<div className="text-[13px] text-[var(--color-ink-muted)]">
						{done} of {counted.length} done
					</div>
				</div>
				<ol aria-label="Phases" className="m-0 flex list-none flex-col gap-0.5 p-0">
					{views.map((p) => (
						<PhaseItem key={p.id} phase={p} active={p.id === open.id} onOpen={() => setOpen(p.id)} onRename={(name) => renameStep(study.id, p.id, name)} onRemove={() => remove(p)} />
					))}
				</ol>
				<AddRow label="Add a step" placeholder="Name of the step, for this study only" onAdd={(v) => addStep(study.id, v)} />
				{removed.length > 0 && (
					<div className="flex flex-col gap-1 px-2 pb-1 text-[13px] text-[var(--color-ink-muted)]">
						Left out of this study:
						{removed.map((r) => (
							<span key={r.id} className="flex items-center gap-1.5">
								<span className="min-w-0 flex-1 truncate line-through">{r.label}</span>
								<button onClick={() => restoreStep(study.id, r.id)} className="font-semibold text-[var(--color-accent)] hover:underline">
									Restore
								</button>
							</span>
						))}
					</div>
				)}
			</nav>
			<PhasePage key={open.id} study={study} phase={open} />
		</div>
	);
}

// A phase in the column: its state and name; the pencil and the cross show
// on hover (or keyboard focus) to rename it or take it out of this study.
function PhaseItem({ phase: p, active, onOpen, onRename, onRemove }: { phase: PhaseView; active: boolean; onOpen: () => void; onRename: (name: string) => void; onRemove: () => void }) {
	const [renaming, setRenaming] = useState(false);
	if (renaming) {
		return (
			<li className="px-1 py-0.5">
				<RenameField value={p.name} label={`New name for the step “${p.name}”`} onSave={onRename} onDone={() => setRenaming(false)} />
			</li>
		);
	}
	return (
		<li className={cn("group flex items-center rounded-[var(--radius-sm)]", active ? "bg-[var(--color-accent-dim)]" : "hover:bg-[var(--color-hover)]")}>
			<button
				onClick={onOpen}
				aria-current={active ? "step" : undefined}
				className={cn(
					"flex min-w-0 flex-1 items-start gap-2 px-2 py-1.5 text-left text-sm",
					active && "font-semibold text-[var(--color-accent)]",
					p.status === "not_needed" && "text-[var(--color-ink-muted)] line-through",
				)}
			>
				<span
					aria-hidden
					className={cn(
						"mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px] no-underline",
						p.status === "done"
							? "border-[var(--color-positive)] bg-[var(--color-positive)] text-white"
							: p.status === "in_progress"
								? "border-[var(--color-accent)] text-[var(--color-accent)]"
								: "border-[var(--color-border-active)] text-[var(--color-ink-muted)]",
					)}
				>
					{p.status === "done" ? <Check size={11} /> : p.addedBy ? "+" : p.id.replace(/bis$/, "b")}
				</span>
				<span className="min-w-0 flex-1 leading-snug">{p.name}</span>
			</button>
			<span className="flex w-0 shrink-0 overflow-hidden focus-within:w-auto group-hover:w-auto">
				<RenameButton label={`Rename the step “${p.name}”`} onClick={() => setRenaming(true)} className="h-6 w-6" />
				<RemoveButton label={`Remove the step “${p.name}”`} onClick={onRemove} />
			</span>
		</li>
	);
}
