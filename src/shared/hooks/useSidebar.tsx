"use client";

import { createContext, useContext, useState } from "react";

// Ported from R&R. Martine's sidebar stays expanded on desktop (as in the
// canvas), so only the off-canvas state on small screens is kept.
interface SidebarCtx {
	mobileOpen: boolean;
	setMobileOpen: (v: boolean) => void;
}

const Ctx = createContext<SidebarCtx>({ mobileOpen: false, setMobileOpen: () => {} });

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	return <Ctx.Provider value={{ mobileOpen, setMobileOpen }}>{children}</Ctx.Provider>;
}

export const useSidebar = () => useContext(Ctx);
