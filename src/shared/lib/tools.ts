// The tool repository (data/catalog.json, "tools") and how tasks use it.
import { catalog } from "./data";
import type { CatalogTool, MethodTask } from "./types";

export function toolById(id: string): CatalogTool | undefined {
	return catalog.tools.find((t) => t.id === id);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MATCHERS = catalog.tools.map((t) => (t.aliases ?? [`\\b${escape(t.label)}\\b`]).map((a) => new RegExp(a)));

// The method files' Tools column names more than tools: documents ("Queries
// tab", "Deck"), guides and libraries ("facet library"), sources and channels
// ("TikTok", "Email"). Only repository tools show under Tools; the rest is
// sorted into Documents and Also used, as written.
const DOCUMENT =
	/\b(decks?|tabs?|sheets?|files?|docs?|documents?|folders?|templates?|notes|workbooks?|library|libraries|reports?|trackers?|lists?|codebook|storyline|outline|sow|briefs?|agenda|log|samples?|database|calendar|guides?|preview|start here|methodology|shot list|moodboard)\b/i;

// "8 platforms (Instagram, TikTok), Excel" → two items, not four.
function splitItems(s: string): string[] {
	const out: string[] = [];
	let depth = 0;
	let cur = "";
	for (const ch of s) {
		if (ch === "(") depth++;
		if (ch === ")") depth = Math.max(0, depth - 1);
		if (ch === "," && depth === 0) {
			out.push(cur);
			cur = "";
		} else cur += ch;
	}
	out.push(cur);
	return out.map((t) => t.trim()).filter(Boolean);
}

export function otherToolItems(task: MethodTask): { documents: string[]; other: string[] } {
	const items = splitItems(task.tools).filter((t) => !/\bskills?\b/i.test(t) && !MATCHERS.some((res) => res.some((re) => re.test(t))));
	return { documents: items.filter((t) => DOCUMENT.test(t)), other: items.filter((t) => !DOCUMENT.test(t)) };
}

export const TOOL_KINDS = [...new Set(catalog.tools.map((t) => t.kind))];
