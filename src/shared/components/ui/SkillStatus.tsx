import { cn } from "@/shared/lib/cn";
import type { SkillStatus } from "@/shared/lib/types";

const STATUS: Record<SkillStatus, { label: string; cls: string }> = {
	validated: { label: "Validated", cls: "bg-[var(--color-positive-bg)] text-[var(--color-positive)]" },
	experimental: { label: "Experimental", cls: "bg-[var(--color-attention-bg)] text-[var(--color-attention)]" },
	deprecated: { label: "Deprecated", cls: "bg-[var(--color-elevated)] text-[var(--color-ink-muted)]" },
};

// A skill's status in the catalog; a skill without one says so.
export function SkillStatusBadge({ status }: { status: SkillStatus | null }) {
	if (!status) return <span className="whitespace-nowrap text-xs text-[var(--color-ink-muted)]">[status to set]</span>;
	return <span className={cn("whitespace-nowrap rounded-[var(--radius-xl)] px-2 py-0.5 text-xs font-semibold", STATUS[status].cls)}>{STATUS[status].label}</span>;
}
