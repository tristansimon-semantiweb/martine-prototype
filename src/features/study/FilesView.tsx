"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3, Building2, ChevronDown, ExternalLink, File, FileSpreadsheet, FileText, Folder, Plus, Presentation } from "lucide-react";
import { Popover } from "@/shared/components/ui/Popover";
import { useMartine } from "@/shared/hooks/useMartine";
import { personById } from "@/shared/lib/data";
import { phaseViews } from "@/shared/lib/studyModel";
import { cn } from "@/shared/lib/cn";
import { plural } from "@/shared/lib/format";

const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
	Explorer: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
};
const TYPE_ICON: Record<string, typeof File> = { Doc: FileText, Sheet: FileSpreadsheet, Excel: FileSpreadsheet, Deck: Presentation, Slides: Presentation, Explorer: BarChart3 };
const TYPE_LABEL: Record<string, string> = { Doc: "Google Doc", Sheet: "Google Sheet", Excel: "Excel file", PDF: "PDF", Deck: "Deck", Slides: "Slides", Explorer: "Pinned from the Explorer" };
function TypeTile({ type }: { type: string }) {
	const Icon = TYPE_ICON[type] ?? File;
	return (
		<span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", TYPE_TONE[type] ?? "bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]")}>
			<Icon size={16} aria-hidden />
		</span>
	);
}
// The name, with its type spelled out underneath, as a drive lists a file.
function NameCell({ name, type, url, label }: { name: string; type: string; url?: string; label?: string }) {
	return (
		<span className="flex min-w-0 items-center gap-3">
			<TypeTile type={type} />
			<span className="min-w-0">
				{url ? (
					<a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 font-semibold text-[var(--color-ink)]">
						<span>{name}</span> <ExternalLink size={12} aria-hidden className="shrink-0 text-[var(--color-ink-muted)]" />
					</a>
				) : (
					<span className="block font-semibold leading-snug">{name}</span>
				)}
				<span className="block text-[12px] text-[var(--color-ink-muted)]">{label ?? TYPE_LABEL[type] ?? type}</span>
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

// The study's document space, laid out like Steps: the folders on the left
// (scope and brief, production documents, deliverables), the open folder's
// list on the right. Each document shows its
// type, where it comes from and the phases that work in it (a document can
// serve several phases, so it is not filed under one). Earlier studies of
// the same type are in the Overview's Similar studies.
export function FilesView({ id }: { id: string }) {
	const { studies } = useMartine();
	const [adding, setAdding] = useState<FileCategory | null>(null);
	// ?folder=production&file=f4 opens a folder and points at a document (from a task).
	const params = useSearchParams();
	const folderParam = params.get("folder");
	const pointed = params.get("file");
	const [tab, setTab] = useState<FileCategory>(folderParam === "production" || folderParam === "deliverable" ? folderParam : "brief");
	const [query, setQuery] = useState("");
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const q = query.trim().toLowerCase();
	// Newest first, by the date each document was added.
	const shown = study.files
		.filter((f) => !q || f.name.toLowerCase().includes(q))
		.map((f, i) => ({ f, i }))
		.sort((a, b) => (b.f.added ?? "").localeCompare(a.f.added ?? "") || b.i - a.i)
		.map(({ f }) => f);
	const current = SECTIONS.find((x) => x.id === tab)!;
	const files = shown.filter((f) => categoryOf(f) === tab);
	const usedIn = (fileId: string) => views.filter((p) => study.state.phaseDocs?.[p.id] === fileId);
	const cols = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:grid-cols-[minmax(0,1.7fr)_64px_minmax(0,1.6fr)_104px]";
	const card = "overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

	return (
		<div className="mx-auto grid max-w-[1240px] items-start gap-7 px-6 py-7 lg:grid-cols-[260px_minmax(0,1fr)]">
			<Modal open={Boolean(adding)} onClose={() => setAdding(null)} title={`Add to ${SECTIONS.find((x) => x.id === adding)?.title ?? "Files"}`}>
				<p className="m-0 mb-3 text-sm text-[var(--color-ink-muted)]">A link to a Sheet, Doc or deck, or a file. Any phase can then pick it as its document.</p>
				{adding && <AttachForm study={study} phase="0" defaultName="" category={adding} onDone={() => setAdding(null)} />}
			</Modal>

			{/* The folders on the left, as Steps lists its phases. */}
			<nav aria-label="Folders" className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-[var(--shadow-xs)] lg:sticky lg:top-6">
				<div className="px-2 pt-1">
					<div className="text-sm font-semibold">Files</div>
					<div className="text-[13px] text-[var(--color-ink-muted)]">{plural(study.files.length, "document")}</div>
				</div>
				<ul role="tablist" aria-label="Kind of document" aria-orientation="vertical" className="m-0 flex list-none flex-col gap-0.5 p-0">
					{SECTIONS.map((sec) => (
						<li key={sec.id}>
							<button
								role="tab"
								aria-selected={tab === sec.id}
								onClick={() => setTab(sec.id)}
								className={cn(
									"flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm",
									tab === sec.id ? "bg-[var(--color-accent-dim)] font-semibold text-[var(--color-accent)]" : "hover:bg-[var(--color-hover)]",
								)}
							>
								<Folder size={16} aria-hidden className={tab === sec.id ? undefined : "text-[var(--color-ink-muted)]"} />
								<span className="flex-1">{sec.title}</span>
								<span className="text-[13px] font-normal text-[var(--color-ink-muted)]">{shown.filter((f) => categoryOf(f) === sec.id).length}</span>
							</button>
						</li>
					))}
				</ul>
				<p className="m-0 px-2 pb-1 text-[12px] leading-snug text-[var(--color-ink-muted)]">Claude can read them; nothing from another client shows here.</p>
			</nav>

			{/* The open folder's documents. */}
			<section aria-labelledby="folder-title" className={card.replace("overflow-hidden ", "")}>
				<div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-5 py-4">
					<div className="min-w-[200px] flex-1">
						<h2 id="folder-title" className="m-0 font-[family-name:var(--font-heading)] text-[22px] font-medium">
							{current.title}
						</h2>
						<p className="m-0 text-[13px] text-[var(--color-ink-muted)]">{current.hint}</p>
					</div>
					<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the documents" placeholder="Search all documents" className="rr-input w-[220px] py-1.5" />
					<button
						onClick={() => setAdding(tab)}
						aria-label={`Add to ${current.title}`}
						className="inline-flex items-center gap-1 rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
					>
						<Plus size={14} aria-hidden /> Add
					</button>
				</div>
				<div className={cn(cols, "border-b border-[var(--color-border)] px-5 py-2 text-[12px] font-semibold text-[var(--color-ink-muted)]")}>
					<span>Name</span>
					<span className="hidden sm:block">Added</span>
					<span className="hidden sm:block">From</span>
					<span className="text-right sm:text-left">Used in</span>
				</div>
				{files.length === 0 ? (
					<p className="m-0 px-5 py-5 text-sm text-[var(--color-ink-muted)]">{q ? "No document matches." : current.empty}</p>
				) : (
					<ul className="m-0 list-none p-0">
						{files.map((f) => {
							const phases = usedIn(f.id);
							return (
								<li key={f.id} className={cn(cols, "border-b border-[var(--color-border)] px-5 py-3 text-sm last:border-b-0 hover:bg-[var(--color-hover)]", f.id === pointed && "bg-[var(--color-accent-dim)]")}>
									<NameCell name={f.name} type={f.type} url={f.url} label={f.type === "Explorer" ? `Pinned from the Explorer for phase ${f.phase}` : undefined} />
									<span className={cn("hidden sm:block", f.added ? "text-[var(--color-ink-secondary)]" : "text-[var(--color-ink-muted)]")}>{f.added ? shortDate(f.added) : "not dated"}</span>
									<span className="hidden sm:block">
										<From study={study} file={f} />
									</span>
									<span className="flex justify-end sm:justify-start">
										<UsedIn study={study} phases={phases} />
									</span>
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</div>
	);
}

// The steps that work in a document, as a count ("2 steps"): a click lists
// them, each a link to its phase. A document can serve many phases.
function UsedIn({ study, phases }: { study: Study; phases: { id: string; label: string }[] }) {
	if (!phases.length) return <span className="text-[var(--color-ink-muted)]">not used yet</span>;
	return (
		<Popover
			align="end"
			width={280}
			trigger={({ open, toggle }) => (
				<button
					onClick={toggle}
					aria-expanded={open}
					className="inline-flex items-center gap-1 rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-accent)]"
				>
					{plural(phases.length, "step")} <ChevronDown size={12} aria-hidden />
				</button>
			)}
		>
			{() => (
				<ul className="m-0 list-none p-0 text-sm">
					<li className="px-2 pb-1 pt-0.5 text-[12px] font-semibold text-[var(--color-ink-muted)]">Steps that work in this document</li>
					{phases.map((p) => (
						<li key={p.id}>
							<Link href={`/studies/${study.id}/steps?phase=${p.id}`} className="block rounded-[var(--radius-sm)] px-2 py-1.5 text-[var(--color-ink)] no-underline hover:bg-[var(--color-hover)]">
								{p.label}
							</Link>
						</li>
					))}
				</ul>
			)}
		</Popover>
	);
}
