"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { phaseViews } from "@/shared/lib/studyModel";
import { AttachForm, FileChip } from "@/features/files/Deliverables";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

// The study's document space: the files and links that exist, phase by phase.
// A document that delivers a task says which one (and links to it); the
// deliverables expected by the method are on the tasks, in Steps.
export function FilesView({ id }: { id: string }) {
	const { studies } = useMartine();
	const [adding, setAdding] = useState(false);
	const [target, setTarget] = useState(""); // "<phase>|<task key>" or ""
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const taskName = (key?: string) => views.flatMap((p) => p.tasks).find((t) => t.key === key)?.task.task;
	const groups = views
		.map((p) => ({ p, files: study.files.filter((f) => f.phase === p.id) }))
		.filter((g) => g.files.length);
	const unplaced = study.files.filter((f) => !views.some((p) => p.id === f.phase));
	const [phase, task] = target ? target.split("|") : ["0", undefined];

	return (
		<div className="mx-auto flex max-w-[820px] flex-col gap-[22px] px-6 py-8">
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex-1">
					<h1 className="m-0 font-[family-name:var(--font-heading)] text-[26px] font-medium">Files</h1>
					<p className="m-0 text-sm text-[var(--color-ink-muted)]">The study’s documents, by phase. Claude can read them; nothing from another client shows here.</p>
				</div>
				{!adding && (
					<button
						onClick={() => setAdding(true)}
						className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
					>
						Add a document
					</button>
				)}
			</div>

			{adding && (
				<div className="flex flex-col gap-2">
					<label className="flex flex-wrap items-center gap-2 text-sm">
						<span className="text-[var(--color-ink-muted)]">It delivers</span>
						<select value={target} onChange={(e) => setTarget(e.target.value)} className="rr-input w-auto max-w-full py-2">
							<option value="">no task in particular</option>
							{views.map((p) => (
								<optgroup key={p.id} label={p.label}>
									{p.tasks.map((t) => (
										<option key={t.key} value={`${p.id}|${t.key}`}>
											{t.task.task}
										</option>
									))}
								</optgroup>
							))}
						</select>
					</label>
					<AttachForm
						key={target}
						study={study}
						phase={phase}
						task={task}
						defaultName={task ? (views.flatMap((p) => p.tasks).find((t) => t.key === task)?.task.output ?? "") : ""}
						onDone={() => {
							setAdding(false);
							setTarget("");
						}}
					/>
				</div>
			)}

			{groups.length === 0 && unplaced.length === 0 && <p className="m-0 text-[var(--color-ink-muted)]">No document yet.</p>}

			{groups.map(({ p, files }) => (
				<section key={p.id} aria-label={p.label}>
					<h2 className="mb-2 mt-0 font-[family-name:var(--font-body)] text-[15px] font-semibold">{p.label}</h2>
					<ul className={`${card} m-0 list-none overflow-hidden p-0`}>
						{files.map((f) => (
							<li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-5 py-3 last:border-b-0">
								<FileChip study={study} file={f} />
								<span className="text-sm text-[var(--color-ink-muted)]">{f.type}</span>
								{f.task && (
									<Link href={`/studies/${study.id}/steps?phase=${p.id}`} className="ml-auto text-sm">
										delivers “{taskName(f.task)}”
									</Link>
								)}
							</li>
						))}
					</ul>
				</section>
			))}

			{unplaced.length > 0 && (
				<section aria-labelledby="other">
					<h2 id="other" className="mb-2 mt-0 font-[family-name:var(--font-body)] text-[15px] font-semibold">
						Other documents
					</h2>
					<div className="flex flex-wrap gap-1.5">
						{unplaced.map((f) => (
							<FileChip key={f.id} study={study} file={f} />
						))}
					</div>
				</section>
			)}

			{study.previousWave.length > 0 && (
				<section aria-labelledby="prev">
					<h2 id="prev" className="mb-2 mt-0 font-[family-name:var(--font-body)] text-[15px] font-semibold">
						From the previous wave
					</h2>
					<ul className={`${card} m-0 list-none overflow-hidden p-0`}>
						{study.previousWave.map((f) => (
							<li key={f.id} className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3 last:border-b-0">
								<FileText size={16} className="shrink-0 text-[var(--color-ink-muted)]" aria-hidden />
								<span className="flex-1 font-semibold">{f.name}</span>
								<span className="text-sm text-[var(--color-ink-muted)]">{f.type}, same client</span>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}
