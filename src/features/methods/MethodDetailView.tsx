"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { TopBand } from "@/shared/components/layout/TopBand";
import { AddRow, RemoveButton, RenameButton, RenameField } from "@/shared/components/ui/Editing";
import { useState } from "react";
import { useToast } from "@/shared/components/ui/Toast";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, methodFile, personById, studyTypeDefinition } from "@/shared/lib/data";
import { costed, costedDays, plannedLabel, plural } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import { methodDays, methodPhases, removedPhases, type MethodPhaseView } from "./methodModel";
import { MethodPhaseDrawer } from "./MethodPhaseDrawer";
import { CatalogDrawer, type Tab } from "./CatalogDrawer";

// A method: landmarks, the pending suggestion, then its phases, laid out like
// a study's Steps tab. ?phase= opens a phase, &add= the catalog for a task.
export function MethodDetailView({ id }: { id: string }) {
	const { studies, suggestions, drafts, role, addMethodPhase, renameMethodPhase, removeMethodPhase, restoreMethodPhase } = useMartine();
	const toast = useToast();
	const pathname = usePathname();
	const params = useSearchParams();
	const m = methodEntry(id);

	if (!m) {
		return (
			<>
				<TopBand>
					<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Study type not found</div>
				</TopBand>
				<div className="mx-auto max-w-[820px] px-6 py-10">
					<Link href="/study-types">Back to the study types</Link>
				</div>
			</>
		);
	}

	const draft = drafts[id];
	const phases = methodPhases(id, draft, suggestions);
	const pending = suggestions.filter((s) => s.method === id && s.status === "pending");
	const usedBy = studies.filter((s) => s.method.id === id && s.status !== "delivered").length;
	const planned = plannedLabel(m.planned) ?? costedDays(methodDays(id));
	const file = methodFile(id);
	const def = studyTypeDefinition(id);
	const isOwner = role === "method_owner";
	const openId = params.get("phase");
	const addKey = params.get("add");
	const open = phases.find((p) => p.id === openId) ?? null;
	const tabParam = params.get("tab");
	const tab: Tab = tabParam === "Tools" || tabParam === "Documents" ? tabParam : "Skills";
	const go = (phase: string | null, add?: string | null, onTab?: Tab) => {
		const q = new URLSearchParams();
		if (phase) q.set("phase", phase);
		if (phase && add) q.set("add", add);
		if (phase && add && onTab) q.set("tab", onTab);
		// Native History API: no server round trip (see StepsView).
		window.history.replaceState(null, "", q.size ? `${pathname}?${q}` : pathname);
	};

	return (
		<>
			<TopBand>
				<div className="text-sm text-[var(--color-ink-muted)]">
					<Link href="/study-types" className="text-[var(--color-ink-muted)]">
						Study types
					</Link>{" "}
					/ {m.name}
				</div>
				<div className="flex flex-wrap items-baseline gap-x-4">
					<span className="font-[family-name:var(--font-heading)] text-[23px] font-medium">{m.name}</span>
					{m.version && (
						<button onClick={() => toast("Opens the method file in the real product")} className="text-sm text-[var(--color-accent)]">
							Open the method sheet
						</button>
					)}
				</div>
			</TopBand>

			<div className="mx-auto flex max-w-[820px] flex-col gap-[18px] px-6 py-8">
				<section
					aria-label="What this study type is"
					className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[26px] py-5 shadow-[var(--shadow-xs)]"
				>
					{def ? (
						<>
							{def.question && <p className="m-0 font-[family-name:var(--font-heading)] text-[22px] font-medium leading-snug">{def.question}</p>}
							<p className="m-0 mt-2 text-[16px] leading-relaxed text-[var(--color-ink-secondary)]">{def.definition}</p>
							{def.source === "draft" && (
								<p className="m-0 mt-2.5 inline-block rounded-[var(--radius-sm)] bg-[var(--color-attention-bg)] px-2.5 py-1 text-[13px] text-[var(--color-attention)]">
									Draft written from the method file, to validate by the method owner
								</p>
							)}
						</>
					) : (
						<p className="m-0 text-[var(--color-ink-muted)]">[Definition to write: what this study type is and the question it answers]</p>
					)}
				</section>

				<dl className="m-0 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
					{[
						["Method owner", m.owner ?? "To name"],
						["Method version", m.version ? `${m.version}, published${draft?.saved ? `; draft ${draft.version} saved` : ""}` : "To document"],
						["Used by", plural(usedBy, "study", "studies")],
						["Planned", m.version ? planned : "[not documented]"],
					].map(([k, v]) => (
						<div key={k} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
							<dt className="text-[13px] text-[var(--color-ink-muted)]">{k}</dt>
							<dd className="m-0 mt-0.5 font-semibold">{v}</dd>
						</div>
					))}
				</dl>

				{!m.version && (
					<p className="m-0 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-6 py-6 text-[var(--color-ink-secondary)]">
						This method’s tab is empty in the method file. Its phases and tasks show here once it is written.
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
						<ol
							aria-label="Phases"
							className="m-0 list-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-xs)]"
						>
							{phases.map((p) => (
								<MethodPhaseRow
									key={p.id}
									phase={p}
									onOpen={() => go(p.id)}
									canEdit={isOwner}
									onRename={(name) => renameMethodPhase(id, m.version, p.id, name)}
									onRemove={() => {
										const added = removeMethodPhase(id, m.version, p.id);
										toast("Phase removed in the draft", { label: "Undo", onClick: () => restoreMethodPhase(id, m.version, p.id, added) });
									}}
								/>
							))}
						</ol>
						{isOwner && <AddRow label="Add a phase" placeholder="Name of the phase" onAdd={(v) => addMethodPhase(id, m.version, v)} />}
						{removedPhases(id, draft).length > 0 && (
							<p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--color-ink-muted)]">
								Removed in the draft:
								{removedPhases(id, draft).map((r) => (
									<span key={r.id} className="inline-flex items-center gap-1.5">
										<span className="line-through">{r.label}</span>
										{isOwner && (
											<button onClick={() => restoreMethodPhase(id, m.version, r.id)} className="font-semibold text-[var(--color-accent)] hover:underline">
												Restore
											</button>
										)}
									</span>
								))}
							</p>
						)}
					</section>
				)}

				{file?.glossary && (
					<section aria-labelledby="terms" className="flex flex-col gap-2">
						<h2 id="terms" className="m-0 font-[family-name:var(--font-body)] text-lg font-semibold">
							Terms
						</h2>
						<dl className="m-0 grid grid-cols-[120px_minmax(0,1fr)] gap-x-3.5 gap-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-[15px]">
							{file.glossary.map((g) => (
								<div key={g.term} className="contents">
									<dt className="font-semibold">{g.term}</dt>
									<dd className="m-0 text-[var(--color-ink-secondary)]">{g.definition}</dd>
								</div>
							))}
						</dl>
					</section>
				)}

				{file?.notes && (
					<section aria-labelledby="notes" className="flex flex-col gap-2">
						<h2 id="notes" className="m-0 font-[family-name:var(--font-body)] text-lg font-semibold">
							Notes from the method file
						</h2>
						<ul className="m-0 flex flex-col gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 pl-9 text-[15px] text-[var(--color-ink-secondary)]">
							{file.notes.map((n, i) => (
								<li key={i}>{n}</li>
							))}
						</ul>
					</section>
				)}
			</div>

			<MethodPhaseDrawer methodId={id} phase={open} onClose={() => go(null)} onAdd={(key, onTab) => go(openId, key, onTab)} />
			<CatalogDrawer key={`${addKey}-${tab}`} methodId={id} phase={open} taskKey={open ? addKey : null} initialTab={tab} onClose={() => go(openId)} />
		</>
	);
}

