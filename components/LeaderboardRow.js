function initials(name) {
  return name
    .split(/[_\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function Trend({ delta }) {
  if (delta === 0) {
    return <span className="text-muted">—</span>;
  }
  const up = delta > 0;
  return (
    <span className={up ? "text-signal" : "text-danger"}>
      {up ? "▲" : "▼"} {Math.abs(delta)}
    </span>
  );
}

export default function LeaderboardRow({
  rank,
  name,
  hours,
  delta = 0,
  isUser = false,
  detailed = false,
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded px-3 py-3 ${
        isUser ? "bg-raised ring-1 ring-signal/40" : ""
      }`}
    >
      <span
        className={`w-5 flex-shrink-0 font-pixel text-[11px] leading-none tabular-nums ${
          rank <= 3 ? "text-signal" : "text-muted"
        }`}
      >
        {rank}
      </span>

      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded bg-moss/60 text-[11px] text-paper">
        {initials(name)}
      </span>

      <span
        className={`flex-1 truncate font-pixel text-[11px] leading-none ${
          isUser ? "text-signal" : "text-paper"
        }`}
      >
        {name}
        {isUser ? (
          <span className="ml-2 font-mono text-xs normal-case text-muted">(you)</span>
        ) : null}
      </span>

      {detailed ? (
        <span className="hidden w-20 flex-shrink-0 text-right font-pixel text-[9px] leading-none text-muted sm:block">
          <Trend delta={delta} />
        </span>
      ) : null}

      <span className="w-16 flex-shrink-0 text-right font-pixel text-[11px] leading-none tabular-nums text-paper">
        {hours}h
      </span>
    </div>
  );
}
