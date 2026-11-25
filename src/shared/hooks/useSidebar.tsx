"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";

// Ported from R&R: the sidebar folds to an icon rail on desktop, and the
// choice is kept in this browser. Martine opens it expanded by default. On
// small screens it is an off-canvas drawer, always expanded.
const KEY = "martine_sidebar_collapsed";

interface SidebarCtx {
	collapsed: boolean;
	toggle: () => void;
	mobileOpen: boolean;
	setMobileOpen: (v: boolean) => void;
}

const Ctx = createContext<SidebarCtx>({ collapsed: false, toggle: () => {}, mobileOpen: false, setMobileOpen: () => {} });

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
	listeners.add(l);
	return () => listeners.delete(l);
};
let state: boolean | null = null;
const read = () => {
	if (state === null) {
		try {
			state = localStorage.getItem(KEY) === "1";
		} catch {
			state = false;
		}
	}
	return state;
};
const write = (v: boolean) => {
	state = v;
	try {
		localStorage.setItem(KEY, v ? "1" : "0");
	} catch {
		// Storage blocked: the rail still folds, until the next reload.
	}
	listeners.forEach((l) => l());
};

export function SidebarProvider({ children }: { children: React.ReactNode }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const collapsed = useSyncExternalStore(subscribe, read, () => false);
	const toggle = () => write(!collapsed);
	return <Ctx.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>{children}</Ctx.Provider>;
}

export const useSidebar = () => useContext(Ctx);
