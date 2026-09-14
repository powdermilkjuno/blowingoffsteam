"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded border border-line bg-surface px-3 py-2 text-xs shadow-glow">
      <p className="text-muted">{label}</p>
      <p className="mt-0.5 text-paper">
        <span className="text-clay">{payload[0].value}h</span> played
      </p>
    </div>
  );
}

export default function PlaytimeChart({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="playtimeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--color-clay))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="rgb(var(--color-signal))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--color-line))" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="day"
            axisLine={{ stroke: "rgb(var(--color-line))" }}
            tickLine={false}
            tick={{ fill: "rgb(var(--color-muted))", fontSize: 12, fontFamily: "var(--font-mono)" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "rgb(var(--color-muted))", fontSize: 12, fontFamily: "var(--font-mono)" }}
            width={36}
            tickFormatter={(v) => `${v}h`}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgb(var(--color-moss))", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="rgb(var(--color-signal))"
            strokeWidth={2}
            fill="url(#playtimeFill)"
            activeDot={{
              r: 4,
              fill: "rgb(var(--color-clay))",
              stroke: "rgb(var(--color-surface))",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
