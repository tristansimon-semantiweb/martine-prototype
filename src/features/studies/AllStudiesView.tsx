"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { FamilyPill } from "@/shared/components/ui/Family";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, methodsIndex, people, personById } from "@/shared/lib/data";
import { dueDate, plural } from "@/shared/lib/format";
import { phaseLabelForCard } from "@/shared/lib/studyModel";
import { cn } from "@/shared/lib/cn";
import type { Family, Study } from "@/shared/lib/types";

type Status = "in_progress" | "not_started" | "delivered";
const STATUS_LABEL: Record<Status, string> = { in_progress: "In progress", not_started: "Not started", delivered: "Delivered" };
const FAMILIES: (Family | "All")[] = ["All", "SML", "Monitoring", "Trends"];

function statusOf(s: Study): Status {
	if (s.status === "delivered") return "delivered";
	return phaseLabelForCard(s) ? "in_progress" : "not_started";
}

// Every study, not only mine, so anyone can find how a study of the same type
// (or for the same client) was run, and open its steps, notes and files.
export function AllStudiesView() {
	const { studies } = useMartine();
	const [family, setFamily] = useState<Family | "All">("All");
	const [type, setType] = useState("all");
	const [status, setStatus] = useState<Status | "all">("all");
	const [person, setPerson] = useState("all");
	const [query, setQuery] = useState("");

	const q = query.trim().toLowerCase();
	const rows = studies
		.filter((s) => family === "All" || s.family === family)
		.filter((s) => type === "all" || s.method.id === type)
		.filter((s) => status === "all" || statusOf(s) === status)
		.filter((s) => person === "all" || s.team.some((m) => m.person === person))
		.filter((s) => !q || `${s.title} ${s.client} ${s.id}`.toLowerCase().includes(q))
		.sort((a, b) => b.due.localeCompare(a.due));

	// Study types offered in the filter: those of the chosen family.
	const types = methodsIndex.filter((m) => family === "All" || m.family === family);
	const filtered = family !== "All" || type !== "all" || status !== "all" || person !== "all" || Boolean(q);
	const select = "rr-input w-auto min-w-[150px] py-2";

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">All studies</div>
				<div className="text-sm text-[var(--color-ink-muted)]">Every study run in Martine: see how a study of the same type was done</div>
			</TopBand>
			<div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-6 py-7">
				<div className="flex flex-wrap items-center gap-3">
					<div role="group" aria-label="Family" className="flex flex-wrap gap-1">
						{FAMILIES.map((f) => (
							<button
								key={f}
								onClick={() => {
									setFamily(f);
									setType("all");
								}}
								aria-pressed={family === f}
								className={cn(
									"rounded-[var(--radius-sm)] px-3 py-1 text-[15px] font-semibold",
									family === f ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "hover:bg-[var(--color-hover)]",
								)}
							>
								{f}
							</button>
						))}
					</div>
					<select value={type} onChange={(e) => setType(e.target.value)} aria-label="Study type" className={select}>
						<option value="all">All study types</option>
						{types.map((m) => (
							<option key={m.id} value={m.id}>
								{m.name}
							</option>
						))}
					</select>
					<select value={status} onChange={(e) => setStatus(e.target.value as Status | "all")} aria-label="Status" className={select}>
						<option value="all">Any status</option>
						{(Object.keys(STATUS_LABEL) as Status[]).map((k) => (
							<option key={k} value={k}>
								{STATUS_LABEL[k]}
							</option>
						))}
					</select>
					<select value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Team member" className={select}>
						<option value="all">Anyone</option>
						{people.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						aria-label="Search studies"
						placeholder="Study, client or code"
						className="rr-input max-w-[240px] flex-1"
					/>
				</div>

				<div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
					<table className="w-full min-w-[820px] border-collapse text-[15px]">
						<thead>
							<tr className="border-b border-[var(--color-border)] text-left text-[13px] text-[var(--color-ink-muted)]">
								<th className="px-5 py-3 font-semibold">Study</th>
								<th className="px-3 py-3 font-semibold">Study type</th>
								<th className="px-3 py-3 font-semibold">Client</th>
								<th className="px-3 py-3 font-semibold">Team</th>
								<th className="px-3 py-3 font-semibold">Where it stands</th>
								<th className="px-5 py-3 font-semibold">Due</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((s) => {
								const m = methodEntry(s.method.id);
								const st = statusOf(s);
								const team = s.team.filter((t) => t.role !== "method_owner");
								return (
									<tr key={s.id} className="border-b border-[var(--color-border)] align-top last:border-b-0 hover:bg-[var(--color-hover)]">
										<td className="px-5 py-3.5">
											<Link href={`/studies/${s.id}`} className="font-semibold text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
												{s.title}
											</Link>
											<div className="font-mono text-[12px] text-[var(--color-ink-muted)]">{s.id}</div>
										</td>
										<td className="px-3 py-3.5">
											<div className="flex flex-wrap items-center gap-2">
												{m?.name ?? s.method.id}
												<FamilyPill family={s.family} />
											</div>
											{s.method.version && <div className="text-[13px] text-[var(--color-ink-muted)]">method v{s.method.version}</div>}
										</td>
										<td className="px-3 py-3.5">{s.client}</td>
										<td className="px-3 py-3.5">
											<span className="flex flex-wrap gap-1">
												{team.map((t) => {
													const p = personById(t.person);
													return (
														<span
															key={t.person}
															title={`${p?.name}, ${t.role}`}
															className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-elevated)] text-[11px] font-bold text-[var(--color-ink-secondary)]"
														>
															<span className="sr-only">{p?.name}</span>
															<span aria-hidden>{p?.initials}</span>
														</span>
													);
												})}
											</span>
										</td>
										<td className="px-3 py-3.5">
											{st === "in_progress" ? (
												<span className="text-sm">{phaseLabelForCard(s)}</span>
											) : (
												<span
													className={cn(
														"rounded-[var(--radius-xl)] px-2.5 py-0.5 text-xs font-semibold",
														st === "delivered" ? "bg-[var(--color-positive-bg)] text-[var(--color-positive)]" : "bg-[var(--color-elevated)] text-[var(--color-ink-muted)]",
													)}
												>
													{STATUS_LABEL[st]}
												</span>
											)}
										</td>
										<td className="whitespace-nowrap px-5 py-3.5 text-sm">{dueDate(s.due)}</td>
									</tr>
								);
							})}
							{rows.length === 0 && (
								<tr>
									<td colSpan={6} className="px-5 py-6 text-[var(--color-ink-muted)]">
										No study matches these filters.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<p className="m-0 text-sm text-[var(--color-ink-muted)]">
					{filtered ? `${plural(rows.length, "study", "studies")} of ${studies.length}.` : `${plural(studies.length, "study", "studies")}.`} Open one to see its
					steps, notes and files.
				</p>
			</div>
		</>
	);
}
