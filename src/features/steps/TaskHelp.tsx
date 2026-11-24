"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { useToast } from "@/shared/components/ui/Toast";
import { helpFor } from "@/shared/lib/help";
import { otherToolItems } from "@/shared/lib/tools";
import type { MethodTask } from "@/shared/lib/types";

// What helps to do the task: the documentation that applies to its tools, its
// skills or its text, then any guide the method file names that the library
// does not have yet.
export function TaskHelp({ task }: { task: MethodTask }) {
	const toast = useToast();
	const docs = helpFor(task);
	const named = otherToolItems(task).guides.filter((g) => !docs.some((d) => d.title.toLowerCase() === g.toLowerCase()));
	if (!docs.length && !named.length) return null;
	return (
		<section aria-label="Documentation" className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-canvas)] px-4 py-3.5">
			<h3 className="m-0 flex items-center gap-2 font-[family-name:var(--font-body)] text-[14px] font-semibold">
				<BookOpen size={15} aria-hidden className="text-[var(--color-accent)]" /> Documentation
			</h3>
			<ul className="m-0 flex list-none flex-col gap-1 p-0">
				{docs.map((d) => (
					<li key={d.id}>
						<button
							onClick={() => toast(`Opens “${d.title}” in the internal documentation, in the real product`)}
							className="-mx-2 flex w-full items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[var(--color-hover)]"
						>
							<span className="min-w-0 flex-1">
								<span className="flex flex-wrap items-baseline gap-x-2">
									<span className="text-sm font-semibold text-[var(--color-accent)]">{d.title}</span>
									<span className="text-[12px] text-[var(--color-ink-muted)]">{d.kind}</span>
								</span>
								<span className="block text-[13px] text-[var(--color-ink-secondary)]">{d.about}</span>
							</span>
							<ExternalLink size={12} aria-hidden className="mt-1 shrink-0 text-[var(--color-ink-muted)]" />
						</button>
					</li>
				))}
				{named.map((g) => (
					<li key={g} className="px-0 py-1 text-sm text-[var(--color-ink-secondary)]">
						{g} <span className="text-[12px] text-[var(--color-ink-muted)]">named in the method, not in the documentation yet</span>
					</li>
				))}
			</ul>
		</section>
	);
}
