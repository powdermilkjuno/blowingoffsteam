"use client";

import { useState } from "react";

export default function Toggle({ defaultChecked = false, label, description, id }) {
  const [on, setOn] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <div>
        <label htmlFor={id} className="block text-sm text-paper">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => setOn((v) => !v)}
        className={`relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
          on ? "border-signal bg-signal/30" : "border-line bg-surface"
        }`}
      >
        <span
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${
            on ? "left-6 bg-signal" : "left-1 bg-fern"
          }`}
        />
      </button>
    </div>
  );
}
