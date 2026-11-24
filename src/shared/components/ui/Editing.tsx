"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Pencil, Plus, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

// The editing grammar of Martine, the same everywhere:
// - InlineEdit: text that can change shows a pencil on hover; click it, type;
//   Enter or clicking away saves, Escape cancels. No Save / Cancel buttons.
// - AddRow: "+ Add …" at the end of a list turns into a field in place;
//   Enter adds and keeps the field open for the next one.
// - RemoveButton: a small cross; the caller shows "Undo" in a toast.
// - CanDo: one line at the top of a panel saying what you can do here, and
//   why the rest is locked.

export function InlineEdit({
	value,
	onSave,
	canEdit,
	label,
	placeholder,
	multiline,
	className,
	children,
}: {
	value: string;
	onSave: (next: string) => void;
	canEdit: boolean;
	label: string; // what is edited, for screen readers ("the note")
	placeholder: string; // shown when empty and editable
	multiline?: boolean;
	className?: string;
	children?: React.ReactNode; // how the value reads when not editing
}) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);
	const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

	useEffect(() => {
		if (editing) {
			ref.current?.focus();
			ref.current?.select();
		}
	}, [editing]);

	const save = () => {
		setEditing(false);
		if (draft.trim() !== value.trim()) onSave(draft.trim());
	};
	const cancel = () => {
		setDraft(value);
		setEditing(false);
	};

	if (editing) {
		const common = {
			value: draft,
			"aria-label": `Edit ${label}`,
			onChange: (e: React.ChangeEvent<HTMLTextAreaElement & HTMLInputElement>) => setDraft(e.target.value),
			onBlur: save,
			onKeyDown: (e: React.KeyboardEvent) => {
				if (e.key === "Escape") {
					e.stopPropagation();
					cancel();
				}
				if (e.key === "Enter" && (!multiline || e.metaKey || e.ctrlKey)) {
					e.preventDefault();
					save();
				}
			},
			className: cn("rr-input w-full", className),
		};
		return (
			<span className="block">
				{multiline ? <textarea ref={ref} rows={Math.max(2, draft.split("\n").length)} {...common} /> : <input ref={ref} {...common} />}
				<span className="mt-1 block text-[12px] text-[var(--color-ink-muted)]">
					{multiline ? "⌘ Enter or click away to save, Esc to cancel" : "Enter or click away to save, Esc to cancel"}
				</span>
			</span>
		);
	}

	if (!canEdit) return <>{children ?? (value || null)}</>;

	return (
		<button
			type="button"
			onClick={() => {
				setDraft(value);
				setEditing(true);
			}}
			aria-label={value ? `Edit ${label}` : placeholder}
			className={cn(
				"group -mx-1.5 inline-flex max-w-full items-start gap-1.5 rounded-[var(--radius-sm)] px-1.5 py-0.5 text-left hover:bg-[var(--color-hover)]",
				!value && "text-[var(--color-ink-muted)]",
				className,
			)}
		>
			<span className="min-w-0">{value ? (children ?? value) : placeholder}</span>
			<Pencil size={13} aria-hidden className="mt-1 shrink-0 text-[var(--color-ink-muted)] opacity-40 group-hover:opacity-100" />
		</button>
	);
}

export function AddRow({ label, placeholder, onAdd }: { label: string; placeholder: string; onAdd: (value: string) => void }) {
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState("");

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="flex w-full items-center gap-2 rounded-[12px] border border-dashed border-[var(--color-border-active)] px-4 py-2.5 text-left text-sm font-semibold text-[var(--color-ink-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
			>
				<Plus size={15} aria-hidden /> {label}
			</button>
		);
	}
	return (
		<div className="flex w-full items-center gap-2 rounded-[12px] border border-[var(--color-accent)] bg-[var(--color-surface)] px-3 py-1.5">
			<Plus size={15} aria-hidden className="shrink-0 text-[var(--color-accent)]" />
			<input
				autoFocus
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter" && value.trim()) {
						onAdd(value.trim());
						setValue("");
					}
					if (e.key === "Escape") {
						e.stopPropagation();
						setOpen(false);
						setValue("");
					}
				}}
				onBlur={() => !value.trim() && setOpen(false)}
				aria-label={label}
				placeholder={placeholder}
				className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
			/>
			<span className="hidden text-[12px] text-[var(--color-ink-muted)] sm:inline">Enter to add, Esc to close</span>
		</div>
	);
}

export function RemoveButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			className={cn(
				"flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-muted)] hover:bg-[var(--color-negative-bg)] hover:text-[var(--color-negative)]",
				className,
			)}
		>
			<X size={14} aria-hidden />
		</button>
	);
}

export function CanDo({ can, locked }: { can: string; locked?: string }) {
	return (
		<div className="flex flex-col gap-1 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-2 text-[13px]">
			<span className="flex items-center gap-1.5 text-[var(--color-ink-secondary)]">
				<Pencil size={12} aria-hidden className="text-[var(--color-accent)]" /> {can}
			</span>
			{locked && (
				<span className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
					<Lock size={12} aria-hidden /> {locked}
				</span>
			)}
		</div>
	);
}
