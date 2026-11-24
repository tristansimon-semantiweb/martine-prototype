"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2 } from "lucide-react";

// Ported from R&R, with an optional action: a removal shows "Undo" instead
// of asking for confirmation first.
type ToastAction = { label: string; onClick: () => void };
type Toast = { id: number; message: string; action?: ToastAction };

const ToastContext = createContext<(message: string, action?: ToastAction) => void>(() => {});

export function useToast() {
	return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const show = useCallback((message: string, action?: ToastAction) => {
		const id = Date.now() + Math.random();
		setToasts((t) => [...t, { id, message, action }]);
		setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 3000);
	}, []);

	return (
		<ToastContext.Provider value={show}>
			{children}
			<div
				className="fixed bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
				style={{ zIndex: "var(--z-tooltip)" }}
				role="status"
				aria-live="polite"
			>
				{toasts.map((t) => (
					<div
						key={t.id}
						className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-ink)] px-4 py-2.5 text-sm text-white shadow-[var(--shadow-lg)]"
					>
						<CheckCircle2 size={16} className="text-[var(--color-positive)]" aria-hidden />
						{t.message}
						{t.action && (
							<button
								onClick={() => {
									t.action!.onClick();
									setToasts((all) => all.filter((x) => x.id !== t.id));
								}}
								className="ml-2 rounded-[var(--radius-sm)] px-2 py-0.5 font-semibold text-[#c9c2ff] hover:bg-white/10"
							>
								{t.action.label}
							</button>
						)}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}
