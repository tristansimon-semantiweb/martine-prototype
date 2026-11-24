"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { useToast } from "@/shared/components/ui/Toast";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, methodFile, methodsIndex } from "@/shared/lib/data";
import { plural } from "@/shared/lib/format";
import { toolById } from "@/shared/lib/tools";
import { methodPhases } from "@/features/methods/methodModel";
import { toolUsage } from "./toolUsage";

// One tool: what it is, and every step of every study type that uses it.
// The method owner links it to a step, or unlinks it, from here too (draft).
export function ToolDetailView({ id }: { id: string }) {
	const { drafts, suggestions, role, linkTool, unlinkTool } = useMartine();
	const toast = useToast();
	const [type, setType] = useState("");
	const [phase, setPhase] = useState("");
	const [step, setStep] = useState("");
	const tool = toolById(id);

	if (!tool) {
		return (
			<>
				<TopBand>
					<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Tool not found</div>
				</TopBand>
				<div className="mx-auto max-w-[820px] px-6 py-10">
					<Link href="/tools">Back to the tools</Link>
				</div>
			</>
		);
	}

	const isOwner = role === "method_owner";
	const uses = toolUsage(id, drafts);
	const byType = [...new Set(uses.map((u) => u.methodId))].map((m) => ({ m, rows: uses.filter((u) => u.methodId === m) }));
	const typesWithFile = methodsIndex.filter((m) => methodFile(m.id));
	const phases = type ? methodPhases(type, drafts[type], suggestions) : [];
	const steps = phases.find((p) => p.id === phase)?.tasks ?? [];
	const select = "rr-input w-auto min-w-[170px] py-2";

	return (
		<>
			<TopBand>
				<div className="text-sm text-[var(--color-ink-muted)]">
					<Link href="/tools" className="text-[var(--color-ink-muted)]">
						Tools
					</Link>{" "}
					/ {tool.kind}
				</div>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">{tool.label}</div>
			</TopBand>

			<div className="mx-auto flex max-w-[820px] flex-col gap-[18px] px-6 py-8">
				<dl className="m-0 grid grid-cols-2 gap-3.5 sm:grid-cols-3">
					{[
						["Kind", tool.kind],
						["Claude connector", tool.claude_connector === null ? "[to check]" : tool.claude_connector ? "Yes: Claude can read it" : "No"],
						["Used in", uses.length ? `${plural(uses.length, "step")}, ${plural(byType.length, "study type")}` : "No step yet"],
					].map(([k, v]) => (
						<div key={k} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
							<dt className="text-[13px] text-[var(--color-ink-muted)]">{k}</dt>
							<dd className="m-0 mt-0.5 font-semibold">{v}</dd>
						</div>
					))}
				</dl>

				{(tool.note || uses.some((u) => u.toConfirm)) && (
					<section aria-label="What it is" className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-[15px]">
						{tool.note && <p className="m-0 text-[var(--color-ink-secondary)]">{tool.note}</p>}
						{uses.some((u) => u.toConfirm) && (
							<p className="m-0 text-sm text-[var(--color-attention)]">
								Links marked “to confirm” were read in the step’s text, not in its Tools column: the study type’s method owner confirms or removes them.
							</p>
						)}
					</section>
				)}

				{byType.map(({ m, rows }) => (
					<section key={m} aria-labelledby={`t-${m}`} className="flex flex-col gap-2">
						<h2 id={`t-${m}`} className="m-0 font-[family-name:var(--font-body)] text-lg font-semibold">
							<Link href={`/study-types/${m}`} className="text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
								{methodEntry(m)?.name}
							</Link>
						</h2>
						<ul className="m-0 list-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0">
							{rows.map((u) => (
								<li key={u.taskKey} className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] px-5 py-3 last:border-b-0">
									<Link href={`/study-types/${m}/method?phase=${u.phaseId}`} className="flex-1 text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
										<span className="text-sm text-[var(--color-ink-muted)]">{u.phaseLabel}</span>
										<span className="block font-semibold">{u.taskName}</span>
									</Link>
									{u.inDraft && <span className="text-[13px] text-[var(--color-attention)]">linked in draft</span>}
									{u.toConfirm && <span className="text-[13px] text-[var(--color-attention)]">to confirm</span>}
									{isOwner && (
										<button
											onClick={() => {
												unlinkTool(m, methodEntry(m)?.version ?? null, u.taskKey, id);
												toast(`${tool.label} unlinked from “${u.taskName}”`);
											}}
											className="rounded-[var(--radius)] border border-[var(--color-border-hover)] px-3 py-1 text-sm hover:bg-[var(--color-hover)]"
										>
											Unlink
										</button>
									)}
								</li>
							))}
						</ul>
					</section>
				))}

				{isOwner ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							if (!type || !step) return;
							linkTool(type, methodEntry(type)?.version ?? null, step, id);
							toast(`${tool.label} linked to “${steps.find((s) => s.key === step)?.task.task}”`);
							setStep("");
						}}
						className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-active)] bg-[var(--color-surface)] px-5 py-4"
					>
						<div className="font-semibold">Link {tool.label} to a step</div>
						<div className="flex flex-wrap gap-2">
							<select
								value={type}
								onChange={(e) => {
									setType(e.target.value);
									setPhase("");
									setStep("");
								}}
								aria-label="Study type"
								className={select}
							>
								<option value="">Study type</option>
								{typesWithFile.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name}
									</option>
								))}
							</select>
							<select
								value={phase}
								onChange={(e) => {
									setPhase(e.target.value);
									setStep("");
								}}
								disabled={!type}
								aria-label="Phase"
								className={select}
							>
								<option value="">Phase</option>
								{phases.map((p) => (
									<option key={p.id} value={p.id}>
										{p.label}
									</option>
								))}
							</select>
							<select value={step} onChange={(e) => setStep(e.target.value)} disabled={!phase} aria-label="Step" className={select}>
								<option value="">Step</option>
								{steps.map((s) => (
									<option key={s.key} value={s.key} disabled={s.task.tool_ids.includes(id)}>
										{s.task.task}
										{s.task.tool_ids.includes(id) ? " (already linked)" : ""}
									</option>
								))}
							</select>
							<button type="submit" disabled={!step} className="rounded-[var(--radius)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white disabled:opacity-40">
								Link
							</button>
						</div>
						<p className="m-0 text-sm text-[var(--color-ink-muted)]">The link goes into the method’s draft; studies in progress keep their version.</p>
					</form>
				) : (
					<p className="m-0 text-sm text-[var(--color-ink-muted)]">
						A study type’s method owner links tools to its steps. (In the prototype, view as Bamby from the account menu.)
					</p>
				)}
			</div>
		</>
	);
}
