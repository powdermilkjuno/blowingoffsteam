import type { InputHTMLAttributes, ReactNode } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  hint?: ReactNode;
  id: string;
};

export default function Field({
  label,
  hint,
  id,
  type = "text",
  placeholder,
  ...props
}: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 block text-xs text-fern">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        className="w-full rounded border border-line bg-surface px-3.5 py-3 text-sm text-paper outline-none transition-colors placeholder:text-muted/60 focus:border-signal"
        {...props}
      />
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
