const tones = {
  panel: "border border-line bg-surface",
  flat: "border-0 bg-raised/60",
  solid: "border border-clay/30 bg-clay/10",
  outline: "border border-line bg-transparent",
  danger: "border border-danger/30 bg-danger/5",
};

const radii = {
  none: "rounded-none",
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-lg",
};

export default function Card({
  children,
  className = "",
  as: Comp = "div",
  tone = "panel",
  radius = "md",
  ...props
}) {
  return (
    <Comp
      className={`${radii[radius]} ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
