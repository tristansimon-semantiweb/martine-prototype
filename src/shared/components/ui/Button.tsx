import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-semibold transition-[background,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
	{
		variants: {
			variant: {
				primary:
					"bg-[var(--color-accent)] text-white hover:opacity-90",
				secondary:
					"bg-[var(--color-elevated)] text-[var(--color-ink)] hover:bg-[var(--color-active)]",
				outline:
					"border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-hover)]",
				ghost:
					"text-[var(--color-ink-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]",
			},
			size: {
				sm: "h-8 px-3 text-xs",
				md: "h-9 px-4",
				lg: "h-11 px-6 text-base",
				icon: "h-9 w-9 p-0",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
	return (
		<button
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { buttonVariants };
