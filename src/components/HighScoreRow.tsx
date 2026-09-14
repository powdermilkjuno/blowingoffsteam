import Image from "next/image";

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}TH`;
  switch (n % 10) {
    case 1:
      return `${n}ST`;
    case 2:
      return `${n}ND`;
    case 3:
      return `${n}RD`;
    default:
      return `${n}TH`;
  }
}

function initials(name: string): string {
  return name
    .split(/[_\s.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function Trend({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-muted">—</span>;
  }
  const up = delta > 0;
  return (
    <span className={up ? "text-signal" : "text-danger"}>
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}

export default function HighScoreRow({
  rank,
  name,
  hours,
  avatarUrl,
  delta = 0,
  isUser = false,
  detailed = false,
}: {
  rank: number;
  name: string;
  hours: number;
  avatarUrl?: string;
  delta?: number;
  isUser?: boolean;
  detailed?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 font-pixel text-[11px] tracking-wide ${
        isUser
          ? "bg-signal/15 text-signal"
          : "text-paper hover:bg-surface/80"
      }`}
    >
      <span
        className={`w-14 flex-shrink-0 tabular-nums ${
          !isUser && rank <= 3 ? "text-clay" : ""
        }`}
      >
        {ordinal(rank)}
      </span>

      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 flex-shrink-0 rounded object-cover"
        />
      ) : (
        <span
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded font-mono text-[10px] tracking-normal ${
            isUser ? "bg-signal/25 text-signal" : "bg-moss/70 text-paper"
          }`}
        >
          {initials(name)}
        </span>
      )}

      <span className="flex-1 truncate normal-case">{name}</span>
      {detailed ? (
        <span className="hidden w-16 flex-shrink-0 text-right text-[9px] sm:block">
          <Trend delta={delta} />
        </span>
      ) : null}
      <span className="w-24 flex-shrink-0 text-right tabular-nums">{hours}h</span>
    </div>
  );
}
