// cadmin-web/src/pages/marketplace/Pricing/comps/commission/InfoTooltip.jsx (do not remove this comment)

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

/**
 * Hover/click-triggered info tooltip.
 * Shows a small info icon next to a label. On hover (desktop) or click (mobile),
 * reveals a dark explanatory popover.
 *
 * Props:
 *   - content: ReactNode — the explanation text/JSX
 *   - size: number — icon size (default 13)
 *   - position: "top" | "bottom" | "left" | "right" (default "bottom")
 *   - width: string — tailwind width class (default "w-72")
 */
export const InfoTooltip = ({
  content,
  size = 13,
  position = "bottom",
  width = "w-72",
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const positionClasses = {
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
    left: "right-full mr-2 top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    bottom:
      "absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45",
    top: "absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45",
    right:
      "absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45",
    left: "absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45",
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center text-gray-400 hover:text-[#05015A] transition-colors cursor-help"
        aria-label="More information"
      >
        <Info size={size} />
      </button>

      {open && (
        <div
          ref={popoverRef}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={`absolute z-50 ${positionClasses[position]} ${width}`}
        >
          <div className={arrowClasses[position]} />
          <div className="relative bg-gray-900 text-white text-[11px] leading-relaxed rounded-lg shadow-xl px-3.5 py-2.5">
            {content}
          </div>
        </div>
      )}
    </span>
  );
};

export default InfoTooltip;