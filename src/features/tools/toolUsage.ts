// Where a tool is used: every step of every study type linked to it, as the
// method owner sees it (published method with its draft laid over).
import { methodsIndex } from "@/shared/lib/data";
import type { MethodDraft } from "@/shared/hooks/useMartine";
import { methodPhases } from "@/features/methods/methodModel";

export interface ToolUse {
	methodId: string;
	methodName: string;
	phaseId: string;
	phaseLabel: string;
	taskKey: string;
	taskName: string;
	inDraft: boolean; // linked in the method's draft, not published yet
}

export function toolUsage(toolId: string, drafts: Record<string, MethodDraft>): ToolUse[] {
	return methodsIndex.flatMap((m) =>
		methodPhases(m.id, drafts[m.id], []).flatMap((p) =>
			p.tasks
				.filter((t) => t.task.tool_ids.includes(toolId))
				.map((t) => ({
					methodId: m.id,
					methodName: m.name,
					phaseId: p.id,
					phaseLabel: p.label,
					taskKey: t.key,
					taskName: t.task.task,
					inDraft: t.addedTools.includes(toolId),
				})),
		),
	);
}
