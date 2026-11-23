"use client";

import { useRef } from "react";
import { Database, FileText, FolderOpen, Hash, Radar } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { personById } from "@/shared/lib/data";
import { currentPhase, phaseViews } from "@/shared/lib/studyModel";
import type { FileOrigin, StudyLink } from "@/shared/lib/types";

const LINK_ICON: Record<StudyLink["kind"], typeof Database> = {
	data_platform: Database,
	slack: Hash,
	drive: FolderOpen,
	talkwalker: Radar,
};

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

function origin(from: FileOrigin): { text: string; tone: "plain" | "checked" | "tocheck" } {
	if (from.kind === "client") return { text: "from the client", tone: "plain" };
	if (from.kind === "person") return { text: personById(from.by)?.name.split(" ")[0] ?? "", tone: "plain" };
	if (from.checkedBy) return { text: `made by Claude, checked by ${personById(from.checkedBy)?.name.split(" ")[0]}`, tone: "checked" };
	return { text: "made by Claude, to check", tone: "tocheck" };
}

// Files sit under the phase they belong to, with where they come from. On top,
// what Martine created with the study: those are how Claude and the team find
// the study in the other tools.
export function FilesView({ id }: { id: string }) {
	const { studies, markFileChecked, addFile } = useMartine();
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
			{study.links.length > 0 && (
				<section aria-labelledby="linked" className={`${card} p-5`}>
					<h2 id="linked" className="m-0 font-[family-name:var(--font-body)] text-[15px] font-semibold">
						Linked to this study, created with it
					</h2>
					<ul className="m-0 mt-3 grid list-none gap-2 p-0 sm:grid-cols-2">
						{study.links.map((l) => {
							const Icon = LINK_ICON[l.kind];
							return (
								<li key={l.kind}>
									<a
										href="#"
										onClick={(e) => {
											e.preventDefault();
											toast("Opens the tool in the real product");
										}}
										className="flex items-center gap-2.5 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] no-underline hover:border-[var(--color-border-hover)]"
									>
										<Icon size={16} className="text-[var(--color-accent)]" aria-hidden />
										{l.label}
									</a>
								</li>
							);
						})}
					</ul>
				</section>
			)}

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
					onClick={() => input.current?.click()}
					className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-hover)]"
				>
					Add a file
				</button>
			</div>

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
										<FileText size={16} className="shrink-0 text-[var(--color-ink-muted)]" aria-hidden />
										<span className="min-w-[180px] flex-1">
											<span className="font-semibold">{f.name}</span>
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
