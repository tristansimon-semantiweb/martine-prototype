"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ScrollFoldContext } from "@/shared/hooks/useScrollFold";
import { SidebarProvider, useSidebar } from "@/shared/hooks/useSidebar";
import { MartineProvider } from "@/shared/hooks/useMartine";
import { ToastProvider } from "@/shared/components/ui/Toast";
import { AskMartineProvider } from "@/features/ask-martine/AskMartineProvider";
import { ChatDrawer } from "@/features/ask-martine/ChatDrawer";
import { Sidebar } from "./Sidebar";
import { AskMartineButton } from "./AskMartineButton";

// Adapted from R&R's AppShell: the sidebar on the left, the page on the right,
// Ask Martine floating on top. No filters, no banner (the access code is
// checked before any page, in src/proxy.ts): each page draws
// its own top band (TopBand).
export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	// The access code page renders on its own, without the app around it.
	if (pathname === "/access") return <>{children}</>;

	return (
		<SidebarProvider>
			<MartineProvider>
				<ToastProvider>
					<AskMartineProvider>
						<ShellBody>{children}</ShellBody>
						<ChatDrawer />
					</AskMartineProvider>
				</ToastProvider>
			</MartineProvider>
		</SidebarProvider>
	);
}

function ShellBody({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { setMobileOpen } = useSidebar();

	// The top band folds as you scroll down and comes back as you scroll up,
	// as in R&R. While it animates, the content's height changes and the browser
	// clamps scrollTop, which reads as the opposite direction: direction
	// detection is locked for the length of the transition to avoid a loop.
	// The page the band is folded on: another page opens with it unfolded.
	const [foldedOn, setFoldedOn] = useState<string | null>(null);
	const folded = foldedOn === pathname;
	const last = useRef(0);
	const lock = useRef(false);
	const onScroll = (e: React.UIEvent<HTMLElement>) => {
		const y = e.currentTarget.scrollTop;
		const prev = last.current;
		last.current = y;
		if (lock.current) return;
		let next: boolean | null = null;
		if (y <= 8) next = false;
		else if (y > prev + 6) next = true;
		else if (y < prev - 6) next = false;
		if (next !== null && next !== folded) {
			setFoldedOn(next ? pathname : null);
			lock.current = true;
			window.setTimeout(() => (lock.current = false), 650);
		}
	};

	// Close the mobile menu whenever the route changes.
	useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

	return (
		<div className="flex h-screen overflow-hidden bg-[var(--color-canvas)]">
			<Sidebar />
			<main onScroll={onScroll} className="min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
				<ScrollFoldContext.Provider value={folded}>
					<div key={pathname} className="animate-page-in min-h-full pb-32">
						{children}
					</div>
				</ScrollFoldContext.Provider>
			</main>
			<AskMartineButton />
		</div>
	);
}
