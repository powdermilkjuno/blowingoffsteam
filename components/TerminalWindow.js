export default function TerminalWindow({ title, children, className = "" }) {
  return (
    <div className={`overflow-hidden rounded-md border border-line bg-surface ${className}`}>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-moss" />
        <span className="h-2 w-2 rounded-full bg-moss" />
        <span className="h-2 w-2 rounded-full bg-moss" />
        {title ? (
          <span className="ml-2 text-xs text-muted">{title}</span>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
