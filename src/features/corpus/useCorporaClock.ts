"use client";

import { useEffect, useState } from "react";
import { processing } from "@/shared/lib/corpus";
import type { Corpus } from "@/shared/lib/types";

// The time, refreshed while a corpus is processing, so its stage moves on
// its own. Still when nothing runs.
export function useCorporaClock(corpora: Corpus[]): number {
	const [now, setNow] = useState(0);
	const last = Math.max(0, ...corpora.map((c) => c.processingSince ?? 0));
	useEffect(() => {
		const tick = () => setNow(Date.now());
		const left = last + processing.demoSeconds * 1000 - Date.now();
		const first = setTimeout(tick, 0);
		if (left <= 0) return () => clearTimeout(first);
		const t = setInterval(tick, 500);
		const stop = setTimeout(() => clearInterval(t), left + 600);
		return () => {
			clearTimeout(first);
			clearInterval(t);
			clearTimeout(stop);
		};
	}, [last]);
	return now;
}
