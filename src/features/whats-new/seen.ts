import { useSyncExternalStore } from "react";
import { whatsNew } from "@/shared/lib/data";

// Whether this browser has seen the latest What's new entry (a per-viewer
// convenience, kept in localStorage).
const KEY = "martine_whats_new_seen";
const latest = whatsNew[0]?.date ?? "";
const listeners = new Set<() => void>();

function seen(): string {
	try {
		return localStorage.getItem(KEY) ?? "";
	} catch {
		return "";
	}
}

export function markWhatsNewSeen() {
	try {
		localStorage.setItem(KEY, latest);
	} catch {}
	listeners.forEach((l) => l());
}

export function useHasNews(): boolean {
	return useSyncExternalStore(
		(l) => {
			listeners.add(l);
			return () => listeners.delete(l);
		},
		() => seen() < latest,
		() => false,
	);
}
