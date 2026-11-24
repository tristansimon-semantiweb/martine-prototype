"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { phaseViews } from "@/shared/lib/studyModel";
import { AttachForm, FileChip } from "@/features/files/Documents";
import { Modal } from "@/shared/components/ui/Modal";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

// The study's documents: the shared pool each phase picks its document from.
// A document says which phases work in it.
export function FilesView({ id }: { id: string }) {
	const { studies } = useMartine();
	const [adding, setAdding] = useState(false);
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const usedIn = (fileId: string) =>
		views.filter((p) => study.state.phaseDocs?.[p.id] === fileId);

	return (
		<div className="mx-auto flex max-w-[820px] flex-col gap-[22px] px-6 py-8">
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex-1">
					<h1 className="m-0 font-[family-name:var(--font-heading)] text-[26px] font-medium">Files</h1>
					<p className="m-0 text-sm text-[var(--color-ink-muted)]">
						The study’s documents. Each phase works in one of them, chosen in the phase. Claude can read them; nothing from another client shows here.
					</p>
				</div>
				<button onClick={() => setAdding(true)} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
					Add a document
				</button>
			</div>
			<Modal open={adding} onClose={() => setAdding(false)} title="Add a document">
				<p className="m-0 mb-3 text-sm text-[var(--color-ink-muted)]">A link to a Sheet, Doc or deck, or a file. Any phase can then pick it as its document.</p>
				<AttachForm study={study} phase="0" defaultName="" onDone={() => setAdding(false)} />
			</Modal>

			{study.files.length === 0 ? (
				<p className="m-0 text-[var(--color-ink-muted)]">No document yet.</p>
			) : (
				<ul className={`${card} m-0 list-none overflow-hidden p-0`}>
					{study.files.map((f) => {
						const phases = usedIn(f.id);
						return (
							<li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--color-border)] px-5 py-3 last:border-b-0">
								<FileChip study={study} file={f} />
								<span className="text-sm text-[var(--color-ink-muted)]">{f.type}</span>
								{phases.length > 0 && (
									<span className="ml-auto flex flex-wrap items-center gap-1.5 text-sm">
										<span className="text-[var(--color-ink-muted)]">used in</span>
										{phases.map((p) => (
											<Link
												key={p.id}
												href={`/studies/${study.id}/steps?phase=${p.id}`}
												className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-accent)] no-underline"
											>
												{p.label}
											</Link>
										))}
									</span>
								)}
							</li>
						);
					})}
				</ul>
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
