"use client";

import { useRef } from "react";

export function AccessibleTabs({
  tabs,
  value,
  onChange,
  label,
  className = "",
  renderLabel
}: {
  tabs: readonly string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  renderLabel?: (tab: string) => React.ReactNode;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const select = (index: number) => {
    const nextIndex = (index + tabs.length) % tabs.length;
    onChange(tabs[nextIndex]);
    window.requestAnimationFrame(() => buttons.current[nextIndex]?.focus());
  };

  return (
    <div className={`page-tabs ${className}`.trim()} role="tablist" aria-label={label}>
      {tabs.map((tab, index) => (
        <button
          key={tab}
          ref={(node) => { buttons.current[index] = node; }}
          type="button"
          role="tab"
          aria-selected={value === tab}
          tabIndex={value === tab ? 0 : -1}
          className={value === tab ? "active" : ""}
          onClick={() => onChange(tab)}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              select(index + 1);
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              select(index - 1);
            } else if (event.key === "Home") {
              event.preventDefault();
              select(0);
            } else if (event.key === "End") {
              event.preventDefault();
              select(tabs.length - 1);
            }
          }}
        >
          {renderLabel ? renderLabel(tab) : tab}
        </button>
      ))}
    </div>
  );
}

