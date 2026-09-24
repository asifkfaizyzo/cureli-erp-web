// pharmacy-web/src/components/common/SupplierModal.jsx (do not remove this comment)
// src/pages/suppliers/components/SupplierModal.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Save,
  User,
  CreditCard,
  Users,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Hash,
  FileText,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building,
  Globe,
  Shield,
  Clock,
  Plus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Check,
  AlertTriangle,
  Info,
  PackagePlus,
  ArrowRight,
} from "lucide-react";
import { useToast } from "../../../components/common/Toast";
import { useMenuStore } from "../../../store/useMenuStore";

// ============================================
// VALIDATION UTILITIES WITH SPECIFIC MESSAGES
// ============================================

/**
 * GST Number Validation
 * Format: 22AAAAA0000A1Z5
 */
const validateGSTNumber = (gst) => {
  if (!gst || gst.trim() === "") {
    return { isValid: false, error: "GST Number is required" };
  }

  const cleanGST = gst.toUpperCase().trim();

  if (cleanGST.length < 15) {
    return {
      isValid: false,
      error: `GST Number must be 15 characters (currently ${cleanGST.length})`,
    };
  }

  if (cleanGST.length > 15) {
    return { isValid: false, error: "GST Number cannot exceed 15 characters" };
  }

  // Check first 2 characters are digits (state code)
  if (!/^[0-9]{2}/.test(cleanGST)) {
    return {
      isValid: false,
      error: "GST must start with 2-digit state code (01-37)",
    };
  }

  // Validate state code range
  const stateCode = parseInt(cleanGST.substring(0, 2));
  if (stateCode < 1 || stateCode > 37) {
    return {
      isValid: false,
      error: `Invalid state code "${stateCode}". Must be between 01-37`,
    };
  }

  // Check next 5 characters are letters (PAN first part)
  if (!/^[0-9]{2}[A-Z]{5}/.test(cleanGST)) {
    return {
      isValid: false,
      error: "Characters 3-7 must be letters (PAN code)",
    };
  }

  // Check next 4 characters are digits
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}/.test(cleanGST)) {
    return { isValid: false, error: "Characters 8-11 must be digits" };
  }

  // Check 12th character is a letter
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]/.test(cleanGST)) {
    return { isValid: false, error: "Character 12 must be a letter" };
  }

  // Check 13th character is alphanumeric
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]/.test(cleanGST)) {
    return {
      isValid: false,
      error: "Character 13 must be alphanumeric (1-9 or A-Z)",
    };
  }

  // Check 14th character is Z
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z/.test(cleanGST)) {
    return { isValid: false, error: 'Character 14 must be "Z"' };
  }

  // Full pattern validation
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(cleanGST)) {
    return {
      isValid: false,
      error: "Invalid GST format. Example: 27AABCA1234C1Z5",
    };
  }

  return { isValid: true, error: null };
};

/**
 * Drug License Number Validation
 */
const validateDrugLicense = (license) => {
  if (!license || license.trim() === "") {
    return { isValid: false, error: "Drug License Number is required" };
  }

  const cleanLicense = license.toUpperCase().trim();

  if (cleanLicense.length < 5) {
    return {
      isValid: false,
      error: `Drug License too short (min 5 characters, currently ${cleanLicense.length})`,
    };
  }

  if (cleanLicense.length > 25) {
    return {
      isValid: false,
      error: "Drug License too long (max 25 characters)",
    };
  }

  // Check for at least some alphanumeric pattern
  if (!/[A-Z]/.test(cleanLicense) && !/[0-9]/.test(cleanLicense)) {
    return {
      isValid: false,
      error: "Drug License must contain letters or numbers",
    };
  }

  // Must contain at least one letter and one number
  if (!/[A-Z]/.test(cleanLicense)) {
    return {
      isValid: false,
      error: "Drug License must contain at least one letter",
    };
  }

  if (!/[0-9]/.test(cleanLicense)) {
    return {
      isValid: false,
      error: "Drug License must contain at least one number",
    };
  }

  // Check for valid patterns
  const validPatterns = [
    /^DL[-/]?[A-Z0-9]{2,4}[-/]?[A-Z0-9]{2,4}[-/]?[A-Z0-9]{4,10}$/i,
    /^(20|21)[AB][-/]?[A-Z0-9]{4,15}$/i,
    /^[A-Z]{2,3}[-/]?[0-9]{2,4}[-/]?[A-Z0-9]{4,15}$/i,
    /^[A-Z0-9]{5,20}$/i,
  ];

  const isValidFormat = validPatterns.some((pattern) =>
    pattern.test(cleanLicense),
  );

  if (!isValidFormat) {
    return {
      isValid: false,
      error:
        "Invalid format. Examples: DL-DEL-20B-123456, 21B123456, MH20B123456",
    };
  }

  return { isValid: true, error: null };
};

/**
 * Phone Number Validation (Indian format)
 */
