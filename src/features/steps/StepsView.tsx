"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry } from "@/shared/lib/data";
import { dayRange, plural } from "@/shared/lib/format";
import { hasMethodFile, phaseViews, type PhaseView } from "@/shared/lib/studyModel";
import { PhaseDrawer } from "./PhaseDrawer";

// The phases of the study's method, in order. The open phase is in the URL
// (?phase=2) so Ask Martine's sources and Overview's Continue can link to it.
export function StepsView({ id }: { id: string }) {
	const { studies, role, addStep } = useMartine();
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const [newStep, setNewStep] = useState<string | null>(null);
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const openId = params.get("phase");
	const open = views.find((p) => p.id === openId) ?? null;
	const setOpen = (p: string | null) => router.replace(p ? `${pathname}?phase=${p}` : pathname, { scroll: false });
	const method = methodEntry(study.method.id);

	if (!hasMethodFile(study)) {
		return (
			<div className="mx-auto max-w-[820px] px-6 py-8">
				<div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-6 py-8 text-[var(--color-ink-secondary)]">
					<p className="m-0 font-semibold text-[var(--color-ink)]">The {method?.name.toLowerCase() ?? "study"} method is not in Martine yet.</p>
					<p className="mb-0 mt-1.5 text-[15px]">
						Its phases and tasks show here once its method file is imported. Only the trend report method is imported in this prototype.{" "}
						<Link href="/methods">See the methods</Link>
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-[820px] flex-col gap-4 px-6 py-8">
			<p className="m-0 text-[15px] text-[var(--color-ink-secondary)]">
				The phases of the {method?.name.toLowerCase()} method, in order. A phase is done when its tasks pass their quality check.
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

function PhaseRow({ phase: p, onOpen }: { phase: PhaseView; onOpen: () => void }) {
	const active = p.status === "current" || p.status === "awaiting";
	const counts =
		p.status === "todo" ? plural(p.total, "task") : `${p.doneCount} of ${plural(p.total, "task")}`;
	return (
		<li
			className={cn(
				"grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--color-border)] px-5 last:border-b-0 sm:grid-cols-[30px_minmax(0,1fr)_110px_130px]",
				active ? "bg-[var(--color-accent-dim)] py-4" : "py-3.5",
				p.status === "done" && "text-[var(--color-ink-muted)]",
			)}
		>
			<span
				aria-hidden
				className={cn(
					"box-border flex h-[26px] w-[26px] items-center justify-center rounded-full text-[13px]",
					p.status === "done" && "bg-[var(--color-positive)] text-white",
					active && "border-2 border-[var(--color-accent)] font-bold text-[var(--color-accent)]",
					p.status === "todo" && "border-[1.5px] border-[var(--color-border-active)] text-[var(--color-ink-muted)]",
				)}
			>
				{p.status === "done" ? <Check size={14} /> : p.id.replace(/^x.*/, "+")}
			</span>
			<button
				onClick={onOpen}
				className={cn("text-left hover:text-[var(--color-accent)]", active && "text-[17px] font-semibold text-[var(--color-ink)]")}
			>
				{p.label}
				{p.addedBy && <span className="ml-2 text-[13px] font-normal text-[var(--color-attention)]">added for this study</span>}
				{p.status === "awaiting" && (
					<span className="ml-2 rounded-[var(--radius-xl)] bg-[var(--color-attention-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--color-attention)]">to approve</span>
				)}
			</button>
			<span className="hidden text-sm sm:block">{counts}</span>
			{active ? (
				<button
					onClick={onOpen}
					className="justify-self-start rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
				>
					Continue
				</button>
			) : (
				<span className={cn("text-sm", p.status === "todo" && "text-[var(--color-ink-muted)]")}>{p.addedBy ? "" : dayRange(p.days.min, p.days.max)}</span>
			)}
		</li>
	);
}
