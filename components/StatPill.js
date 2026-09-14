export default function StatPill({ label, value, sub }) {
  return (
    <div className="rounded-md border border-line bg-surface px-4 py-3.5">
      <p className="text-xs text-fern">{label}</p>
      <p className="mt-1.5 text-2xl tracking-tight text-paper">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}