// A phase of the method: the whole row opens it; the method owner renames or
// removes it in the draft.
function MethodPhaseRow({
	phase: p,
	onOpen,
	canEdit,
	onRename,
	onRemove,
}: {
	phase: MethodPhaseView;
	onOpen: () => void;
	canEdit: boolean;
	onRename: (name: string) => void;
	onRemove: () => void;
}) {
	const [renaming, setRenaming] = useState(false);
	return (
		<li className="flex items-center border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-hover)]">
			{renaming ? (
				<span className="flex flex-1 items-center gap-3 px-5 py-2.5">
					<span className="text-[13px] text-[var(--color-ink-muted)]">{p.label.split(".")[0]}.</span>
					<RenameField value={p.name} label={`New name for the phase “${p.name}”`} onSave={onRename} onDone={() => setRenaming(false)} />
				</span>
			) : (
				<button onClick={onOpen} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 py-3.5 pl-5 pr-2 text-left">
					<span className="min-w-[220px] flex-1">
						{p.label}
						{p.optional && <span className="ml-2 text-[13px] text-[var(--color-ink-muted)]">optional</span>}
						{p.isNew && <span className="ml-2 text-[13px] text-[var(--color-attention)]">new in draft</span>}
					</span>
					{p.suggestions.length > 0 && (
						<span className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
							{plural(p.suggestions.length, "suggestion")}
						</span>
					)}
					<span className="w-16 text-sm">{plural(p.tasks.length, "task")}</span>
					<span className={cn("w-28 text-sm", !p.days && "text-[var(--color-ink-muted)]")}>{costed(p.days)}</span>
					<span className={cn("w-16 text-sm", p.skillCount === 0 && "text-[var(--color-ink-muted)]")}>{p.skillCount === 0 ? "no skill" : plural(p.skillCount, "skill")}</span>
				</button>
			)}
			{canEdit && !renaming && (
				<>
					<RenameButton label={`Rename the phase “${p.name}”`} onClick={() => setRenaming(true)} />
					<RemoveButton label={`Remove the phase “${p.name}”`} onClick={onRemove} />
				</>
			)}
			<span aria-hidden onClick={onOpen} className="flex cursor-pointer items-center pl-1 pr-5 text-[var(--color-ink-muted)]">
				<ChevronRight size={16} />
			</span>
		</li>
	);
}
