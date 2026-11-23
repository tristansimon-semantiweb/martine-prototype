import { Fragment } from "react";

// Minimal renderer for the scripted answer markdown: paragraphs, bullet lists,
// and inline **bold** / *italic*. Intentionally not a full markdown engine.
function renderInline(text: string, keyPrefix: string) {
	const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
	return tokens.map((t, i) => {
		const key = `${keyPrefix}-${i}`;
		if (t.startsWith("**") && t.endsWith("**")) {
			return (
				<strong key={key} className="font-semibold text-[var(--color-ink)]">
					{t.slice(2, -2)}
				</strong>
			);
		}
		if (t.startsWith("*") && t.endsWith("*")) {
			return (
				<em key={key} className="italic text-[var(--color-ink-secondary)]">
					{t.slice(1, -1)}
				</em>
			);
		}
		return <Fragment key={key}>{t}</Fragment>;
	});
}

export function Markdown({ source }: { source: string }) {
	const blocks = source.split("\n\n");

	return (
		<div className="flex flex-col gap-3 text-sm leading-relaxed text-[var(--color-ink-secondary)]">
			{blocks.map((block, bi) => {
				const lines = block.split("\n");
				if (lines.every((l) => l.startsWith("- "))) {
					return (
						<ul key={bi} className="flex flex-col gap-1.5 pl-1">
							{lines.map((l, li) => (
								<li key={li} className="flex gap-2">
									<span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--color-accent)]" />
									<span>{renderInline(l.slice(2), `${bi}-${li}`)}</span>
								</li>
							))}
						</ul>
					);
				}
				return <p key={bi}>{renderInline(block, `p-${bi}`)}</p>;
			})}
		</div>
	);
}
