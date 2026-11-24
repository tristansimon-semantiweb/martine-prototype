"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Portal } from "./Portal";

// Ported from R&R. Martine's drawers (a phase, the catalog) need their own
// header and a pinned footer, and render in a portal so the page-in animation
// can't trap them. `level` stacks the catalog above the phase drawer.
export function Sheet({
	open,
	onClose,
	title,
	header,
	footer,
	width = 480,
	level = 0,
	label,
	children,
}: {
	open: boolean;
	onClose: () => void;
	title?: React.ReactNode;
	header?: React.ReactNode; // replaces the default title row
	footer?: React.ReactNode;
	width?: number;
	level?: number;
	label: string;
	children: React.ReactNode;
}) {
	useEffect(() => {
		if (!open) return;
		// Escape closes the top sheet only (a task's detail over its phase).
		const onKey = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			const open = [...document.querySelectorAll<HTMLElement>("aside[data-sheet-level][aria-hidden='false']")].map((el) => Number(el.dataset.sheetLevel));
			if (level >= Math.max(level, ...open)) onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose, level]);

	const z = `calc(var(--z-drawer) + ${level * 2})`;

	return (
		<Portal>
			<div
				onClick={onClose}
				className={cn(
					"fixed inset-0 bg-[rgba(45,41,38,0.32)] transition-opacity duration-200",
					open ? "opacity-100" : "pointer-events-none opacity-0",
				)}
				style={{ zIndex: z }}
				aria-hidden
			/>
			<aside
				role="dialog"
				aria-modal="true"
				aria-label={label}
				aria-hidden={!open}
				data-sheet-level={level}
				inert={!open}
				className={cn(
					"fixed inset-y-0 right-0 flex max-w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)] transition-transform duration-300 [transition-timing-function:var(--ease-smooth)]",
					open ? "translate-x-0" : "translate-x-full",
				)}
				style={{ zIndex: z, width }}
			>
				<header className="flex items-start justify-between gap-3 px-8 pb-2 pt-7">
					<div className="min-w-0 flex-1">{header ?? (title && <h2 className="truncate">{title}</h2>)}</div>
					<button
						onClick={onClose}
						className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--color-border-hover)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</header>
				<div className="flex-1 overflow-y-auto px-8 pb-6 pt-4">{children}</div>
				{footer && <footer className="border-t border-[var(--color-border)] px-8 py-4">{footer}</footer>}
			</aside>
		</Portal>
	);
}
