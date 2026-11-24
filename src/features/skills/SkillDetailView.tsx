"use client";

import Link from "next/link";
import { TopBand } from "@/shared/components/layout/TopBand";
import { SkillStatusBadge } from "@/shared/components/ui/SkillStatus";
import { useMartine } from "@/shared/hooks/useMartine";
import { methodEntry, personById, skillById } from "@/shared/lib/data";
import { toolById } from "@/shared/lib/tools";
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
				{skill.request && (
					<section aria-label="Request" className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] bg-[var(--color-accent-dim)] px-5 py-4 text-[15px]">
						<p className="m-0">
							{skill.request.kind === "automation" ? "Automation" : "Skill"} requested by {personById(skill.request.by)?.name.split(" ")[0]} on{" "}
							{new Date(`${skill.request.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}, for the step{" "}
							<Link href={`/study-types/${skill.request.method}`}>
								“{skill.request.taskName}” of the {methodEntry(skill.request.method)?.name.toLowerCase()} method
							</Link>
							.
						</p>
						<div className="text-sm">
							<span className="font-semibold">Connectors to build: </span>
							{skill.request.connectors.length ? skill.request.connectors.map((t) => toolById(t)?.label ?? t).join(", ") : "none, the existing ones are enough"}
						</div>
						<ol className="m-0 flex flex-wrap gap-x-5 gap-y-1 pl-5 text-sm">
							{(["requested", "in_development", "validated"] as const).map((st) => (
								<li key={st} className={skill.status === st ? "font-semibold" : "text-[var(--color-ink-muted)]"}>
									{st === "requested" ? "Requested" : st === "in_development" ? `The tech team builds the connectors and the ${skill.request?.kind ?? "skill"}` : "Fabien validates it: available to everyone"}
								</li>
							))}
						</ol>
						{skill.status !== "validated" &&
							(role === "skills_owner" ? (
								<div className="flex flex-wrap items-center gap-2">
									<button
										onClick={() => {
											setSkillStatus(skill.id, skill.status === "requested" ? "in_development" : "validated");
											toast(skill.status === "requested" ? "In development" : "Available to everyone, linked to its step");
										}}
										className="rounded-[var(--radius)] bg-[var(--color-accent)] px-3.5 py-2 text-sm font-semibold text-white"
									>
										{skill.status === "requested" ? "Start the development" : "Validate: available to everyone"}
									</button>
									<button
										onClick={() => {
											discardSkill(skill.id);
											toast("Request declined");
											router.push("/skills");
										}}
										className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-3.5 py-2 text-sm"
									>
										Decline
									</button>
								</div>
							) : (
								<p className="m-0 text-sm text-[var(--color-ink-muted)]">
									With the tech team. (In the prototype, view as Fabien from the account menu.)
								</p>
							))}
						{skill.status === "validated" && <p className="m-0 text-sm">Available to everyone, and linked to its step in the method’s draft.</p>}
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
										<Link href={`/study-types/${m}/method?phase=${u.phaseId}`} className="flex-1 text-[var(--color-ink)] no-underline hover:text-[var(--color-accent)]">
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
