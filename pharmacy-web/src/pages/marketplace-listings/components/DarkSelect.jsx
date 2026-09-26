// pharmacy-web/src/pages/marketplace-listings/components/DarkSelect.jsx (do not remove this comment)
// src/pages/marketplace-listings/components/DarkSelect.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

const DarkSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  prefix = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const DROPDOWN_MAX_HEIGHT = 240;
    const MARGIN = 4;

    const spaceBelow = viewportHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;

    const openUpward =
      spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;

    const dropdownWidth = Math.max(rect.width, 180);
    const clampedLeft = Math.min(rect.left, viewportWidth - dropdownWidth - 8);

    setDropdownPosition({
      width: dropdownWidth,
      left: clampedLeft,
      ...(openUpward
        ? {
            bottom: viewportHeight - rect.top + MARGIN,
            top: "auto",
            openUpward: true,
          }
        : {
            top: rect.bottom + MARGIN,
            bottom: "auto",
            openUpward: false,
          }),
      maxHeight: openUpward
        ? Math.min(spaceAbove, DROPDOWN_MAX_HEIGHT)
        : Math.min(spaceBelow, DROPDOWN_MAX_HEIGHT),
    });
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) updatePosition();
    setIsOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on scroll / update on resize
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setIsOpen(false);
    };
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

  const selectedOption = options.find((opt) => opt.value === value);
  const isActive = Boolean(value) && value !== "all";

  // ── Portal Dropdown ──
  const dropdown =
    isOpen && dropdownPosition
      ? createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] rounded-xl shadow-2xl shadow-black/70 overflow-hidden border flex flex-col bg-[#0d0b2e] border-white/[0.12]"
            style={{
              top: dropdownPosition.openUpward
                ? "auto"
                : dropdownPosition.top,
              bottom: dropdownPosition.openUpward
                ? dropdownPosition.bottom
                : "auto",
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: dropdownPosition.maxHeight,
            }}
          >
            <div className="overflow-y-auto overscroll-contain flex-1 py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between transition-colors ${
                    value === option.value
                      ? "bg-white/[0.08] text-white"
                      : "text-white/60 hover:bg-white/[0.05] hover:text-white/80"
                  }`}
                >
                  <span className="truncate">
                    {option.label}
                  </span>
                  {value === option.value && (
                    <Check
                      size={13}
                      className="text-emerald-400 flex-shrink-0 ml-2"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* ── Trigger ── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`h-9 px-3 rounded-lg text-xs text-left flex items-center gap-2 border transition-all whitespace-nowrap
          disabled:opacity-40 disabled:cursor-not-allowed
          ${
            isActive
              ? "bg-white/[0.08] border-white/[0.15] text-white font-semibold"
              : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:bg-white/[0.06] hover:border-white/[0.12]"
          }
          ${isOpen ? "border-white/20 bg-white/[0.07]" : ""}
        `}
      >
        <span className="truncate">
          {selectedOption
            ? `${prefix}${selectedOption.label}`
            : placeholder}
        </span>
        <ChevronDown
          size={13}
          className={`flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          } ${isActive ? "text-white/50" : "text-white/25"}`}
        />
      </button>

      {/* ── Dropdown Portal ── */}
      {dropdown}
    </>
  );
};

export default DarkSelect;