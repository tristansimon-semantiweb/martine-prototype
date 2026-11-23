"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { methodEntry, skillById } from "@/shared/lib/data";
import { toolById } from "@/shared/lib/tools";
import { ChevronDown } from "lucide-react";
import type { PhaseView, TaskView } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";
import { TaskFields, ToolList, formatOf, taskMeta, taskRows } from "@/features/phase/PhaseParts";
import { SkillBlock } from "./SkillBlock";

// The days spent on a done task: filled with the planned minimum, editable.
export function DaysInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
	return (
		<label className="flex items-center gap-1 text-[13px] text-[var(--color-ink-muted)]">
			done,
			<input
				type="number"
				min={0}
				step={0.25}
				value={value}
				onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
				aria-label={label}
				className="w-14 rounded-[var(--radius-xs)] border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-right text-[13px] text-[var(--color-ink)]"
			/>
			d
		</label>
	);
}

// One row of the method file as a task of this study, folded to one line:
// the task, what it is for, its tools and skills at a glance. Opening it shows
// the method's columns, Open in Claude and "Suggest a change". Done tasks keep
// one line with the real time.
export function TaskCard({ study, phase, view, highlight }: { study: Study; phase: PhaseView; view: TaskView; highlight: boolean }) {
	const { setTaskDone, setTaskDays, suggestChange } = useMartine();
	const toast = useToast();
	const [open, setOpen] = useState(false);
	const [suggesting, setSuggesting] = useState(false);
	const [text, setText] = useState("");
	const { task, key, state } = view;
	const method = methodEntry(study.method.id);
	const checkbox = (
		<input
			type="checkbox"
			checked={state.done}
			onChange={(e) => setTaskDone(study.id, key, e.target.checked, task.days_min ?? 0)}
			aria-label={state.done ? `${task.task}: done` : `${task.task}: mark as done once its check passes`}
			className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
		/>
	);

	if (state.done) {
		return (
			<article className="flex items-center gap-3 rounded-[12px] border border-[var(--color-border)] px-4 py-2.5 text-[var(--color-ink-muted)]">
				{checkbox}
				<span className="flex-1 line-through">{task.task}</span>
				<DaysInput value={state.days ?? task.days_min ?? 0} onChange={(v) => setTaskDays(study.id, key, v)} label={`Days spent on ${task.task}`} />
			</article>
		);
	}

	const format = formatOf(study.method.id);
	const summary = task.what || task.output;
	const toolNames = task.tool_ids.map((t) => toolById(t)?.label ?? t);
	const tools = (
		<div className="flex flex-col gap-2.5">
			<ToolList task={task} />
			{task.skills.map((s) => (
				<SkillBlock key={s} study={study} phase={phase} taskKey={key} skillId={s} />
			))}
		</div>
	);
	const hasTools = task.tool_ids.length > 0 || task.skills.length > 0 || Boolean(task.tools);

	return (
		<article
			className={cn(
				"rounded-[12px] px-4 py-3",
				highlight ? "border-[1.5px] border-[var(--color-accent)]" : "border border-[var(--color-border)]",
			)}
		>
			<div className="flex items-start gap-3">
				{checkbox}
				<button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-w-0 flex-1 text-left">
					<span className="flex items-baseline gap-3">
						<span className="flex-1 text-[16px] font-semibold">{task.task}</span>
						<span className="shrink-0 text-[13px] text-[var(--color-ink-muted)]">{taskMeta(task)}</span>
						<ChevronDown size={16} aria-hidden className={cn("shrink-0 self-center text-[var(--color-ink-muted)] transition-transform", open && "rotate-180")} />
					</span>
					{!open && summary && <span className="mt-0.5 block truncate text-sm text-[var(--color-ink-secondary)]">{summary}</span>}
					{!open && (toolNames.length > 0 || task.skills.length > 0) && (
						<span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px] text-[var(--color-ink-muted)]">
							{task.skills.map((sk) => (
								<span key={sk} className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2 py-px font-semibold text-[var(--color-accent)]">
									Skill: {skillById(sk)?.label ?? sk}
								</span>
							))}
							{toolNames.length > 0 && <span>{toolNames.join(" · ")}</span>}
						</span>
					)}
				</button>
			</div>

			{open && (
				<div className="mt-3 flex flex-col gap-3 border-t border-[var(--color-border)] pt-3 pl-8">
					<TaskFields rows={taskRows(task, format, format === "tasks" || hasTools ? { tools } : {})} />
					{suggesting ? (
						<div className="flex flex-col gap-2">
							<textarea
								value={text}
								onChange={(e) => setText(e.target.value)}
								rows={2}
								aria-label="Your suggestion for this task"
								placeholder="What should the method say for this task?"
								className="rr-input resize-none"
							/>
							<div className="flex gap-2">
								<button
									disabled={!text.trim()}
									onClick={() => {
										suggestChange(study.method.id, phase.id, key, text.trim());
										toast(`Suggestion sent to ${method?.owner ?? "the method owner"}`);
										setSuggesting(false);
										setText("");
									}}
									className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
								>
									Send
								</button>
								<button onClick={() => setSuggesting(false)} className="rounded-[var(--radius)] px-3 py-1.5 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]">
									Cancel
								</button>
							</div>
						</div>
					) : (
						<button onClick={() => setSuggesting(true)} className="self-start text-sm font-semibold text-[var(--color-accent)] hover:underline">
							Suggest a change to the method
						</button>
					)}
				</div>
			)}
		</article>
	);
}
