"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

interface ScrollableSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const ScrollableSelect: React.FC<ScrollableSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = "Select",
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full border-2 border-my-grey bg-background px-3 py-2 font-mono text-sm",
          "flex items-center justify-between text-left",
          disabled && "opacity-60 cursor-not-allowed",
        )}
      >
        <span className={cn(!selected && "text-gray-500")}>
          {selected?.label ?? placeholder}
        </span>
        <span className="ml-2 text-xs">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1 z-40 border-2 border-my-grey bg-background shadow-[4px_4px_0_0_#9ea393]">
          <div className="max-h-64 overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 font-mono text-sm text-gray-500">
                No options
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left font-mono text-sm",
                    "hover:bg-my-grey/30 transition-colors",
                    option.value === value && "bg-my-grey/40 font-medium",
                  )}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScrollableSelect;
