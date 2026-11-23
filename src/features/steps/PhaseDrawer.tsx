"use client";

import { useState } from "react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { personById } from "@/shared/lib/data";
import { dayRange, plural } from "@/shared/lib/format";
import type { PhaseView } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";
import { PhaseSheet, ownerLabel } from "@/features/phase/PhaseParts";
import { DaysInput, TaskCard } from "./TaskCard";

// A phase of a study, opened from Steps: the consultant's note, the method's
// tasks as written in the method file, the tasks added for this study, then
// completing (or approving) the phase.
export function PhaseDrawer({ study, phase, onClose }: { study: Study; phase: PhaseView | null; onClose: () => void }) {
	return (
		<PhaseSheet
			open={Boolean(phase)}
			onClose={onClose}
			kicker={phase ? kicker(phase) : ""}
			title={phase?.name ?? ""}
			footer={phase && <Footer study={study} phase={phase} onDone={onClose} />}
		>
			{phase && <Body key={phase.id} study={study} phase={phase} />}
		</PhaseSheet>
	);
}

function kicker(p: PhaseView) {
	const owners = [...new Set(p.tasks.map((t) => ownerLabel(t.task.owner)))];
	const owner = owners.length === 1 ? `, ${owners[0]}` : "";
	if (p.addedBy) return `Phase ${p.id}, added for this study by ${personById(p.addedBy)?.name}`;
	return `Phase ${p.id}, planned ${dayRange(p.days.min, p.days.max).replace(" d", " days")}${owner}`;
}

function consultantOf(study: Study) {
	const id = study.team.find((m) => m.role === "consultant")?.person;
	return personById(id ?? "")?.name.split(" ")[0] ?? "The consultant";
}

