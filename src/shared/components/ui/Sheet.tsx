"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Sheet({
	open,
	onClose,
	title,
	subtitle,
	width = 480,
	children,
}: {
	open: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	subtitle?: React.ReactNode;
	width?: number;
	children: React.ReactNode;
}) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	return (
		<>
			<div
				onClick={onClose}
				className={cn(
					"fixed inset-0 bg-[var(--overlay-modal)] transition-opacity duration-200",
					open ? "opacity-100" : "pointer-events-none opacity-0",
				)}
				style={{ zIndex: "var(--z-drawer)" }}
				aria-hidden
			/>
			<aside
				role="dialog"
				aria-modal="true"
				className={cn(
					"fixed inset-y-0 right-0 flex max-w-full flex-col bg-[var(--color-surface)] shadow-[var(--shadow-lg)] transition-transform duration-300 [transition-timing-function:var(--ease-smooth)]",
					open ? "translate-x-0" : "translate-x-full",
				)}
				style={{ zIndex: "var(--z-drawer)", width }}
			>
				<header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
					<div className="min-w-0">
						{title && <h3 className="truncate">{title}</h3>}
						{subtitle && (
							<p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{subtitle}</p>
						)}
					</div>
					<button
						onClick={onClose}
						className="rounded-[var(--radius-sm)] p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</header>
				<div className="flex-1 overflow-y-auto">{children}</div>
			</aside>
		</>
	);
}
