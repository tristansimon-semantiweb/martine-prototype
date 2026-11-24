import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

// A secondary link at the corner of a card ("All the steps", "All files"):
// accent, with an arrow, underlined on hover, so it reads as a way to go further.
export function MoreLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
	return (
		<Link
			href={href}
			className={cn("group inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)] no-underline hover:underline", className)}
		>
			{children}
			<ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
		</Link>
	);
}