function Body({ study, phase }: { study: Study; phase: PhaseView }) {
	const { role, setNote, addTask, setAddedTaskDone, setAddedTaskDays } = useMartine();
	const isConsultant = role === "consultant";
	const note = study.state.notes[phase.id];
	const [editingNote, setEditingNote] = useState(false);
	const [noteText, setNoteText] = useState(note?.text ?? "");
	const [newTask, setNewTask] = useState<string | null>(null);
	const firstOpen = phase.tasks.find((t) => !t.state.done)?.key;

	return (
		<>
			{editingNote ? (
				<div className="flex flex-col gap-2 rounded-[var(--radius)] bg-[var(--color-attention-bg)] p-3">
					<label htmlFor="note" className="text-sm font-bold text-[var(--color-attention)]">
						Note for the team on this phase
					</label>
					<textarea id="note" value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} className="rr-input resize-none" />
					<div className="flex gap-2">
						<button
							onClick={() => {
								setNote(study.id, phase.id, noteText);
								setEditingNote(false);
							}}
							className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1.5 text-sm font-semibold text-white"
						>
							Save the note
						</button>
						<button onClick={() => setEditingNote(false)} className="rounded-[var(--radius)] px-3 py-1.5 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]">
							Cancel
						</button>
					</div>
				</div>
			) : note ? (
				<div className="rounded-[var(--radius)] bg-[var(--color-attention-bg)] px-3 py-2.5 text-[15px] leading-normal">
					<span className="font-bold text-[var(--color-attention)]">Note from {personById(note.by)?.name.split(" ")[0]}:</span> {note.text}
					{isConsultant && (
						<button onClick={() => setEditingNote(true)} className="ml-2 text-sm font-semibold text-[var(--color-accent)]">
							Edit
						</button>
					)}
				</div>
			) : (
				isConsultant && (
					<button
						onClick={() => setEditingNote(true)}
						className="self-start rounded-[var(--radius)] border border-dashed border-[var(--color-border-active)] px-3.5 py-2 text-sm font-semibold"
					>
						Add a note for the team
					</button>
				)
			)}

			{phase.tasks.map((t) => (
				<TaskCard key={t.key} study={study} phase={phase} view={t} highlight={t.key === firstOpen} />
			))}

			{phase.added.length > 0 && (
				<section aria-label="Tasks added for this study" className="flex flex-col gap-2">
					{phase.tasks.length > 0 && <div className="text-xs font-bold text-[var(--color-ink-muted)]">Added for this study</div>}
					{phase.added.map((t) => (
						<article key={t.id} className="flex items-center gap-3 rounded-[14px] bg-[var(--color-attention-soft)] px-4 py-3.5">
							<input
								type="checkbox"
								checked={Boolean(t.done)}
								onChange={(e) => setAddedTaskDone(study.id, t.id, e.target.checked)}
								aria-label={t.done ? `${t.title}: done` : `${t.title}: mark as done`}
								className="h-5 w-5 shrink-0 accent-[var(--color-accent)]"
							/>
							<span className={t.done ? "flex-1 text-[var(--color-ink-muted)] line-through" : "flex-1 font-semibold"}>{t.title}</span>
							{t.done ? (
								<DaysInput value={t.days ?? 0.25} onChange={(v) => setAddedTaskDays(study.id, t.id, v)} label={`Days spent on ${t.title}`} />
							) : (
								<span className="text-[13px] text-[var(--color-attention)]">added by {personById(t.by)?.name.split(" ")[0]}</span>
							)}
						</article>
					))}
				</section>
			)}

			{isConsultant &&
				(newTask === null ? (
					<button onClick={() => setNewTask("")} className="self-start text-sm font-semibold text-[var(--color-accent)]">
						Add a task
					</button>
				) : (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (!newTask.trim()) return;
							addTask(study.id, phase.id, newTask.trim());
							setNewTask(null);
						}}
						className="flex flex-wrap gap-2"
					>
						<input
							autoFocus
							value={newTask}
							onChange={(e) => setNewTask(e.target.value)}
							aria-label="The task to add for this study"
							placeholder="What needs doing, for this study only"
							className="rr-input min-w-[240px] flex-1"
						/>
						<button type="submit" className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 text-sm font-semibold text-white">
							Add
						</button>
						<button type="button" onClick={() => setNewTask(null)} className="rounded-[var(--radius)] px-3 text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]">
							Cancel
						</button>
					</form>
				))}
		</>
	);
}

function Footer({ study, phase, onDone }: { study: Study; phase: PhaseView; onDone: () => void }) {
	const { role, completePhase } = useMartine();
	const toast = useToast();
	const isConsultant = role === "consultant";
	const left = phase.total - phase.doneCount;
	const consultant = consultantOf(study);
	const btn = "rounded-[var(--radius)] bg-[var(--color-accent)] px-5 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

	if (phase.status === "done") {
		return <p className="text-sm text-[var(--color-ink-muted)]">This phase is complete.</p>;
	}

	const complete = () => {
		completePhase(study.id, phase.id, phase.milestone, isConsultant);
		toast(phase.milestone && !isConsultant ? `Sent to ${consultant} for approval` : `Phase ${phase.id} complete`);
		onDone();
	};

	if (phase.status === "awaiting") {
		return isConsultant ? (
			<div className="flex flex-wrap items-center gap-3">
				<button onClick={complete} className={btn}>
					Approve the phase
				</button>
				<span className="text-sm text-[var(--color-ink-muted)]">The next phase opens for the team</span>
			</div>
		) : (
			<p className="text-sm text-[var(--color-ink-muted)]">Waiting for {consultant}’s approval.</p>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-3">
			<button onClick={complete} disabled={left > 0 || phase.total === 0} className={btn}>
				{phase.milestone && isConsultant ? "Approve the phase" : "Complete the phase"}
			</button>
			<span className="text-sm text-[var(--color-ink-muted)]">
				{left > 0
					? `${plural(left, "task")} left before the phase can close`
					: phase.milestone && !isConsultant
						? `${consultant} approves this phase next`
						: "Every task has passed its check"}
			</span>
		</div>
	);
}
