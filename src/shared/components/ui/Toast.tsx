"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type Toast = { id: number; message: string };

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
	return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const show = useCallback((message: string) => {
		const id = Date.now() + Math.random();
		setToasts((t) => [...t, { id, message }]);
		setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
	}, []);

	return (
		<ToastContext.Provider value={show}>
			{children}
			<div
				className="fixed bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
				style={{ zIndex: "var(--z-tooltip)" }}
			>
				{toasts.map((t) => (
					<div
						key={t.id}
						className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-ink)] px-4 py-2.5 text-sm text-white shadow-[var(--shadow-lg)]"
					>
						<CheckCircle2 size={16} className="text-[var(--color-positive)]" />
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}
