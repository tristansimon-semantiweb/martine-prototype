"use client";

import { useState } from "react";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, people, personById } from "@/shared/lib/data";
import { plural } from "@/shared/lib/format";
import type { RoleId } from "@/shared/lib/types";

const ROLE_LINE: Record<RoleId, string> = {
	consultant: "Consultant, talks to the client",
	analyst: "Analyst",
	method_owner: "Method owner",
};

const row = "flex items-center gap-3.5 border-b border-[var(--color-border)] px-5 py-4 last:border-b-0";
const avatar = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold";

export function TeamView({ id }: { id: string }) {
	const { studies, role, addTeamMember } = useMartine();
	const [adding, setAdding] = useState(false);
	const study = studies.find((s) => s.id === id);
	if (!study) return null;

	const method = methodEntry(study.method.id);
	const claudeFiles = study.files.filter((f) => f.from.kind === "claude");
	const toCheck = claudeFiles.filter((f) => f.from.kind === "claude" && !f.from.checkedBy).length;
	const candidates = people.filter((p) => !study.team.some((m) => m.person === p.id));

	return (
		<div className="mx-auto flex max-w-[760px] flex-col gap-4 px-6 py-8">
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="m-0 flex-1 font-[family-name:var(--font-heading)] text-[26px] font-medium">Team</h1>
				{role === "consultant" && candidates.length > 0 && (
					<button
						onClick={() => setAdding((v) => !v)}
						className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--color-hover)]"
					>
						Add someone
					</button>
				)}
			</div>

			{adding && (
				<div className="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
					{candidates.map((p) => (
						<button
							key={p.id}
							onClick={() => {
								addTeamMember(study.id, p.id, p.role);
								setAdding(false);
							}}
							className="rounded-[var(--radius-xl)] border border-[var(--color-border-hover)] px-3 py-1.5 text-sm hover:bg-[var(--color-hover)]"
						>
							{p.name}, {p.role.replace("_", " ")}
						</button>
					))}
				</div>
			)}

			<ul aria-label="Team" className="m-0 list-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[var(--shadow-xs)]">
				{study.team.map((m) => {
					const p = personById(m.person);
					return (
						<li key={m.person} className={row}>
							<span className={`${avatar} bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]`}>{p?.initials}</span>
							<span className="flex-1">
								<span className="block font-semibold">{p?.name}</span>
								<span className="block text-sm text-[var(--color-ink-muted)]">
									{m.role === "method_owner" ? `Method owner, ${method?.name.toLowerCase() ?? "this method"}s` : ROLE_LINE[m.role]}
								</span>
							</span>
							<span className="text-sm text-[var(--color-ink-muted)]">{m.role === "method_owner" ? "advisor" : m.role}</span>
						</li>
					);
				})}
				<li className={row}>
					<span className={`${avatar} bg-[var(--color-accent-dim)] text-[var(--color-accent)]`}>AI</span>
					<span className="flex-1">
						<span className="block font-semibold">Claude</span>
						<span className="block text-sm text-[var(--color-ink-muted)]">
							{claudeFiles.length === 0
								? "No output yet in this study"
								: `Produced ${plural(claudeFiles.length, "output")}, ${toCheck === 0 ? "all checked by the team" : `${toCheck} still to check`}`}
						</span>
					</span>
					<span className="text-sm text-[var(--color-ink-muted)]">assistant</span>
				</li>
			</ul>
		</div>
	);
}
