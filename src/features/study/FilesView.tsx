"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { plural } from "@/shared/lib/format";
import { phaseViews } from "@/shared/lib/studyModel";
import { AttachForm, FileChip, TaskDeliverable } from "@/features/files/Deliverables";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

// The study's documents, tied to the method: phase by phase, each task with
// the deliverable the method expects and the file or link attached to it.
// Files that answer no task (the client brief, a proposal) sit under Other
// files. Only real files and links: no Slack channel or Drive folder.
export function FilesView({ id }: { id: string }) {
	const { studies } = useMartine();
	const [adding, setAdding] = useState(false);
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const expected = views.flatMap((p) => p.tasks.filter((t) => t.task.output));
	const attached = expected.filter((t) => study.files.some((f) => f.task === t.key)).length;
	const others = study.files.filter((f) => !f.task);

	return (
		<div className="mx-auto flex max-w-[820px] flex-col gap-[22px] px-6 py-8">
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex-1">
					<h1 className="m-0 font-[family-name:var(--font-heading)] text-[26px] font-medium">Files</h1>
					{expected.length > 0 && (
						<p className="m-0 text-sm text-[var(--color-ink-muted)]">
							{attached} of {plural(expected.length, "deliverable")} attached. Each task’s deliverable is attached from the task, here or in Steps.
						</p>
					)}
				</div>
				{!adding && (
					<button
						onClick={() => setAdding(true)}
						className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-hover)]"
					>
						Add another file or link
					</button>
				)}
			</div>
			{adding && <AttachForm study={study} phase="0" defaultName="" onDone={() => setAdding(false)} />}

			{views.map((p) => {
				const tasks = p.tasks.filter((t) => t.task.output || study.files.some((f) => f.task === t.key));
				if (!tasks.length) return null;
				return (
					<section key={p.id} aria-label={p.label}>
						<h2 className="mb-2 mt-0 font-[family-name:var(--font-body)] text-[15px] font-semibold">{p.label}</h2>
						<ul className={`${card} m-0 list-none overflow-hidden p-0`}>
							{tasks.map((t) => (
								<li key={t.key} className="border-b border-[var(--color-border)] px-5 py-3 last:border-b-0">
									<div className="flex items-baseline gap-2">
										<span className="font-semibold">{t.task.task}</span>
									</div>
									<TaskDeliverable study={study} phase={p.id} taskKey={t.key} task={t.task} />
								</li>
							))}
						</ul>
					</section>
				);
			})}

			{others.length > 0 && (
				<section aria-labelledby="others">
					<h2 id="others" className="mb-2 mt-0 font-[family-name:var(--font-body)] text-[15px] font-semibold">
						Other files
					</h2>
					<div className="flex flex-wrap gap-1.5">
						{others.map((f) => (
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

			<p className="m-0 text-sm text-[var(--color-ink-muted)]">
				Claude knows which file answers which task, and can read them. Nothing from another client shows here.
			</p>
		</div>
	);
}
