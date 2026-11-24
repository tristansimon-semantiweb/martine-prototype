"use client";

import { useState } from "react";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { Modal } from "@/shared/components/ui/Modal";
import { useToast } from "@/shared/components/ui/Toast";
import { allSkills } from "@/shared/lib/data";
import { toolById } from "@/shared/lib/tools";
import type { MethodTask } from "@/shared/lib/types";

const STATUS_TEXT: Record<string, string> = {
	requested: "requested, with the tech team",
	in_development: "in development",
	validated: "available",
};

// On a step with no skill: "Request a skill". The request says what Claude
// should do on this step and which tools it needs a connector for; it lands
// with the tech team, who build the connectors and the skill.
export function RequestSkill({ methodId, version, taskKey, task }: { methodId: string; version: string | null; taskKey: string; task: MethodTask }) {
	const { requestSkill } = useMartine();
	const toast = useToast();
	const existing = allSkills().find((s) => s.request?.method === methodId && s.request.task === taskKey);
	const firstSentence = (t: string) => t.split(/\n|(?<=\.)\s/)[0]?.trim() ?? "";
	const [open, setOpen] = useState(false);
	const [need, setNeed] = useState(() => firstSentence(task.what || task.how));
	// Pre-ticked: the step's tools Claude has no connector for yet.
	const [connectors, setConnectors] = useState(() => task.tool_ids.filter((t) => !toolById(t)?.claude_connector));

	if (existing) {
		return (
			<Link href={`/skills/${existing.id}`} className="inline-flex items-center gap-1 text-[13px] font-semibold">
				<Wrench size={13} aria-hidden /> Skill {STATUS_TEXT[existing.status ?? "requested"]}
			</Link>
		);
	}

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-accent)]/40 px-2.5 py-1 text-[13px] font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]"
			>
				<Wrench size={13} aria-hidden /> Request a skill
			</button>
			<Modal open={open} onClose={() => setOpen(false)} title="Request a skill">
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (!need.trim()) return;
				requestSkill(methodId, version, taskKey, task, need.trim(), connectors);
				toast("Request sent to the tech team");
				setOpen(false);
			}}
			className="flex w-full flex-col gap-3 text-sm"
		>
			<p className="m-0 text-[var(--color-ink-muted)]">
				For the step “{task.task}”. The request goes to the tech team, who build the connectors and the skill.
			</p>
			<label className="flex flex-col gap-1">
				<span className="font-semibold">What should Claude do on this step?</span>
				<textarea value={need} onChange={(e) => setNeed(e.target.value)} rows={2} className="rr-input resize-y" />
			</label>
			{task.tool_ids.length > 0 && (
				<fieldset className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 border-0 p-0">
					<legend className="mb-1 font-semibold">Connectors Claude needs</legend>
					{task.tool_ids.map((t) => {
						const tool = toolById(t);
						return (
							<label key={t} className="inline-flex items-center gap-1.5">
								<input
									type="checkbox"
									checked={connectors.includes(t)}
									onChange={(e) => setConnectors((c) => (e.target.checked ? [...c, t] : c.filter((x) => x !== t)))}
									className="accent-[var(--color-accent)]"
								/>
								{tool?.label ?? t}
								{tool?.claude_connector && <span className="text-[var(--color-ink-muted)]">(exists)</span>}
							</label>
						);
					})}
				</fieldset>
			)}
			<div className="flex items-center gap-2">
				<button type="submit" disabled={!need.trim()} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-1.5 font-semibold text-white disabled:opacity-40">
					Send to the tech team
				</button>
				<button type="button" onClick={() => setOpen(false)} className="text-[var(--color-ink-muted)]">
					Cancel
				</button>
			</div>
		</form>
			</Modal>
		</>
	);
}
