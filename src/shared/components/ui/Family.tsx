import { cn } from "@/shared/lib/cn";
import type { Family } from "@/shared/lib/types";

// Study families carry one color each: Trends green, Monitoring blue, SML plum.
const VAR: Record<Family, string> = { Trends: "trends", Monitoring: "monitoring", SML: "sml" };

export function FamilyDot({ family }: { family: Family }) {
	return (
		<span
			aria-hidden
			className="h-2 w-2 shrink-0 rounded-full"
			style={{ background: `var(--color-family-${VAR[family]})` }}
		/>
	);
}

export function FamilyPill({ family, className }: { family: Family; className?: string }) {
	return (
		<span
			className={cn("rounded-[var(--radius-xl)] px-2.5 py-0.5 text-xs font-semibold", className)}
			style={{ background: `var(--color-family-${VAR[family]}-bg)`, color: `var(--color-family-${VAR[family]})` }}
		>
			{family}
		</span>
	);
}
