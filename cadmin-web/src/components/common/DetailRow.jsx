// cadmin-web/src/components/common/DetailRow.jsx (do not remove this comment)
// Q:\YourZeroesAndOnes\cureli\curely_erp\cadmin-web\src\components\common\DetailRow.jsx

import {
  Pencil,
  ClipboardCopy,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  ChevronDown,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const DetailRow = ({
  label,
  value,
  isEditing,
  fieldName,
  type = "text", // text | select | status | verification | onboarding
  options = [],
  onChange,
  disabled = false,
  helperText = null,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);

  const selectTriggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleCopy = () => {
    const textValue = typeof value === "string" ? value : String(value);
    navigator.clipboard.writeText(textValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleInputChange = (e) => {
    if (!disabled) {
      onChange?.(e.target.value);
    }
  };

  const handleSelectChange = (val) => {
    if (!disabled) {
      onChange?.(val);
      setIsSelectOpen(false);
    }
  };

  // Calculate dropdown position before opening
  const updateDropdownPosition = useCallback(() => {
    if (selectTriggerRef.current) {
      const rect = selectTriggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleSelectToggle = () => {
    if (disabled) return;
    if (!isSelectOpen) {
      updateDropdownPosition();
    }
    setIsSelectOpen(!isSelectOpen);
  };

  // Close on outside click
  useEffect(() => {
    if (!isSelectOpen) return;

    const handleClickOutside = (e) => {
      if (
        selectTriggerRef.current &&
        !selectTriggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelectOpen]);

  // Close on scroll and update position on resize
  useEffect(() => {
    if (!isSelectOpen) return;

    const handleScroll = () => setIsSelectOpen(false);
    const handleResize = () => updateDropdownPosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isSelectOpen, updateDropdownPosition]);

  // Get selected option label
  const selectedOptionLabel =
    options.find((o) => o.value === value)?.label || value;

  // Render status badge
  const renderStatusBadge = (status) => {
    const statusLower = status?.toString().toLowerCase();
    let styles = "bg-gray-100 text-gray-700";
    let icon = null;

    if (
      statusLower === "active" ||
      statusLower === "yes" ||
      statusLower === "paid"
    ) {
      styles = "bg-emerald-100 text-emerald-700";
      icon = <CheckCircle size={12} />;
    } else if (
      statusLower === "suspended" ||
      statusLower === "inactive" ||
      statusLower === "no"
    ) {
      styles = "bg-red-100 text-red-700";
      icon = <XCircle size={12} />;
    } else if (statusLower === "pending" || statusLower === "pending setup") {
      styles = "bg-orange-100 text-orange-700";
      icon = <Clock size={12} />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}
      >
        {icon}
        {status}
      </span>
    );
  };

  // Render verification badge
  const renderVerificationBadge = (status) => {
    const statusLower = status?.toLowerCase();
    let styles = "bg-orange-100 text-orange-700";
    let icon = <Clock size={12} />;

    if (statusLower === "verified") {
      styles = "bg-emerald-100 text-emerald-700";
      icon = <CheckCircle size={12} />;
    } else if (statusLower === "rejected") {
      styles = "bg-red-100 text-red-700";
      icon = <XCircle size={12} />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}
      >
        {icon}
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
    );
  };

  // Render onboarding status badge
  const renderOnboardingBadge = (status) => {
    const statusLower = status?.toLowerCase();
    let styles = "bg-blue-100 text-blue-700";
    let icon = <Clock size={12} />;

    if (
      statusLower === "verified" ||
      statusLower === "completed" ||
      statusLower === "active"
    ) {
      styles = "bg-emerald-100 text-emerald-700";
      icon = <CheckCircle size={12} />;
    } else if (statusLower?.includes("pending")) {
      styles = "bg-orange-100 text-orange-700";
      icon = <Clock size={12} />;
    } else if (statusLower === "rejected") {
      styles = "bg-red-100 text-red-700";
      icon = <XCircle size={12} />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}
      >
        {icon}
        {status}
      </span>
    );
  };

  // Render custom select dropdown via portal
  const renderSelectDropdown = () => {
    if (!isSelectOpen || !dropdownPosition) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 overflow-hidden"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          minWidth: dropdownPosition.width,
        }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelectChange(option.value)}
            className={`
              w-full px-4 py-2.5 text-sm text-left flex items-center justify-between
              transition-colors duration-150
              ${
                value === option.value
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <span>{option.label}</span>
            {value === option.value && (
              <Check size={14} className="text-indigo-600 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>,
      document.body,
    );
  };

  return (
    <div className="flex flex-col gap-1 py-2 group">
      <div className="flex items-center gap-0">
        {/* Label */}
        <label className="w-36 text-sm font-medium text-gray-500 flex-shrink-0 flex items-center gap-1">
          {label}
          {disabled && isEditing && (
            <Lock size={12} className="text-gray-400" />
          )}
        </label>

        {/* Value */}
        <div className="flex-1 relative">
          {/* Status Badge */}
          {type === "status" && !isEditing && (
            <div className="px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200">
              {renderStatusBadge(value)}
            </div>
          )}

          {/* Verification Badge */}
          {type === "verification" && !isEditing && (
            <div className="px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200">
              {renderVerificationBadge(value)}
            </div>
          )}

          {/* Onboarding Badge */}
          {type === "onboarding" && !isEditing && (
            <div className="px-4 py-2.5 rounded-lg text-sm bg-white border border-gray-200">
              {renderOnboardingBadge(value)}
            </div>
          )}

          {/* Select Field - Editable (Custom Styled) */}
          {type === "select" && isEditing && !disabled && (
            <>
              <button
                ref={selectTriggerRef}
                type="button"
                onClick={handleSelectToggle}
                className={`
                  w-full px-4 py-2.5 pr-10 rounded-lg text-sm text-left
                  flex items-center justify-between
                  transition-all duration-200 shadow-sm
                  ${
                    isSelectOpen
                      ? "bg-white border-2 border-indigo-500 ring-2 ring-indigo-500/20"
                      : "bg-white border-2 border-indigo-500 hover:border-indigo-600"
                  }
                `}
              >
                <span className={value ? "text-gray-900" : "text-gray-400"}>
                  {selectedOptionLabel || `Select ${label}`}
                </span>
                <ChevronDown
                  size={16}
                  className={`
                    absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500
                    transition-transform duration-200
                    ${isSelectOpen ? "rotate-180" : ""}
                  `}
                />
              </button>
              {renderSelectDropdown()}
            </>
          )}

          {/* Select Field - Disabled/Locked */}
          {type === "select" && isEditing && disabled && (
            <div className="relative">
              <input
                type="text"
                value={selectedOptionLabel}
                readOnly
                className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm bg-gray-100 border border-gray-300 
                           text-gray-500 cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Lock size={14} className="text-gray-400" />
              </div>
            </div>
          )}

          {/* Select Field - Read only (not editing) */}
          {type === "select" && !isEditing && (
            <input
              type="text"
              value={selectedOptionLabel}
              readOnly
              className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm bg-white border border-gray-200 
                         text-gray-700 cursor-default"
            />
          )}

          {/* Text Input - Editable or Read-only */}
          {type === "text" && (
            <input
              type="text"
              name={fieldName}
              value={value || ""}
              onChange={isEditing && !disabled ? handleInputChange : undefined}
              readOnly={!isEditing || disabled}
              className={`
                w-full px-4 py-2.5 pr-10 rounded-lg text-sm transition-all duration-200
                ${
                  isEditing && !disabled
                    ? "bg-white border-2 border-indigo-500 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    : disabled && isEditing
                      ? "bg-gray-100 border border-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-white border border-gray-200 text-gray-700 cursor-default"
                }
              `}
            />
          )}

          {/* Copy Button - Only in read mode for text */}
          {!isEditing && type === "text" && value && (
            <button
              onClick={handleCopy}
              className="
                absolute right-3 top-1/2 -translate-y-1/2 opacity-0
                group-hover:opacity-100 transition-opacity duration-150
                text-gray-400 hover:text-indigo-500
              "
            >
              <ClipboardCopy size={16} />
            </button>
          )}

          {/* Edit Icon - Only in edit mode for editable text */}
          {isEditing && type === "text" && !disabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Pencil size={14} className="text-indigo-400" />
            </div>
          )}

          {/* Lock Icon - For disabled text fields in edit mode */}
          {isEditing && type === "text" && disabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Lock size={14} className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Copy feedback */}
        {copied && <span className="text-xs text-green-600 ml-2">Copied</span>}
      </div>

      {/* Helper Text */}
      {helperText && (
        <div className="ml-40 text-xs text-amber-600 flex items-center gap-1">
          <Lock size={10} />
          {helperText}
        </div>
      )}
    </div>
  );
};

export default DetailRow;
