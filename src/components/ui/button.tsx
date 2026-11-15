import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-primary-strong text-white hover:bg-[#115e59]",
  outline: "border border-line bg-card text-fg hover:bg-muted",
  ghost: "text-fg hover:bg-muted",
  accent: "bg-accent text-black hover:bg-[#c2410c] hover:text-white",
  danger: "text-danger hover:bg-danger-soft",
};
const sizes = {
  md: "h-11 px-4 text-sm",
  sm: "h-9 px-3 text-sm",
  icon: "h-11 w-11",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
