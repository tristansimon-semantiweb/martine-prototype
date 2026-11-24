"use client";

import { useRef, useState } from "react";
import { ChevronDown, ExternalLink, FileText, Link2, Plus } from "lucide-react";
import { Popover } from "@/shared/components/ui/Popover";
import { RemoveButton } from "@/shared/components/ui/Editing";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { catalog, personById } from "@/shared/lib/data";
import { cn } from "@/shared/lib/cn";
import type { FileCategory, FileOrigin, MethodTask, Study, StudyFile } from "@/shared/lib/types";

// The study's documents, and how a phase uses one: each phase works in one
// document of the study (a working sheet, a deck…), chosen among the study's
// documents or added for it. Files lists them all.

const first = (id: string) => personById(id)?.name.split(" ")[0] ?? "";

export function origin(from: FileOrigin): { text: string; tone: "plain" | "checked" | "tocheck" } {
	if (from.kind === "client") return { text: "from the client", tone: "plain" };
	if (from.kind === "person") return { text: `added by ${first(from.by)}`, tone: "plain" };
	if (from.kind === "template") return { text: `from the ${from.template}, ${first(from.by)}`, tone: "plain" };
	if (from.checkedBy) return { text: `made by Claude, checked by ${first(from.checkedBy)}`, tone: "checked" };
	return { text: "made by Claude, to check", tone: "tocheck" };
}

// The catalog template a task's deliverable starts from, when there is one.
const TEMPLATE_RULES: [RegExp, string][] = [
	[/queries tab/i, "Queries tab template"],
	[/metrics tab/i, "Metrics tab template"],
	[/sample sheet|video sample/i, "TikTok sample sheet"],
	[/codebook|code the sample/i, "Codebook"],
	[/\bdeck\b/i, "Deck template"],
];
export function templateFor(tasks: MethodTask[]): string | null {
	const text = tasks.map((t) => `${t.task} ${t.output} ${t.tools}`).join(" ");
	const hit = TEMPLATE_RULES.find(([re, doc]) => re.test(text) && catalog.documents.includes(doc));
	return hit?.[1] ?? null;
}

export function FileChip({ study, file }: { study: Study; file: StudyFile }) {
	const { markFileChecked } = useMartine();
	const o = origin(file.from);
	return (
		<span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[13px]">
			{file.url ? <Link2 size={13} className="text-[var(--color-accent)]" aria-hidden /> : <FileText size={13} className="text-[var(--color-ink-muted)]" aria-hidden />}
			{file.url ? (
				<a href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold">
					{file.name} <ExternalLink size={11} aria-hidden />
				</a>
			) : (
				<span className="font-semibold">{file.name}</span>
			)}
			<span
				className={cn(
					o.tone === "tocheck" && "rounded-[var(--radius-xl)] bg-[var(--color-attention-bg)] px-2 font-semibold text-[var(--color-attention)]",
					o.tone === "checked" && "rounded-[var(--radius-xl)] bg-[var(--color-positive-bg)] px-2 font-semibold text-[var(--color-positive)]",
					o.tone === "plain" && "text-[var(--color-ink-muted)]",
				)}
			>
				{o.text}
			</span>
			{o.tone === "tocheck" && (
				<button onClick={() => markFileChecked(study.id, file.id)} className="font-semibold text-[var(--color-accent)]">
					Mark as checked
				</button>
			)}
		</span>
	);
}

// Add a document to the study: a link, an upload, or a copy of a template.
// `onAttached` receives the new document's id (a phase then uses it).
export function AttachForm({
	study,
	phase,
	defaultName,
	template,
	category,
	onAttached,
	onDone,
}: {
	study: Study;
	phase: string;
	defaultName: string;
	template?: string | null;
	category?: FileCategory; // where it goes in Files (default: production)
	onAttached?: (id: string) => void;
	onDone: () => void;
}) {
	const { attach } = useMartine();
	const toast = useToast();
	const input = useRef<HTMLInputElement>(null);
	const [name, setName] = useState(defaultName);
	const [url, setUrl] = useState("");
	const validUrl = /^https?:\/\/\S+$/.test(url.trim());

	return (
		<div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] p-3">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (!name.trim() || !validUrl) return;
					// Add first: an optional call skips its argument when there is no callback.
					const id = attach(study.id, { name: name.trim(), type: "Link", phase, url: url.trim(), category });
					onAttached?.(id);
					toast("Link added");
					onDone();
				}}
				className="flex flex-wrap gap-2"
			>
				<input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" placeholder="Name" className="rr-input min-w-[180px] flex-1" />
				<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Address" placeholder="https:// (Sheet, Doc, deck…)" className="rr-input min-w-[220px] flex-[2]" />
				<button type="submit" disabled={!name.trim() || !validUrl} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 text-sm font-semibold text-white disabled:opacity-40">
					Add the link
				</button>
			</form>
			<div className="flex flex-wrap items-center gap-3 text-sm">
				<input
					ref={input}
					type="file"
					className="hidden"
					onChange={(e) => {
						const f = e.target.files?.[0];
						if (!f) return;
						const id = attach(study.id, { name: f.name.replace(/\.[^.]+$/, ""), type: f.name.split(".").pop()?.toUpperCase() ?? "File", phase, category });
						onAttached?.(id);
						toast("File added");
						onDone();
					}}
				/>
				<button onClick={() => input.current?.click()} className="font-semibold text-[var(--color-accent)]">
					or upload a file
				</button>
				{template && (
					<button
						onClick={() => {
							const id = attach(study.id, {
								name: `${study.id} ${template.replace(/ template$/i, "")}`,
								type: /deck/i.test(template) ? "Slides" : "Sheet",
								phase,
								template,
								category,
							});
							onAttached?.(id);
							toast(`Started from the ${template}`);
							onDone();
						}}
						className="font-semibold text-[var(--color-accent)]"
					>
						or start from the {template}
					</button>
				)}
				<button onClick={onDone} className="ml-auto text-[var(--color-ink-muted)]">
					Cancel
				</button>
			</div>
		</div>
	);
}

