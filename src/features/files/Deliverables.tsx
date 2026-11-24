"use client";

import { useRef, useState } from "react";
import { ExternalLink, FileText, Link2, Paperclip } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { catalog, personById } from "@/shared/lib/data";
import { cn } from "@/shared/lib/cn";
import type { FileOrigin, MethodTask, Study, StudyFile } from "@/shared/lib/types";

// What links a task to the study's documents: the method says what the task
// produces (its Output / Deliverable); the study attaches the real file or
// link to that task. Files lists the same thing, phase by phase.

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
export function templateFor(task: MethodTask): string | null {
	const text = `${task.task} ${task.output} ${task.tools}`;
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

// Attach a link, a file, or start from the template, to a task or to the study.
export function AttachForm({
	study,
	phase,
	task,
	defaultName,
	template,
	onDone,
}: {
	study: Study;
	phase: string;
	task?: string;
	defaultName: string;
	template?: string | null;
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
					attach(study.id, { name: name.trim(), type: "Link", phase, task, url: url.trim() });
					toast("Link attached");
					onDone();
				}}
				className="flex flex-wrap gap-2"
			>
				<input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" placeholder="Name" className="rr-input min-w-[180px] flex-1" />
				<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Address" placeholder="https:// (Sheet, Doc, deck…)" className="rr-input min-w-[220px] flex-[2]" />
				<button type="submit" disabled={!name.trim() || !validUrl} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 text-sm font-semibold text-white disabled:opacity-40">
					Attach the link
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
						attach(study.id, { name: f.name.replace(/\.[^.]+$/, ""), type: f.name.split(".").pop()?.toUpperCase() ?? "File", phase, task });
						toast("File attached");
						onDone();
					}}
				/>
				<button onClick={() => input.current?.click()} className="font-semibold text-[var(--color-accent)]">
					or upload a file
				</button>
				{template && (
					<button
						onClick={() => {
							attach(study.id, {
								name: `${study.id} ${template.replace(/ template$/i, "")}`,
								type: /deck/i.test(template) ? "Slides" : "Sheet",
								phase,
								task,
								template,
							});
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

// The deliverable line of a task: what the method expects, what is attached.
export function TaskDeliverable({ study, phase, taskKey, task }: { study: Study; phase: string; taskKey: string; task: MethodTask }) {
	const [adding, setAdding] = useState(false);
	const files = study.files.filter((f) => f.task === taskKey);
	if (!task.output && !files.length) return null;
	return (
		<div className="mt-2.5 flex flex-col gap-1.5">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<span className="text-[var(--color-ink-muted)]">Deliverable:</span>
				<span className="text-[var(--color-ink-secondary)]">{task.output || "[not in the method file]"}</span>
				{!adding && (
					<button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-accent)]">
						<Paperclip size={13} aria-hidden /> {files.length ? "Attach another" : "Attach"}
					</button>
				)}
			</div>
			{files.length > 0 && (
				<div className="flex flex-wrap gap-1.5">
					{files.map((f) => (
						<FileChip key={f.id} study={study} file={f} />
					))}
				</div>
			)}
			{adding && <AttachForm study={study} phase={phase} task={taskKey} defaultName={task.output} template={templateFor(task)} onDone={() => setAdding(false)} />}
		</div>
	);
}
