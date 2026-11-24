"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Plus } from "lucide-react";
import { Modal } from "@/shared/components/ui/Modal";
import { catalog } from "@/shared/lib/data";
import { otherToolItems } from "@/shared/lib/tools";
import type { MethodTask, Study, StudyFile } from "@/shared/lib/types";
import { AttachForm } from "@/features/files/Documents";

// "Metrics tab" and "Queries tab, FR, UK, JP" are the same document.
const norm = (s: string) =>
	s
		.toLowerCase()
		.replace(/\b(the|a|an)\b/g, "")
		.replace(/[^a-z0-9 ]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
const matchFile = (files: StudyFile[], name: string) => {
	const n = norm(name);
	return files.find((f) => norm(f.name).includes(n) || n.includes(norm(f.name)));
};

// The documents a task names in the method file, as links: to the study's
// document when it has one (its address, else its row in Files), or "+ Add"
// to add it there and then (a link, a file, or a copy of the catalog template).
export function TaskDocuments({ study, phase, task }: { study: Study; phase: string; task: MethodTask }) {
	const [adding, setAdding] = useState<string | null>(null);
	const names = otherToolItems(task).documents;
	if (!names.length) return null;
	const template = (name: string) => catalog.documents.find((d) => norm(d).startsWith(norm(name))) ?? null;
	const chip = "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1 text-[13px] font-semibold no-underline";

	return (
		<span className="flex flex-wrap items-center gap-1.5">
			{names.map((name) => {
				const f = matchFile(study.files, name);
				if (f) {
					const inner = (
						<>
							<FileText size={13} aria-hidden className="text-[var(--color-ink-muted)]" />
							{f.name}
							{f.url && <ExternalLink size={11} aria-hidden className="text-[var(--color-ink-muted)]" />}
						</>
					);
					const cls = `${chip} border-[var(--color-border-hover)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`;
					return f.url ? (
						<a key={name} href={f.url} target="_blank" rel="noopener noreferrer" title={`Open ${f.name}`} className={cls}>
							{inner}
						</a>
					) : (
						<Link key={name} href={`/studies/${study.id}/files?folder=${f.category ?? "production"}&file=${f.id}`} title={`${f.name} in Files`} className={cls}>
							{inner}
						</Link>
					);
				}
				return (
					<button
						key={name}
						onClick={() => setAdding(name)}
						title={`Not in the study yet: add ${name}`}
						className={`${chip} border-dashed border-[var(--color-border-active)] bg-transparent text-[var(--color-ink-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`}
					>
						{name} <Plus size={12} aria-hidden /> <span className="font-normal">Add</span>
					</button>
				);
			})}
			<Modal open={Boolean(adding)} onClose={() => setAdding(null)} title={`Add “${adding ?? ""}”`}>
				<p className="m-0 mb-3 text-sm text-[var(--color-ink-muted)]">It goes into the study’s production documents, and this task links to it.</p>
				{adding && <AttachForm study={study} phase={phase} defaultName={adding} template={template(adding)} category="production" onDone={() => setAdding(null)} />}
			</Modal>
		</span>
	);
}
