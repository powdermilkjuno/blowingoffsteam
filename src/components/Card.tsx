import type { ElementType, HTMLAttributes, ReactNode } from "react";

const tones = {
  panel: "border border-line bg-surface",
  flat: "border-0 bg-raised/60",
  solid: "border border-clay/30 bg-clay/10",
  outline: "border border-line bg-transparent",
  danger: "border border-danger/30 bg-danger/5",
} as const;

const radii = {
  none: "rounded-none",
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
} as const;

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  tone?: keyof typeof tones;
  radius?: keyof typeof radii;
};

export default function Card({
  children,
  className = "",
  as: Comp = "div",
  tone = "panel",
  radius = "md",
  ...props
}: CardProps) {
  return (
    <Comp className={`${radii[radius]} ${tones[tone]} ${className}`} {...props}>
      {children}
    </Comp>
  );
}
