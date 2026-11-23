// The tool repository (data/catalog.json, "tools") and how tasks use it.
import { catalog } from "./data";
import type { CatalogTool, MethodTask } from "./types";

export function toolById(id: string): CatalogTool | undefined {
	return catalog.tools.find((t) => t.id === id);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MATCHERS = catalog.tools.map((t) => (t.aliases ?? [`\\b${escape(t.label)}\\b`]).map((a) => new RegExp(a)));

// What a task's Tools text names besides repository tools and skills:
// documents, sources, people ("Queries tab", "client brief"). Shown as text.
export function otherToolItems(task: MethodTask): string[] {
	return task.tools
		.split(/,\s*/)
		.map((t) => t.trim())
		.filter((t) => t && !/\bskills?\b/i.test(t) && !MATCHERS.some((res) => res.some((re) => re.test(t))));
}

export const TOOL_KINDS = [...new Set(catalog.tools.map((t) => t.kind))];
