"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry } from "@/shared/lib/data";
import { costed, plural } from "@/shared/lib/format";
import { hasMethodFile, phaseViews, type PhaseView } from "@/shared/lib/studyModel";
import { PhaseDrawer } from "./PhaseDrawer";

// The phases of the study's method, in order. The open phase is in the URL
// (?phase=2) so Ask Martine's sources and Overview's Continue can link to it.
export function StepsView({ id }: { id: string }) {
	const { studies, role, addStep } = useMartine();
	const pathname = usePathname();
	const params = useSearchParams();
	const [newStep, setNewStep] = useState<string | null>(null);
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
						Its tab in the method file is still empty: its phases and tasks show here once it is written.{" "}
						<Link href="/study-types">See the study types</Link>
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-[820px] flex-col gap-4 px-6 py-8">
			<p className="m-0 text-[15px] text-[var(--color-ink-secondary)]">
				The phases of the {method?.name.toLowerCase()} method, in order. Open one to see its tasks, their tools and their deliverables.
			</p>

			<ol aria-label="Phases" className="m-0 list-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-xs)]">
				{views.map((p) => (
					<PhaseRow key={p.id} phase={p} onOpen={() => setOpen(p.id)} />
				))}
			</ol>

			{role === "consultant" &&
				(newStep === null ? (
					<button
						onClick={() => setNewStep("")}
						className="self-start rounded-[var(--radius)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-4 py-2.5 font-semibold"
					>
						Add a step for this study
					</button>
				) : (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (!newStep.trim()) return;
							addStep(study.id, newStep.trim());
							setNewStep(null);
						}}
						className="flex flex-wrap gap-2"
					>
						<input
							autoFocus
							value={newStep}
							onChange={(e) => setNewStep(e.target.value)}
							aria-label="Name of the step"
							placeholder="Name of the step, for this study only"
							className="rr-input min-w-[260px] flex-1"
						/>
						<button type="submit" className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white">
							Add
						</button>
						<button type="button" onClick={() => setNewStep(null)} className="rounded-[var(--radius)] px-3 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]">
							Cancel
						</button>
					</form>
				))}

			<PhaseDrawer study={study} phase={open} onClose={() => setOpen(null)} />
		</div>
	);
}

// A phase: its number and name, its tasks and planned days. The whole row
// opens it.
function PhaseRow({ phase: p, onOpen }: { phase: PhaseView; onOpen: () => void }) {
	return (
		<li className="border-b border-[var(--color-border)] last:border-b-0">
			<button
				onClick={onOpen}
				className="grid w-full grid-cols-[30px_minmax(0,1fr)_auto_16px] items-center gap-3 px-5 py-3.5 text-left hover:bg-[var(--color-hover)] sm:grid-cols-[30px_minmax(0,1fr)_90px_120px_16px]"
			>
				<span
					aria-hidden
					className="box-border flex h-[26px] w-[26px] items-center justify-center rounded-full border-[1.5px] border-[var(--color-border-active)] text-[13px] text-[var(--color-ink-secondary)]"
				>
					{p.addedBy ? "+" : p.id.replace(/bis$/, "b")}
				</span>
				<span className="font-semibold">
					{p.label}
					{p.addedBy && <span className="ml-2 text-[13px] font-normal text-[var(--color-attention)]">added for this study</span>}
				</span>
				<span className="hidden text-sm text-[var(--color-ink-muted)] sm:block">{plural(p.total, "task")}</span>
				<span className="text-sm text-[var(--color-ink-muted)]">{p.addedBy ? "" : costed(p.days)}</span>
				<ChevronRight size={16} aria-hidden className="text-[var(--color-ink-muted)]" />
			</button>
		</li>
	);
}
