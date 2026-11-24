"use client";

import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { SkillStatusBadge } from "@/shared/components/ui/SkillStatus";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, personById, skillById } from "@/shared/lib/data";
import { useRouter } from "next/navigation";
import { useToast } from "@/shared/components/ui/Toast";
import { skillUsage } from "@/features/tools/toolUsage";

// One skill: what it does, needs and produces, and every step that uses it.
export function SkillDetailView({ id }: { id: string }) {
	const { drafts, role, setSkillStatus, discardSkill } = useMartine();
	const router = useRouter();
	const toast = useToast();
	const skill = skillById(id);

	if (!skill) {
		return (
			<>
				<TopBand>
					<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">Skill not found</div>
				</TopBand>
				<div className="mx-auto max-w-[820px] px-6 py-10">
					<Link href="/skills">Back to the skills</Link>
				</div>
			</>
		);
	}

	const uses = skillUsage(id, drafts);
	const types = [...new Set(uses.map((u) => u.methodId))];

	return (
		<>
			<TopBand>
				<div className="text-sm text-[var(--color-ink-muted)]">
					<Link href="/skills" className="text-[var(--color-ink-muted)]">
						Skills
					</Link>{" "}
					/ <code className="text-[13px]">{skill.id}</code>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<span className="font-[family-name:var(--font-heading)] text-[23px] font-medium">{skill.label}</span>
					<SkillStatusBadge status={skill.status} />
				</div>
			</TopBand>
			<div className="mx-auto flex max-w-[820px] flex-col gap-[18px] px-6 py-8">
				{skill.origin && (
					<section aria-label="Review" className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-accent-dim)] px-5 py-4 text-[15px]">
						<p className="m-0">
							Drafted by Claude from the step{" "}
							<Link href={`/study-types/${skill.origin.method}`}>
								“{skill.origin.taskName}” of the {methodEntry(skill.origin.method)?.name.toLowerCase()} method
							</Link>
							, at {personById(skill.origin.by)?.name.split(" ")[0]}’s request, on {new Date(`${skill.origin.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}. It is linked to that step in the method’s draft.
						</p>
						<ol className="m-0 flex flex-wrap gap-x-4 gap-y-1 pl-5 text-sm">
							<li className={skill.status === "draft" ? "font-semibold" : "text-[var(--color-ink-muted)]"}>Bamby approves it for the method</li>
							<li className={skill.status === "approved" ? "font-semibold" : "text-[var(--color-ink-muted)]"}>Fabien validates it for everyone</li>
						</ol>
						{skill.status === "draft" &&
							(role === "method_owner" ? (
								<div className="flex flex-wrap items-center gap-2">
									<button
										onClick={() => {
											setSkillStatus(skill.id, "approved");
											toast("Approved for the method: Fabien validates it next");
										}}
										className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white"
									>
										Approve for the method
									</button>
									<button
										onClick={() => {
											discardSkill(skill.id);
											toast("Draft discarded");
											router.push("/skills");
										}}
										className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-3.5 py-2 text-sm"
									>
										Discard
									</button>
									<span className="text-sm text-[var(--color-ink-muted)]">Test it on a real study first.</span>
								</div>
							) : (
								<p className="m-0 text-sm text-[var(--color-ink-muted)]">
									Waiting for the method owner’s review. (In the prototype, view as Bamby from the account menu.)
								</p>
							))}
						{skill.status === "approved" &&
							(role === "skills_owner" ? (
								<div className="flex flex-wrap items-center gap-2">
									<button
										onClick={() => {
											setSkillStatus(skill.id, "validated");
											toast("Validated: the skill is available to everyone");
										}}
										className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white"
									>
										Validate for everyone
									</button>
									<button
										onClick={() => {
											discardSkill(skill.id);
											toast("Draft discarded");
											router.push("/skills");
										}}
										className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-3.5 py-2 text-sm"
									>
										Discard
									</button>
								</div>
							) : (
								<p className="m-0 text-sm text-[var(--color-ink-muted)]">
									Approved for the method; waiting for Fabien, who validates skills for everyone. (In the prototype, view as Fabien from the account menu.)
								</p>
							))}
						{skill.status === "validated" && <p className="m-0 text-sm">Validated by Fabien: every analyst can use it from the step.</p>}
					</section>
				)}

				<dl className="m-0 grid grid-cols-[130px_minmax(0,1fr)] gap-x-3.5 gap-y-2.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-[15px]">
					{[
						["What it does", skill.does],
						["Needs", skill.needs ?? "[to describe]"],
						["Produces", skill.produces ?? "[to describe]"],
					].map(([k, v]) => (
						<div key={k} className="contents">
							<dt className="text-[var(--color-ink-muted)]">{k}</dt>
							<dd className={v.startsWith("[") ? "m-0 text-[var(--color-ink-muted)]" : "m-0"}>{v}</dd>
						</div>
					))}
				</dl>

				{types.length === 0 && <p className="m-0 text-[var(--color-ink-muted)]">No step of a study type names this skill yet.</p>}
				{types.map((m) => (
					<section key={m} aria-labelledby={`s-${m}`} className="flex flex-col gap-2">
						<h2 id={`s-${m}`} className="m-0 font-[family-name:var(--font-body)] text-lg font-semibold">
							<Link href={`/study-types/${m}`} className="text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
								{methodEntry(m)?.name}
							</Link>
						</h2>
						<ul className="m-0 list-none overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0">
							{uses
								.filter((u) => u.methodId === m)
								.map((u) => (
									<li key={u.taskKey} className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3 last:border-b-0">
										<Link href={`/study-types/${m}?phase=${u.phaseId}`} className="flex-1 text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
											<span className="text-sm text-[var(--color-ink-muted)]">{u.phaseLabel}</span>
											<span className="block font-semibold">{u.taskName}</span>
										</Link>
										{u.inDraft && <span className="text-[13px] text-[var(--color-attention)]">added in draft</span>}
									</li>
								))}
						</ul>
					</section>
				))}
			</div>
		</>
	);
}
