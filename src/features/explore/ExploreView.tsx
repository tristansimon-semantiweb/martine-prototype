"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, MessageSquare, Pin } from "lucide-react";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { Popover } from "@/shared/components/ui/Popover";
import { askCorpusUrl } from "@/shared/lib/martineContext";
import { phaseViews } from "@/shared/lib/studyModel";
import { STAGE_LABEL, corpusFigures, corpusRole, corpusStage, explorerData, fmt, type ExplorerData } from "@/shared/lib/corpus";
import { cn } from "@/shared/lib/cn";
import type { Study } from "@/shared/lib/types";
import { VerbatimRow } from "@/features/corpus/CorpusView";
import { useNow } from "@/features/corpus/useNow";

const card = "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]";

// The Explorer, inside the study: the same band and tabs as the rest of the
// study, so moving from the steps to the analysis does not feel like changing
// tools. In the product the Explorer is its own application; here it is a
// mock on fictional data. Opened from a phase (?phase=5), what is pinned goes
// to that phase, in Files.
export function ExploreView({ id }: { id: string }) {
	const { studies, corpusOf } = useMartine();
	const params = useSearchParams();
	const study = studies.find((s) => s.id === id);
	const c = corpusOf(id);
	const now = useNow(Boolean(c.run && !c.checked));
	if (!study) return null;
	const { stage } = corpusStage(c, now);
	const views = phaseViews(study);
	const fromPhase = views.find((p) => p.id === params.get("phase"));
	const data = explorerData[study.id];

	if (stage !== "ready") {
		return (
			<div className="mx-auto max-w-[1240px] px-6 py-7">
				<div className={`${card} flex flex-col items-start gap-2 px-6 py-6`}>
					<h2 className="m-0 font-[family-name:var(--font-heading)] text-[22px] font-medium">The corpus is not in the Explorer yet</h2>
					<p className="m-0 text-[15px] text-[var(--color-ink-secondary)]">
						Where it stands: {STAGE_LABEL[stage].toLowerCase()}. It arrives here once processed and checked.
					</p>
					<Link href={`/studies/${study.id}/corpus`} className="text-sm font-semibold">
						Go to the corpus
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-7">
			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<span className="rounded-[var(--radius-sm)] bg-[var(--color-ink)] px-2 py-0.5 text-[12px] font-bold uppercase tracking-wide text-[var(--color-surface)]">Explorer</span>
				<span className="flex-1 text-sm text-[var(--color-ink-secondary)]">
					{fmt(data ? Object.values(data.markets).reduce((a, b) => a + b, 0) : corpusFigures(c).kept)} verbatims, processed by the data platform
					{fromPhase && (
						<>
							{" "}
							· for phase {fromPhase.id}, {fromPhase.name}: what you pin goes to it
						</>
					)}
				</span>
				<a href={askCorpusUrl(study, fromPhase?.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold">
					<MessageSquare size={14} aria-hidden /> Ask Claude about this corpus <ExternalLink size={12} aria-hidden />
				</a>
			</div>
			{data ? (
				<Explorer study={study} data={data} defaultPhase={fromPhase?.id ?? views.find((p) => corpusRole(study, p.id) === "analyse")?.id ?? views[0]?.id} />
			) : (
				<p className={`${card} m-0 px-6 py-5 text-[15px] text-[var(--color-ink-secondary)]`}>The prototype’s Explorer has data for Hair skinification only. In the product, every processed corpus opens here.</p>
			)}
		</div>
	);
}

type Filters = { market: string[]; sentiment: string[]; code: string[] };

function Explorer({ study, data, defaultPhase }: { study: Study; data: ExplorerData; defaultPhase?: string }) {
	const [f, setF] = useState<Filters>({ market: [], sentiment: [], code: [] });
	const toggle = (k: keyof Filters, v: string) => setF((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));
	const total = Object.values(data.markets).reduce((a, b) => a + b, 0);
	const markets = f.market.length ? f.market : Object.keys(data.markets);
	const share = (k: "market" | "sentiment", rec: Record<string, number>) => (f[k].length ? f[k].reduce((n, v) => n + (rec[v] ?? 0), 0) / total : 1);
	const inView = Math.round(total * share("market", data.markets) * share("sentiment", data.sentiment));
	const codes = Object.entries(data.codes)
		.filter(([code]) => !f.code.length || f.code.includes(code))
		.map(([code, by]) => ({ code, n: Math.round(markets.reduce((n, m) => n + (by[m] ?? 0), 0) * share("sentiment", data.sentiment)) }))
		.sort((a, b) => b.n - a.n);
	const max = Math.max(...codes.map((x) => x.n), 1);
	const months = data.months.map((m) => ({ ...m, n: Math.round((m.n * inView) / total) }));
	const maxMonth = Math.max(...months.map((m) => m.n), 1);
	const verbatims = data.verbatims.filter((v) => (!f.market.length || f.market.includes(v.market)) && (!f.sentiment.length || f.sentiment.includes(v.sentiment)) && (!f.code.length || f.code.includes(v.code)));
	const scope = [f.market.join(", "), f.sentiment.join(", "), f.code.join(", ")].filter(Boolean).join(" · ");

	const groups: { key: keyof Filters; label: string; origin: string; values: [string, number][] }[] = [
		{ key: "market", label: "Market", origin: "from the metadata", values: Object.entries(data.markets) },
		{ key: "sentiment", label: "Sentiment", origin: "detected by the AI", values: Object.entries(data.sentiment) },
		{ key: "code", label: "Skincare code", origin: "detected by the AI, from the study’s scope", values: Object.entries(data.codes).map(([k, v]) => [k, Object.values(v).reduce((a, b) => a + b, 0)]) },
	];

	return (
		<div className="grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
			<aside aria-label="Filters" className={`${card} flex flex-col gap-4 px-4 py-4`}>
				{groups.map((g) => (
					<fieldset key={g.key} className="m-0 flex flex-col gap-1 border-0 p-0">
						<legend className="mb-1 p-0">
							<span className="block text-[13px] font-semibold">{g.label}</span>
							<span className="block text-[11px] text-[var(--color-ink-muted)]">{g.origin}</span>
						</legend>
						{g.values.map(([v, n]) => (
							<label key={v} className="flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-1 py-0.5 text-sm hover:bg-[var(--color-hover)]">
								<input type="checkbox" checked={f[g.key].includes(v)} onChange={() => toggle(g.key, v)} className="accent-[var(--color-accent)]" />
								<span className="flex-1">{v}</span>
								<span className="text-[12px] text-[var(--color-ink-muted)]">{fmt(n)}</span>
							</label>
						))}
					</fieldset>
				))}
			</aside>

			<div className="flex min-w-0 flex-col gap-4">
				<section aria-labelledby="codes-h" className={`${card} flex flex-col gap-3 px-6 py-5`}>
					<div className="flex flex-wrap items-baseline gap-3">
						<h2 id="codes-h" className="m-0 flex-1 font-[family-name:var(--font-body)] text-[17px] font-semibold">
							Verbatims by skincare code
						</h2>
						<span className="text-sm text-[var(--color-ink-muted)]">about {fmt(inView)} verbatims in view</span>
						<PinTo study={study} defaultPhase={defaultPhase} name={`Chart: verbatims by skincare code${scope ? ` (${scope})` : ""}`} />
					</div>
					<ul className="m-0 flex list-none flex-col gap-1.5 p-0">
						{codes.map((x) => (
							<li key={x.code} className="grid grid-cols-[140px_minmax(0,1fr)_64px] items-center gap-3 text-sm">
								<span className="truncate">{x.code}</span>
								<span className="h-5 rounded-[var(--radius-sm)] bg-[var(--color-elevated)]">
									<span className="block h-5 rounded-[var(--radius-sm)] bg-[var(--color-accent)]" style={{ width: `${(x.n / max) * 100}%` }} />
								</span>
								<span className="text-right tabular-nums">{fmt(x.n)}</span>
							</li>
						))}
					</ul>
					<p className="m-0 text-[12px] text-[var(--color-ink-muted)]">A verbatim can carry several codes. Fictional figures for the prototype.</p>
				</section>

				<section aria-labelledby="months-h" className={`${card} flex flex-col gap-3 px-6 py-5`}>
					<div className="flex flex-wrap items-baseline gap-3">
						<h2 id="months-h" className="m-0 flex-1 font-[family-name:var(--font-body)] text-[17px] font-semibold">
							Verbatims by month
						</h2>
						<PinTo study={study} defaultPhase={defaultPhase} name={`Chart: verbatims by month${scope ? ` (${scope})` : ""}`} />
					</div>
					<div className="flex h-[120px] items-end gap-1.5">
						{months.map((m) => (
							<div key={m.month} className="flex h-full flex-1 flex-col justify-end" title={`${m.month}: ${fmt(m.n)}`}>
								<div className="rounded-t-[3px] bg-[var(--color-accent)] opacity-80" style={{ height: `${(m.n / maxMonth) * 100}%` }} />
							</div>
						))}
					</div>
					<div className="flex gap-1.5 text-[11px] text-[var(--color-ink-muted)]">
						{months.map((m) => (
							<span key={m.month} className="flex-1 truncate text-center">
								{m.month}
							</span>
						))}
					</div>
				</section>

				<section aria-labelledby="verbatims-h" className={`${card} flex flex-col gap-2 px-6 py-5`}>
					<h2 id="verbatims-h" className="m-0 font-[family-name:var(--font-body)] text-[17px] font-semibold">
						Verbatims <span className="font-normal text-[var(--color-ink-muted)]">{verbatims.length} examples in view</span>
					</h2>
					{verbatims.map((v) => (
						<VerbatimRow key={v.id} v={v} meta={`${v.market}, ${v.source}, ${v.code}, ${v.sentiment.toLowerCase()}`}>
							<PinTo study={study} defaultPhase={defaultPhase} name={`Verbatim ${v.id}`} small />
						</VerbatimRow>
					))}
					{verbatims.length === 0 && <p className="m-0 text-sm text-[var(--color-ink-muted)]">No example for these filters.</p>}
					<p className="m-0 text-[12px] text-[var(--color-ink-muted)]">Fictional verbatims written for the prototype.</p>
				</section>
			</div>
		</div>
	);
}

// Pin a chart or a verbatim to a phase: it joins the study's production
// documents, used in that phase, with its way back to the Explorer.
function PinTo({ study, defaultPhase, name, small }: { study: Study; defaultPhase?: string; name: string; small?: boolean }) {
	const { attach } = useMartine();
	const toast = useToast();
	const router = useRouter();
	const views = phaseViews(study);
	const pin = (phase: string) => {
		attach(study.id, { name, type: "Explorer", phase, category: "production" });
		const p = views.find((x) => x.id === phase);
		toast(`Pinned to phase ${p?.id}, ${p?.name}`, { label: "See in Files", onClick: () => router.push(`/studies/${study.id}/files?folder=production`) });
	};
	return (
		<Popover
			align="end"
			width={300}
			trigger={({ open, toggle }) => (
				<button
					onClick={toggle}
					aria-expanded={open}
					aria-label={`Pin ${name} to a phase`}
					className={cn(
						"inline-flex shrink-0 items-center gap-1 rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] font-semibold hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
						small ? "px-2 py-1 text-[12px]" : "px-2.5 py-1 text-[13px]",
					)}
				>
					<Pin size={12} aria-hidden /> Pin
				</button>
			)}
		>
			{(close) => (
				<div className="flex flex-col text-sm">
					<div className="px-2 pb-1 text-[12px] text-[var(--color-ink-muted)]">Pin to a phase of the study</div>
					{views.map((p) => (
						<button
							key={p.id}
							onClick={() => {
								pin(p.id);
								close();
							}}
							className={cn("rounded-[var(--radius-sm)] px-2 py-1.5 text-left hover:bg-[var(--color-hover)]", p.id === defaultPhase && "font-semibold text-[var(--color-accent)]")}
						>
							{p.label}
						</button>
					))}
				</div>
			)}
		</Popover>
	);
}
