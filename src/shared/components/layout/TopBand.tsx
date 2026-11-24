"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Menu, RotateCcw } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { HeaderActions } from "./AskMartineButton";
import { useSidebar } from "@/shared/hooks/useSidebar";
import { useMartine } from "@/shared/hooks/useMartine";
import { personById } from "@/shared/lib/data";
import type { RoleId } from "@/shared/lib/types";

export const ROLE_LABEL: Record<RoleId, string> = {
	analyst: "Analyst",
	consultant: "Consultant",
	method_owner: "Method owner",
	skills_owner: "Skills owner",
};

const ROLES: { role: RoleId; person: string }[] = [
	{ role: "analyst", person: "marie" },
	{ role: "consultant", person: "claire" },
	{ role: "method_owner", person: "bamby" },
	{ role: "skills_owner", person: "fabien" },
];

// The white 88 px band at the top of every page, lined up with the sidebar's
// logo band (same height token as R&R's banner). The page puts its title in
// it; What's new and the account menu sit on the right.
export function TopBand({ children }: { children?: React.ReactNode }) {
	const { setMobileOpen } = useSidebar();
	return (
		<header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
			<div className="mx-auto flex min-h-[var(--band-h)] max-w-[1120px] flex-wrap items-center gap-4 px-6 py-3">
				<button
					onClick={() => setMobileOpen(true)}
					aria-label="Open the menu"
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)] md:hidden"
				>
					<Menu size={18} />
				</button>
				<div className="min-w-0 flex-1 leading-tight">{children}</div>
				<HeaderActions />
				<AccountMenu />
			</div>
		</header>
	);
}

// Switching role is how the demo shows what the consultant and the method
// owner can do (brief, §8). The reset puts the seeded demo data back.
function AccountMenu() {
	const { role, me, setRole, reset } = useMartine();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const person = personById(me);

	useEffect(() => {
		if (!open) return;
		const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		window.addEventListener("mousedown", onDown);
		window.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("mousedown", onDown);
			window.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<div ref={ref} className="relative shrink-0">
			<button
				onClick={() => setOpen((v) => !v)}
				aria-label={`${person?.name}’s account, ${ROLE_LABEL[role].toLowerCase()}`}
				aria-expanded={open}
				className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-bold text-white hover:opacity-90"
			>
				{person?.initials}
			</button>
			{open && (
				<div
					className="absolute right-0 top-11 w-72 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-md)]"
					style={{ zIndex: "var(--z-dropdown)" }}
				>
					<div className="px-2.5 pb-1.5 pt-1 text-xs font-bold text-[var(--color-ink-muted)]">View the prototype as</div>
					{ROLES.map((r) => {
						const p = personById(r.person);
						const active = r.role === role;
						return (
							<button
								key={r.role}
								onClick={() => {
									setRole(r.role);
									setOpen(false);
								}}
								className={cn(
									"flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm hover:bg-[var(--color-hover)]",
									active && "font-semibold text-[var(--color-accent)]",
								)}
							>
								<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-elevated)] text-[11px] font-bold text-[var(--color-ink-secondary)]">
									{p?.initials}
								</span>
								<span className="flex-1">
									{p?.name}, {ROLE_LABEL[r.role].toLowerCase()}
								</span>
								{active && <Check size={15} />}
							</button>
						);
					})}
					<div className="my-1.5 border-t border-[var(--color-border)]" />
					<button
						onClick={() => {
							reset();
							setOpen(false);
						}}
						className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)]"
					>
						<RotateCcw size={15} /> Reset the demo data
					</button>
				</div>
			)}
		</div>
	);
}
