"use client";

import { useMartine } from "./useMartine";
import { HELP_DOCS, helpFor, helpKey, type HelpDoc } from "@/shared/lib/help";
import type { MethodTask } from "@/shared/lib/types";

// The documentation library (data/help.json plus the guides added from
// Martine), and what applies to a task: the guides attached to it by hand,
// then the ones its tools, skills and text call for.
export function useHelp() {
	const { helpDocs, helpLinks, helpUrls } = useMartine();
	const all: HelpDoc[] = [...HELP_DOCS, ...(helpDocs ?? [])].map((d) => (helpUrls?.[d.id] ? { ...d, url: helpUrls[d.id] } : d));
	const linked = (methodId: string, taskKey: string) => (helpLinks?.[helpKey(methodId, taskKey)] ?? []).map((id) => all.find((d) => d.id === id)).filter((d): d is HelpDoc => Boolean(d));
	return {
		all,
		linked,
		forTask: (methodId: string, taskKey: string, task: MethodTask) =>
			helpFor(task, linked(methodId, taskKey)).map((d) => all.find((x) => x.id === d.id) ?? d),
		// How many tasks a guide was attached to by hand.
		linkCount: (docId: string) => Object.values(helpLinks ?? {}).filter((ids) => ids.includes(docId)).length,
	};
}
