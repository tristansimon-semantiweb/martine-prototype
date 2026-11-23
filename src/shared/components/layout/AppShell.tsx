"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SidebarProvider, useSidebar } from "@/shared/hooks/useSidebar";
import { MartineProvider } from "@/shared/hooks/useMartine";
import { ToastProvider } from "@/shared/components/ui/Toast";
import { AskMartineProvider } from "@/features/ask-martine/AskMartineProvider";
import { ChatDrawer } from "@/features/ask-martine/ChatDrawer";
import { Sidebar } from "./Sidebar";
import { AskMartineButton } from "./AskMartineButton";

// Adapted from R&R's AppShell: the sidebar on the left, the page on the right,
// Ask Martine floating on top. No auth, no filters, no banner: each page draws
// its own top band (TopBand).
export function AppShell({ children }: { children: React.ReactNode }) {
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

	// Close the mobile menu whenever the route changes.
	useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

	return (
		<div className="flex h-screen overflow-hidden bg-[var(--color-canvas)]">
			<Sidebar />
			<main className="min-w-0 flex-1 overflow-y-auto [scrollbar-gutter:stable]">
				<div key={pathname} className="animate-page-in min-h-full pb-32">
					{children}
				</div>
			</main>
			<AskMartineButton />
		</div>
	);
}
