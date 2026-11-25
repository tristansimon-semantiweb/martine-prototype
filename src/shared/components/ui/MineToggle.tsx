"use client";

import { cn } from "@/shared/lib/cn";

// "All … / Mine", with the count of each: the way back to your own work.
// Opens the filter row of Studies and Study types.
export function MineToggle({ mine, onChange, all, minecount, allLabel, label }: { mine: boolean; onChange: (mine: boolean) => void; all: number; minecount: number; allLabel: string; label: string }) {
	return (
		<div role="group" aria-label={label} className="flex rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5">
			{[
				{ on: false, text: allLabel, n: all },
				{ on: true, text: "Mine", n: minecount },
			].map((o) => (
				<button
					key={o.text}
					onClick={() => onChange(o.on)}
					aria-pressed={mine === o.on}
					className={cn(
						"flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1 text-[15px] font-semibold",
						mine === o.on ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]",
					)}
				>
					{o.text}
					<span className="text-[12px] font-normal text-[var(--color-ink-muted)]">{o.n}</span>
				</button>
			))}
		</div>
	);
}
