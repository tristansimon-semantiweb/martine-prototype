"use client";

import { ExternalLink, Play } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { personById, skillById } from "@/shared/lib/data";
import { openInClaudeUrl } from "@/shared/lib/martineContext";
import type { PhaseView, TaskView } from "@/shared/lib/studyModel";
import { toolById } from "@/shared/lib/tools";
import type { Study } from "@/shared/lib/types";
import { ToolOpenButton, taskTime } from "@/features/phase/PhaseParts";

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

function executorLine(e: Executor): string {
	if (e.kind === "claude") return `In Claude, with ${skillById(e.skill)?.label ?? e.skill}`;
	if (e.kind === "automation") return `Runs on its own: ${skillById(e.skill)?.label ?? e.skill}`;
	if (e.kind === "tool") return `In ${toolById(e.tool)?.label ?? e.tool}`;
	return "By hand";
}

// The phase as a run: one card per task, from top to bottom: its name, then
// who runs it, how long, what it delivers, and its one action. No ticking or
// done state on tasks in V1. A click on the card opens the task's detail.
export function TaskPipeline({ study, phase, onOpen }: { study: Study; phase: PhaseView; onOpen: (key: string) => void }) {
	const { role, renameAddedTask, removeAddedTask, restoreAddedTask } = useMartine();
	const toast = useToast();
	const isConsultant = role === "consultant";
	const first = (id: string) => personById(id)?.name.split(" ")[0];

	return (
		<ol aria-label="Tasks" className="m-0 list-none p-0">
			{phase.tasks.map((t) => {
				const e = executorOf(t);
				const meta = [executorLine(e), taskTime(t.task)].filter(Boolean).join(" · ");
				return (
					<li key={t.key}>
						{/* The whole card opens the task's detail; its one action runs it. */}
						<div
							onClick={() => onOpen(t.key)}
							className="mb-2.5 flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]"
						>
							<button onClick={() => onOpen(t.key)} aria-label={`${t.task.task}: details`} className="min-w-[260px] flex-1 text-left">
								<span className="flex items-baseline gap-2">
									<span className="text-[13px] text-[var(--color-ink-muted)]">{t.key}</span>
									<span className="text-[16px] font-semibold">{t.task.task}</span>
								</span>
								<span className="mt-0.5 block text-sm text-[var(--color-ink-muted)]">
									{meta}
									{t.task.output && <span className="text-[var(--color-ink-secondary)]"> · → {t.task.output}</span>}
								</span>
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
								{e.kind === "tool" && <ToolOpenButton id={e.tool} toConfirm={t.task.tool_ids_to_confirm?.includes(e.tool)} />}
							</span>
						</div>
					</li>
				);
			})}
			{phase.added.map((t, i) => (
				<li key={t.id}>
					<div className="mb-2.5 flex min-w-0 items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-5 py-3.5">
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
