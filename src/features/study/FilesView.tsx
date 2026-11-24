"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, ExternalLink, File, FileSpreadsheet, FileText, Folder, Plus, Presentation } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { personById } from "@/shared/lib/data";
import { phaseViews } from "@/shared/lib/studyModel";
import { cn } from "@/shared/lib/cn";
import { plural } from "@/shared/lib/format";
import { Modal } from "@/shared/components/ui/Modal";
import type { FileCategory, Study, StudyFile } from "@/shared/lib/types";
import { AttachForm } from "@/features/files/Documents";

// The three sections of Files, in reading order.
const SECTIONS: { id: FileCategory; title: string; hint: string; empty: string }[] = [
	{ id: "brief", title: "Scope and brief", hint: "What frames the study: the client’s brief, the proposal, the scope.", empty: "No brief or scope document yet." },
	{ id: "production", title: "Production documents", hint: "What the team works in: queries, exports, working sheets.", empty: "No production document yet." },
	{ id: "deliverable", title: "Deliverables", hint: "What goes to the client: the deck, the report, the data.", empty: "Nothing delivered yet." },
];
const categoryOf = (f: StudyFile): FileCategory => f.category ?? (f.from.kind === "client" ? "brief" : "production");

// A document's type as a small coloured tile, so a list reads at a glance.
const TYPE_TONE: Record<string, string> = {
	PDF: "bg-[var(--color-negative-bg)] text-[var(--color-negative)]",
	Doc: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
	Sheet: "bg-[var(--color-positive-bg)] text-[var(--color-positive)]",
	Excel: "bg-[var(--color-positive-bg)] text-[var(--color-positive)]",
	Deck: "bg-[var(--color-attention-bg)] text-[var(--color-attention)]",
	Slides: "bg-[var(--color-attention-bg)] text-[var(--color-attention)]",
};
const TYPE_ICON: Record<string, typeof File> = { Doc: FileText, Sheet: FileSpreadsheet, Excel: FileSpreadsheet, Deck: Presentation, Slides: Presentation };
const TYPE_LABEL: Record<string, string> = { Doc: "Google Doc", Sheet: "Google Sheet", Excel: "Excel file", PDF: "PDF", Deck: "Deck", Slides: "Slides" };
function TypeTile({ type }: { type: string }) {
	const Icon = TYPE_ICON[type] ?? File;
	return (
		<span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", TYPE_TONE[type] ?? "bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]")}>
			<Icon size={16} aria-hidden />
		</span>
	);
}
// The name, with its type spelled out underneath, as a drive lists a file.
function NameCell({ name, type, url }: { name: string; type: string; url?: string }) {
	return (
		<span className="flex min-w-0 items-center gap-3">
			<TypeTile type={type} />
			<span className="min-w-0">
				{url ? (
					<a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 font-semibold text-[var(--color-ink)]">
						<span className="truncate">{name}</span> <ExternalLink size={12} aria-hidden className="shrink-0 text-[var(--color-ink-muted)]" />
					</a>
				) : (
					<span className="block truncate font-semibold">{name}</span>
				)}
				<span className="block text-[12px] text-[var(--color-ink-muted)]">{TYPE_LABEL[type] ?? type}</span>
			</span>
		</span>
	);
}

const firstName = (id: string) => personById(id)?.name.split(" ")[0] ?? "";

// Where a document comes from: the client, someone on the team, or Claude
// (checked by someone, or still to check).
function From({ study, file }: { study: Study; file: StudyFile }) {
	const { markFileChecked } = useMartine();
	const f = file.from;
	const avatar = "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold";
	if (f.kind === "client")
		return (
			<span className="flex items-center gap-2">
				<span className={cn(avatar, "bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]")}>
					<Building2 size={12} aria-hidden />
				</span>
				{study.client}
			</span>
		);
	if (f.kind === "claude")
		return (
			<span className="flex flex-wrap items-center gap-2">
				<span className={cn(avatar, "bg-[var(--color-accent)] text-white")}>Cl</span>
				Claude
				{f.checkedBy ? (
					<span className="text-[var(--color-ink-muted)]">checked by {firstName(f.checkedBy)}</span>
				) : (
					<>
						<span className="font-semibold text-[var(--color-attention)]">to check</span>
						<button onClick={() => markFileChecked(study.id, file.id)} className="font-semibold text-[var(--color-accent)] hover:underline">
							Mark as checked
						</button>
					</>
				)}
			</span>
		);
	const by = f.by;
	return (
		<span className="flex items-center gap-2">
			<span className={cn(avatar, "bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]")}>{personById(by)?.initials}</span>
			{firstName(by)}
			{f.kind === "template" && <span className="text-[var(--color-ink-muted)]">from the {f.template}</span>}
		</span>
	);
}

