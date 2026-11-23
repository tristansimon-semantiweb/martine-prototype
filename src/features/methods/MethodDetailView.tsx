"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TopBand } from "@/shared/components/layout/TopBand";
import { useToast } from "@/shared/components/ui/Toast";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, personById } from "@/shared/lib/data";
import { dayRange, plural } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { methodDays, methodPhases } from "./methodModel";
import { MethodPhaseDrawer } from "./MethodPhaseDrawer";
import { CatalogDrawer } from "./CatalogDrawer";

// A method: landmarks, the pending suggestion, then its phases, laid out like
// a study's Steps tab. ?phase= opens a phase, &add= the catalog for a task.
export function MethodDetailView({ id }: { id: string }) {
	const { studies, suggestions, drafts, role, addMethodPhase } = useMartine();
	const toast = useToast();
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const [newPhase, setNewPhase] = useState<string | null>(null);
	const m = methodEntry(id);

	if (!m) {
		return (
			<>
				<TopBand>
					<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Method not found</div>
				</TopBand>
				<div className="mx-auto max-w-[820px] px-6 py-10">
					<Link href="/methods">Back to the methods</Link>
				</div>
			</>
		);
	}

	const draft = drafts[id];
	const phases = methodPhases(id, draft, suggestions);
	const pending = suggestions.filter((s) => s.method === id && s.status === "pending");
	const usedBy = studies.filter((s) => s.method.id === id && s.status !== "delivered").length;
	const planned = methodDays(id);
	const isOwner = role === "method_owner";
	const openId = params.get("phase");
	const addKey = params.get("add");
	const open = phases.find((p) => p.id === openId) ?? null;
	const go = (phase: string | null, add?: string | null) => {
		const q = new URLSearchParams();
		if (phase) q.set("phase", phase);
		if (phase && add) q.set("add", add);
		router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false });
	};

	return (
		<>
			<TopBand>
				<div className="text-sm text-[var(--color-ink-muted)]">
					<Link href="/methods" className="text-[var(--color-ink-muted)]">
						Methods
					</Link>{" "}
					/ {m.name}
				</div>
				<div className="flex flex-wrap items-baseline gap-x-4">
					<span className="font-[family-name:var(--font-heading)] text-[23px] font-medium">{m.name} method</span>
					{m.version && (
						<button onClick={() => toast("Opens the method file in the real product")} className="text-sm text-[var(--color-accent)]">
							Open the method sheet
						</button>
					)}
				</div>
			</TopBand>

			<div className="mx-auto flex max-w-[820px] flex-col gap-[18px] px-6 py-8">
				<dl className="m-0 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
					{[
						["Owner", m.owner ?? "To name"],
						["Version", m.version ? `${m.version}, published${draft?.saved ? `; draft ${draft.version} saved` : ""}` : "To import"],
						["Used by", plural(usedBy, "study", "studies")],
						["Planned", planned ? dayRange(planned.min, planned.max).replace(" d", " days") : "[from the method file]"],
					].map(([k, v]) => (
						<div key={k} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
							<dt className="text-[13px] text-[var(--color-ink-muted)]">{k}</dt>
							<dd className="m-0 mt-0.5 font-semibold">{v}</dd>
						</div>
					))}
				</dl>

				{!m.version && (
					<p className="m-0 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-6 py-6 text-[var(--color-ink-secondary)]">
						This method’s file is not imported yet. Its phases and tasks show here once it is.
					</p>
				)}

				{pending.map((s) => (
					<div key={s.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-accent-dim)] px-4 py-3 text-[15px]">
						<span className="flex-1">
							1 suggestion from {personById(s.by)?.name.split(" ")[0] ?? "an analyst"} on phase {s.phase}: {s.text}
						</span>
						<button onClick={() => go(s.phase)} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white">
							Review
						</button>
					</div>
				))}

				{phases.length > 0 && (
					<section aria-labelledby="phases" className="flex flex-col gap-3">
						<div>
							<h2 id="phases" className="m-0 font-[family-name:var(--font-body)] text-lg font-semibold">
								Phases
							</h2>
							<p className="m-0 text-sm text-[var(--color-ink-muted)]">
								Every {m.name.toLowerCase()} starts from these phases. Open one to see{isOwner ? " and edit" : ""} its tasks.
							</p>
						</div>
						<ol aria-label="Phases" className="m-0 list-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-xs)]">
							{phases.map((p) => (
								<li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-[var(--color-border)] px-5 py-3.5 last:border-b-0">
									<button onClick={() => go(p.id)} className="min-w-[220px] flex-1 text-left hover:text-[var(--color-accent)]">
										{p.label}
										{p.optional && <span className="ml-2 text-[13px] text-[var(--color-ink-muted)]">optional</span>}
										{p.isNew && <span className="ml-2 text-[13px] text-[var(--color-attention)]">new in draft</span>}
									</button>
									{p.suggestions.length > 0 && (
										<span className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
											{plural(p.suggestions.length, "suggestion")}
										</span>
									)}
									<span className="w-16 text-sm">{plural(p.tasks.length, "task")}</span>
									<span className="w-28 text-sm">{dayRange(p.days.min, p.days.max)}</span>
									<span className={cn("w-16 text-sm", p.skillCount === 0 && "text-[var(--color-ink-muted)]")}>
										{p.skillCount === 0 ? "no skill" : plural(p.skillCount, "skill")}
									</span>
								</li>
							))}
						</ol>
						{isOwner &&
							(newPhase === null ? (
								<button
									onClick={() => setNewPhase("")}
									className="self-start rounded-[var(--radius)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-4 py-2.5 font-semibold"
								>
									Add a phase
								</button>
							) : (
								<form
									onSubmit={(e) => {
										e.preventDefault();
										if (!newPhase.trim()) return;
										addMethodPhase(id, m.version, newPhase.trim());
										setNewPhase(null);
									}}
									className="flex flex-wrap gap-2"
								>
									<input autoFocus value={newPhase} onChange={(e) => setNewPhase(e.target.value)} aria-label="Name of the phase" placeholder="Name of the phase" className="rr-input min-w-[260px] flex-1" />
									<button type="submit" className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white">
										Add
									</button>
									<button type="button" onClick={() => setNewPhase(null)} className="rounded-[var(--radius)] px-3 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]">
										Cancel
									</button>
								</form>
							))}
					</section>
				)}
			</div>

			<MethodPhaseDrawer methodId={id} phase={open} onClose={() => go(null)} onAdd={(key) => go(openId, key)} />
			<CatalogDrawer methodId={id} phase={open} taskKey={open ? addKey : null} onClose={() => go(openId)} />
		</>
	);
}
