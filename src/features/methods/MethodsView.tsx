"use client";

import { useState } from "react";
import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { FamilyPill } from "@/shared/components/ui/Family";
import { useToast } from "@/shared/components/ui/Toast";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodsIndex } from "@/shared/lib/data";
import { plural } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import type { Family } from "@/shared/lib/types";

const FAMILIES: (Family | "All")[] = ["All", "SML", "Monitoring", "Trends"];

// One row per method: counts come from the method files. A 0 in Skills is
// highlighted: that is where a skill would save the most time.
export function MethodsView() {
	const { suggestions, drafts } = useMartine();
	const toast = useToast();
	const [family, setFamily] = useState<Family | "All">("All");
	const [query, setQuery] = useState("");

	const rows = methodsIndex
		.filter((m) => family === "All" || m.family === family)
		.filter((m) => !query.trim() || m.name.toLowerCase().includes(query.trim().toLowerCase()));

	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Methods</div>
				<div className="text-sm text-[var(--color-ink-muted)]">One method per study type; every new study starts from one</div>
			</TopBand>
			<div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-6 py-7">
				<div className="flex flex-wrap items-center gap-3">
					<div role="group" aria-label="Family" className="flex flex-wrap gap-1">
						{FAMILIES.map((f) => (
							<button
								key={f}
								onClick={() => setFamily(f)}
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
						aria-label="Search methods"
						placeholder="Search methods"
						className="rr-input max-w-[260px] flex-1"
					/>
					<button
						onClick={() => toast("A new method starts from its method file: importing is not in the prototype")}
						className="ml-auto rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
					>
						New method
					</button>
				</div>

				<div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
					<table className="w-full min-w-[720px] border-collapse text-[15px]">
						<thead>
							<tr className="border-b border-[var(--color-border)] text-left text-[13px] text-[var(--color-ink-muted)]">
								<th className="px-5 py-3 font-semibold">Method</th>
								<th className="px-3 py-3 font-semibold">Owner</th>
								<th className="px-3 py-3 text-right font-semibold">Phases</th>
								<th className="px-3 py-3 text-right font-semibold">Tasks</th>
								<th className="px-3 py-3 text-right font-semibold">Skills</th>
								<th className="px-5 py-3 font-semibold">Status</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((m) => {
								const pending = suggestions.filter((s) => s.method === m.id && s.status === "pending").length;
								const draft = drafts[m.id];
								const imported = m.status === "published";
								return (
									<tr key={m.id} className="border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-hover)]">
										<td className="px-5 py-3.5">
											<div className="flex flex-wrap items-center gap-2">
												<Link href={`/methods/${m.id}`} className="font-semibold text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
													{m.name}
												</Link>
												<FamilyPill family={m.family} />
											</div>
										</td>
										<td className={cn("px-3 py-3.5", !m.owner && "text-[var(--color-ink-muted)]")}>{m.owner ?? "To name"}</td>
										<td className="px-3 py-3.5 text-right">{imported ? m.phases : ""}</td>
										<td className="px-3 py-3.5 text-right">{imported ? m.tasks : ""}</td>
										<td className="px-3 py-3.5 text-right">
											{imported &&
												(m.skills === 0 ? (
													<span className="rounded-[var(--radius-sm)] bg-[var(--color-attention-bg)] px-2 py-0.5 font-semibold text-[var(--color-attention)]">0</span>
												) : (
													m.skills
												))}
										</td>
										<td className="px-5 py-3.5">
											{imported ? (
												<span className="flex flex-wrap items-center gap-2">
													v{m.version}
													{pending > 0 && (
														<span className="rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
															{plural(pending, "suggestion")}
														</span>
													)}
													{draft?.saved && <span className="text-sm text-[var(--color-ink-muted)]">draft v{draft.version}</span>}
												</span>
											) : (
												<span className="text-[var(--color-ink-muted)]">To document</span>
											)}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
				<p className="m-0 text-sm text-[var(--color-ink-muted)]">
					Phases, tasks and skills come from the method files. A 0 in Skills shows where a skill would save the most time.
				</p>
			</div>
		</>
	);
}
