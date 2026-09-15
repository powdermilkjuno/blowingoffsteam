export const GROUP_ACCENT_IDS = [
  "clay",
  "fern",
  "signal",
  "moss",
  "paper",
] as const;

export type GroupAccent = (typeof GROUP_ACCENT_IDS)[number];

export const GROUP_ACCENTS: Record<
  GroupAccent,
  { label: string; swatch: string; border: string; title: string }
> = {
  clay: {
    label: "Clay",
    swatch: "bg-clay",
    border: "border-l-4 border-l-clay",
    title: "text-clay",
  },
  fern: {
    label: "Fern",
    swatch: "bg-fern",
    border: "border-l-4 border-l-fern",
    title: "text-fern",
  },
  signal: {
    label: "Signal",
    swatch: "bg-signal",
    border: "border-l-4 border-l-signal",
    title: "text-signal",
  },
  moss: {
    label: "Moss",
    swatch: "bg-moss",
    border: "border-l-4 border-l-moss",
    title: "text-moss",
  },
  paper: {
    label: "Paper",
    swatch: "bg-paper",
    border: "border-l-4 border-l-paper",
    title: "text-paper",
  },
};

export function isGroupAccent(value: string): value is GroupAccent {
  return (GROUP_ACCENT_IDS as readonly string[]).includes(value);
}

export function resolveGroupAccent(value: string | null | undefined): GroupAccent {
  return value && isGroupAccent(value) ? value : "clay";
}
