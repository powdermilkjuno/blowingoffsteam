export default function StatPill({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-sm border border-line bg-surface px-4 py-3.5">
      <span className="absolute inset-y-0 left-0 w-0.5 bg-clay" aria-hidden="true" />
      <p className="text-xs tracking-wide text-fern">{label}</p>
      <p className="mt-1.5 text-2xl tracking-tight text-paper">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}
