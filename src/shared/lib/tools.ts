// The tool repository (data/catalog.json, "tools") and how tasks use it.
import { catalog } from "./data";
import type { CatalogTool, MethodTask } from "./types";

export function toolById(id: string): CatalogTool | undefined {
	return catalog.tools.find((t) => t.id === id);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MATCHERS = catalog.tools.map((t) => (t.aliases ?? [`\\b${escape(t.label)}\\b`]).map((a) => new RegExp(a)));

// The method files' Tools column names more than tools: documents ("Queries
// tab", "Deck"), guides and libraries ("facet library", which are documents
// too), sources and channels ("TikTok", "Email"). Only repository tools show
// under Tools; the rest is sorted into Documents and Also used, as written.
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

// A guide is a document: the catalog's guides, and what reads as one (a guide, a library, a methodology).
const GUIDE = /\b(guides?|library|libraries|methodology|start here)\b/i;
const isGuide = (t: string) => GUIDE.test(t) || catalog.guides.some((g) => g.toLowerCase() === t.toLowerCase());
// A skill named in the column ("building radarly queries skill") is shown as a skill, not here.
const isSkill = (t: string) => /\bskills?\b/i.test(t) && !isGuide(t);

export function otherToolItems(task: MethodTask): { documents: string[]; other: string[] } {
	// A guide can name a tool ("Talkwalker queries skill guide"): it stays a guide.
	const items = splitItems(task.tools).filter((t) => isGuide(t) || (!isSkill(t) && !MATCHERS.some((res) => res.some((re) => re.test(t)))));
	const isDocument = (t: string) => isGuide(t) || DOCUMENT.test(t);
	return { documents: items.filter(isDocument), other: items.filter((t) => !isDocument(t)) };
}

export const TOOL_KINDS = [...new Set(catalog.tools.map((t) => t.kind))];
