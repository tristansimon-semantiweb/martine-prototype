"use client";

import { useState } from "react";
import { Sheet } from "@/shared/components/ui/Sheet";
import { useToast } from "@/shared/components/ui/Toast";
import { useMartine } from "@/shared/hooks/useMartine";
import { catalog, methodEntry } from "@/shared/lib/data";
import { cn } from "@/shared/lib/cn";
import type { CatalogSkill, MethodTask } from "@/shared/lib/types";
import { SkillStatusBadge } from "@/shared/components/ui/SkillStatus";
import type { MethodPhaseView } from "./methodModel";

type Tab = "Skills" | "Tools" | "Documents" | "Guides";
const TABS: Tab[] = ["Skills", "Tools", "Documents", "Guides"];


const STOP = new Set(["with", "from", "each", "that", "this", "their", "until", "then", "into", "when", "same", "above", "study", "studies", "task"]);
const words = (s: string) => new Set(s.toLowerCase().match(/[a-z]{4,}/g)?.filter((w) => !STOP.has(w)) ?? []);

// Martine's suggestions bring the task's description close to each skill's
// (brief, §5): the words they share, and what the skill needs and produces.
function suggest(task: MethodTask): { skill: CatalogSkill; shared: string[] }[] {
	const t = words(`${task.task} ${task.how} ${task.tools} ${task.output}`);
	return catalog.skills
		.filter((s) => s.status !== "deprecated")
		.map((skill) => ({ skill, shared: [...words(`${skill.label} ${skill.does} ${skill.produces ?? ""}`)].filter((w) => t.has(w)) }))
		.filter((x) => x.shared.length > 0)
		.sort((a, b) => b.shared.length - a.shared.length)
		.slice(0, 2);
}

