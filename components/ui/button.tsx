import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border-2 border-border font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[3px_3px_0_var(--foreground)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none",
        secondary: "bg-secondary text-secondary-foreground shadow-[3px_3px_0_var(--foreground)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none",
        accent: "bg-accent text-accent-foreground shadow-[3px_3px_0_var(--foreground)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none",
        outline: "bg-card text-card-foreground shadow-[3px_3px_0_var(--foreground)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none",
        ghost: "border-transparent bg-transparent hover:bg-muted",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-9 px-3 text-xs",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };