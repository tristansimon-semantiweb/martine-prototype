"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowUpDown, Check } from "lucide-react";
import { Popover } from "@/shared/components/ui/Popover";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { AddRow, RemoveButton } from "@/shared/components/ui/Editing";
import { methodEntry } from "@/shared/lib/data";
import { hasMethodFile, phaseViews, type PhaseView } from "@/shared/lib/studyModel";
import { cn } from "@/shared/lib/cn";
import { PhasePage } from "./PhasePage";

// The study's steps: the phases in a column on the left, to move between them
// (the method's phases as they are, plus the steps added for this study); the
// open phase on the rest of the page.
// Steps opens on the phase in progress (else the first not done). The open
// phase is in the URL (?phase=2) so Ask Martine's sources and Overview's
// Continue can link to it.
export function StepsView({ id }: { id: string }) {
	const { studies, addStep, removeAddedStep, restoreAddedStep, placeAddedStep } = useMartine();
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

	// Only a step added for this study can be removed: the method's phases stay as they are.
	const remove = (p: PhaseView) => {
		const r = removeAddedStep(study.id, p.id);
		toast("Step removed", r && { label: "Undo", onClick: () => restoreAddedStep(study.id, r) });
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
						<PhaseItem
							key={p.id}
							phase={p}
							active={p.id === open.id}
							onOpen={() => setOpen(p.id)}
							onRemove={p.addedBy ? () => remove(p) : undefined}
							places={p.addedBy ? views.filter((v) => !v.addedBy) : undefined}
							onPlace={(after) => {
								placeAddedStep(study.id, p.id, after);
								toast(after === "start" ? `“${p.name}” moved to the start` : `“${p.name}” placed after ${views.find((v) => v.id === after)?.name}`);
							}}
						/>
					))}
				</ol>
				<AddRow label="Add a step" placeholder="Name of the step, for this study only" onAdd={(v) => addStep(study.id, v)} />
			</nav>
			<PhasePage key={open.id} study={study} phase={open} />
		</div>
	);
}

// A phase in the column: its state and name. A step added for this study
// shows, on hover (or keyboard focus), Move (place it at the start or after a
// method phase) and a cross to remove it.
function PhaseItem({
	phase: p,
	active,
	onOpen,
	onRemove,
	places,
	onPlace,
}: {
	phase: PhaseView;
	active: boolean;
	onOpen: () => void;
	onRemove?: () => void;
	places?: PhaseView[]; // the method phases it can be placed after
	onPlace: (after: string) => void;
}) {
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
			{onRemove && (
				<span className="flex w-0 shrink-0 overflow-hidden focus-within:w-auto group-hover:w-auto has-[[aria-expanded=true]]:w-auto has-[[aria-expanded=true]]:overflow-visible">
					{places && (
						<Popover
							align="start"
							width={280}
							trigger={({ open, toggle }) => (
								<button
									onClick={toggle}
									aria-expanded={open}
									aria-label={`Move the step “${p.name}”`}
									title="Move"
									className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]"
								>
									<ArrowUpDown size={13} aria-hidden />
								</button>
							)}
						>
							{(close) => (
								<ul role="listbox" aria-label={`Place “${p.name}”`} className="m-0 max-h-[320px] list-none overflow-y-auto p-0 text-sm">
									<li className="px-2 pb-1 pt-0.5 text-[12px] font-semibold text-[var(--color-ink-muted)]">Place this step</li>
									{[{ id: "start", label: "At the start" }, ...places.map((x) => ({ id: x.id, label: `After ${x.label}` }))].map((o) => (
										<li key={o.id}>
											<button
												role="option"
												aria-selected={false}
												onClick={() => {
													onPlace(o.id);
													close();
												}}
												className="w-full rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[var(--color-hover)]"
											>
												{o.label}
											</button>
										</li>
									))}
								</ul>
							)}
						</Popover>
					)}
					<RemoveButton label={`Remove the step “${p.name}”`} onClick={onRemove} />
				</span>
			)}
		</li>
	);
}
