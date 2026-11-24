"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { allSkills } from "@/shared/lib/data";
import type { MethodTask } from "@/shared/lib/types";

// The link that asks Claude to draft a skill for a method step: identifiers
// only, as Open in Claude. Claude reads the step through the Martine connector
// and drafts it with skill-creator.
function draftUrl(methodId: string, version: string | null, key: string, taskName: string) {
	const message = [
		`Draft a Claude skill for the Martine method step ${methodId}@${version ?? "draft"}/${key} (“${taskName}”).`,
		"Read the step through the Martine connector and use the skill-creator skill.",
		"Keep it generic: no client, brand or people names.",
	].join(" ");
	return `https://claude.ai/new?q=${encodeURIComponent(message)}`;
}

// On a step with no skill: "Draft a skill with Claude". Once drafted, the step
// shows the draft and where to review it.
export function DraftSkill({ methodId, version, taskKey, task }: { methodId: string; version: string | null; taskKey: string; task: MethodTask }) {
	const { draftSkill } = useMartine();
	const toast = useToast();
	const draft = allSkills().find((s) => s.origin?.method === methodId && s.origin.task === taskKey);

	if (draft) {
		return (
			<Link href={`/skills/${draft.id}`} className="inline-flex items-center gap-1 text-[13px] font-semibold">
				<Sparkles size={13} aria-hidden /> Skill {draft.status === "draft" ? "drafted, to review" : draft.status === "approved" ? "approved, waiting for Fabien" : "validated"}: {draft.label}
			</Link>
		);
	}
	return (
		<a
			href={draftUrl(methodId, version, taskKey, task.task)}
			target="_blank"
			rel="noopener noreferrer"
			onClick={() => {
				draftSkill(methodId, version, taskKey, task);
				toast("Skill drafted: it waits in Skills for the method owner’s review");
			}}
			className="inline-flex items-center gap-1 self-start rounded-[var(--radius-sm)] border border-dashed border-[var(--color-accent)]/40 px-2.5 py-1 text-[13px] font-semibold text-[var(--color-accent)] no-underline hover:bg-[var(--color-accent-dim)]"
		>
			<Sparkles size={13} aria-hidden /> Draft a skill with Claude
		</a>
	);
}