const validatePhoneNumber = (phone) => {
  if (!phone || phone.trim() === "") {
    return { isValid: false, error: "Office Phone is required" };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, "");

  if (digitsOnly.length === 0) {
    return { isValid: false, error: "Phone number must contain digits" };
  }

  if (digitsOnly.length < 8) {
    return {
      isValid: false,
      error: `Phone number too short (min 8 digits, currently ${digitsOnly.length})`,
    };
  }

  if (digitsOnly.length > 12) {
    return {
      isValid: false,
      error: `Phone number too long (max 12 digits, currently ${digitsOnly.length})`,
    };
  }

  // Remove +91 or 91 prefix for validation
  let normalizedPhone = digitsOnly;
  if (normalizedPhone.startsWith("91") && normalizedPhone.length > 10) {
    normalizedPhone = normalizedPhone.substring(2);
  }

  // Mobile number: 10 digits starting with 6-9
  if (normalizedPhone.length === 10) {
    if (!/^[6-9]/.test(normalizedPhone)) {
      return {
        isValid: false,
        error: "Mobile number must start with 6, 7, 8, or 9",
      };
    }
    return { isValid: true, error: null };
  }

  // Landline with STD code: 8-11 digits
  if (normalizedPhone.length >= 8 && normalizedPhone.length <= 11) {
    return { isValid: true, error: null };
  }

  return {
    isValid: false,
    error: "Enter 10-digit mobile or landline with STD code",
  };
};

/**
 * Email Validation
 */
const validateEmail = (email) => {
  if (!email || email.trim() === "") {
    return { isValid: true, error: null }; // Optional field
  }

  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail.length < 5) {
    return { isValid: false, error: "Email is too short" };
  }

  if (!trimmedEmail.includes("@")) {
    return { isValid: false, error: "Email must contain @ symbol" };
  }

  if (!trimmedEmail.includes(".")) {
    return {
      isValid: false,
      error: "Email must contain a domain (e.g., .com)",
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: "Invalid email format. Example: name@company.com",
    };
  }

  return { isValid: true, error: null };
};

/**
 * IFSC Code Validation
 */
const validateIFSC = (ifsc) => {
  if (!ifsc || ifsc.trim() === "") {
    return { isValid: true, error: null }; // Optional field
  }

  const cleanIFSC = ifsc.toUpperCase().trim();

  if (cleanIFSC.length !== 11) {
    return {
      isValid: false,
      error: `IFSC must be 11 characters (currently ${cleanIFSC.length})`,
    };
  }

  // First 4 characters must be letters (bank code)
  if (!/^[A-Z]{4}/.test(cleanIFSC)) {
    return {
      isValid: false,
      error: "First 4 characters must be letters (bank code)",
    };
  }

  // 5th character must be 0
  if (cleanIFSC[4] !== "0") {
    return { isValid: false, error: '5th character must be "0"' };
  }

  // Last 6 characters must be alphanumeric (branch code)
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIFSC)) {
    return {
      isValid: false,
      error: "Last 6 characters must be alphanumeric (branch code)",
    };
  }

  return { isValid: true, error: null };
};

/**
 * PAN Number Validation
 */
const validatePAN = (pan) => {
  if (!pan || pan.trim() === "") {
    return { isValid: true, error: null }; // Optional field
  }

  const cleanPAN = pan.toUpperCase().trim();

  if (cleanPAN.length !== 10) {
    return {
      isValid: false,
      error: `PAN must be 10 characters (currently ${cleanPAN.length})`,
    };
  }

  // First 5 characters must be letters
  if (!/^[A-Z]{5}/.test(cleanPAN)) {
    return { isValid: false, error: "First 5 characters must be letters" };
  }

  // Next 4 characters must be digits
  if (!/^[A-Z]{5}[0-9]{4}/.test(cleanPAN)) {
    return { isValid: false, error: "Characters 6-9 must be digits" };
  }

  // Last character must be a letter
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPAN)) {
    return { isValid: false, error: "Last character must be a letter" };
  }

  return { isValid: true, error: null };
};

/**
 * Pincode Validation
 */
const validatePincode = (pincode) => {
  if (!pincode || pincode.trim() === "") {
    return { isValid: true, error: null }; // Optional field
  }

  const cleanPincode = pincode.replace(/\D/g, "");

  if (cleanPincode.length !== 6) {
    return {
      isValid: false,
      error: `Pincode must be 6 digits (currently ${cleanPincode.length})`,
    };
  }

  // First digit cannot be 0
  if (cleanPincode[0] === "0") {
    return { isValid: false, error: "Pincode cannot start with 0" };
  }

  return { isValid: true, error: null };
};

// ============================================
// INPUT SANITIZERS
// ============================================

const sanitizePhone = (value) => {
  return value.replace(/[^\d\+\-\s\(\)]/g, "").slice(0, 15);
};

const sanitizeGST = (value) => {
  return value
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 15);
};

const sanitizeDrugLicense = (value) => {
  return value
    .replace(/[^A-Za-z0-9\-\/]/g, "")
    .toUpperCase()
    .slice(0, 25);
};

const sanitizePAN = (value) => {
  return value
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 10);
};

const sanitizeIFSC = (value) => {
  return value
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 11);
};

const sanitizePincode = (value) => {
  return value.replace(/\D/g, "").slice(0, 6);
};

const sanitizeAccountNumber = (value) => {
  return value.replace(/\D/g, "").slice(0, 18);
};

const sanitizeNumber = (value) => {
  return value.replace(/\D/g, "");
};

// Animation Variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: { opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.15 } },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

