"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { askScripts } from "@/shared/lib/data";
import type { AskScript } from "@/shared/lib/types";

// Ported from R&R's ChatDrawerProvider and useAskAi, reduced to what Martine
// needs: one drawer, one conversation per scope, scripted answers only (no
// model call). The scope is the study in view, or all studies elsewhere.

export interface Turn {
	id: string;
	question: string;
	script: AskScript | null;
	thinking: boolean;
}

// "/studies/TR-2611-01/steps" → "TR-2611-01"; anything else → null (all studies).
export function studyFromPath(pathname: string): string | null {
	const m = pathname.match(/^\/studies\/([^/]+)/);
	return m && m[1] !== "new" ? decodeURIComponent(m[1]) : null;
}

function matchScript(question: string, study: string | null): AskScript | null {
	const q = question.toLowerCase();
	const pool = askScripts.filter((s) => (study ? s.scope === "study" && s.study === study : s.scope === "all"));
	let best: { script: AskScript; hits: number } | null = null;
	for (const s of pool) {
		const hits = s.keywords.filter((k) => q.includes(k.toLowerCase())).length;
		if (hits > 0 && (!best || hits > best.hits)) best = { script: s, hits };
	}
	return best?.script ?? null;
}

export function suggestionsFor(study: string | null): AskScript[] {
	return askScripts.filter((s) => (study ? s.scope === "study" && s.study === study : s.scope === "all"));
}

function useAskMartineState() {
	const pathname = usePathname();
	const scope = studyFromPath(pathname);
	const key = scope ?? "all";
	const [open, setOpen] = useState(false);
	const [threads, setThreads] = useState<Record<string, Turn[]>>({});

	const turns = threads[key] ?? [];

	const ask = useCallback(
		(question: string) => {
			const q = question.trim();
			if (!q) return;
			const id = crypto.randomUUID();
			setThreads((t) => ({ ...t, [key]: [...(t[key] ?? []), { id, question: q, script: null, thinking: true }] }));
			// A short pause so the answer doesn't flash in (as in R&R).
			window.setTimeout(() => {
				const script = matchScript(q, scope);
				setThreads((t) => ({
					...t,
					[key]: (t[key] ?? []).map((x) => (x.id === id ? { ...x, script, thinking: false } : x)),
				}));
			}, 550);
		},
		[key, scope],
	);

	const newConversation = useCallback(() => setThreads((t) => ({ ...t, [key]: [] })), [key]);
	const openChat = useCallback(() => setOpen(true), []);
	const closeChat = useCallback(() => setOpen(false), []);

	// ⌘K / Ctrl+K opens Ask Martine from anywhere, as Ask AI in R&R.
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
				e.preventDefault();
				setOpen((v) => !v);
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);

	return { open, openChat, closeChat, scope, turns, ask, newConversation };
}

type Value = ReturnType<typeof useAskMartineState>;
const Ctx = createContext<Value | null>(null);

export function AskMartineProvider({ children }: { children: React.ReactNode }) {
	const value = useAskMartineState();
	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAskMartine(): Value {
	const ctx = useContext(Ctx);
	if (!ctx) throw new Error("useAskMartine must be used within AskMartineProvider");
	return ctx;
}
