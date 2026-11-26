"use client";

import { useEffect, useState } from "react";

// The time, refreshed while something runs (the corpus processing), so the
// stage moves on its own. Still when nothing runs.
export function useNow(running: boolean): number {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!running) return;
		const t = setInterval(() => setNow(Date.now()), 500);
		return () => clearInterval(t);
	}, [running]);
	return now;
}
