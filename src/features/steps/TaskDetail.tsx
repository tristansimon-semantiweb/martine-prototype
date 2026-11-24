"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, MessageSquarePlus, Play, Zap } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { Modal } from "@/shared/components/ui/Modal";
import { Sheet } from "@/shared/components/ui/Sheet";
import { methodEntry, skillById } from "@/shared/lib/data";
import { openInClaudeUrl } from "@/shared/lib/martineContext";
import type { PhaseView } from "@/shared/lib/studyModel";
import type { Study } from "@/shared/lib/types";
import { TaskFields, ToolOpenButton, formatOf, taskMeta, taskRows } from "@/features/phase/PhaseParts";
import { RequestSkill } from "@/features/skills/RequestSkill";
import { SkillBlock } from "./SkillBlock";
import { TaskDocuments } from "./TaskDocuments";
import { TaskHelp } from "./TaskHelp";
import { otherToolItems } from "@/shared/lib/tools";

// A task's detail, over its phase: where to run it, what it delivers, then
// the method's text (how to do it, the check, what to watch), what Claude
// reads, and "Suggest a change". The phase stays readable behind it.
export function TaskDetail({ study, phase, taskKey, onClose }: { study: Study; phase: PhaseView; taskKey: string | null; onClose: () => void }) {
	const view = phase.tasks.find((t) => t.key === taskKey);
	return (
		<Sheet
			open={Boolean(view)}
			onClose={onClose}
			width={560}
			level={1}
			label="Task"
			header={
				view && (
					<>
						<div className="text-sm text-[var(--color-ink-muted)]">
							Task {view.key}
							{taskMeta(view.task) && `, ${taskMeta(view.task)}`}
						</div>
						<h2 className="mt-0.5 font-[family-name:var(--font-heading)] text-[26px] font-medium leading-tight">{view.task.task}</h2>
					</>
				)
			}
		>
			{view && <Body key={view.key} study={study} phase={phase} taskKey={view.key} />}
		</Sheet>
	);
}

function Body({ study, phase, taskKey }: { study: Study; phase: PhaseView; taskKey: string }) {
	const { suggestChange } = useMartine();
	const toast = useToast();
	const [suggesting, setSuggesting] = useState(false);
	const [text, setText] = useState("");
	const view = phase.tasks.find((t) => t.key === taskKey)!;
	const { task, key } = view;
	const method = methodEntry(study.method.id);
	const format = formatOf(study.method.id);

	return (
		<div className="flex flex-col gap-5">
			<section aria-label="Where to run it" className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3.5">
				<div className="flex flex-wrap items-center gap-1.5">
					{task.skills.map((sk) =>
						skillById(sk)?.request?.kind === "automation" ? (
							<Link
								key={sk}
								href={`/skills/${sk}`}
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
								className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white no-underline hover:opacity-90"
							>
								<Play size={12} aria-hidden className="fill-current" /> Run in Claude <span className="font-normal opacity-85">with {skillById(sk)?.label ?? sk}</span>
								<ExternalLink size={12} aria-hidden />
							</a>
						),
					)}
					{task.tool_ids.map((t) => (
						<ToolOpenButton key={t} id={t} toConfirm={task.tool_ids_to_confirm?.includes(t)} />
					))}
					{task.skills.length === 0 && (
						<RequestSkill methodId={study.method.id} version={study.method.version} taskKey={key} task={task} openInClaude={(sk) => openInClaudeUrl(study, phase, key, sk)} />
					)}
				</div>
				{task.output && (
					<p className="m-0 text-sm">
						<span className="text-[var(--color-ink-muted)]">Delivers: </span>
						{task.output}
					</p>
				)}
			</section>

			<TaskHelp task={task} />

			<TaskFields
				rows={[
					...taskRows(task, format, { documents: <TaskDocuments study={study} phase={phase.id} task={task} /> }).filter((r) => !["Tools", "Output", "Deliverable"].includes(r.label) && !(r.label === "Documents" && !otherToolItems(task).documents.length)),
					...task.skills
						.filter((sk) => skillById(sk)?.request?.kind !== "automation")
						.map((sk) => ({ label: "What Claude reads", value: <SkillBlock study={study} phase={phase} taskKey={key} skillId={sk} /> })),
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
					<button type="submit" disabled={!text.trim()} className="self-start rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 font-semibold text-white disabled:opacity-40">
						Send to {method?.owner ?? "the method owner"}
					</button>
				</form>
			</Modal>
		</div>
	);
}
