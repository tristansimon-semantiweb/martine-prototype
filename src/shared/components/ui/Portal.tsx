"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

// Renders children into document.body so fixed-position overlays escape any
// ancestor with a transform (e.g. the page-in animation), which would
// otherwise become their containing block and trap them mid-page.
export function Portal({ children }: { children: React.ReactNode }) {
	// false on the server and during hydration, true in the browser after.
	const mounted = useSyncExternalStore(noop, () => true, () => false);
	if (!mounted) return null;
	return createPortal(children, document.body);
}

const noop = () => () => {};
