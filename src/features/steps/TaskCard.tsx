"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { methodEntry, skillById } from "@/shared/lib/data";
import Link from "next/link";
import { ChevronDown, ExternalLink, MessageSquarePlus, Sparkles, Zap } from "lucide-react";
import { Modal } from "@/shared/components/ui/Modal";
import type { PhaseView, TaskView } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";
import { TaskFields, ToolOpenButton, formatOf, taskMeta, taskRows } from "@/features/phase/PhaseParts";
import { otherToolItems } from "@/shared/lib/tools";
import { openInClaudeUrl } from "@/shared/lib/martineContext";
import { SkillBlock } from "./SkillBlock";
import { RequestSkill } from "@/features/skills/RequestSkill";

// One row of the method file as a task of this study, read top to bottom:
// what to do (in a line), where to do it (Open in Claude with its skill, Open
// each tool), what it delivers. "How to do it" unfolds the method's text.
export function TaskCard({ study, phase, view }: { study: Study; phase: PhaseView; view: TaskView }) {
	const { suggestChange } = useMartine();
	const toast = useToast();
	const [open, setOpen] = useState(false);
	const [suggesting, setSuggesting] = useState(false);
	const [text, setText] = useState("");
	const { task, key } = view;
	const method = methodEntry(study.method.id);

	const format = formatOf(study.method.id);
	// What to do, in a line: the step's purpose (steps format), else the first
	// sentence of how to do it. The full text unfolds below.
	const summary = task.what || task.how.split(/\n|(?<=\.)\s/)[0];
	const others = otherToolItems(task);

	return (
		<article className="rounded-[12px] border border-[var(--color-border)] px-4 py-3">
			<div>
				<div className="min-w-0">
					<div className="flex items-baseline gap-3">
						<h3 className="m-0 flex-1 font-[family-name:var(--font-body)] text-[16px] font-semibold">{task.task}</h3>
						<span className="shrink-0 text-[13px] text-[var(--color-ink-muted)]">{taskMeta(task)}</span>
					</div>
					{summary && !(open && !task.what) && <p className={cn("m-0 mt-0.5 text-sm text-[var(--color-ink-secondary)]", !open && "line-clamp-2")}>{summary}</p>}

					<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
						{task.skills.map((sk) =>
							skillById(sk)?.request?.kind === "automation" ? (
								<Link
									key={sk}
									href={`/skills/${sk}`}
									title="An automation built by the tech team: it runs on its own"
									className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent-dim)] px-3 py-1.5 text-[13px] font-semibold text-[var(--color-accent)] no-underline"
								>
									<Zap size={13} aria-hidden /> Runs on its own: {skillById(sk)?.label}
								</Link>
							) : (
								<a
									key={sk}
									href={openInClaudeUrl(study, phase, key, sk)}
									target="_blank"
									rel="noopener noreferrer"
									title="Opens Claude on this task, with the study and the method in context"
									className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white no-underline hover:opacity-90"
								>
									<Sparkles size={13} aria-hidden />
									Open in Claude
									<span className="font-normal opacity-85">with {skillById(sk)?.label ?? sk}</span>
									<ExternalLink size={12} aria-hidden />
								</a>
							),
						)}
						{task.tool_ids.map((t) => (
							<ToolOpenButton key={t} id={t} toConfirm={task.tool_ids_to_confirm?.includes(t)} />
						))}
						{task.skills.length === 0 && <RequestSkill methodId={study.method.id} version={study.method.version} taskKey={key} task={task} openInClaude={(sk) => openInClaudeUrl(study, phase, key, sk)} />}
					</div>

					{task.output && (
						<p className="m-0 mt-2 text-sm">
							<span className="text-[var(--color-ink-muted)]">Deliverable: </span>
							<span className="text-[var(--color-ink-secondary)]">{task.output}</span>
						</p>
					)}

					<button
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
						className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-accent)] hover:underline"
					>
						{open ? "Hide how to do it" : format === "steps" ? "How to do it, what to watch" : "How to do it, the check"}
						<ChevronDown size={14} aria-hidden className={cn("transition-transform", open && "rotate-180")} />
					</button>
				</div>
			</div>

			{open && (
				<div className="mt-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3">
					<TaskFields
						rows={[
							...taskRows(task, format).filter((r) => !["What", "Tools", "Output", "Deliverable"].includes(r.label)),
							...(others.length ? [{ label: "Also named", value: others.join(", ") }] : []),
							...task.skills.map((sk) => ({
								label: "Skill",
								value: <SkillBlock study={study} phase={phase} taskKey={key} skillId={sk} />,
							})),
						]}
					/>
					<button onClick={() => setSuggesting(true)} className="inline-flex items-center gap-1 self-start text-sm font-semibold text-[var(--color-accent)] hover:underline">
						<MessageSquarePlus size={14} aria-hidden /> Suggest a change to the method
					</button>
					<Modal open={suggesting} onClose={() => setSuggesting(false)} title="Suggest a change">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								if (!text.trim()) return;
								suggestChange(study.method.id, phase.id, key, text.trim());
								toast(`Suggestion sent to ${method?.owner ?? "the method owner"}`);
								setSuggesting(false);
								setText("");
							}}
							className="flex flex-col gap-3 text-sm"
						>
							<p className="m-0 text-[var(--color-ink-muted)]">
								On “{task.task}”, in the {method?.name.toLowerCase()} method. {method?.owner ?? "The method owner"} reviews it; studies keep their version.
							</p>
							<textarea
								autoFocus
								value={text}
								onChange={(e) => setText(e.target.value)}
								rows={3}
								aria-label="Your suggestion for this task"
								placeholder="What should the method say for this task?"
								className="rr-input resize-y"
							/>
							<button
								type="submit"
								disabled={!text.trim()}
								className="self-start rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white disabled:opacity-40"
							>
								Send to {method?.owner ?? "the method owner"}
							</button>
						</form>
					</Modal>
				</div>
			)}
		</article>
	);
}
