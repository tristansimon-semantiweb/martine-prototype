"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Portal } from "./Portal";
import { cn } from "@/shared/lib/cn";

export function Modal({
	open,
	onClose,
	title,
	wide,
	children,
}: {
	open: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	wide?: boolean;
	children: React.ReactNode;
}) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<Portal>
			<div
				className="fixed inset-0 flex items-center justify-center p-4"
				style={{ zIndex: "var(--z-modal)" }}
			>
				<div
					onClick={onClose}
					className="animate-overlay-in absolute inset-0 bg-[var(--overlay-modal)]"
					aria-hidden
				/>
				<div
					role="dialog"
					aria-modal="true"
					className={cn(
						"animate-modal-in relative flex max-h-[90vh] w-full flex-col rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]",
						wide ? "max-w-2xl" : "max-w-md",
					)}
				>
					<header className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
						{title && <h3>{title}</h3>}
						<button
							onClick={onClose}
							className="rounded-[var(--radius-sm)] p-1 text-[var(--color-ink-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]"
							aria-label="Close"
						>
							<X size={18} />
						</button>
					</header>
					<div className="overflow-y-auto px-5 py-4">{children}</div>
				</div>
			</div>
		</Portal>
	);
}
