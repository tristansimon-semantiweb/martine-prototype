"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

// A small panel anchored under its trigger, for choosing (a document, a
// tool): it opens over the content instead of pushing it down. Closes on a
// click outside or Escape.
export function Popover({
	trigger,
	children,
	align = "start",
	width = 340,
}: {
	trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
	children: (close: () => void) => React.ReactNode;
	align?: "start" | "end";
	width?: number;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				setOpen(false);
			}
		};
		window.addEventListener("mousedown", onDown);
		ref.current?.addEventListener("keydown", onKey);
		const node = ref.current;
		return () => {
			window.removeEventListener("mousedown", onDown);
			node?.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<div ref={ref} className="relative inline-block">
			{trigger({ open, toggle: () => setOpen((v) => !v) })}
			{open && (
				<div
					role="dialog"
					className={cn(
						"absolute top-full mt-1.5 max-w-[calc(100vw-2rem)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-md)]",
						align === "end" ? "right-0" : "left-0",
					)}
					style={{ width, zIndex: "var(--z-dropdown)" }}
				>
					{children(() => setOpen(false))}
				</div>
			)}
		</div>
	);
}
