export const GROUP_ACCENT_IDS = [
  "clay",
  "fern",
  "signal",
  "moss",
  "paper",
  "ember",
  "ice",
  "violet",
  "rose",
] as const;

export type GroupAccent = (typeof GROUP_ACCENT_IDS)[number];

export const GROUP_ACCENTS: Record<
  GroupAccent,
  { label: string; swatch: string; card: string; title: string }
> = {
  clay: {
    label: "Clay",
    swatch: "bg-clay",
    card: "border border-clay/70 bg-clay/20",
    title: "text-clay",
  },
  fern: {
    label: "Fern",
    swatch: "bg-fern",
    card: "border border-fern/70 bg-fern/20",
    title: "text-fern",
  },
  signal: {
    label: "Signal",
    swatch: "bg-signal",
    card: "border border-signal/70 bg-signal/20",
    title: "text-signal",
  },
  moss: {
    label: "Moss",
    swatch: "bg-moss",
    card: "border border-moss/70 bg-moss/20",
    title: "text-moss",
  },
  paper: {
    label: "Paper",
    swatch: "bg-paper",
    card: "border border-paper/40 bg-paper/10",
    title: "text-paper",
  },
  ember: {
    label: "Ember",
    swatch: "bg-ember",
    card: "border border-ember/70 bg-ember/20",
    title: "text-ember",
  },
  ice: {
    label: "Ice",
    swatch: "bg-ice",
    card: "border border-ice/70 bg-ice/20",
    title: "text-ice",
  },
  violet: {
    label: "Violet",
    swatch: "bg-violet",
    card: "border border-violet/70 bg-violet/20",
    title: "text-violet",
  },
  rose: {
    label: "Rose",
    swatch: "bg-rose",
    card: "border border-rose/70 bg-rose/20",
    title: "text-rose",
  },
};

export function isGroupAccent(value: string): value is GroupAccent {
  return (GROUP_ACCENT_IDS as readonly string[]).includes(value);
}

export function resolveGroupAccent(value: string | null | undefined): GroupAccent {
  return value && isGroupAccent(value) ? value : "clay";
}
