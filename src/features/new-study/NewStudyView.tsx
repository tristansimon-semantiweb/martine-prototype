"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBand } from "@/shared/components/layout/TopBand";
import { useMartine } from "@/shared/hooks/useMartine";
import { useToast } from "@/shared/components/ui/Toast";
import { briefReadings, briefs, methodEntry } from "@/shared/lib/data";
import { dueDate, plural } from "@/shared/lib/format";

// Which example brief a dropped file or pasted text stands for. Reading is
// scripted: the prototype recognises the two example briefs and treats any
// other file as the trend report one.
function recognise(text: string): string {
	return /brand audit|lumen/i.test(text) ? "brand_audit" : "trend_report";
}

export function NewStudyView() {
	const router = useRouter();
	const toast = useToast();
	const { createStudy } = useMartine();
	const fileInput = useRef<HTMLInputElement>(null);
	const [briefKey, setBriefKey] = useState<string | null>(null);
	const [reading, setReading] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [pasting, setPasting] = useState(false);
	const [pasted, setPasted] = useState("");

	const read = (key: string) => {
		setBriefKey(null);
		setReading(true);
		window.setTimeout(() => {
			setReading(false);
			setBriefKey(key);
		}, 700);
	};

	const onFile = (f: File | undefined) => {
		if (!f) return;
		if (f.type.startsWith("text/")) f.text().then((t) => read(recognise(`${f.name} ${t}`)));
		else read(recognise(f.name));
	};

	const r = briefKey ? briefReadings[briefKey] : null;
	const method = r ? methodEntry(r.method) : null;

	return (
		<>
			<TopBand />
			<div className="mx-auto flex max-w-[640px] flex-col gap-6 px-6 py-10">
				<Link href="/" className="text-sm text-[var(--color-ink-muted)]">
					Back to my studies
				</Link>
				<h1 className="m-0 font-[family-name:var(--font-heading)] text-[34px] font-medium">New study</h1>

				<div
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDragging(false);
						onFile(e.dataTransfer.files?.[0]);
					}}
					className={`flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed bg-[var(--color-surface)] px-6 py-11 text-center ${dragging ? "border-[var(--color-accent)]" : "border-[var(--color-border-active)]"}`}
				>
					<div className="text-[19px] font-semibold">Drop the client brief</div>
					<div className="text-[15px] text-[var(--color-ink-muted)]">PDF, Word, or paste the text</div>
					<input ref={fileInput} type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
					<div className="mt-1.5 flex flex-wrap justify-center gap-2.5">
						<button
							onClick={() => fileInput.current?.click()}
							className="rounded-[var(--radius)] bg-[var(--color-accent)] px-5 py-3 font-semibold text-white hover:opacity-90"
						>
							Choose a file
						</button>
						<button
							onClick={() => setPasting((v) => !v)}
							className="rounded-[var(--radius)] border border-[var(--color-border-hover)] bg-[var(--color-surface)] px-4 py-3 hover:bg-[var(--color-hover)]"
						>
							Paste the text
						</button>
					</div>
					<div className="text-sm text-[var(--color-ink-muted)]">
						Or try an example brief:{" "}
						<button onClick={() => read("trend_report")} className="font-semibold text-[var(--color-accent)]">
							Maison Arlette trend watch
						</button>
						{", "}
						<button onClick={() => read("brand_audit")} className="font-semibold text-[var(--color-accent)]">
							Lumen Café brand audit
						</button>
					</div>
				</div>

				{pasting && (
					<div className="flex flex-col gap-2">
						<textarea
							value={pasted}
							onChange={(e) => setPasted(e.target.value)}
							rows={6}
							aria-label="The brief’s text"
							placeholder={briefs.trend_report.split("\n").slice(0, 3).join("\n")}
							className="rr-input"
						/>
						<button
							disabled={!pasted.trim()}
							onClick={() => read(recognise(pasted))}
							className="self-start rounded-[var(--radius)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
						>
							Read the brief
						</button>
					</div>
				)}

				{reading && <p className="m-0 text-[var(--color-ink-muted)]">Martine is reading the brief…</p>}

				{r && briefKey && (
					<section
						aria-labelledby="res"
						className="flex flex-col gap-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-xs)]"
					>
						<span className="self-start rounded-[var(--radius-xl)] bg-[var(--color-accent-dim)] px-2.5 py-0.5 text-[13px] font-semibold text-[var(--color-accent)]">
							Martine read the brief
						</span>
						<h2 id="res" className="m-0 font-[family-name:var(--font-heading)] text-2xl font-medium leading-snug">
							{r.type} for {r.client}, due {dueDate(r.due)}
						</h2>
						<p className="m-0 text-base leading-relaxed text-[var(--color-ink-secondary)]">
							{r.scope} Budget: {r.daysSold != null ? `${r.daysSold} days` : "[to set, not in the brief]"}.
						</p>
						<p className="m-0 text-sm text-[var(--color-ink-muted)]">
							Method:{" "}
							{method?.version ? `${method.name} v${method.version}, the version the study will keep` : `${method?.name ?? r.type}, not imported in Martine yet: the study starts without phases`}
						</p>
						{r.toClarify.length > 0 && (
							<details className="rounded-[var(--radius)] bg-[var(--color-attention-bg)] px-3.5 py-3 text-[15px] text-[var(--color-attention)]">
								<summary className="cursor-pointer">{plural(r.toClarify.length, "point")} to clarify with the client before starting</summary>
								<ul className="mb-0 mt-2 flex flex-col gap-1.5 pl-5">
									{r.toClarify.map((c) => (
										<li key={c}>{c}</li>
									))}
								</ul>
							</details>
						)}
						<div className="mt-1 flex flex-wrap items-center gap-3">
							<button
								onClick={() => {
									const id = createStudy(r, briefKey);
									toast("Study created with its data platform study, Slack channel and Drive folder");
									router.push(`/studies/${id}`);
								}}
								className="rounded-[var(--radius)] bg-[var(--color-accent)] px-5 py-3 font-semibold text-white hover:opacity-90"
							>
								Create the study
							</button>
							<span className="text-sm text-[var(--color-ink-muted)]">
								Martine also creates its data platform study, Slack channel and Drive folder{r.family === "Trends" ? ", and links the Talkwalker topic" : ""}.
							</span>
						</div>
					</section>
				)}
			</div>
		</>
	);
}
