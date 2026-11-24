"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TopBand } from "@/shared/components/layout/TopBand";
import { whatsNew, type WhatsNewKind } from "@/shared/lib/data";
import { cn } from "@/shared/lib/cn";
import { markWhatsNewSeen } from "./seen";

const KIND: Record<WhatsNewKind, { label: string; cls: string }> = {
	new: { label: "New", cls: "bg-[var(--color-accent-dim)] text-[var(--color-accent)]" },
	changed: { label: "Changed", cls: "bg-[var(--color-elevated)] text-[var(--color-ink-secondary)]" },
	removed: { label: "Set aside", cls: "bg-[var(--color-attention-bg)] text-[var(--color-attention)]" },
};

// What changed in the prototype, newest first (data/whats-new.json): each
// change says what it does, why, and where to see it.
export function WhatsNewView() {
	useEffect(() => markWhatsNewSeen(), []);
	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">What’s new</div>
				<div className="text-sm text-[var(--color-ink-muted)]">What changed in Martine, newest first</div>
			</TopBand>
			<div className="mx-auto flex max-w-[760px] flex-col gap-8 px-6 py-8">
				{whatsNew.map((e) => (
					<section key={e.date} aria-labelledby={`d-${e.date}`} className="flex flex-col gap-3">
						<div>
							<h2 id={`d-${e.date}`} className="m-0 font-[family-name:var(--font-heading)] text-[22px] font-medium">
								{new Date(`${e.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
							</h2>
							{e.summary && <p className="m-0 mt-0.5 text-[15px] text-[var(--color-ink-secondary)]">{e.summary}</p>}
						</div>
						<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
							{e.items.map((it) => (
								<li key={it.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 shadow-[var(--shadow-xs)]">
									<div className="flex flex-wrap items-center gap-2">
										<span className={cn("rounded-[var(--radius-xl)] px-2.5 py-0.5 text-xs font-semibold", KIND[it.kind].cls)}>{KIND[it.kind].label}</span>
										<h3 className="m-0 font-[family-name:var(--font-body)] text-[16px] font-semibold">{it.title}</h3>
									</div>
									<p className="m-0 mt-1.5 text-[15px] leading-relaxed text-[var(--color-ink-secondary)]">{it.text}</p>
									{it.href && (
										<Link href={it.href} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold">
											See it <ArrowRight size={14} aria-hidden />
										</Link>
									)}
								</li>
							))}
						</ul>
					</section>
				))}
			</div>
		</>
	);
}
