// pharmacy-web/src/components/common/StyledSelect.jsx (do not remove this comment)
// pharmacy-web/src/components/common/StyledSelect.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

const StyledSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  error,
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

    // Decide: open downward or upward
    const openUpward =
      spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > spaceBelow;

    // Clamp left so dropdown doesn't overflow right edge
    const dropdownWidth = Math.max(rect.width, 160);
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

  // Close on scroll (but not if scrolling inside dropdown) and update on resize
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = (e) => {
      // Don't close if scrolling inside the dropdown itself
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
  const isActive = Boolean(value);

  const dropdown =
    isOpen && dropdownPosition
      ? createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl
                       animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col overflow-hidden"
            style={{
              top: dropdownPosition.openUpward ? "auto" : dropdownPosition.top,
              bottom: dropdownPosition.openUpward
                ? dropdownPosition.bottom
                : "auto",
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: dropdownPosition.maxHeight,
            }}
          >
            {/* Scrollable list */}
            <div className="overflow-y-auto overscroll-contain flex-1 py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between
                               transition-colors
                               ${
                                 value === option.value
                                   ? "bg-indigo-50 text-indigo-700"
                                   : "text-gray-700 hover:bg-gray-50"
                               }`}
                >
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check
                      size={14}
                      className="text-indigo-600 flex-shrink-0 ml-2"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs text-gray-500 font-medium">{label}</label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full h-10 px-3 border rounded-lg text-sm text-left
                   flex items-center justify-between gap-2 shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                   transition-all duration-200 ease-in-out
                   disabled:opacity-50 disabled:cursor-not-allowed
                   ${
                     error
                       ? "border-red-500 bg-red-50"
                       : isActive
                         ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                         : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                   }`}
      >
        <span
          className={`flex-1 truncate ${selectedOption ? "" : "text-gray-400"}`}
        >
          {selectedOption?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`flex-shrink-0 transition-transform duration-200
                     ${isOpen ? "rotate-180" : ""}
                     ${isActive ? "text-indigo-500" : "text-gray-400"}`}
        />
      </button>

      {/* Error Message */}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Dropdown Portal */}
      {dropdown}
    </div>
  );
};

export default StyledSelect;
