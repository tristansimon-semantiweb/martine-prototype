import { cn } from "@/shared/lib/cn";

type Tone = "neutral" | "accent" | "positive" | "negative" | "warm" | "high" | "medium" | "low";

const toneStyles: Record<Tone, string> = {
	neutral: "bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]",
	accent: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]",
	positive: "bg-[var(--color-positive-bg)] text-[var(--color-positive)]",
	negative: "bg-[var(--color-negative-bg)] text-[var(--color-negative)]",
	warm: "bg-[var(--color-accent-warm-dim)] text-[var(--color-accent-warm)]",
	high: "bg-[var(--color-negative-bg)] text-[var(--color-error)]",
	medium: "bg-[var(--color-accent-warm-dim)] text-[var(--color-accent-warm)]",
	low: "bg-[var(--color-elevated)] text-[var(--color-ink-muted)]",
};

export function Badge({
	tone = "neutral",
	className,
	children,
}: {
	tone?: Tone;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-0.5 text-2xs font-semibold uppercase tracking-[0.04em] leading-relaxed",
				toneStyles[tone],
				className,
			)}
		>
			{children}
		</span>
	);
}
