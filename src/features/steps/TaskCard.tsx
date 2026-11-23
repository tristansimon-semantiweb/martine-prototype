"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { methodEntry } from "@/shared/lib/data";
import type { PhaseView, TaskView } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";
import { Chip, TaskFields, formatOf, taskMeta, taskRows, toolChips } from "@/features/phase/PhaseParts";
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

// One row of the method file as a task of this study. Done tasks fold to one
// line with the real time; open tasks show the four columns, the skills and
// "Suggest a change".
export function TaskCard({ study, phase, view, highlight }: { study: Study; phase: PhaseView; view: TaskView; highlight: boolean }) {
	const { setTaskDone, setTaskDays, suggestChange } = useMartine();
	const toast = useToast();
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
			className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
		/>
	);

	if (state.done) {
		return (
			<article className="flex items-center gap-3 rounded-[14px] border border-[var(--color-border)] px-4 py-3.5 text-[var(--color-ink-muted)]">
				{checkbox}
				<span className="flex-1 line-through">{task.task}</span>
				<DaysInput value={state.days ?? task.days_min ?? 0} onChange={(v) => setTaskDays(study.id, key, v)} label={`Days spent on ${task.task}`} />
			</article>
		);
	}

	const chips = toolChips(task);
	const format = formatOf(study.method.id);
	const tools = (
		<div className="flex flex-col gap-2.5">
			{chips.length > 0 && (
				<span className="flex flex-wrap gap-1.5">
					{chips.map((c) => (
						<Chip key={c.label} title={c.kind === "document" ? "A document of the method: it lives in Files" : undefined}>
							{c.label}
						</Chip>
					))}
				</span>
			)}
			{task.skills.map((s) => (
				<SkillBlock key={s} study={study} phase={phase} taskKey={key} skillId={s} />
			))}
			{chips.length === 0 && task.skills.length === 0 && <span className="text-[var(--color-ink-muted)]">None named</span>}
		</div>
	);

	return (
		<article
			className={cn(
				"flex flex-col gap-3.5 rounded-[14px] p-[18px]",
				highlight ? "border-[1.5px] border-[var(--color-accent)]" : "border border-[var(--color-border)]",
			)}
		>
			<div className="flex items-center gap-3">
				{checkbox}
				<h3 className="m-0 flex-1 font-[family-name:var(--font-body)] text-lg font-semibold">{task.task}</h3>
				<span className="text-[13px] text-[var(--color-ink-muted)]">{taskMeta(task)}</span>
			</div>
			<TaskFields
				rows={[
					...taskRows(task, format, {
						...(format === "tasks" || task.tools || task.skills.length ? { tools } : {}),
					}),
					{
						label: "Method",
						value: suggesting ? (
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
							<span className="text-sm">
								<button onClick={() => setSuggesting(true)} className="font-semibold text-[var(--color-accent)] underline-offset-2 hover:underline">
									Suggest a change
								</button>{" "}
								<span className="text-[var(--color-ink-muted)]">goes to {method?.owner ?? "the method owner"}, who updates the method sheet</span>
							</span>
						),
					},
				]}
			/>
		</article>
	);
}