// The catalog, opened from "+ Add" on a task of a method phase. One source for
// skills, tools, documents and guides (data/catalog.json).
export function CatalogDrawer({
	methodId,
	phase,
	taskKey,
	onClose,
}: {
	methodId: string;
	phase: MethodPhaseView | null;
	taskKey: string | null;
	onClose: () => void;
}) {
	const { drafts, addSkillToTask, editMethodTask, linkTool } = useMartine();
	const toast = useToast();
	const [tab, setTab] = useState<Tab>("Skills");
	const [query, setQuery] = useState("");
	const m = methodEntry(methodId);
	const view = phase?.tasks.find((t) => t.key === taskKey);
	const task = view?.task;
	const version = drafts[methodId]?.version ?? m?.version;
	const q = query.trim().toLowerCase();
	const matches = (s: string) => !q || s.toLowerCase().includes(q);

	const suggested = task ? suggest(task) : [];
	const inPhase = new Set(phase?.tasks.flatMap((t) => t.task.skills) ?? []);

	const addSkill = (id: string, label: string) => {
		addSkillToTask(methodId, m?.version ?? null, taskKey!, id);
		toast(`${label} added to the task`);
	};
	const addTool = (label: string) => {
		const tools = task?.tools ? `${task.tools}, ${label}` : label;
		editMethodTask(methodId, m?.version ?? null, taskKey!, { tools });
		toast(`${label} added to the task`);
	};

	const skillRow = (s: CatalogSkill, why?: string) => {
		const onTask = task?.skills.includes(s.id);
		return (
			<li key={s.id} className="flex flex-col gap-1 border-b border-[var(--color-border)] py-3 last:border-b-0">
				<div className="flex flex-wrap items-center gap-2">
					<span className="flex-1 font-semibold">{s.label}</span>
					{onTask ? (
						<span className="text-sm text-[var(--color-ink-muted)]">on this task</span>
					) : inPhase.has(s.id) ? (
						<span className="text-sm text-[var(--color-ink-muted)]">already in phase {phase?.id}</span>
					) : (
						<SkillStatusBadge status={s.status} />
					)}
					{!onTask && s.status !== "deprecated" && (
						<button onClick={() => addSkill(s.id, s.label)} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1 text-sm font-semibold text-white">
							Add
						</button>
					)}
				</div>
				<p className="m-0 text-sm text-[var(--color-ink-secondary)]">{s.does}</p>
				{why && <p className="m-0 text-sm text-[var(--color-ink-muted)]">{why}</p>}
			</li>
		);
	};

	const simpleRow = (label: string, meta?: string) => {
		const onTask = task?.tools.toLowerCase().includes(label.toLowerCase());
		return (
			<li key={label} className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] py-3 last:border-b-0">
				<span className="flex-1 font-semibold">{label}</span>
				{meta && <span className="text-sm text-[var(--color-ink-muted)]">{meta}</span>}
				{onTask ? (
					<span className="text-sm text-[var(--color-ink-muted)]">on this task</span>
				) : (
					<button onClick={() => addTool(label)} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1 text-sm font-semibold text-white">
						Add
					</button>
				)}
			</li>
		);
	};

	return (
		<Sheet
			open={Boolean(task)}
			onClose={onClose}
			width={560}
			level={1}
			label="Catalog"
			header={
				<>
					<div className="text-sm text-[var(--color-ink-muted)]">
						{m?.name} method, editing v{version}
					</div>
					<div className="mt-2 text-sm text-[var(--color-ink-muted)]">Add to the task, phase {phase?.id}</div>
					<h2 className="mt-0.5 font-[family-name:var(--font-heading)] text-[26px] font-medium">{task?.task}</h2>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<div role="tablist" aria-label="Catalog" className="flex flex-wrap gap-1">
					{TABS.map((t) => (
						<button
							key={t}
							role="tab"
							aria-selected={tab === t}
							onClick={() => setTab(t)}
							className={cn(
								"rounded-[var(--radius-sm)] px-3 py-1 text-[15px] font-semibold",
								tab === t ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "hover:bg-[var(--color-hover)]",
							)}
						>
							{t}
						</button>
					))}
				</div>
				<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label={`Search ${tab.toLowerCase()}`} placeholder={`Search ${tab.toLowerCase()}`} className="rr-input" />

				{tab === "Skills" && (
					<>
						{!q && suggested.length > 0 && (
							<section aria-labelledby="sugg" className="rounded-[var(--radius-md)] bg-[var(--color-accent-dim)] px-4 py-2">
								<h3 id="sugg" className="m-0 pt-2 font-[family-name:var(--font-body)] text-sm font-bold text-[var(--color-accent)]">
									Suggested by Martine for this task
								</h3>
								<ul className="m-0 list-none p-0">
									{suggested.map(({ skill, shared }) =>
										skillRow(
											skill,
											`Why: the task and the skill both mention ${shared.slice(0, 3).join(", ")}.${skill.needs ? ` Needs: ${skill.needs.charAt(0).toLowerCase()}${skill.needs.slice(1)}.` : ""}${skill.produces ? ` Produces: ${skill.produces.charAt(0).toLowerCase()}${skill.produces.slice(1)}.` : ""}`,
										),
									)}
								</ul>
							</section>
						)}
						<section aria-labelledby="all">
							<h3 id="all" className="m-0 font-[family-name:var(--font-body)] text-sm font-bold text-[var(--color-ink-muted)]">
								All skills in the catalog
							</h3>
							<ul className="m-0 list-none p-0">
								{catalog.skills
									.filter((s) => q || !suggested.some((x) => x.skill.id === s.id))
									.filter((s) => matches(`${s.label} ${s.does}`))
									.map((s) => skillRow(s))}
							</ul>
						</section>
						<div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-active)] px-4 py-3 text-sm">
							<button onClick={() => toast("Request sent to the skills owner")} className="font-semibold text-[var(--color-accent)]">
								No skill fits? Request one
							</button>
							<p className="m-0 mt-0.5 text-[var(--color-ink-muted)]">The request goes to the skills owner and joins the list of skills to create.</p>
						</div>
					</>
				)}
				{tab === "Tools" && (
					<ul className="m-0 list-none p-0">
						{catalog.tools
							.filter((t) => matches(`${t.label} ${t.kind}`))
							.map((t) => {
								const linked = task?.tool_ids.includes(t.id);
								return (
									<li key={t.id} className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] py-3 last:border-b-0">
										<span className="flex-1 font-semibold">{t.label}</span>
										<span className="text-sm text-[var(--color-ink-muted)]">
											{t.kind}
											{t.claude_connector ? ", Claude can read it" : ""}
										</span>
										{linked ? (
											<span className="text-sm text-[var(--color-ink-muted)]">on this task</span>
										) : (
											<button
												onClick={() => {
													linkTool(methodId, m?.version ?? null, taskKey!, t.id);
													toast(`${t.label} linked to the task`);
												}}
												className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3 py-1 text-sm font-semibold text-white"
											>
												Link
											</button>
										)}
									</li>
								);
							})}
					</ul>
				)}
				{tab === "Documents" && <ul className="m-0 list-none p-0">{catalog.documents.filter(matches).map((d) => simpleRow(d, "lives in Files"))}</ul>}
				{tab === "Guides" && <ul className="m-0 list-none p-0">{catalog.guides.filter(matches).map((g) => simpleRow(g, "to read"))}</ul>}
			</div>
		</Sheet>
	);
}
