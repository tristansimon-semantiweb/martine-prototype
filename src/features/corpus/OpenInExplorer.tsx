"use client";

import { ExternalLink } from "lucide-react";
import { useToast } from "@/shared/components/ui/Toast";
import { cn } from "@/shared/lib/cn";
import type { Study } from "@/shared/lib/types";

// The Explorer is its own application: Martine opens it in a new tab, on the
// study (or one of its corpora) and, from a phase, on that phase. Its address stays out of the
// prototype, so here a click says where it would land.
export function OpenInExplorer({ study, corpus, phase, phaseName, variant = "primary" }: { study: Study; corpus?: string; phase?: string; phaseName?: string; variant?: "primary" | "outline" | "link" }) {
	const toast = useToast();
	return (
		<button
			onClick={() => toast(`Opens the Explorer in a new tab, on ${study.id}${corpus ? `, ${corpus}` : ""}${phase ? `, for phase ${phase}${phaseName ? `, ${phaseName}` : ""}` : ""}. Its address stays out of the prototype.`)}
			className={cn(
				"inline-flex shrink-0 items-center gap-1.5 font-semibold",
				variant === "primary" && "rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm text-white hover:opacity-90",
				variant === "outline" && "rounded-[var(--radius)] border border-[var(--color-accent)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] text-[var(--color-accent)] hover:bg-[var(--color-accent-dim)]",
				variant === "link" && "text-sm text-[var(--color-accent)]",
			)}
		>
			Open in Explorer <ExternalLink size={13} aria-hidden />
		</button>
	);
}
