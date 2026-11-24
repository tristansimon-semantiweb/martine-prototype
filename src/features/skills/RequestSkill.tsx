"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Play, Search, Wrench } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { Modal } from "@/shared/components/ui/Modal";
import { useToast } from "@/shared/components/ui/Toast";
import { SkillStatusBadge } from "@/shared/components/ui/SkillStatus";
import { allSkills, personById } from "@/shared/lib/data";
import { toolById } from "@/shared/lib/tools";
import type { MethodTask } from "@/shared/lib/types";
import { findExisting, type Found } from "./findExisting";

const STATUS_TEXT: Record<string, string> = {
	requested: "requested, with the tech team",
	in_development: "in development",
	validated: "available",
};

type Kind = "skill" | "automation";
type Stage = "form" | "checking" | "found" | "sent";

// On a step with no skill: "Request a skill or automation". A skill: Claude
// does the step with the analyst. An automation: it runs on its own (an
// export on a schedule, a file passed from one tool to the next).
// Claude first looks for something that already does it (a skill, an
// automation, a request in progress) and shows it. If nothing does, the
// request goes to the tech team, who build the connectors and the skill or
// the automation; Fabien validates it for everyone.
export function RequestSkill({
	methodId,
	version,
	taskKey,
	task,
	openInClaude,
}: {
	methodId: string;
	version: string | null;
	taskKey: string;
	task: MethodTask;
	openInClaude?: (skillId: string) => string; // in a study: open a found skill on this task
}) {
	const { requestSkill } = useMartine();
	const toast = useToast();
	const existing = allSkills().find((s) => s.request?.method === methodId && s.request.task === taskKey);
	const firstSentence = (t: string) => t.split(/\n|(?<=\.)\s/)[0]?.trim() ?? "";
	const [open, setOpen] = useState(false);
	const [stage, setStage] = useState<Stage>("form");
	const [found, setFound] = useState<Found[]>([]);
	const [sentId, setSentId] = useState<string | null>(null);
	const [kind, setKind] = useState<Kind>("skill");
	const [need, setNeed] = useState(() => firstSentence(task.what || task.how));
	// Pre-ticked: the step's tools Claude has no connector for yet.
	const [connectors, setConnectors] = useState(() => task.tool_ids.filter((t) => !toolById(t)?.claude_connector));

	const send = () => {
		const id = requestSkill(methodId, version, taskKey, task, need.trim(), connectors, kind);
		setSentId(id);
		setStage("sent");
		toast("Request sent to the tech team");
	};

	// Claude's look through the catalog (scripted: a short pause, then the matches).
	useEffect(() => {
		if (stage !== "checking") return;
		const t = setTimeout(() => {
			const matches = findExisting(need, existing?.id);
			setFound(matches);
			if (matches.length) setStage("found");
			else send();
		}, 900);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stage]);

	const close = () => {
		setOpen(false);
		setStage("form");
	};

	if (existing && !open) {
		return (
			<Link href={`/skills/${existing.id}`} className="inline-flex items-center gap-1 text-[13px] font-semibold">
				<Wrench size={13} aria-hidden /> {existing.request?.kind === "automation" ? "Automation" : "Skill"} {STATUS_TEXT[existing.status ?? "requested"]}
			</Link>
		);
	}

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] border border-dashed border-[var(--color-accent)]/40 px-2.5 py-1 text-[13px] font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]"
			>
				<Wrench size={13} aria-hidden /> Request a skill or automation
			</button>
			<Modal open={open} onClose={close} title="Request a skill or automation">
				{stage === "form" && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (need.trim()) setStage("checking");
						}}
						className="flex w-full flex-col gap-3 text-sm"
					>
						<p className="m-0 text-[var(--color-ink-muted)]">
							For the step “{task.task}”. Claude first looks for a skill or an automation that already does it; if nothing does, the request goes to the tech team.
						</p>
						<fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
							<legend className="mb-1 font-semibold">What do you need?</legend>
							{(
								[
									["skill", "A skill", "Claude does the step with you, in Claude."],
									["automation", "An automation", "It runs on its own: an export on a schedule, a file passed from one tool to the next."],
								] as const
							).map(([k, title, text]) => (
								<label
									key={k}
									className={`flex cursor-pointer items-start gap-2 rounded-[var(--radius)] border px-3 py-2 ${kind === k ? "border-[var(--color-accent)] bg-[var(--color-accent-dim)]" : "border-[var(--color-border)]"}`}
								>
									<input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} className="mt-1 accent-[var(--color-accent)]" />
									<span>
										<span className="font-semibold">{title}</span>
										<span className="block text-[var(--color-ink-muted)]">{text}</span>
									</span>
								</label>
							))}
						</fieldset>
						<label className="flex flex-col gap-1">
							<span className="font-semibold">{kind === "skill" ? "What should Claude do on this step?" : "What should run on its own on this step?"}</span>
							<textarea value={need} onChange={(e) => setNeed(e.target.value)} rows={2} className="rr-input resize-y" />
						</label>
						{task.tool_ids.length > 0 && (
							<fieldset className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 border-0 p-0">
								<legend className="mb-1 font-semibold">{kind === "skill" ? "Connectors Claude needs" : "Tools it connects to"}</legend>
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
							<button
								type="submit"
								disabled={!need.trim()}
								className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-1.5 font-semibold text-white disabled:opacity-40"
							>
								<Search size={14} aria-hidden /> Check with Claude
							</button>
							<button type="button" onClick={close} className="text-[var(--color-ink-muted)]">
								Cancel
							</button>
						</div>
					</form>
				)}

				{stage === "checking" && (
					<p role="status" className="m-0 flex items-center gap-2 py-6 text-sm text-[var(--color-ink-secondary)]">
						<Loader2 size={16} aria-hidden className="animate-spin text-[var(--color-accent)]" />
						Claude looks through the skills, the automations and the requests in progress…
					</p>
				)}

				{stage === "found" && (
					<div className="flex flex-col gap-3 text-sm">
						<p className="m-0">
							<span className="font-semibold">This may already exist.</span> <span className="text-[var(--color-ink-muted)]">Claude found {found.length === 1 ? "something close" : "a few things close"} to your request:</span>
						</p>
						<ul className="m-0 flex list-none flex-col gap-2 p-0">
							{found.map(({ skill: s, why }) => {
								const usable = s.status === "validated" || s.status === "experimental";
								const pending = Boolean(s.request) && s.status !== "validated";
								return (
									<li key={s.id} className="flex flex-col gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2.5">
										<div className="flex flex-wrap items-center gap-2">
											<span className="font-semibold">{s.label}</span>
											<span className="text-[var(--color-ink-muted)]">{s.request?.kind === "automation" ? "automation" : "skill"}</span>
											<SkillStatusBadge status={s.status} />
										</div>
										<p className="m-0 text-[var(--color-ink-secondary)]">
											{pending ? `Already requested by ${personById(s.request!.by)?.name.split(" ")[0]} for “${s.request!.taskName}”: ${s.does}` : s.does}
										</p>
										<p className="m-0 text-[12px] text-[var(--color-ink-muted)]">In common with your request: {why.join(", ")}</p>
										<div className="flex flex-wrap gap-2">
											{usable && openInClaude && s.request?.kind !== "automation" && (
												<a
													href={openInClaude(s.id)}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-semibold text-white no-underline hover:opacity-90"
												>
													<Play size={12} aria-hidden className="fill-current" /> Open in Claude with it <ExternalLink size={12} aria-hidden />
												</a>
											)}
											<Link href={`/skills/${s.id}`} className="inline-flex items-center rounded-[var(--radius)] border border-[var(--color-border-hover)] px-3 py-1.5 text-[13px] font-semibold no-underline">
												{pending ? "Follow the request" : "See it"}
											</Link>
										</div>
									</li>
								);
							})}
						</ul>
						<div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
							<button onClick={send} className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-3.5 py-1.5 font-semibold hover:bg-[var(--color-hover)]">
								None of these: send the request to the tech team
							</button>
							<button onClick={close} className="text-[var(--color-ink-muted)]">
								Close
							</button>
						</div>
					</div>
				)}

				{stage === "sent" && (
					<div className="flex flex-col gap-3 text-sm">
						<p className="m-0">
							{found.length ? "" : "Nothing in Martine does this yet. "}
							<span className="font-semibold">Request sent to the tech team.</span> They build the connectors and the {kind}; Fabien validates it, then it is available to everyone and linked to this step.
						</p>
						<div className="flex items-center gap-2">
							{sentId && (
								<Link href={`/skills/${sentId}`} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-1.5 font-semibold text-white no-underline">
									Follow the request
								</Link>
							)}
							<button onClick={close} className="text-[var(--color-ink-muted)]">
								Close
							</button>
						</div>
					</div>
				)}
			</Modal>
		</>
	);
}