//  RESPONSIVE ROW COUNT HOOK
const useResponsiveTableRows = () => {
  const [config, setConfig] = useState({
    visibleRows: 4,
    rowHeight: 56,
    isMobile: false,
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let visibleRows = 4;
      let rowHeight = 56;
      let isMobile = false;

      if (width < 768) {
        visibleRows = Math.floor((height * 0.4) / 100);
        rowHeight = 100;
        isMobile = true;
      } else if (width >= 2560) {
        visibleRows = 8;
        rowHeight = 60;
      } else if (width >= 1920) {
        visibleRows = 6;
        rowHeight = 58;
      } else if (width >= 1440) {
        visibleRows = 5;
        rowHeight = 56;
      } else if (width >= 1280) {
        visibleRows = 4;
        rowHeight = 54;
      } else {
        visibleRows = 3;
        rowHeight = 52;
      }

      setConfig({ visibleRows, rowHeight, isMobile });
    };

    updateConfig();
    window.addEventListener("resize", updateConfig);
    return () => window.removeEventListener("resize", updateConfig);
  }, []);

  return config;
};

// ============================================
// ENHANCED FORM FIELD COMPONENT
// ============================================
const FormField = ({
  label,
  value,
  editable,
  onChange,
  required,
  type = "text",
  icon: Icon,
  placeholder,
  error,
  fieldError,
  success,
  hint,
  className = "",
  inputClassName = "",
  multiline = false,
  rows = 3,
  validationFn,
  sanitizeFn,
  showValidation = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState(null);

  const hasValue = value && value.toString().trim().length > 0;

  const displayError = fieldError || localError;
  const showError = (touched || fieldError) && displayError && !isFocused;
  const isValid = hasValue && !displayError && showValidation;

  const handleChange = (e) => {
    let newValue = e.target.value;

    if (sanitizeFn) {
      newValue = sanitizeFn(newValue);
    }

    onChange?.(newValue);

    if (localError) {
      setLocalError(null);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTouched(true);

    if (validationFn && (hasValue || required)) {
      const result = validationFn(value);
      setLocalError(result.error);
    } else if (required && !hasValue) {
      setLocalError(`${label} is required`);
    } else {
      setLocalError(null);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  useEffect(() => {
    if (!value && !hasValue) {
      setLocalError(null);
    }
  }, [value, hasValue]);

  return (
    <div className={`relative ${className}`}>
      <label
        className={`
        flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-1.5
        ${isFocused ? "text-indigo-600" : showError ? "text-red-500" : isValid && touched ? "text-emerald-600" : "text-slate-500"}
        transition-colors duration-200
      `}
      >
        {Icon && <Icon size={12} strokeWidth={2} />}
        <span>{label}</span>
        {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative">
        {editable ? (
          multiline ? (
            <textarea
              value={value || ""}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              rows={rows}
              placeholder={placeholder}
              className={`
                w-full text-sm font-medium text-slate-800 bg-white 
                border rounded-lg px-3 py-2.5 resize-none
                transition-all duration-200 outline-none
                ${
                  isFocused
                    ? "border-indigo-400 ring-2 ring-indigo-100 shadow-sm"
                    : showError
                      ? "border-red-300 bg-red-50/50"
                      : isValid && touched
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-200 hover:border-slate-300"
                }
                ${inputClassName}
              `}
            />
          ) : (
            <input
              type={type}
              value={value || ""}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              className={`
                w-full h-10 text-sm font-medium text-slate-800 bg-white 
                border rounded-lg px-3 pr-10
                transition-all duration-200 outline-none
                ${
                  isFocused
                    ? "border-indigo-400 ring-2 ring-indigo-100 shadow-sm"
                    : showError
                      ? "border-red-300 bg-red-50/50"
                      : isValid && touched
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-200 hover:border-slate-300"
                }
                ${inputClassName}
              `}
            />
          )
        ) : (
          <div
            className={`
            w-full min-h-[40px] text-sm font-medium text-slate-700 
            bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5
            flex items-center
          `}
          >
            {value || <span className="text-slate-400">—</span>}
          </div>
        )}

        {editable && !multiline && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isValid && touched && !isFocused && (
              <CheckCircle2 size={16} className="text-emerald-500" />
            )}
            {showError && <AlertCircle size={16} className="text-red-400" />}
          </div>
        )}
      </div>

      <div className="min-h-[18px] mt-1">
        {showError ? (
          <p className="text-[10px] text-red-500 flex items-start gap-1">
            <AlertTriangle size={10} className="mt-0.5 shrink-0" />
            <span>{displayError}</span>
          </p>
        ) : hint && isFocused ? (
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <Info size={10} />
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
};

// Section Header Component
const SectionHeader = ({ icon: Icon, title, subtitle, badge, action }) => (
  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span
          className={`px-2 py-1 text-[10px] font-semibold rounded-full ${
            badge.includes("error")
              ? "bg-red-100 text-red-600"
              : "bg-indigo-50 text-indigo-700"
          }`}
        >
          {badge}
        </span>
      )}
      {action}
    </div>
  </div>
);

// ============================================
// EMPTY SUPPLIERS STATE COMPONENT
// ============================================
const EmptySuppliersState = ({ onAddNew, viewportHeight }) => (
  <div
    className="flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border-2 border-dashed border-slate-200"
    style={{ height: `${viewportHeight}px` }}
  >
    <div className="text-center max-w-sm mx-auto px-6">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
        <Building2 size={36} className="text-white" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        No Suppliers Found
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 mb-6">
        Your supplier directory is empty. Add your first supplier to get started
        with purchase billing.
      </p>

      {/* Action Button */}
      <button
        onClick={() => onAddNew?.("")}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <Plus size={18} />
        <span>Add First Supplier</span>
        <ArrowRight size={16} />
      </button>

      {/* Help text */}
      <p className="text-[11px] text-slate-400 mt-4">
        Or switch to the{" "}
        <span className="font-medium text-indigo-600">General Info</span> tab to
        enter details manually
      </p>
    </div>
  </div>
);

// ============================================
// SUPPLIER TABLE COMPONENT
// ============================================
const SupplierTable = ({
  suppliers,
  selectedId,
  onSelect,
  searchQuery,
  visibleRows = 4,
  rowHeight = 56,
  isMobile = false,
  onAddNew,
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const tableBodyRef = useRef(null);
  const [scrollInfo, setScrollInfo] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });

  const viewportHeight = visibleRows * rowHeight;

  const sortedSuppliers = useMemo(() => {
    const sorted = [...suppliers];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key]?.toLowerCase() || "";
      const bVal = b[sortConfig.key]?.toLowerCase() || "";
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [suppliers, sortConfig]);

  const updateScrollInfo = useCallback(() => {
    const container = tableBodyRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    setScrollInfo({
      canScrollUp: scrollTop > 5,
      canScrollDown: scrollTop + clientHeight < scrollHeight - 5,
    });
  }, []);

  useEffect(() => {
    const container = tableBodyRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateScrollInfo);
    updateScrollInfo();

    return () => container.removeEventListener("scroll", updateScrollInfo);
  }, [updateScrollInfo, suppliers.length]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const hasOverflow = suppliers.length > visibleRows;

  //  EMPTY STATE - No suppliers at all
  if (suppliers.length === 0 && !searchQuery) {
    return (
      <EmptySuppliersState
        onAddNew={onAddNew}
        viewportHeight={viewportHeight}
      />
    );
  }

  //  NO SEARCH RESULTS
  if (suppliers.length === 0 && searchQuery) {
    return (
      <div
        className="flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200"
        style={{ height: `${viewportHeight}px` }}
      >
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Search size={24} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-600">
          No suppliers match "{searchQuery}"
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Try a different search term or add a new supplier
        </p>
        {onAddNew && (
          <button
            onClick={() => onAddNew(searchQuery)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <Plus size={14} />
            Add "{searchQuery}" as new supplier
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-slate-500" />
          <span className="text-[11px] font-semibold text-slate-700">
            {suppliers.length} Suppliers
          </span>
        </div>

        {hasOverflow && (
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                tableBodyRef.current?.scrollBy({
                  top: -rowHeight * 2,
                  behavior: "smooth",
                })
              }
              disabled={!scrollInfo.canScrollUp}
              className={`p-1 rounded ${scrollInfo.canScrollUp ? "hover:bg-indigo-100 text-slate-500" : "text-slate-300 cursor-not-allowed"}`}
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() =>
                tableBodyRef.current?.scrollBy({
                  top: rowHeight * 2,
                  behavior: "smooth",
                })
              }
              disabled={!scrollInfo.canScrollDown}
              className={`p-1 rounded ${scrollInfo.canScrollDown ? "hover:bg-indigo-100 text-slate-500" : "text-slate-300 cursor-not-allowed"}`}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>

      <div
        ref={tableBodyRef}
        className="overflow-y-auto"
        style={{
          height: `${viewportHeight}px`,
          maxHeight: `${viewportHeight}px`,
        }}
      >
        {sortedSuppliers.map((supplier) => {
          const isSelected =
            selectedId === supplier.id || selectedId === supplier.supplier_id;
          return (
            <div
              key={supplier.id || supplier.supplier_id}
              onClick={() => onSelect(supplier)}
              className={`p-3 cursor-pointer border-b border-slate-100 transition-colors ${
                isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <Check size={10} className="text-white" strokeWidth={3} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${isSelected ? "text-indigo-700" : "text-slate-800"}`}
                  >
                    {supplier.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {supplier.gst ||
                        supplier.gst_number ||
                        supplier.gstNumber ||
                        "—"}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {supplier.officePhone ||
                        supplier.office_phone ||
                        supplier.contact ||
                        "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const SupplierModal = ({
  open,
  mode,
  supplier,
  onClose,
  onSave,
  saving = false,
  existingSuppliers = [], //  NEW PROP - suppliers from backend
  onNavigateToAdd, //  Optional callback to navigate to add supplier
}) => {
  const toast = useToast();
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const isNew = supplier?.supplierId === "NEW";

  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const sidebarExpanded = useMenuStore?.((s) => s.sidebarExpanded) || false;
  const { visibleRows, rowHeight, isMobile } = useResponsiveTableRows();

  //  Use suppliers from props (from backend)
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return existingSuppliers;
    const query = searchQuery.toLowerCase();
    return existingSuppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.gst?.toLowerCase().includes(query) ||
        s.gst_number?.toLowerCase().includes(query) ||
        s.gstNumber?.toLowerCase().includes(query),
    );
  }, [existingSuppliers, searchQuery]);

  //  Dynamic tabs - only show "Select Supplier" if there are existing suppliers
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "general", label: "General Info", icon: Building2 },
      { id: "contact", label: "Contact", icon: Phone },
      { id: "banking", label: "Banking", icon: Landmark },
    ];

    // Always show the existing tab, but it will show empty state if no suppliers
    baseTabs.push({
      id: "existing",
      label:
        existingSuppliers.length > 0 ? "Select Supplier" : "Browse Suppliers",
      icon: Users,
    });

    return baseTabs;
  }, [existingSuppliers.length]);

  // Initialize form data
  useEffect(() => {
    if (supplier) {
      const mappedData = {
        supplierId: supplier.supplierId || supplier.supplier_id || "NEW",
        supplier_id: supplier.supplier_id || supplier.supplierId,
        name: supplier.name || "",
        gst: supplier.gst || supplier.gst_number || supplier.gstNumber || "",
        panNumber: supplier.panNumber || supplier.pan_number || "",
        drugLicense:
          supplier.drugLicense ||
          supplier.drug_license_no ||
          supplier.drugLicenseNo ||
          "",
        website: supplier.website || "",
        address:
          supplier.address ||
          supplier.address_line_1 ||
          supplier.addressLine1 ||
          "",
        city: supplier.city || "",
        state: supplier.state || "",
        pincode: supplier.pincode || "",
        officePhone:
          supplier.officePhone ||
          supplier.office_phone ||
          supplier.contact ||
          "",
        personalPhone: supplier.personalPhone || supplier.personal_phone || "",
        email: supplier.email || "",
        contactPerson: supplier.contactPerson || supplier.contact_person || "",
        designation: supplier.designation || "",
        bankName: supplier.bankName || supplier.bank_name || "",
        branchName: supplier.branchName || "",
        accountNo:
          supplier.accountNo ||
          supplier.account_number ||
          supplier.accountNumber ||
          "",
        accountType: supplier.accountType || supplier.account_type || "",
        ifsc: supplier.ifsc || supplier.ifsc_code || supplier.ifscCode || "",
        creditDays: supplier.creditDays || supplier.credit_days || "",
        creditLimit: supplier.creditLimit || supplier.credit_limit || "",
        paymentMode: supplier.paymentMode || supplier.payment_mode || "",
      };

      setFormData(mappedData);
      setFormErrors({});
      setActiveTab("general");
      setSearchQuery("");
      setSelectedSupplierId(null);
      setAttemptedSubmit(false);
    }
  }, [supplier]);

  // ============================================
  // COMPREHENSIVE VALIDATION
  // ============================================
  const validateForm = useCallback(() => {
    const errors = {};
    const errorDetails = [];

    if (!formData.name?.trim()) {
      errors.name = "Supplier name is required";
      errorDetails.push({
        field: "Supplier Name",
        message: "Required",
        tab: "general",
      });
    }

    const gstValidation = validateGSTNumber(formData.gst);
    if (!gstValidation.isValid) {
      errors.gst = gstValidation.error;
      errorDetails.push({
        field: "GST Number",
        message: gstValidation.error,
        tab: "general",
      });
    }

    const drugLicenseValidation = validateDrugLicense(formData.drugLicense);
    if (!drugLicenseValidation.isValid) {
      errors.drugLicense = drugLicenseValidation.error;
      errorDetails.push({
        field: "Drug License",
        message: drugLicenseValidation.error,
        tab: "general",
      });
    }

    if (!formData.address?.trim()) {
      errors.address = "Business address is required";
      errorDetails.push({
        field: "Address",
        message: "Required",
        tab: "general",
      });
    }

    const phoneValidation = validatePhoneNumber(formData.officePhone);
    if (!phoneValidation.isValid) {
      errors.officePhone = phoneValidation.error;
      errorDetails.push({
        field: "Office Phone",
        message: phoneValidation.error,
        tab: "contact",
      });
    }

    if (formData.email?.trim()) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error;
        errorDetails.push({
          field: "Email",
          message: emailValidation.error,
          tab: "contact",
        });
      }
    }

    if (formData.panNumber?.trim()) {
      const panValidation = validatePAN(formData.panNumber);
      if (!panValidation.isValid) {
        errors.panNumber = panValidation.error;
        errorDetails.push({
          field: "PAN",
          message: panValidation.error,
          tab: "general",
        });
      }
    }

    if (formData.ifsc?.trim()) {
      const ifscValidation = validateIFSC(formData.ifsc);
      if (!ifscValidation.isValid) {
        errors.ifsc = ifscValidation.error;
        errorDetails.push({
          field: "IFSC",
          message: ifscValidation.error,
          tab: "banking",
        });
      }
    }

    if (formData.pincode?.trim()) {
      const pincodeValidation = validatePincode(formData.pincode);
      if (!pincodeValidation.isValid) {
        errors.pincode = pincodeValidation.error;
        errorDetails.push({
          field: "Pincode",
          message: pincodeValidation.error,
          tab: "general",
        });
      }
    }

    const firstErrorTab = errorDetails.length > 0 ? errorDetails[0].tab : null;

    return {
      errors,
      isValid: Object.keys(errors).length === 0,
      firstErrorTab,
      errorDetails,
    };
  }, [formData]);

  // Handle Save
  const handleSave = async () => {
    setAttemptedSubmit(true);
    const { errors, isValid, firstErrorTab, errorDetails } = validateForm();

    setFormErrors(errors);

    if (!isValid) {
      if (firstErrorTab) {
        setActiveTab(firstErrorTab);
      }

      if (errorDetails.length === 1) {
        toast.error(`${errorDetails[0].field} Error`, errorDetails[0].message);
      } else if (errorDetails.length <= 3) {
        const errorList = errorDetails
          .map((e) => `• ${e.field}: ${e.message}`)
          .join("\n");
        toast.error(`Please fix ${errorDetails.length} errors`, errorList);
      } else {
        const firstThree = errorDetails
          .slice(0, 3)
          .map((e) => `• ${e.field}: ${e.message}`)
          .join("\n");
        toast.error(
          `Please fix ${errorDetails.length} errors`,
          `${firstThree}\n...and ${errorDetails.length - 3} more`,
        );
      }
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success(
        isNew ? "Supplier Created" : "Supplier Updated",
        `${formData.name} has been saved successfully`,
      );
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        "Save Failed",
        error.message || "Failed to save supplier. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Supplier Selection
  const handleSelectSupplier = (sup) => {
    setSelectedSupplierId(sup.id || sup.supplier_id);
    setFormData((prev) => ({
      ...prev,
      name: sup.name,
      gst: sup.gst || sup.gst_number || sup.gstNumber || "",
      address: sup.address || sup.address_line_1 || "",
      officePhone: sup.officePhone || sup.office_phone || sup.contact || "",
      drugLicense: sup.drugLicense || sup.drug_license_no || "",
      email: sup.email || "",
    }));

    setFormErrors({});
    toast.success("Supplier Selected", `"${sup.name}" details loaded`);

    setTimeout(() => setActiveTab("general"), 500);
  };

  // Update form field with sanitization
  const updateField = useCallback(
    (field, value, sanitizeFn = null) => {
      const sanitizedValue = sanitizeFn ? sanitizeFn(value) : value;
      setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));

      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formErrors],
  );

  //  Handle add new from empty state
  const handleAddNewFromEmptyState = useCallback(
    (searchTerm) => {
      if (searchTerm) {
        updateField("name", searchTerm);
      }
      setActiveTab("general");
      toast.info(
        "Add New Supplier",
        "Fill in the required details to create a supplier",
      );
    },
    [updateField, toast],
  );

  if (!open || !supplier) return null;

  // Calculate form completion
  const requiredFields = [
    "name",
    "gst",
    "drugLicense",
    "address",
    "officePhone",
  ];
  const completedFields = requiredFields.filter((f) => {
    const value = formData[f];
    if (!value?.trim()) return false;

    switch (f) {
      case "gst":
        return validateGSTNumber(value).isValid;
      case "drugLicense":
        return validateDrugLicense(value).isValid;
      case "officePhone":
        return validatePhoneNumber(value).isValid;
      default:
        return true;
    }
  });
  const completionPercent = Math.round(
    (completedFields.length / requiredFields.length) * 100,
  );

  // Count errors per tab
  const errorCountByTab = {
    general: [
      "name",
      "gst",
      "drugLicense",
      "address",
      "panNumber",
      "pincode",
    ].filter((f) => formErrors[f]).length,
    contact: ["officePhone", "email"].filter((f) => formErrors[f]).length,
    banking: ["ifsc"].filter((f) => formErrors[f]).length,
  };

  const isFormSaving = isSaving || saving;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-sans">
          <motion.div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
          />

          <motion.div
            className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="shrink-0 bg-gradient-to-r from-[#05015A] to-indigo-700 px-4 sm:px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-white sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-base sm:text-lg font-bold text-white truncate">
                        {isNew
                          ? "Add New Supplier"
                          : isView
                            ? formData.name || "View Supplier"
                            : formData.name || "Edit Supplier"}
                      </h1>
                      {isNew && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-semibold rounded-full flex items-center gap-1 shrink-0">
                          <Sparkles size={10} />
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-indigo-200 text-xs sm:text-sm mt-0.5 truncate">
                      {isNew
                        ? "Fill in the required details (*) to create"
                        : `ID: ${supplier.supplierId || supplier.supplier_id || "N/A"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Completion Badge */}
                  {isEdit && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                      <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            completionPercent === 100
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                          }`}
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-white/80 font-medium">
                        {completionPercent}%
                      </span>
                    </div>
                  )}

                  {/* Save Button */}
                  {isEdit && (
                    <button
                      onClick={handleSave}
                      disabled={isFormSaving}
                      className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
                        isFormSaving
                          ? "bg-white/20 text-white/50 cursor-not-allowed"
                          : "bg-white text-indigo-700 hover:bg-indigo-50 hover:shadow-md"
                      }`}
                    >
                      {isFormSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="shrink-0 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-hide">
              <div className="flex px-2 sm:px-4 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const errorCount = errorCountByTab[tab.id] || 0;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-2 ${
                        isActive
                          ? "text-indigo-700 border-indigo-600 bg-white"
                          : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-white/50"
                      }`}
                    >
                      <Icon
                        size={14}
                        className={isActive ? "text-indigo-600" : ""}
                      />
                      <span>{tab.label}</span>

                      {attemptedSubmit && errorCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-100 text-red-600">
                          {errorCount}
                        </span>
                      )}

                      {tab.id === "existing" &&
                        existingSuppliers.length > 0 && (
                          <span
                            className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                              isActive
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {existingSuppliers.length}
                          </span>
                        )}

                      {tab.id === "existing" &&
                        existingSuppliers.length === 0 && (
                          <span
                            className={`ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full ${
                              isActive
                                ? "bg-amber-100 text-amber-700"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            0
                          </span>
                        )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 bg-slate-50/50">
              <AnimatePresence mode="wait">
                {/* General Info Tab */}
                {activeTab === "general" && (
                  <motion.div
                    key="general"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-6"
                  >
                    <SectionHeader
                      icon={Building2}
                      title="Basic Information"
                      subtitle="Primary supplier details"
                      badge={
                        attemptedSubmit && errorCountByTab.general > 0
                          ? `${errorCountByTab.general} error(s)`
                          : undefined
                      }
                    />

                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <FormField
                          label="Supplier Name"
                          icon={Building}
                          value={formData.name}
                          editable={isEdit}
                          onChange={(v) => updateField("name", v)}
                          required
                          placeholder="Enter supplier company name"
                          fieldError={formErrors.name}
                        />
                        <FormField
                          label="GST Number"
                          icon={Hash}
                          value={formData.gst}
                          editable={isEdit}
                          onChange={(v) => updateField("gst", v, sanitizeGST)}
                          required
                          placeholder="e.g., 27AABCA1234C1Z5"
                          fieldError={formErrors.gst}
                          hint="15-character GST (State Code + PAN + Entity + Z + Check)"
                          validationFn={validateGSTNumber}
                          sanitizeFn={sanitizeGST}
                          inputClassName="font-mono tracking-wide uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5">
                        <FormField
                          label="Drug License No."
                          icon={FileText}
                          value={formData.drugLicense}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("drugLicense", v, sanitizeDrugLicense)
                          }
                          required
                          placeholder="e.g., DL-DEL-20B-123456"
                          fieldError={formErrors.drugLicense}
                          hint="Format: DL-XXX-XXX-XXXXXX or 21B123456"
                          validationFn={validateDrugLicense}
                          sanitizeFn={sanitizeDrugLicense}
                          inputClassName="font-mono tracking-wide uppercase"
                        />
                        <FormField
                          label="PAN Number"
                          icon={Hash}
                          value={formData.panNumber}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("panNumber", v, sanitizePAN)
                          }
                          placeholder="e.g., ABCDE1234F"
                          fieldError={formErrors.panNumber}
                          hint="10-character PAN (5 letters + 4 digits + 1 letter)"
                          validationFn={validatePAN}
                          sanitizeFn={sanitizePAN}
                          inputClassName="font-mono tracking-wide uppercase"
                        />
                      </div>

                      <div className="mt-4 sm:mt-5">
                        <FormField
                          label="Business Address"
                          icon={MapPin}
                          value={formData.address}
                          editable={isEdit}
                          onChange={(v) => updateField("address", v)}
                          required
                          multiline
                          rows={2}
                          placeholder="Enter complete business address"
                          fieldError={formErrors.address}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
                        <FormField
                          label="City"
                          icon={MapPin}
                          value={formData.city}
                          editable={isEdit}
                          onChange={(v) => updateField("city", v)}
                          placeholder="e.g., Mumbai"
                        />
                        <FormField
                          label="State"
                          value={formData.state}
                          editable={isEdit}
                          onChange={(v) => updateField("state", v)}
                          placeholder="e.g., Maharashtra"
                        />
                        <FormField
                          label="Pincode"
                          value={formData.pincode}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("pincode", v, sanitizePincode)
                          }
                          placeholder="e.g., 400001"
                          fieldError={formErrors.pincode}
                          validationFn={validatePincode}
                          sanitizeFn={sanitizePincode}
                          inputClassName="font-mono"
                        />
                      </div>

                      <div className="mt-4 sm:mt-5">
                        <FormField
                          label="Website"
                          icon={Globe}
                          value={formData.website}
                          editable={isEdit}
                          onChange={(v) => updateField("website", v)}
                          placeholder="https://www.example.com"
                          type="url"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Contact Tab */}
                {activeTab === "contact" && (
                  <motion.div
                    key="contact"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-6"
                  >
                    <SectionHeader
                      icon={Phone}
                      title="Contact Information"
                      subtitle="Phone numbers and email"
                      badge={
                        attemptedSubmit && errorCountByTab.contact > 0
                          ? `${errorCountByTab.contact} error(s)`
                          : undefined
                      }
                    />

                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <FormField
                          label="Office Phone"
                          icon={Phone}
                          value={formData.officePhone}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("officePhone", v, sanitizePhone)
                          }
                          required
                          type="tel"
                          placeholder="e.g., 9876543210 or 011-23456789"
                          fieldError={formErrors.officePhone}
                          hint="10-digit mobile or landline with STD code"
                          validationFn={validatePhoneNumber}
                          sanitizeFn={sanitizePhone}
                        />
                        <FormField
                          label="Mobile / Personal"
                          icon={Phone}
                          value={formData.personalPhone}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("personalPhone", v, sanitizePhone)
                          }
                          type="tel"
                          placeholder="e.g., 9876543210"
                          sanitizeFn={sanitizePhone}
                        />
                      </div>

                      <div className="mt-4 sm:mt-5">
                        <FormField
                          label="Email Address"
                          icon={Mail}
                          value={formData.email}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("email", v.toLowerCase())
                          }
                          type="email"
                          placeholder="accounts@company.com"
                          fieldError={formErrors.email}
                          validationFn={validateEmail}
                        />
                      </div>
                    </div>

                    <SectionHeader
                      icon={User}
                      title="Contact Person"
                      subtitle="Primary point of contact"
                    />

                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <FormField
                          label="Contact Person Name"
                          icon={User}
                          value={formData.contactPerson}
                          editable={isEdit}
                          onChange={(v) => updateField("contactPerson", v)}
                          placeholder="Name of primary contact"
                        />
                        <FormField
                          label="Designation"
                          icon={Shield}
                          value={formData.designation}
                          editable={isEdit}
                          onChange={(v) => updateField("designation", v)}
                          placeholder="e.g., Sales Manager"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Banking Tab */}
                {activeTab === "banking" && (
                  <motion.div
                    key="banking"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-6"
                  >
                    <SectionHeader
                      icon={Landmark}
                      title="Banking Details"
                      subtitle="Payment and account information"
                      badge={
                        attemptedSubmit && errorCountByTab.banking > 0
                          ? `${errorCountByTab.banking} error(s)`
                          : undefined
                      }
                    />

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-4 sm:p-5 shadow-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <FormField
                          label="Bank Name"
                          icon={Landmark}
                          value={formData.bankName}
                          editable={isEdit}
                          onChange={(v) => updateField("bankName", v)}
                          placeholder="e.g., HDFC Bank"
                        />
                        <FormField
                          label="Branch Name"
                          icon={MapPin}
                          value={formData.branchName}
                          editable={isEdit}
                          onChange={(v) => updateField("branchName", v)}
                          placeholder="e.g., Connaught Place"
                        />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <FormField
                          label="Account Number"
                          icon={CreditCard}
                          value={formData.accountNo}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("accountNo", v, sanitizeAccountNumber)
                          }
                          placeholder="Bank account number"
                          sanitizeFn={sanitizeAccountNumber}
                          inputClassName="font-mono tracking-wider"
                        />
                        <FormField
                          label="Account Type"
                          icon={FileText}
                          value={formData.accountType}
                          editable={isEdit}
                          onChange={(v) => updateField("accountType", v)}
                          placeholder="e.g., Current, Savings"
                        />
                      </div>

                      <div className="mt-4 sm:mt-5">
                        <FormField
                          label="IFSC Code"
                          icon={Hash}
                          value={formData.ifsc}
                          editable={isEdit}
                          onChange={(v) => updateField("ifsc", v, sanitizeIFSC)}
                          placeholder="e.g., HDFC0001234"
                          fieldError={formErrors.ifsc}
                          hint="11-character code (4 letters + 0 + 6 alphanumeric)"
                          validationFn={validateIFSC}
                          sanitizeFn={sanitizeIFSC}
                          inputClassName="font-mono tracking-wider uppercase"
                        />
                      </div>
                    </div>

                    <SectionHeader
                      icon={Clock}
                      title="Payment Terms"
                      subtitle="Credit and payment settings"
                    />

                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
                        <FormField
                          label="Credit Days"
                          icon={Clock}
                          value={formData.creditDays}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("creditDays", v, sanitizeNumber)
                          }
                          type="text"
                          placeholder="30"
                          hint="Default credit period"
                          sanitizeFn={sanitizeNumber}
                        />
                        <FormField
                          label="Credit Limit (₹)"
                          icon={CreditCard}
                          value={formData.creditLimit}
                          editable={isEdit}
                          onChange={(v) =>
                            updateField("creditLimit", v, sanitizeNumber)
                          }
                          type="text"
                          placeholder="100000"
                          hint="Maximum credit amount"
                          sanitizeFn={sanitizeNumber}
                        />
                        <FormField
                          label="Payment Mode"
                          icon={Landmark}
                          value={formData.paymentMode}
                          editable={isEdit}
                          onChange={(v) => updateField("paymentMode", v)}
                          placeholder="NEFT / RTGS / Cheque"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Existing Suppliers Tab -  UPDATED WITH EMPTY STATE */}
                {activeTab === "existing" && (
                  <motion.div
                    key="existing"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-4"
                  >
                    <SectionHeader
                      icon={Users}
                      title={
                        existingSuppliers.length > 0
                          ? "Select Existing Supplier"
                          : "Supplier Directory"
                      }
                      subtitle={
                        existingSuppliers.length > 0
                          ? "Choose from your supplier directory"
                          : "No suppliers in your directory yet"
                      }
                      badge={
                        existingSuppliers.length > 0
                          ? `${filteredSuppliers.length} suppliers`
                          : "Empty"
                      }
                    />

                    {/*  Search - Only show if there are suppliers */}
                    {existingSuppliers.length > 0 && (
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Search size={16} />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name or GST..."
                          className="w-full h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200 shadow-sm"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full"
                          >
                            <X size={14} className="text-slate-400" />
                          </button>
                        )}
                      </div>
                    )}

                    {/*  Supplier Table with Empty State */}
                    <SupplierTable
                      suppliers={filteredSuppliers}
                      selectedId={selectedSupplierId}
                      onSelect={handleSelectSupplier}
                      searchQuery={searchQuery}
                      visibleRows={visibleRows}
                      rowHeight={rowHeight}
                      isMobile={isMobile}
                      onAddNew={handleAddNewFromEmptyState}
                    />

                    {/*  Add new option - Only show if there are suppliers */}
                    {isEdit && existingSuppliers.length > 0 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab("general")}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 text-sm font-medium"
                        >
                          <Plus size={16} />
                          <span>Or add new supplier details manually</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
                <AlertCircle size={12} />
                Fields marked with{" "}
                <span className="text-red-500 font-medium">*</span> are required
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onClose}
                  disabled={isFormSaving}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isView ? "Close" : "Cancel"}
                </button>
                {isEdit && (
                  <button
                    onClick={handleSave}
                    disabled={isFormSaving}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
                      isFormSaving
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-[#05015A] text-white hover:bg-indigo-700 hover:shadow-md"
                    }`}
                  >
                    {isFormSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>
                          {isNew ? "Create Supplier" : "Save Changes"}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SupplierModal;