// The document a phase works in, in one line at the top of the phase: the
// document, a menu to choose another one (search the study's documents, or
// add a new one there), and a cross to take it off the phase (with Undo).
// `inline`: no frame or title, to sit in a phase's summary next to its label.
export function PhaseDocument({ study, phase, tasks, inline }: { study: Study; phase: string; tasks: MethodTask[]; inline?: boolean }) {
	const { setPhaseDoc } = useMartine();
	const toast = useToast();
	const [query, setQuery] = useState("");
	const [adding, setAdding] = useState(false);
	const docId = study.state.phaseDocs?.[phase];
	const doc = study.files.find((f) => f.id === docId);
	const q = query.trim().toLowerCase();
	const options = study.files.filter((f) => !q || f.name.toLowerCase().includes(q));

	return (
		<section
			aria-label="Phase document"
			className={inline ? "flex flex-wrap items-center gap-2" : "flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-canvas)] px-3 py-2"}
		>
			{!inline && <span className="text-sm font-semibold">Phase document</span>}
			{doc ? (
				inline ? (
					doc.url ? (
						<a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-semibold">
							{doc.name}
						</a>
					) : (
						<span className="font-semibold">{doc.name}</span>
					)
				) : (
				<>
					<FileChip study={study} file={doc} />
					<RemoveButton
						label="Take this document off the phase"
						onClick={() => {
							setPhaseDoc(study.id, phase, null);
							toast("Document taken off the phase", { label: "Undo", onClick: () => setPhaseDoc(study.id, phase, doc.id) });
						}}
					/>
				</>
				)
			) : (
				<span className="text-sm text-[var(--color-ink-muted)]">none yet</span>
			)}
			<span className={inline ? undefined : "ml-auto"}>
				<Popover
					align="end"
					width={380}
					trigger={({ open, toggle }) => (
						<button
							onClick={() => {
								setAdding(false);
								setQuery("");
								toggle();
							}}
							aria-expanded={open}
							className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[13px] font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]"
						>
							{doc ? "Change" : "Choose a document"} <ChevronDown size={13} aria-hidden />
						</button>
					)}
				>
					{(close) =>
						adding ? (
							<AttachForm
								study={study}
								phase={phase}
								defaultName=""
								template={templateFor(tasks)}
								onAttached={(id) => setPhaseDoc(study.id, phase, id)}
								onDone={close}
							/>
						) : (
							<div className="flex flex-col gap-1">
								<input
									autoFocus
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									aria-label="Search the study’s documents"
									placeholder="Search the study’s documents"
									className="rr-input py-1.5"
								/>
								<ul className="m-0 max-h-60 list-none overflow-y-auto p-0">
									{options.map((f) => (
										<li key={f.id}>
											<button
												onClick={() => {
													setPhaseDoc(study.id, phase, f.id);
													toast(`${f.name} is this phase’s document`);
													close();
												}}
												className={cn(
													"flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left text-sm hover:bg-[var(--color-hover)]",
													f.id === docId && "font-semibold text-[var(--color-accent)]",
												)}
											>
												{f.url ? <Link2 size={13} aria-hidden /> : <FileText size={13} aria-hidden />}
												<span className="flex-1 truncate">{f.name}</span>
												<span className="text-[12px] text-[var(--color-ink-muted)]">{f.type}</span>
											</button>
										</li>
									))}
									{options.length === 0 && <li className="px-2 py-1.5 text-sm text-[var(--color-ink-muted)]">No document matches.</li>}
								</ul>
								<button
									onClick={() => setAdding(true)}
									className="mt-1 flex items-center gap-1.5 rounded-[var(--radius-sm)] border-t border-[var(--color-border)] px-2 pt-2 text-left text-sm font-semibold text-[var(--color-accent)]"
								>
									<Plus size={14} aria-hidden /> New document: link, upload{templateFor(tasks) ? " or template" : ""}
								</button>
							</div>
						)
					}
				</Popover>
			</span>
		</section>
	);
}
