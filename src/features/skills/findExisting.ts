// Before a request goes to the tech team, Claude looks for something that
// already does it: a skill, an automation, or a request in progress. In the
// product this is a Claude skill reading the catalog; in the prototype the
// answer is scripted, by matching the words of the request with the skills'
// names and descriptions: a word of the name counts double, a word of the
// description or the id once, and it takes 2 to be shown.
import { allSkills } from "@/shared/lib/data";
import type { CatalogSkill } from "@/shared/lib/types";

const STOP = new Set(
	"the and for with from into each per what that this then than they them their there step task tasks claude data file make made need needs want should would could when where which while also only like over under about after before your our you are can will been have has review read spot check prepare preparing build building write writes existing client market markets".split(
		" ",
	),
);
// Words analysts use for the same thing.
const SAME: Record<string, string> = { pollution: "noise", polluted: "noise", depollute: "noise", noisy: "noise", cleaning: "clean", queries: "query", facet: "facets" };

const stem = (w: string) => (SAME[w] ?? w).replace(/ies$/, "y").replace(/s$/, "").slice(0, 6);
const words = (t: string) => [...new Set((t.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((w) => !STOP.has(w)).map(stem))];

export interface Found {
	skill: CatalogSkill;
	why: string[]; // the words they share
}

export function findExisting(need: string, exclude?: string): Found[] {
	const asked = words(need);
	// Each stem back to the word as the analyst wrote it, to show it.
	const asWritten = new Map<string, string>();
	for (const w of need.toLowerCase().match(/[a-z]{4,}/g) ?? []) if (!asWritten.has(stem(w))) asWritten.set(stem(w), w);
	return allSkills()
		.filter((s) => s.status !== "deprecated" && s.id !== exclude)
		.map((s) => {
			const name = words(s.label);
			const does = words(`${s.does} ${s.produces ?? ""} ${s.id.replace(/-/g, " ")}`);
			const shared = asked.filter((w) => name.includes(w) || does.includes(w));
			const score = shared.reduce((n, w) => n + (name.includes(w) ? 2 : 1), 0);
			return { skill: s, why: shared.map((w) => asWritten.get(w) ?? w), score };
		})
		.filter((x) => x.score >= 2)
		.sort((a, b) => b.score - a.score)
		.slice(0, 3)
		.map(({ skill, why }) => ({ skill, why }));
}
