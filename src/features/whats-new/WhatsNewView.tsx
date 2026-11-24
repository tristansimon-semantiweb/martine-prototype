"use client";

import { useEffect } from "react";
import { TopBand } from "@/shared/components/layout/TopBand";
import { whatsNew } from "@/shared/lib/data";
import { markWhatsNewSeen } from "./seen";

// What changed in the prototype, newest first (data/whats-new.json).
export function WhatsNewView() {
	useEffect(() => markWhatsNewSeen(), []);
	return (
		<>
			<TopBand>
				<div className="font-[family-name:var(--font-heading)] text-[23px] font-medium">What’s new</div>
				<div className="text-sm text-[var(--color-ink-muted)]">What changed in Martine, newest first</div>
			</TopBand>
			<div className="mx-auto flex max-w-[760px] flex-col gap-6 px-6 py-8">
				{whatsNew.map((e) => (
					<section key={e.date} aria-labelledby={`d-${e.date}`}>
						<h2 id={`d-${e.date}`} className="m-0 mb-2 font-[family-name:var(--font-body)] text-[15px] font-semibold">
							{new Date(`${e.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
						</h2>
						<ul className="m-0 flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 pl-9 text-[15px] leading-relaxed shadow-[var(--shadow-xs)]">
							{e.items.map((it) => (
								<li key={it}>{it}</li>
							))}
						</ul>
					</section>
				))}
			</div>
		</>
	);
}
