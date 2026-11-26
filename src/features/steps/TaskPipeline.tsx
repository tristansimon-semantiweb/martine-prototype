"use client";

import { BookOpen, ExternalLink, Play } from "lucide-react";
import { useHelp } from "@/shared/hooks/useHelp";
import { plural } from "@/shared/lib/format";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { personById, skillById } from "@/shared/lib/data";
import { openInClaudeUrl } from "@/shared/lib/martineContext";
import type { PhaseView, TaskView } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";
import { ToolOpenButton } from "@/features/phase/PhaseParts";

// Where a task runs: in Claude with its skill, in a tool, or by hand.
type Executor = { kind: "claude"; skill: string } | { kind: "automation"; skill: string } | { kind: "tool"; tool: string } | { kind: "person" };

function executorOf(view: TaskView): Executor {
	const skill = view.task.skills.find((s) => skillById(s)?.request?.kind !== "automation");
	if (skill) return { kind: "claude", skill };
	const auto = view.task.skills[0];
	if (auto) return { kind: "automation", skill: auto };
	const tool = view.task.tool_ids.find((t) => t !== "claude") ?? view.task.tool_ids[0];
	if (tool) return { kind: "tool", tool };
	return { kind: "person" };
}

// The phase as a run: one row per task, from top to bottom: its name, then
// what to do (the start of how to do it), and its one action. No ticking or
// done state on tasks in V1. A click on the card opens the task's detail.
export function TaskPipeline({ study, phase, onOpen }: { study: Study; phase: PhaseView; onOpen: (key: string) => void }) {
	const { role, renameAddedTask, removeAddedTask, restoreAddedTask } = useMartine();
	const toast = useToast();
	const isConsultant = role === "consultant";
	const first = (id: string) => personById(id)?.name.split(" ")[0];
	const docsFor = useHelp().forTask;

	return (
		<ol aria-label="Tasks" className="m-0 list-none p-0 [&>li:last-child>div]:border-b-0">
			{phase.tasks.map((t) => {
				const e = executorOf(t);
				// Under the name, what to do: the step's purpose, else the start of how to do it.
				const summary = t.task.what || t.task.how.split(/\n|(?<=\.)\s/)[0];
				const help = docsFor(study.method.id, t.key, t.task);
				return (
					<li key={t.key}>
						{/* The whole card opens the task's detail; its one action runs it. */}
						<div
							onClick={() => onOpen(t.key)}
							className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--color-border)] px-6 py-4 transition-colors hover:bg-[var(--color-hover)]"
						>
							<button onClick={() => onOpen(t.key)} aria-label={`${t.task.task}: details`} className="min-w-[260px] flex-1 text-left">
								<span className="flex items-baseline gap-2">
									<span className="text-[13px] text-[var(--color-ink-muted)]">{t.key}</span>
									<span className="text-[16px] font-semibold">{t.task.task}</span>
								</span>
								{summary && <span className="mt-0.5 line-clamp-2 block text-sm text-[var(--color-ink-secondary)]">{summary}</span>}
								{help.length > 0 && (
									<span className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-ink-muted)]" title={help.map((d) => d.title).join(", ")}>
										<BookOpen size={12} aria-hidden /> {plural(help.length, "doc")} to help
									</span>
								)}
							</button>
							<span onClick={(ev) => ev.stopPropagation()} className="shrink-0">
								{e.kind === "claude" && (
									<a
										href={openInClaudeUrl(study, phase, t.key, e.skill)}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white no-underline hover:opacity-90"
									>
										<Play size={13} aria-hidden className="fill-current" /> Run in Claude <ExternalLink size={12} aria-hidden />
									</a>
								)}
								{e.kind === "tool" && <ToolOpenButton id={e.tool} toConfirm={t.task.tool_ids_to_confirm?.includes(e.tool)} study={study} phase={phase.id} phaseName={phase.name} />}
							</span>
						</div>
					</li>
				);
			})}
			{phase.added.map((t, i) => (
				<li key={t.id}>
					<div className="flex min-w-0 items-center gap-3 border-b border-[var(--color-border)] px-6 py-3.5">
						<span className="text-[13px] text-[var(--color-ink-muted)]">{`${phase.id}.${phase.tasks.length + i + 1}`}</span>
						<span className="min-w-0 flex-1 font-semibold">
							<InlineEdit value={t.title} onSave={(v) => v && renameAddedTask(study.id, t.id, v)} canEdit={isConsultant} label="the task" placeholder="Name the task" />
						</span>
						<span className="shrink-0 text-[13px] text-[var(--color-attention)]">By hand, added for this study by {first(t.by)}</span>
						{isConsultant && (
							<RemoveButton
								label={`Remove “${t.title}”`}
								onClick={() => {
									const removed = removeAddedTask(study.id, t.id);
									toast("Task removed", removed && { label: "Undo", onClick: () => restoreAddedTask(study.id, removed) });
								}}
							/>
						)}
					</div>
				</li>
			))}
		</ol>
	);
}
