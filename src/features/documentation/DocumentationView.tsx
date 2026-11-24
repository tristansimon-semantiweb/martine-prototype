"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { TopBand } from "@/shared/components/layout/TopBand";
import { Modal } from "@/shared/components/ui/Modal";
import { useToast } from "@/shared/components/ui/Toast";
import { useMartine } from "@/shared/hooks/useMartine";
import { useHelp } from "@/shared/hooks/useHelp";
import { personById, skillById } from "@/shared/lib/data";
import { toolById } from "@/shared/lib/tools";
import { plural } from "@/shared/lib/format";
import type { HelpDoc } from "@/shared/lib/help";
import { HELP_KINDS } from "@/features/steps/TaskHelp";

// The documentation library for analysts: every guide, what it is, what it
// applies to (tools, skills, words of a task), and its link. Add a guide here,
// or paste the link of one that has none; tasks then show it.
export function DocumentationView() {
	const help = useHelp();
	const [adding, setAdding] = useState(false);
	const [q, setQ] = useState("");
	const rows = help.all.filter((d) => !q.trim() || `${d.title} ${d.about} ${d.kind}`.toLowerCase().includes(q.trim().toLowerCase()));

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Documentation</div>
				<div className="text-sm text-[var(--color-ink-muted)]">Guides, methodologies and references that help the analysts, shown on the tasks they apply to</div>
			</TopBand>
			<div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-6 py-7">
				<div className="flex flex-wrap items-center gap-3">
					<input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the documentation" placeholder="Search the documentation" className="rr-input max-w-[320px] flex-1" />
					<button onClick={() => setAdding(true)} className="ml-auto rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">
						Add a guide
					</button>
				</div>
				<Modal open={adding} onClose={() => setAdding(false)} title="Add a guide">
					<GuideForm onDone={() => setAdding(false)} />
				</Modal>

				<div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
					<table className="w-full min-w-[820px] border-collapse text-[15px]">
						<thead>
							<tr className="border-b border-[var(--color-border)] text-left text-[13px] text-[var(--color-ink-muted)]">
								<th className="px-5 py-3 font-semibold">Guide</th>
								<th className="px-3 py-3 font-semibold">Kind</th>
								<th className="px-3 py-3 font-semibold">Shown on tasks that</th>
								<th className="px-5 py-3 font-semibold">Link</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((d) => (
								<tr key={d.id} className="border-b border-[var(--color-border)] align-top last:border-b-0">
									<td className="px-5 py-3">
										<div className="font-semibold">{d.title}</div>
										{d.about && <div className="max-w-[420px] text-sm text-[var(--color-ink-secondary)]">{d.about}</div>}
										{d.by && <div className="text-[12px] text-[var(--color-ink-muted)]">added by {personById(d.by)?.name.split(" ")[0]}</div>}
									</td>
									<td className="whitespace-nowrap px-3 py-3 text-sm">{d.kind}</td>
									<td className="px-3 py-3 text-sm text-[var(--color-ink-secondary)]">{appliesTo(d, help.linkCount(d.id))}</td>
									<td className="px-5 py-3">
										<LinkCell doc={d} />
									</td>
								</tr>
							))}
							{rows.length === 0 && (
								<tr>
									<td colSpan={4} className="px-5 py-6 text-[var(--color-ink-muted)]">
										No guide matches.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<p className="m-0 text-sm text-[var(--color-ink-muted)]">{plural(rows.length, "guide")}. A task also takes a guide by hand: its Documentation section, + Add.</p>
			</div>
		</>
	);
}

// What a guide is shown on: its tools, its skills, words of a task, tasks it was attached to.
function appliesTo(d: HelpDoc, attached: number): string {
	const parts = [
		...(d.tools ?? []).map((t) => `use ${toolById(t)?.label ?? t}`),
		...(d.skills ?? []).map((s) => `use the ${skillById(s)?.label ?? s} skill`),
		...(d.words?.length ? ["mention it in their text"] : []),
		...(attached ? [`it was attached to (${attached})`] : []),
	];
	return parts.length ? parts.join(", ") : "attached by hand only";
}

// The link: open it, or paste one when the guide has none.
function LinkCell({ doc }: { doc: HelpDoc }) {
	const { setHelpUrl } = useMartine();
	const toast = useToast();
	const [url, setUrl] = useState("");
	if (doc.url)
		return (
			<a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold">
				Open <ExternalLink size={12} aria-hidden />
			</a>
		);
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (!/^https?:\/\/\S+$/.test(url.trim())) return;
				setHelpUrl(doc.id, url.trim());
				toast(`Link added to “${doc.title}”`);
			}}
			className="flex gap-1.5"
		>
			<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-label={`Link for ${doc.title}`} placeholder="Paste its link" className="rr-input w-[180px] py-1 text-sm" />
			<button type="submit" disabled={!/^https?:\/\/\S+$/.test(url.trim())} className="rounded-[var(--radius)] border border-[var(--color-border-hover)] px-2.5 text-sm font-semibold disabled:opacity-40">
				Save
			</button>
		</form>
	);
}

function GuideForm({ onDone }: { onDone: () => void }) {
	const { addHelpDoc } = useMartine();
	const toast = useToast();
	const [title, setTitle] = useState("");
	const [url, setUrl] = useState("");
	const [kind, setKind] = useState("Guide");
	const [about, setAbout] = useState("");
	const valid = title.trim() && /^https?:\/\/\S+$/.test(url.trim());
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (!valid) return;
				addHelpDoc({ title: title.trim(), url: url.trim(), kind, about: about.trim() });
				toast(`“${title.trim()}” added to the documentation`);
				onDone();
			}}
			className="flex flex-col gap-2.5 text-sm"
		>
			<p className="m-0 text-[var(--color-ink-muted)]">A link to a guide on Notion, Drive or the intranet. Attach it to tasks from their Documentation section.</p>
			<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title" placeholder="Title" className="rr-input" />
			<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Link" placeholder="https://" className="rr-input" />
			<select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind" className="rr-input">
				{HELP_KINDS.map((k) => (
					<option key={k}>{k}</option>
				))}
			</select>
			<input value={about} onChange={(e) => setAbout(e.target.value)} aria-label="What it covers" placeholder="What it covers, in a line (optional)" className="rr-input" />
			<button type="submit" disabled={!valid} className="self-start rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white disabled:opacity-40">
				Add the guide
			</button>
		</form>
	);
}
