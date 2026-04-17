import { ReactNode } from "react";

interface TooltipProps {
  label: string;
  children: ReactNode;
  position?: "top" | "bottom";
}

export default function Tooltip({ label, children, position = "top" }: TooltipProps) {
  return (
    <div className="relative group/tooltip inline-flex">
      {children}
      <div
        className={`pointer-events-none absolute z-50 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 ${
          position === "top"
            ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
            : "top-full mt-2 left-1/2 -translate-x-1/2"
        }`}
      >
        <div className="bg-neutral-900 border border-white/10 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
          {label}
        </div>
        {position === "top" ? (
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-neutral-900 -mt-px" />
        ) : (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-neutral-900 -mb-px" />
        )}
      </div>
    </div>
  );
}
