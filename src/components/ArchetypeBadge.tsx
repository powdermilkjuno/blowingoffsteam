"use client";

import type { ReactNode } from "react";
import {
  BarChartIcon,
  GlobeIcon,
  HomeIcon,
  LightningBoltIcon,
  MoonIcon,
  StarIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ARCHETYPE_META, archetypeHover, type ArchetypeBreakdown } from "@/lib/archetypes";
import type { Archetype } from "@/lib/db/profiles";

const ICONS: Record<Archetype, typeof MoonIcon> = {
  night_owl: MoonIcon,
  early_bird: SunIcon,
  firecracker: LightningBoltIcon,
  hearth: HomeIcon,
  one_hit_wonder: StarIcon,
  chart_topper: BarChartIcon,
  grass_toucher: GlobeIcon,
};

const STAMP = "border-[#0b1020] shadow-[2px_2px_0_#0b1020]";

const TONES: Record<Archetype, string> = {
  night_owl: `${STAMP} bg-[#3b1d8a] text-[#ffe566]`,
  early_bird: `${STAMP} bg-[#ffd23f] text-[#1a3aff]`,
  firecracker: `${STAMP} bg-[#ff2d8a] text-[#fff8a8]`,
  hearth: `${STAMP} bg-[#ff4d2e] text-[#fff6e8]`,
  one_hit_wonder: `${STAMP} bg-[#22e6ff] text-[#1a0a4a]`,
  chart_topper: `${STAMP} bg-[#2b5cff] text-[#ffe14d]`,
  grass_toucher: `${STAMP} bg-[#7dffb3] text-[#5b1aff]`,
};

export function IconSquare({
  label,
  description,
  className,
  children,
}: {
  label: string;
  description: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className={`inline-flex size-7 shrink-0 items-center justify-center rounded-[5px] border-2 transition-transform duration-150 hover:z-10 hover:scale-125 hover:rotate-0 ${className}`}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          sideOffset={8}
          className="z-50 max-w-xs rounded-sm border-2 border-[#0b1020] bg-[#fff8a8] px-2.5 py-2 text-xs leading-relaxed text-[#0b1020] shadow-[3px_3px_0_#0b1020]"
        >
          <p className="font-pixel text-[10px] tracking-wide text-[#ff2d8a]">{label}</p>
          <p className="mt-1 text-[#0b1020]/85">{description}</p>
          <Tooltip.Arrow className="fill-[#fff8a8]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function ArchetypeBadge({
  archetype,
}: {
  archetype: Archetype | null | undefined;
}) {
  if (!archetype) return null;
  const meta = ARCHETYPE_META[archetype];
  const Icon = ICONS[archetype];

  return (
    <IconSquare
      label={meta.label}
      description={archetypeHover(archetype)}
      className={`-rotate-6 ${TONES[archetype]}`}
    >
      <Icon width={16} height={16} />
    </IconSquare>
  );
}

export function ArchetypeBars({ breakdown }: { breakdown: ArchetypeBreakdown }) {
  const highlight =
    breakdown.winner === "night_owl" || breakdown.winner === "early_bird"
      ? "Clock"
      : breakdown.winner === "hearth" || breakdown.winner === "firecracker"
        ? "Sessions"
        : breakdown.winner === "chart_topper" ||
            breakdown.winner === "one_hit_wonder"
          ? "Week"
          : null;

  const bars = [
    { label: "Clock", value: breakdown.clock },
    { label: "Sessions", value: breakdown.length },
    { label: "Week", value: breakdown.volume },
  ];

  return (
    <div className="space-y-2">
      {bars.map((bar) => {
        const winning = bar.label === highlight;
        return (
          <div key={bar.label}>
            <div className="mb-1 flex justify-between text-[10px] text-muted">
              <span className={winning ? "text-clay" : undefined}>{bar.label}</span>
              <span>{bar.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-sm bg-raised">
              <div
                className={`h-full ${winning ? "bg-clay2" : "bg-signal"}`}
                style={{ width: `${Math.min(100, Math.max(0, bar.value))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
