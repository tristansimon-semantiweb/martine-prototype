"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { TopBand } from "@/shared/components/layout/TopBand";
import { FamilyPill } from "@/shared/components/ui/Family";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, methodsIndex, people, personById } from "@/shared/lib/data";
import { dueDate, plural } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import type { Family, Study } from "@/shared/lib/types";

type Status = "in_progress" | "not_started" | "delivered";
const STATUS_LABEL: Record<Status, string> = { in_progress: "In progress", not_started: "Not started", delivered: "Delivered" };
const STATUS_STYLE: Record<Status, string> = {
	in_progress: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
	not_started: "bg-[var(--color-elevated)] text-[var(--color-ink-muted)]",
	delivered: "bg-[var(--color-positive-bg)] text-[var(--color-positive)]",
};
const FAMILIES: (Family | "All")[] = ["All", "SML", "Monitoring", "Trends"];

// The study's status as recorded (V1 does not track progress task by task).
function statusOf(s: Study): Status {
	return s.status;
}

// The home page: every study, in one plain table, so anyone can find how a
// study of the same type (or for the same client) was run. Tags sit in their
// own columns; filters narrow by family, type, status and person.
// The study's lead: its consultant, who carries the client relationship.
const lead = (s: Study) => {
	const c = s.team.find((m) => m.role === "consultant");
	return c ? personById(c.person)?.name : undefined;
};

export function StudiesView() {
	const { studies } = useMartine();
	const [family, setFamily] = useState<Family | "All">("All");
	const [type, setType] = useState("all");
	const [status, setStatus] = useState<Status | "all">("all");
	const [person, setPerson] = useState("all");
	const [client, setClient] = useState("all");
	const [query, setQuery] = useState("");

	const q = query.trim().toLowerCase();
	const rows = studies
		.filter((s) => family === "All" || s.family === family)
		.filter((s) => type === "all" || s.method.id === type)
		.filter((s) => status === "all" || statusOf(s) === status)
		.filter((s) => person === "all" || s.team.some((m) => m.person === person))
		.filter((s) => client === "all" || s.client === client)
		.filter((s) => !q || `${s.title} ${s.client} ${s.id}`.toLowerCase().includes(q))
		.sort((a, b) => b.due.localeCompare(a.due));

	const clients = [...new Set(studies.map((s) => s.client))].sort((a, b) => a.localeCompare(b));
	const types = methodsIndex.filter((m) => family === "All" || m.family === family);
	const select = "rr-input w-auto min-w-[130px] py-2";
	const th = "px-3 py-3 font-semibold";
	const td = "px-3 py-3";

	return (
		<>
			<TopBand>
				<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
					<div>
						<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Studies</div>
						<div className="text-sm text-[var(--color-ink-muted)]">Every study run in Martine</div>
					</div>
					<Link href="/studies/new" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white no-underline hover:opacity-90">
						<Plus size={15} aria-hidden /> New study
					</Link>
				</div>
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
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						aria-label="Search studies"
						placeholder="Study or client"
						className="rr-input ml-auto w-[240px]"
					/>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<select value={client} onChange={(e) => setClient(e.target.value)} aria-label="Client" className={select}>
						<option value="all">All clients</option>
						{clients.map((c) => (
							<option key={c} value={c}>
								{c}
							</option>
						))}
					</select>
					<select value={type} onChange={(e) => setType(e.target.value)} aria-label="Study type" className={cn(select, "max-w-[220px]")}>
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
				</div>

				<div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
					<table className="w-full min-w-[860px] border-collapse text-[15px]">
						<thead>
							<tr className="border-b border-[var(--color-border)] text-left text-[13px] text-[var(--color-ink-muted)]">
								<th className="px-5 py-3 font-semibold">Study</th>
								<th className={th}>Client</th>
								<th className={th}>Lead</th>
								<th className={th}>Study type</th>
								<th className={th}>Family</th>
								<th className={th}>Status</th>
								<th className="px-5 py-3 font-semibold">Due</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((s) => {
								const st = statusOf(s);
								return (
									<tr key={s.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-hover)]">
										<td className="px-5 py-3">
											<Link href={`/studies/${s.id}`} className="font-semibold text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
												{s.title}
											</Link>
										</td>
										<td className={td}>{s.client}</td>
										<td className={cn(td, "whitespace-nowrap")}>{lead(s) ?? <span className="text-[var(--color-ink-muted)]">[to name]</span>}</td>
										<td className={td}>{methodEntry(s.method.id)?.name ?? s.method.id}</td>
										<td className={td}>
											<FamilyPill family={s.family} />
										</td>
										<td className={td}>
											<span className={cn("whitespace-nowrap rounded-[var(--radius-xl)] px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[st])}>{STATUS_LABEL[st]}</span>
										</td>
										<td className="whitespace-nowrap px-5 py-3 text-sm">{dueDate(s.due)}</td>
									</tr>
								);
							})}
							{rows.length === 0 && (
								<tr>
									<td colSpan={7} className="px-5 py-6 text-[var(--color-ink-muted)]">
										No study matches these filters.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<p className="m-0 text-sm text-[var(--color-ink-muted)]">{plural(rows.length, "study", "studies")}. Open one to see its steps, notes and files.</p>
			</div>
		</>
	);
}
