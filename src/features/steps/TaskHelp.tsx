"use client";

import { useState } from "react";
import { BookOpen, ExternalLink, Plus } from "lucide-react";
import { useToast } from "@/shared/components/ui/Toast";
import { Popover } from "@/shared/components/ui/Popover";
import { RemoveButton } from "@/shared/components/ui/Editing";
import { useMartine } from "@/shared/hooks/useMartine";
import { useHelp } from "@/shared/hooks/useHelp";
import { otherToolItems } from "@/shared/lib/tools";
import type { MethodTask } from "@/shared/lib/types";

export const HELP_KINDS = ["Guide", "Methodology", "Tool guide", "Skill guide", "Reference"];

// What helps to do the task: the guides attached to it by hand, then the ones
// its tools, skills and text call for, then any guide the method file names
// that the library does not have yet. A guide opens its link; + Add attaches
// one from the library or a new link.
export function TaskHelp({ methodId, taskKey, task }: { methodId: string; taskKey: string; task: MethodTask }) {
	const toast = useToast();
	const { linkHelp, unlinkHelp } = useMartine();
	const help = useHelp();
	const docs = help.forTask(methodId, taskKey, task);
	const linkedIds = help.linked(methodId, taskKey).map((d) => d.id);
	const named = otherToolItems(task).guides.filter((g) => !docs.some((d) => d.title.toLowerCase() === g.toLowerCase()));

	return (
		<section aria-label="Documentation" className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-canvas)] px-4 py-3.5">
			<div className="flex items-center gap-2">
				<h3 className="m-0 flex flex-1 items-center gap-2 font-[family-name:var(--font-body)] text-[14px] font-semibold">
					<BookOpen size={15} aria-hidden className="text-[var(--color-accent)]" /> Documentation
				</h3>
				<AddHelp exclude={docs.map((d) => d.id)} onPick={(id) => linkHelp(methodId, taskKey, id)} />
			</div>
			<ul className="m-0 flex list-none flex-col gap-1 p-0">
				{docs.map((d) => (
					<li key={d.id} className="flex items-start gap-1">
						<button
							onClick={() => (d.url ? window.open(d.url, "_blank", "noopener,noreferrer") : toast(`“${d.title}” has no link yet: add it in Documentation`))}
							className="-mx-2 flex min-w-0 flex-1 items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[var(--color-hover)]"
						>
							<span className="min-w-0 flex-1">
								<span className="flex flex-wrap items-baseline gap-x-2">
									<span className="text-sm font-semibold text-[var(--color-accent)]">{d.title}</span>
									<span className="text-[12px] text-[var(--color-ink-muted)]">{d.kind}</span>
									{!d.url && <span className="text-[12px] text-[var(--color-ink-muted)]">no link yet</span>}
								</span>
								{d.about && <span className="block text-[13px] text-[var(--color-ink-secondary)]">{d.about}</span>}
							</span>
							{d.url && <ExternalLink size={12} aria-hidden className="mt-1 shrink-0 text-[var(--color-ink-muted)]" />}
						</button>
						{linkedIds.includes(d.id) && (
							<RemoveButton
								label={`Take “${d.title}” off this task`}
								onClick={() => {
									unlinkHelp(methodId, taskKey, d.id);
									toast("Guide taken off the task", { label: "Undo", onClick: () => linkHelp(methodId, taskKey, d.id) });
								}}
							/>
						)}
					</li>
				))}
				{named.map((g) => (
					<li key={g} className="py-1 text-sm text-[var(--color-ink-secondary)]">
						{g} <span className="text-[12px] text-[var(--color-ink-muted)]">named in the method, not in the documentation yet</span>
					</li>
				))}
				{docs.length === 0 && named.length === 0 && <li className="text-sm text-[var(--color-ink-muted)]">No guide for this task yet.</li>}
			</ul>
		</section>
	);
}

// + Add: search the library, or paste a new link (it joins the library too).
function AddHelp({ exclude, onPick }: { exclude: string[]; onPick: (id: string) => void }) {
	const { addHelpDoc } = useMartine();
	const toast = useToast();
	const help = useHelp();
	const [q, setQ] = useState("");
	const [creating, setCreating] = useState(false);
	const [title, setTitle] = useState("");
	const [url, setUrl] = useState("");
	const [kind, setKind] = useState("Guide");
	const valid = title.trim() && /^https?:\/\/\S+$/.test(url.trim());
	const options = help.all.filter((d) => !exclude.includes(d.id) && (!q.trim() || d.title.toLowerCase().includes(q.trim().toLowerCase())));

	return (
		<Popover
			align="end"
			width={360}
			trigger={({ open, toggle }) => (
				<button
					onClick={() => {
						setCreating(false);
						setQ("");
						toggle();
					}}
					aria-expanded={open}
					aria-label="Add documentation to this task"
					className="inline-flex items-center gap-0.5 rounded-[var(--radius-xl)] border border-dashed border-[var(--color-border-active)] px-2.5 py-0.5 text-[13px] font-semibold hover:bg-[var(--color-hover)]"
				>
					<Plus size={12} aria-hidden /> Add
				</button>
			)}
		>
			{(close) =>
				creating ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (!valid) return;
							const id = addHelpDoc({ title: title.trim(), url: url.trim(), kind });
							onPick(id);
							toast(`“${title.trim()}” added to the task and to Documentation`);
							setTitle("");
							setUrl("");
							close();
						}}
						className="flex flex-col gap-2 text-sm"
					>
						<input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Title of the guide" placeholder="Title of the guide" className="rr-input py-1.5" />
						<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Link" placeholder="https:// (Notion, Drive, intranet…)" className="rr-input py-1.5" />
						<select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind" className="rr-input py-1.5">
							{HELP_KINDS.map((k) => (
								<option key={k}>{k}</option>
							))}
						</select>
						<div className="flex items-center gap-2">
							<button type="submit" disabled={!valid} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1.5 font-semibold text-white disabled:opacity-40">
								Add the link
							</button>
							<button type="button" onClick={() => setCreating(false)} className="text-[var(--color-ink-muted)]">
								Back
							</button>
						</div>
					</form>
				) : (
					<div className="flex flex-col gap-1 text-sm">
						<input autoFocus value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the documentation" placeholder="Search the documentation" className="rr-input py-1.5" />
						<ul className="m-0 max-h-[240px] list-none overflow-y-auto p-0">
							{options.map((d) => (
								<li key={d.id}>
									<button
										onClick={() => {
											onPick(d.id);
											toast(`“${d.title}” attached to the task`);
											close();
										}}
										className="flex w-full items-baseline gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[var(--color-hover)]"
									>
										<span className="flex-1">{d.title}</span>
										<span className="text-[12px] text-[var(--color-ink-muted)]">{d.kind}</span>
									</button>
								</li>
							))}
							{options.length === 0 && <li className="px-2 py-1.5 text-[var(--color-ink-muted)]">Nothing else matches.</li>}
						</ul>
						<button onClick={() => setCreating(true)} className="mt-1 flex items-center gap-1.5 rounded-[var(--radius-sm)] border-t border-[var(--color-border)] px-2 pt-2 text-left font-semibold text-[var(--color-accent)]">
							<Plus size={13} aria-hidden /> New link: a guide on Notion, Drive or the intranet
						</button>
					</div>
				)
			}
		</Popover>
	);
}
