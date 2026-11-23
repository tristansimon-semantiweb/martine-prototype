"use client";

import { useActionState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { enter } from "./actions";

// Adapted from R&R's LoginView (same brand block and card), reduced to one
// field: the prototype's access code.
export function AccessView({ next }: { next: string }) {
	const [error, action, pending] = useActionState(enter, null);

	return (
		<div className="flex min-h-screen items-center justify-center bg-[var(--color-canvas)] px-4 py-10">
			<div className="w-full max-w-sm">
				<div className="mb-7 flex flex-col items-center text-center">
					<span className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-[var(--color-accent)] font-[family-name:var(--font-heading)] text-lg font-bold text-white">
						M
					</span>
					<h1 className="font-[family-name:var(--font-heading)] text-[26px] font-semibold leading-tight text-[var(--color-ink)]">Martine</h1>
					<p className="mt-1 text-sm text-[var(--color-ink-muted)]">Prototype, powered by Semantiweb</p>
				</div>

				<form action={action} className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
					<input type="hidden" name="next" value={next} />
					<label htmlFor="code" className="text-sm font-semibold">
						Access code
					</label>
					<div className="relative">
						<Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" aria-hidden />
						<input
							id="code"
							name="code"
							type="password"
							required
							autoFocus
							autoComplete="current-password"
							aria-invalid={Boolean(error)}
							aria-describedby={error ? "code-error" : undefined}
							className="w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-accent)]"
						/>
					</div>
					{error && (
						<p id="code-error" role="alert" className="m-0 text-sm text-[var(--color-negative)]">
							{error}
						</p>
					)}
					<Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
						Enter <ArrowRight size={16} aria-hidden />
					</Button>
				</form>

				<p className="mt-5 text-center text-xs text-[var(--color-ink-muted)]">No code? Ask the Semantiweb team.</p>
			</div>
		</div>
	);
}
