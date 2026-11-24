"use client";

import { ExternalLink, Play, User, Zap } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { InlineEdit, RemoveButton } from "@/shared/components/ui/Editing";
import { personById, skillById } from "@/shared/lib/data";
import { openInClaudeUrl } from "@/shared/lib/martineContext";
import type { PhaseView, TaskView } from "@/shared/lib/studyModel";
import { toolById } from "@/shared/lib/tools";
import { cn } from "@/shared/lib/cn";
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

// The node on the rail: who runs the task. No done state on a task in V1:
// the phase's status says where the work stands.
function Node({ e }: { e: Executor }) {
	const ring = "ring-[var(--color-border-active)]";
	const face =
		e.kind === "claude" || e.kind === "automation"
			? "bg-[var(--color-accent)] text-white"
			: e.kind === "tool"
				? "bg-[var(--color-elevated)] text-[var(--color-ink)]"
				: "bg-[var(--color-surface)] text-[var(--color-ink-secondary)]";
	return (
		<span className={cn("relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-offset-2 ring-offset-[var(--color-canvas)]", face, ring)}>
			{e.kind === "claude" ? (
				"Cl"
			) : e.kind === "automation" ? (
				<Zap size={15} aria-hidden />
			) : e.kind === "tool" ? (
				(toolById(e.tool)?.label ?? e.tool).slice(0, 2)
			) : (
				<User size={15} aria-hidden />
			)}
		</span>
	);
}

// The phase as a run: one card per task, from top to bottom, each with who
// runs it, its one action and what it delivers. No ticking or done state on
// tasks in V1. A click opens the task's detail.
export function TaskPipeline({ study, phase, onOpen }: { study: Study; phase: PhaseView; onOpen: (key: string) => void }) {
	const { role, renameAddedTask, removeAddedTask, restoreAddedTask } = useMartine();
	const toast = useToast();
	const isConsultant = role === "consultant";
	const first = (id: string) => personById(id)?.name.split(" ")[0];

	return (
		<ol aria-label="Tasks" className="m-0 list-none p-0">
			{phase.tasks.map((t, i) => {
				const e = executorOf(t);
				const last = i === phase.tasks.length - 1 && phase.added.length === 0;
				return (
					<li key={t.key} className="relative flex gap-4">
						{!last && <span aria-hidden className="absolute bottom-0 left-[18px] top-11 w-px bg-[var(--color-border-active)]" />}
						<div className="pt-4">
							<Node e={e} />
						</div>
						<div
							className={cn(
								"mb-3 flex min-w-0 flex-1 flex-wrap items-start gap-x-4 gap-y-2 rounded-[var(--radius-lg)] border bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-sm)]",
								"border-[var(--color-border)]",
							)}
						>
							<button onClick={() => onOpen(t.key)} className="min-w-[260px] flex-1 text-left">
								<span className="flex flex-wrap items-baseline gap-x-2">
									<span className="text-[13px] font-semibold text-[var(--color-ink-muted)]">{t.key}</span>
									<span className="text-[16px] font-semibold">{t.task.task}</span>
								</span>
								<span className="mt-0.5 block text-sm text-[var(--color-ink-secondary)]">
									{executorLine(e)}
									{taskTime(t.task) && <span className="text-[var(--color-ink-muted)]">, {taskTime(t.task)}</span>}
								</span>
								{t.task.output && <span className="mt-1 block text-sm text-[var(--color-ink-muted)]">→ {t.task.output}</span>}
							</button>
							<span className="flex shrink-0 items-center gap-2 pt-0.5">
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
								<button onClick={() => onOpen(t.key)} className="rounded-[var(--radius)] px-2.5 py-2 text-sm font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]">
									Details
								</button>
							</span>
						</div>
					</li>
				);
			})}
			{phase.added.map((t, i) => (
				<li key={t.id} className="relative flex gap-4">
					{i < phase.added.length - 1 && <span aria-hidden className="absolute bottom-0 left-[18px] top-11 w-px bg-[var(--color-border-active)]" />}
					<div className="pt-4">
						<Node e={{ kind: "person" }} />
					</div>
					<div className="mb-3 flex min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-5 py-3.5">
						<span className="text-[13px] font-semibold text-[var(--color-ink-muted)]">{`${phase.id}.${phase.tasks.length + i + 1}`}</span>
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
