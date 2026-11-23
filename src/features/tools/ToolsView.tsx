"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { useMartine } from "@/shared/hooks/useMartine";
import { catalog } from "@/shared/lib/data";
import { plural } from "@/shared/lib/format";
import { TOOL_KINDS } from "@/shared/lib/tools";
import { cn } from "@/shared/lib/cn";
import { toolUsage } from "./toolUsage";

// The tool repository: the applications people work in, and how many study
// types and steps use each. One source for the tools a step links to.
export function ToolsView() {
	const { drafts } = useMartine();
	const [kind, setKind] = useState("All");
	const [query, setQuery] = useState("");
	const q = query.trim().toLowerCase();

	const rows = catalog.tools
		.filter((t) => kind === "All" || t.kind === kind)
		.filter((t) => !q || `${t.label} ${t.kind}`.toLowerCase().includes(q))
		.map((t) => {
			const uses = toolUsage(t.id, drafts);
			return { t, steps: uses.length, types: new Set(uses.map((u) => u.methodId)).size };
		})
		.sort((a, b) => b.steps - a.steps);

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Tools</div>
				<div className="text-sm text-[var(--color-ink-muted)]">The applications we work in, and the steps of each study type that use them</div>
			</TopBand>
			<div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-6 py-7">
				<div className="flex flex-wrap items-center gap-3">
					<div role="group" aria-label="Kind of tool" className="flex flex-wrap gap-1">
						{["All", ...TOOL_KINDS].map((k) => (
							<button
								key={k}
								onClick={() => setKind(k)}
								aria-pressed={kind === k}
								className={cn(
									"rounded-[var(--radius-sm)] px-3 py-1 text-[15px] font-semibold",
									kind === k ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "hover:bg-[var(--color-hover)]",
								)}
							>
								{k}
							</button>
						))}
					</div>
					<input
						type="search"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						aria-label="Search tools"
						placeholder="Search tools"
						className="rr-input max-w-[240px] flex-1"
					/>
				</div>

				<div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
					<table className="w-full min-w-[640px] border-collapse text-[15px]">
						<thead>
							<tr className="border-b border-[var(--color-border)] text-left text-[13px] text-[var(--color-ink-muted)]">
								<th className="px-5 py-3 font-semibold">Tool</th>
								<th className="px-3 py-3 font-semibold">Kind</th>
								<th className="px-3 py-3 font-semibold">Claude connector</th>
								<th className="px-5 py-3 font-semibold">Used in</th>
							</tr>
						</thead>
						<tbody>
							{rows.map(({ t, steps, types }) => (
								<tr key={t.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-hover)]">
									<td className="px-5 py-3">
										<Link href={`/tools/${t.id}`} className="font-semibold text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
											{t.label}
										</Link>
									</td>
									<td className="px-3 py-3 text-[var(--color-ink-secondary)]">{t.kind}</td>
									<td className="px-3 py-3">
										{t.claude_connector === null ? (
											<span className="text-[var(--color-ink-muted)]">[to check]</span>
										) : t.claude_connector ? (
											"Yes"
										) : (
											"No"
										)}
									</td>
									<td className={cn("px-5 py-3", steps === 0 && "text-[var(--color-ink-muted)]")}>
										{steps === 0 ? "No step yet" : `${plural(steps, "step")} in ${plural(types, "study type")}`}
									</td>
								</tr>
							))}
							{rows.length === 0 && (
								<tr>
									<td colSpan={4} className="px-5 py-6 text-[var(--color-ink-muted)]">
										No tool matches.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
				<p className="m-0 text-sm text-[var(--color-ink-muted)]">
					Steps are linked to tools from the method files; a study type’s owner links or unlinks them in the method.
				</p>
			</div>
		</>
	);
}