// The study's document space, read like a drive, in three sections: scope
// and brief, production documents, deliverables. Each document shows its
// type, where it comes from and the phases that work in it (a document can
// serve several phases, so it is not filed under one). The last edition's
// documents sit below.
export function FilesView({ id }: { id: string }) {
	const { studies } = useMartine();
	const [adding, setAdding] = useState<FileCategory | null>(null);
	const [query, setQuery] = useState("");
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const q = query.trim().toLowerCase();
	const shown = study.files.filter((f) => !q || f.name.toLowerCase().includes(q)).reverse();
	const usedIn = (fileId: string) => views.filter((p) => study.state.phaseDocs?.[p.id] === fileId);
	// The last edition: this client's latest delivered study of the same type,
	// whose documents can be reused here.
	const lastEdition = studies
		.filter((s) => s.id !== study.id && s.client === study.client && s.method.id === study.method.id && s.status === "delivered" && s.due < study.due)
		.sort((a, b) => b.due.localeCompare(a.due))[0];
	const cols = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)]";
	const card = "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

	return (
		<div className="mx-auto flex max-w-[1080px] flex-col gap-5 px-6 py-8">
			<div className="flex flex-wrap items-end gap-3">
				<div className="flex-1">
					<h1 className="m-0 font-[family-name:var(--font-heading)] text-[26px] font-medium">Files</h1>
					<p className="m-0 text-sm text-[var(--color-ink-muted)]">
						{plural(study.files.length, "document")} in this study. Claude can read them; nothing from another client shows here.
					</p>
				</div>
				<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the documents" placeholder="Search the documents" className="rr-input w-[260px]" />
			</div>
			<Modal open={Boolean(adding)} onClose={() => setAdding(null)} title={`Add to ${SECTIONS.find((x) => x.id === adding)?.title ?? "Files"}`}>
				<p className="m-0 mb-3 text-sm text-[var(--color-ink-muted)]">A link to a Sheet, Doc or deck, or a file. Any phase can then pick it as its document.</p>
				{adding && <AttachForm study={study} phase="0" defaultName="" category={adding} onDone={() => setAdding(null)} />}
			</Modal>

			{SECTIONS.map((sec) => {
				const files = shown.filter((f) => categoryOf(f) === sec.id);
				return (
					<section key={sec.id} aria-labelledby={`sec-${sec.id}`} className={card}>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--color-border)] px-5 py-3.5">
							<div className="flex-1">
								<h2 id={`sec-${sec.id}`} className="m-0 font-[family-name:var(--font-body)] text-[16px] font-semibold">
									{sec.title} <span className="text-sm font-normal text-[var(--color-ink-muted)]">{files.length}</span>
								</h2>
								<p className="m-0 text-[13px] text-[var(--color-ink-muted)]">{sec.hint}</p>
							</div>
							<button
								onClick={() => setAdding(sec.id)}
								aria-label={`Add to ${sec.title}`}
								className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--color-border-hover)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-hover)]"
							>
								<Plus size={14} aria-hidden /> Add
							</button>
						</div>
						{files.length === 0 ? (
							<p className="m-0 px-5 py-4 text-sm text-[var(--color-ink-muted)]">{q ? "No document matches." : sec.empty}</p>
						) : (
							<ul className="m-0 list-none p-0">
								{files.map((f) => {
									const phases = usedIn(f.id);
									return (
										<li key={f.id} className={cn(cols, "border-b border-[var(--color-border)] px-5 py-3 text-sm last:border-b-0 hover:bg-[var(--color-hover)]")}>
											<NameCell name={f.name} type={f.type} url={f.url} />
											<span className="hidden sm:block">
												<From study={study} file={f} />
											</span>
											<span className="flex flex-wrap justify-end gap-1.5 sm:justify-start">
												{phases.map((p) => (
													<Link
														key={p.id}
														href={`/studies/${study.id}/steps?phase=${p.id}`}
														title="The phase works in this document"
														className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-accent)] no-underline"
													>
														{p.label}
													</Link>
												))}
											</span>
										</li>
									);
								})}
							</ul>
						)}
					</section>
				);
			})}

			{study.previousWave.length > 0 && (
				<section aria-labelledby="prev" className={card}>
					<h2 id="prev" className="m-0 flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-canvas)] px-5 py-2.5 font-[family-name:var(--font-body)] text-[13px] font-semibold text-[var(--color-ink-secondary)]">
						<Folder size={14} aria-hidden className="text-[var(--color-ink-muted)]" />
						From the last edition
						{lastEdition ? (
							<>
								: <Link href={`/studies/${lastEdition.id}`}>{lastEdition.title}</Link>
							</>
						) : (
							", same client"
						)}
						<span className="font-normal text-[var(--color-ink-muted)]">{study.previousWave.length}</span>
					</h2>
					<ul className="m-0 list-none p-0">
						{study.previousWave.map((f) => (
							<li key={f.id} className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3 text-sm last:border-b-0">
								<NameCell name={f.name} type={f.type} />
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}
