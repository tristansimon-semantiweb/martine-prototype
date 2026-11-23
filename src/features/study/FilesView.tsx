"use client";

import { useRef, useState } from "react";
import { ExternalLink, FileText, Link2 } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { personById } from "@/shared/lib/data";
import { currentPhase, phaseViews } from "@/shared/lib/studyModel";
import type { FileOrigin } from "@/shared/lib/types";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

function origin(from: FileOrigin): { text: string; tone: "plain" | "checked" | "tocheck" } {
	if (from.kind === "client") return { text: "from the client", tone: "plain" };
	if (from.kind === "person") return { text: personById(from.by)?.name.split(" ")[0] ?? "", tone: "plain" };
	if (from.checkedBy) return { text: `made by Claude, checked by ${personById(from.checkedBy)?.name.split(" ")[0]}`, tone: "checked" };
	return { text: "made by Claude, to check", tone: "tocheck" };
}

// Files sit under the phase they belong to, with where they come from. Only
// real files and links to documents (Sheets, Docs, decks): the study's Slack
// channel or Drive folder are not files.
export function FilesView({ id }: { id: string }) {
	const { studies, markFileChecked, addFile, addLink } = useMartine();
	const [link, setLink] = useState<{ name: string; url: string } | null>(null);
	const toast = useToast();
	const input = useRef<HTMLInputElement>(null);
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const views = phaseViews(study);
	const phaseName = (pid: string) => views.find((p) => p.id === pid)?.label ?? `Phase ${pid}`;
	const groups = [...new Set(study.files.map((f) => f.phase))].sort((a, b) => parseFloat(a) - parseFloat(b));
	const addTo = currentPhase(views)?.id ?? "0";

	return (
		<div className="mx-auto flex max-w-[820px] flex-col gap-[22px] px-6 py-8">
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="m-0 flex-1 font-[family-name:var(--font-heading)] text-[26px] font-medium">Files</h1>
				<input
					ref={input}
					type="file"
					className="hidden"
					onChange={(e) => {
						const f = e.target.files?.[0];
						if (!f) return;
						addFile(study.id, f.name.replace(/\.[^.]+$/, ""), f.name.split(".").pop()?.toUpperCase() ?? "File", addTo);
						toast(`Added under ${phaseName(addTo)}`);
						e.target.value = "";
					}}
				/>
				<button
					onClick={() => setLink(link ? null : { name: "", url: "" })}
					className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-hover)]"
				>
					Add a link
				</button>
				<button
					onClick={() => input.current?.click()}
					className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-hover)]"
				>
					Add a file
				</button>
			</div>

			{link && (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (!link.name.trim() || !/^https?:\/\/\S+$/.test(link.url.trim())) return;
						addLink(study.id, link.name.trim(), link.url.trim(), addTo);
						toast(`Link added under ${phaseName(addTo)}`);
						setLink(null);
					}}
					className="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
				>
					<input autoFocus value={link.name} onChange={(e) => setLink({ ...link, name: e.target.value })} aria-label="Name" placeholder="Name, e.g. Queries tab" className="rr-input min-w-[200px] flex-1" />
					<input type="url" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} aria-label="Address" placeholder="https://" className="rr-input min-w-[240px] flex-[2]" />
					<button type="submit" className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white">
						Add
					</button>
				</form>
			)}

			{groups.length === 0 && <p className="m-0 text-[var(--color-ink-muted)]">No files yet.</p>}

			{groups.map((g) => (
				<section key={g} aria-label={phaseName(g)}>
					<h2 className="mb-2 mt-0 font-[family-name:var(--font-body)] text-[15px] font-semibold">{phaseName(g)}</h2>
					<ul className={`${card} m-0 list-none overflow-hidden p-0`}>
						{study.files
							.filter((f) => f.phase === g)
							.map((f) => {
								const o = origin(f.from);
								return (
									<li key={f.id} className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-5 py-3.5 last:border-b-0">
										{f.url ? (
											<Link2 size={16} className="shrink-0 text-[var(--color-accent)]" aria-hidden />
										) : (
											<FileText size={16} className="shrink-0 text-[var(--color-ink-muted)]" aria-hidden />
										)}
										<span className="min-w-[180px] flex-1">
											{f.url ? (
												<a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold">
													{f.name} <ExternalLink size={12} aria-hidden />
												</a>
											) : (
												<span className="font-semibold">{f.name}</span>
											)}
											<span className="ml-2 text-sm text-[var(--color-ink-muted)]">{f.type}</span>
										</span>
										<span
											className={
												o.tone === "tocheck"
													? "rounded-[var(--radius-xl)] bg-[var(--color-attention-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-attention)]"
													: o.tone === "checked"
														? "rounded-[var(--radius-xl)] bg-[var(--color-positive-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-positive)]"
														: "text-sm text-[var(--color-ink-muted)]"
											}
										>
											{o.text}
										</span>
										{o.tone === "tocheck" && (
											<button onClick={() => markFileChecked(study.id, f.id)} className="text-sm font-semibold text-[var(--color-accent)]">
												Mark as checked
											</button>
										)}
									</li>
								);
							})}
					</ul>
				</section>
			))}

			{study.previousWave.length > 0 && (
				<section aria-labelledby="prev">
					<h2 id="prev" className="mb-2 mt-0 font-[family-name:var(--font-body)] text-[15px] font-semibold">
						From the previous wave
					</h2>
					<ul className={`${card} m-0 list-none overflow-hidden p-0`}>
						{study.previousWave.map((f) => (
							<li key={f.id} className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3.5 last:border-b-0">
								<FileText size={16} className="shrink-0 text-[var(--color-ink-muted)]" aria-hidden />
								<span className="flex-1 font-semibold">{f.name}</span>
								<span className="text-sm text-[var(--color-ink-muted)]">{f.type}, same client</span>
							</li>
						))}
					</ul>
				</section>
			)}

			<p className="m-0 text-sm text-[var(--color-ink-muted)]">
				Each file sits under the phase it belongs to. Ask Martine and Claude can read them; nothing from another client shows here.
			</p>
		</div>
	);
}
