// pharmacy-web/src/pages/suppliers/components/SupplierModal.jsx (do not remove this comment)
// src/pages/suppliers/components/SupplierModal.jsx - UPDATED WITH PROPER VALIDATION
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
  Loader2,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { useMenuStore } from "../../../store/useMenuStore";
import suppliersAPI from "../../../api/suppliers";

// ============================================
// VALIDATION HELPERS
// ============================================
const VALIDATION_PATTERNS = {
  // GST: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
  GST: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,

  // PAN: 5 letters + 4 digits + 1 letter
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,

  // Phone: exactly 10 digits
  PHONE: /^[0-9]{10}$/,

  // Pincode: exactly 6 digits
  PINCODE: /^[0-9]{6}$/,

  // Drug License: alphanumeric with hyphens/slashes
  DRUG_LICENSE: /^[A-Z0-9\-\/]{8,25}$/,

  // Email
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // IFSC: 4 letters + 0 + 6 alphanumeric
  IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,

  // Account Number: 9-18 digits
  ACCOUNT_NUMBER: /^[0-9]{9,18}$/,
};

const VALIDATION_MESSAGES = {
  GST: "GST must be 15 characters: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric (e.g., 27AABCU9603R1ZM)",
  PAN: "PAN must be 10 characters: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)",
  PHONE: "Phone must be exactly 10 digits",
  PINCODE: "Pincode must be exactly 6 digits",
  DRUG_LICENSE: "Invalid format. Use: 20B/12345/2024 or DL-MH-12-123456",
  EMAIL: "Please enter a valid email (e.g., example@domain.com)",
  IFSC: "IFSC must be 11 characters: 4 letters + 0 + 6 alphanumeric (e.g., HDFC0001234)",
  ACCOUNT_NUMBER: "Account number must be 9-18 digits",
};

const validateField = (field, value) => {
  if (!value || value.trim() === "") return { isValid: true, error: null };

  const trimmedValue = value.trim().toUpperCase();

  switch (field) {
    case "gst":
      return {
        isValid: VALIDATION_PATTERNS.GST.test(trimmedValue),
        error: VALIDATION_PATTERNS.GST.test(trimmedValue)
          ? null
          : VALIDATION_MESSAGES.GST,
      };

    case "panNumber":
      return {
        isValid: VALIDATION_PATTERNS.PAN.test(trimmedValue),
        error: VALIDATION_PATTERNS.PAN.test(trimmedValue)
          ? null
          : VALIDATION_MESSAGES.PAN,
      };

    case "officePhone":
    case "personalPhone":
      const digitsOnly = value.replace(/\D/g, "");
      return {
        isValid:
          digitsOnly.length === 0 || VALIDATION_PATTERNS.PHONE.test(digitsOnly),
        error:
          digitsOnly.length === 0 || VALIDATION_PATTERNS.PHONE.test(digitsOnly)
            ? null
            : VALIDATION_MESSAGES.PHONE,
      };

    case "pincode":
      const pincodeDigits = value.replace(/\D/g, "");
      return {
        isValid:
          pincodeDigits.length === 0 ||
          VALIDATION_PATTERNS.PINCODE.test(pincodeDigits),
        error:
          pincodeDigits.length === 0 ||
          VALIDATION_PATTERNS.PINCODE.test(pincodeDigits)
            ? null
            : VALIDATION_MESSAGES.PINCODE,
      };

    case "drugLicense":
      return {
        isValid: VALIDATION_PATTERNS.DRUG_LICENSE.test(trimmedValue),
        error: VALIDATION_PATTERNS.DRUG_LICENSE.test(trimmedValue)
          ? null
          : VALIDATION_MESSAGES.DRUG_LICENSE,
      };

    case "email":
      return {
        isValid: VALIDATION_PATTERNS.EMAIL.test(value.toLowerCase()),
        error: VALIDATION_PATTERNS.EMAIL.test(value.toLowerCase())
          ? null
          : VALIDATION_MESSAGES.EMAIL,
      };

    case "ifsc":
      return {
        isValid: VALIDATION_PATTERNS.IFSC.test(trimmedValue),
        error: VALIDATION_PATTERNS.IFSC.test(trimmedValue)
          ? null
          : VALIDATION_MESSAGES.IFSC,
      };

    case "accountNo":
      const accountDigits = value.replace(/\D/g, "");
      return {
        isValid:
          accountDigits.length === 0 ||
          VALIDATION_PATTERNS.ACCOUNT_NUMBER.test(accountDigits),
        error:
          accountDigits.length === 0 ||
          VALIDATION_PATTERNS.ACCOUNT_NUMBER.test(accountDigits)
            ? null
            : VALIDATION_MESSAGES.ACCOUNT_NUMBER,
      };

    default:
      return { isValid: true, error: null };
  }
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

//  ENHANCED Professional Field Component with Validation
const FormField = ({
  label,
  value,
  editable,
  onChange,
  required,
  type = "text",
  icon: Icon,
  placeholder,
  error: externalError,
  success,
  hint,
  className = "",
  inputClassName = "",
  multiline = false,
  rows = 3,
  validationType, // NEW: 'gst', 'pan', 'phone', 'email', 'pincode', 'drugLicense', 'ifsc', 'accountNo'
  maxLength,
  numbersOnly = false,
  uppercase = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState(null);

  const hasValue = value && value.toString().trim().length > 0;
  const showRequiredError = required && !hasValue && touched && !isFocused;
  const showValidationError = internalError && touched;
  const showError = showRequiredError || showValidationError || externalError;
  const errorMessage =
    externalError ||
    internalError ||
    (showRequiredError ? `${label} is required` : null);

  // Validate on value change
  useEffect(() => {
    if (validationType && value) {
      const validation = validateField(validationType, value);
      setInternalError(validation.error);
    } else {
      setInternalError(null);
    }
  }, [value, validationType]);

  const handleChange = (inputValue) => {
    let processedValue = inputValue;

    // Numbers only filter
    if (numbersOnly) {
      processedValue = inputValue.replace(/\D/g, "");
    }

    // Uppercase transform
    if (uppercase) {
      processedValue = processedValue.toUpperCase();
    }

    // Max length check
    if (maxLength && processedValue.length > maxLength) {
      processedValue = processedValue.slice(0, maxLength);
    }

    onChange?.(processedValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTouched(true);
  };

  // Determine validation status
  const isValidated = validationType && hasValue && !internalError;

  return (
    <div className={`relative ${className}`}>
      <label
        className={`
        flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-1.5
        ${isFocused ? "text-indigo-600" : showError ? "text-red-500" : isValidated ? "text-emerald-600" : "text-slate-500"}
        transition-colors duration-200
      `}
      >
        {Icon && <Icon size={12} strokeWidth={2} />}
        <span>{label}</span>
        {required && <span className="text-red-400">*</span>}
        {maxLength && (
          <span className="ml-auto text-[9px] text-slate-400 font-normal">
            {value?.length || 0}/{maxLength}
          </span>
        )}
      </label>

      <div className="relative">
        {editable ? (
          multiline ? (
            <textarea
              value={value || ""}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
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
                      : isValidated
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
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              placeholder={placeholder}
              maxLength={maxLength}
              className={`
                w-full h-10 text-sm font-medium text-slate-800 bg-white 
                border rounded-lg px-3 pr-10
                transition-all duration-200 outline-none
                ${
                  isFocused
                    ? "border-indigo-400 ring-2 ring-indigo-100 shadow-sm"
                    : showError
                      ? "border-red-300 bg-red-50/50"
                      : isValidated
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-slate-200 hover:border-slate-300"
                }
                ${uppercase ? "uppercase" : ""}
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

        {editable && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isValidated && (
              <CheckCircle2 size={16} className="text-emerald-500" />
            )}
            {showError && <AlertCircle size={16} className="text-red-400" />}
          </div>
        )}
      </div>

      {/* Error/Hint Message */}
      {showError ? (
        <div className="mt-1.5 flex items-start gap-1.5 text-red-500">
          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
          <p className="text-[10px] leading-tight">{errorMessage}</p>
        </div>
      ) : hint ? (
        <p className="mt-1 text-[10px] text-slate-400">{hint}</p>
      ) : null}
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
        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-semibold rounded-full">
          {badge}
        </span>
      )}
      {action}
    </div>
  </div>
);

//  RESPONSIVE SUPPLIER TABLE WITH FIXED ROWS (keeping your existing implementation)
const SupplierTableComponent = ({
  suppliers,
  selectedId,
  onSelect,
  searchQuery,
  visibleRows = 4,
  rowHeight = 56,
  isMobile = false,
  loading = false,
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const tableBodyRef = useRef(null);
  const [scrollInfo, setScrollInfo] = useState({
    canScrollUp: false,
    canScrollDown: false,
    scrollPercentage: 0,
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
    const canScrollUp = scrollTop > 5;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 5;
    const scrollPercentage =
      scrollHeight > clientHeight
        ? (scrollTop / (scrollHeight - clientHeight)) * 100
        : 0;

    setScrollInfo({ canScrollUp, canScrollDown, scrollPercentage });
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

  const scrollUp = () => {
    tableBodyRef.current?.scrollBy({ top: -rowHeight * 2, behavior: "smooth" });
  };

  const scrollDown = () => {
    tableBodyRef.current?.scrollBy({ top: rowHeight * 2, behavior: "smooth" });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={11} className="text-slate-300" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={11} className="text-indigo-600" />
    ) : (
      <ChevronDown size={11} className="text-indigo-600" />
    );
  };

  const hasOverflow = suppliers.length > visibleRows;

  // Loading State
  if (loading) {
    return (
      <div
        className="flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200"
        style={{ height: `${viewportHeight}px` }}
      >
        <Loader2 size={32} className="text-indigo-500 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">
          Loading suppliers...
        </p>
      </div>
    );
  }

  // Empty State
  if (suppliers.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-200"
        style={{ height: `${viewportHeight}px` }}
      >
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Users size={24} className="text-slate-300" />
        </div>
        <p className="text-sm font-medium text-slate-600">
          {searchQuery
            ? "No matching suppliers found"
            : "No suppliers available"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {searchQuery
            ? "Try a different search term"
            : "Add your first supplier"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Table Header Stats */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-500" />
            <span className="text-[11px] font-semibold text-slate-700">
              {suppliers.length} Suppliers
            </span>
          </div>

          {hasOverflow && (
            <>
              <div className="h-3 w-px bg-slate-300" />
              <span className="text-[10px] text-slate-500">
                Showing {visibleRows} at a time
              </span>
            </>
          )}
        </div>

        {hasOverflow && (
          <div className="flex items-center gap-1">
            <button
              onClick={scrollUp}
              disabled={!scrollInfo.canScrollUp}
              className={`
                p-1 rounded transition-all duration-150
                ${
                  scrollInfo.canScrollUp
                    ? "hover:bg-indigo-100 text-slate-500 hover:text-indigo-600"
                    : "text-slate-300 cursor-not-allowed"
                }
              `}
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={scrollDown}
              disabled={!scrollInfo.canScrollDown}
              className={`
                p-1 rounded transition-all duration-150
                ${
                  scrollInfo.canScrollDown
                    ? "hover:bg-indigo-100 text-slate-500 hover:text-indigo-600"
                    : "text-slate-300 cursor-not-allowed"
                }
              `}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      {!isMobile && (
        <div className="hidden md:block">
          {/* Fixed Header */}
          <div className="overflow-hidden">
            <table className="w-full table-fixed">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-[5%] px-2 py-2.5 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th
                    className="w-[30%] px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-slate-600">
                      <Building2 size={11} />
                      <span>Supplier Name</span>
                      <SortIcon columnKey="name" />
                    </div>
                  </th>
                  <th
                    className="w-[22%] px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("gst")}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-slate-600">
                      <Hash size={11} />
                      <span>GST Number</span>
                      <SortIcon columnKey="gst" />
                    </div>
                  </th>
                  <th
                    className="w-[18%] px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("officePhone")}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-slate-600">
                      <Phone size={11} />
                      <span>Contact</span>
                      <SortIcon columnKey="officePhone" />
                    </div>
                  </th>
                  <th
                    className="w-[17%] px-3 py-2.5 text-left cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("location")}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-slate-600">
                      <MapPin size={11} />
                      <span>Location</span>
                      <SortIcon columnKey="location" />
                    </div>
                  </th>
                  <th className="w-[8%] px-2 py-2.5 text-center">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Scrollable Body */}
          <div
            ref={tableBodyRef}
            className="overflow-y-auto overflow-x-hidden"
            style={{
              height: `${viewportHeight}px`,
              maxHeight: `${viewportHeight}px`,
            }}
          >
            <table className="w-full table-fixed">
              <tbody className="divide-y divide-slate-100">
                {sortedSuppliers.map((supplier, idx) => {
                  const isSelected = selectedId === supplier.id;
                  return (
                    <motion.tr
                      key={supplier.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      onClick={() => onSelect(supplier)}
                      style={{ height: `${rowHeight}px` }}
                      className={`
                        cursor-pointer transition-all duration-150 group
                        ${
                          isSelected
                            ? "bg-indigo-50 hover:bg-indigo-100"
                            : "bg-white hover:bg-slate-50"
                        }
                      `}
                    >
                      <td className="w-[5%] px-2 text-center">
                        <div
                          className={`
                          w-4 h-4 rounded-full border-2 flex items-center justify-center mx-auto
                          transition-all duration-200
                          ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 shadow-sm"
                              : "border-slate-300 group-hover:border-indigo-400"
                          }
                        `}
                        >
                          {isSelected && (
                            <Check
                              size={10}
                              className="text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                      </td>

                      <td className="w-[30%] px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`
                            w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                            ${
                              isSelected
                                ? "bg-indigo-200 text-indigo-700"
                                : "bg-slate-100 text-slate-500"
                            }
                          `}
                          >
                            <Building2 size={12} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-xs font-semibold truncate ${isSelected ? "text-indigo-700" : "text-slate-800"}`}
                            >
                              {supplier.name}
                            </p>
                            {supplier.email && (
                              <p className="text-[9px] text-slate-400 truncate">
                                {supplier.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="w-[22%] px-3">
                        <span
                          className={`
                          inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono truncate max-w-full
                          ${
                            isSelected
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                          }
                        `}
                        >
                          {supplier.gst || "—"}
                        </span>
                      </td>

                      <td className="w-[18%] px-3">
                        <div className="flex items-center gap-1 text-[11px] text-slate-700">
                          <Phone
                            size={10}
                            className="text-slate-400 shrink-0"
                          />
                          <span className="truncate">
                            {supplier.officePhone || supplier.contact || "—"}
                          </span>
                        </div>
                      </td>

                      <td className="w-[17%] px-3">
                        <p
                          className="text-[11px] text-slate-600 truncate"
                          title={supplier.location || supplier.address}
                        >
                          {supplier.location ||
                            supplier.city ||
                            supplier.address?.split(",").slice(-1)[0]?.trim() ||
                            "—"}
                        </p>
                      </td>

                      <td className="w-[8%] px-2 text-center">
                        <div
                          className={`
                          w-5 h-5 rounded-full flex items-center justify-center mx-auto
                          transition-all duration-200
                          ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                          }
                        `}
                        >
                          {isSelected ? (
                            <Check size={10} strokeWidth={3} />
                          ) : (
                            <ChevronUp size={10} className="rotate-90" />
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Card View */}
      {isMobile && (
        <div
          ref={tableBodyRef}
          className="md:hidden divide-y divide-slate-100 overflow-y-auto"
          style={{
            height: `${viewportHeight}px`,
            maxHeight: `${viewportHeight}px`,
          }}
        >
          {sortedSuppliers.map((supplier, idx) => {
            const isSelected = selectedId === supplier.id;
            return (
              <motion.div
                key={supplier.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => onSelect(supplier)}
                className={`
                  p-3 cursor-pointer transition-all duration-150
                  ${isSelected ? "bg-indigo-50" : "bg-white hover:bg-slate-50"}
                `}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                    ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-slate-300"
                    }
                  `}
                  >
                    {isSelected && (
                      <Check size={10} className="text-white" strokeWidth={3} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`font-semibold text-sm truncate ${isSelected ? "text-indigo-700" : "text-slate-800"}`}
                      >
                        {supplier.name}
                      </h4>
                      <span
                        className={`
                        shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold
                        ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }
                      `}
                      >
                        {isSelected ? "✓" : "Select"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1.5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Hash size={9} className="shrink-0" />
                        <span className="truncate font-mono">
                          {supplier.gst || "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Phone size={9} className="shrink-0" />
                        <span className="truncate">
                          {supplier.officePhone || supplier.contact || "—"}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin size={9} className="shrink-0" />
                        <span className="truncate">
                          {supplier.location ||
                            supplier.city ||
                            supplier.address?.split(",").slice(-1)[0]?.trim() ||
                            "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {hasOverflow && <div className="h-1 bg-slate-100 relative" />}

      {/* Table Footer */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 px-3 py-2 flex items-center justify-between">
        <p className="text-[10px] text-slate-500">
          <span className="font-semibold text-slate-700">
            {suppliers.length}
          </span>{" "}
          total
          {hasOverflow && (
            <span className="text-slate-400"> • Scroll for more</span>
          )}
        </p>
        <p className="text-[9px] text-slate-400 hidden sm:block">
          Click row to select • Click headers to sort
        </p>
      </div>
    </div>
  );
};

//  Helper function to map API supplier data to modal format
const mapAPISupplierToModalFormat = (supplier) => ({
  id: supplier.supplier_id,
  supplier_id: supplier.supplier_id,
  name: supplier.name || "",
  gst: supplier.gst_number || "",
  address: [
    supplier.address_line_1,
    supplier.address_line_2,
    supplier.city,
    supplier.state,
    supplier.pincode,
  ]
    .filter(Boolean)
    .join(", "),
  addressLine1: supplier.address_line_1 || "",
  addressLine2: supplier.address_line_2 || "",
  city: supplier.city || "",
  state: supplier.state || "",
  pincode: supplier.pincode || "",
  location:
    supplier.city && supplier.state
      ? `${supplier.city}, ${supplier.state}`
      : supplier.city || supplier.state || "",
  officePhone: supplier.office_phone || "",
  personalPhone: supplier.personal_phone || "",
  contact: supplier.office_phone || supplier.personal_phone || "",
  email: supplier.email || "",
  contactPerson: supplier.contact_person || "",
  drugLicense: supplier.drug_license_no || "",
  panNumber: supplier.pan_number || "",
  creditDays: supplier.credit_days || "",
  creditLimit: supplier.credit_limit || "",
  bankName: supplier.bank_name || "",
  branchName: "",
  accountNo: supplier.account_number || "",
  accountType: "Current",
  ifsc: supplier.ifsc_code || "",
});

//  MAIN MODAL COMPONENT WITH VALIDATION
const SupplierModal = ({
  open,
  mode,
  supplier,
  onClose,
  onSave,
  saving = false,
  currentBranchName = "",
  isGlobalMode = false,
}) => {
  const isEdit = mode === "edit";
  const isNew = supplier?.supplierId === "NEW" || !supplier?.supplier_id;
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const sidebarExpanded = useMenuStore?.((s) => s.sidebarExpanded) || false;

  //  API State for existing suppliers
  const [existingSuppliers, setExistingSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);

  const { visibleRows, rowHeight, isMobile } = useResponsiveTableRows();

  //  Fetch existing suppliers from API when "existing" tab is active
  useEffect(() => {
    if (activeTab === "existing" && !suppliersLoaded && !isGlobalMode) {
      const fetchExistingSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
          const response = await suppliersAPI.getAll({
            isActive: true,
            limit: 100,
          });

          if (response.success) {
            const suppliersData =
              response.data.suppliers || response.data || [];
            const mapped = suppliersData.map(mapAPISupplierToModalFormat);
            setExistingSuppliers(mapped);
            setSuppliersLoaded(true);
          } else {
            console.error("Failed to fetch suppliers:", response.message);
            toast.error("Failed to load suppliers");
          }
        } catch (err) {
          console.error("Error fetching existing suppliers:", err);
          toast.error("Failed to load suppliers");
        } finally {
          setLoadingSuppliers(false);
        }
      };

      fetchExistingSuppliers();
    }
  }, [activeTab, suppliersLoaded, isGlobalMode]);

  //  Filtered Suppliers based on search
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return existingSuppliers;
    const query = searchQuery.toLowerCase();
    return existingSuppliers.filter(
      (s) =>
        s.name?.toLowerCase().includes(query) ||
        s.gst?.toLowerCase().includes(query) ||
        s.location?.toLowerCase().includes(query) ||
        s.city?.toLowerCase().includes(query) ||
        s.officePhone?.includes(query) ||
        s.email?.toLowerCase().includes(query),
    );
  }, [existingSuppliers, searchQuery]);

  // Tabs Configuration
  const tabs = [
    { id: "general", label: "General Info", icon: Building2 },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "banking", label: "Banking", icon: Landmark },
    { id: "existing", label: "Select Supplier", icon: Users },
  ];

  // Reset form on supplier change
  useEffect(() => {
    if (supplier) {
      setFormData({ ...supplier });
      setFormErrors({});
      setActiveTab("general");
      setSearchQuery("");
      setSelectedSupplierId(null);
      if (!open) {
        setSuppliersLoaded(false);
      }
    }
  }, [supplier, open]);

  // Sync external saving state
  useEffect(() => {
    setIsSaving(saving);
  }, [saving]);

  //  COMPREHENSIVE VALIDATION
  const validateForm = () => {
    const errors = [];

    // Required: Supplier Name
    if (!formData.name?.trim()) {
      errors.push({
        field: "name",
        message: "Supplier name is required",
        tab: "general",
      });
    }

    // Required: Office Phone (10 digits)
    const officePhone =
      formData.officePhone?.replace(/\D/g, "") ||
      formData.contact?.replace(/\D/g, "") ||
      "";
    if (!officePhone) {
      errors.push({
        field: "officePhone",
        message: "Office phone is required",
        tab: "contact",
      });
    } else if (!VALIDATION_PATTERNS.PHONE.test(officePhone)) {
      errors.push({
        field: "officePhone",
        message: "Office phone must be exactly 10 digits",
        tab: "contact",
      });
    }

    // Optional: Personal Phone (10 digits if provided)
    const personalPhone = formData.personalPhone?.replace(/\D/g, "") || "";
    if (personalPhone && !VALIDATION_PATTERNS.PHONE.test(personalPhone)) {
      errors.push({
        field: "personalPhone",
        message: "Personal phone must be exactly 10 digits",
        tab: "contact",
      });
    }

    // Optional: Email format
    if (formData.email && !VALIDATION_PATTERNS.EMAIL.test(formData.email)) {
      errors.push({
        field: "email",
        message: "Please enter a valid email address",
        tab: "contact",
      });
    }

    // Optional: GST format (15 characters)
    if (
      formData.gst &&
      !VALIDATION_PATTERNS.GST.test(formData.gst.toUpperCase())
    ) {
      errors.push({
        field: "gst",
        message:
          "Invalid GST format. Must be 15 characters (e.g., 27AABCU9603R1ZM)",
        tab: "general",
      });
    }

    // Optional: PAN format (10 characters)
    if (
      formData.panNumber &&
      !VALIDATION_PATTERNS.PAN.test(formData.panNumber.toUpperCase())
    ) {
      errors.push({
        field: "panNumber",
        message: "Invalid PAN format. Must be 10 characters (e.g., ABCDE1234F)",
        tab: "general",
      });
    }

    // Optional: Drug License format
    if (
      formData.drugLicense &&
      !VALIDATION_PATTERNS.DRUG_LICENSE.test(formData.drugLicense.toUpperCase())
    ) {
      errors.push({
        field: "drugLicense",
        message:
          "Invalid Drug License format. Use: 20B/12345/2024 or DL-MH-12-123456",
        tab: "general",
      });
    }

    // Optional: Pincode (6 digits)
    const pincode = formData.pincode?.replace(/\D/g, "") || "";
    if (pincode && !VALIDATION_PATTERNS.PINCODE.test(pincode)) {
      errors.push({
        field: "pincode",
        message: "Pincode must be exactly 6 digits",
        tab: "general",
      });
    }

    // Optional: IFSC format
    if (
      formData.ifsc &&
      !VALIDATION_PATTERNS.IFSC.test(formData.ifsc.toUpperCase())
    ) {
      errors.push({
        field: "ifsc",
        message:
          "Invalid IFSC format. Must be 11 characters (e.g., HDFC0001234)",
        tab: "banking",
      });
    }

    // Optional: Account Number (9-18 digits)
    const accountNo = formData.accountNo?.replace(/\D/g, "") || "";
    if (accountNo && !VALIDATION_PATTERNS.ACCOUNT_NUMBER.test(accountNo)) {
      errors.push({
        field: "accountNo",
        message: "Account number must be 9-18 digits",
        tab: "banking",
      });
    }

    return errors;
  };

  // Handle Save
  const handleSave = async () => {
    const errors = validateForm();

    if (errors.length > 0) {
      // Show first error and switch to that tab
      const firstError = errors[0];
      setActiveTab(firstError.tab);

      // Set all errors in state
      const errorMap = {};
      errors.forEach((e) => {
        errorMap[e.field] = e.message;
      });
      setFormErrors(errorMap);

      // Show toast with all errors
      const errorCount = errors.length;
      toast.error(
        <div>
          <p className="font-semibold">
            {errorCount} Validation Error{errorCount > 1 ? "s" : ""}
          </p>
          <ul className="text-sm mt-1 list-disc list-inside">
            {errors.slice(0, 3).map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
            {errorCount > 3 && <li>...and {errorCount - 3} more</li>}
          </ul>
        </div>,
        {
          autoClose: 5000,
          icon: <AlertTriangle size={20} className="text-red-500" />,
        },
      );
      return;
    }

    // Clear errors and save
    setFormErrors({});
    onSave(formData);
  };

  // Handle Supplier Selection from Table
  const handleSelectSupplier = (sup) => {
    setSelectedSupplierId(sup.id);
    setFormData({
      ...formData,
      supplier_id: sup.supplier_id || sup.id,
      name: sup.name,
      gst: sup.gst,
      address: sup.address,
      addressLine1: sup.addressLine1 || "",
      addressLine2: sup.addressLine2 || "",
      city: sup.city || "",
      state: sup.state || "",
      pincode: sup.pincode || "",
      location: sup.location,
      officePhone: sup.officePhone,
      personalPhone: sup.personalPhone,
      contact: sup.contact || sup.officePhone,
      email: sup.email,
      contactPerson: sup.contactPerson || "",
      drugLicense: sup.drugLicense || "",
      panNumber: sup.panNumber || "",
      creditDays: sup.creditDays || "",
      creditLimit: sup.creditLimit || "",
      bankName: sup.bankName || "",
      branchName: sup.branchName || "",
      accountNo: sup.accountNo || "",
      accountType: sup.accountType || "",
      ifsc: sup.ifsc || "",
    });
    setFormErrors({});

    toast.success(`"${sup.name}" selected`, {
      autoClose: 2000,
      icon: <CheckCircle2 size={18} />,
    });

    setTimeout(() => {
      setActiveTab("general");
    }, 800);
  };

  // Update form field
  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!open || !supplier) return null;

  // Calculate form completion
  const requiredFields = ["name", "officePhone"];
  const completedFields = requiredFields.filter(
    (f) =>
      formData[f]?.trim() || (f === "officePhone" && formData.contact?.trim()),
  );
  const completionPercent = Math.round(
    (completedFields.length / requiredFields.length) * 100,
  );

  // Count errors per tab
  const tabErrorCounts = {
    general: Object.keys(formErrors).filter((f) =>
      ["name", "gst", "panNumber", "drugLicense", "pincode"].includes(f),
    ).length,
    contact: Object.keys(formErrors).filter((f) =>
      ["officePhone", "personalPhone", "email"].includes(f),
    ).length,
    banking: Object.keys(formErrors).filter((f) =>
      ["ifsc", "accountNo"].includes(f),
    ).length,
    existing: 0,
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Modal Panel */}
          <motion.div
            className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            {/*  HEADER */}
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
                          : formData.name || "Edit Supplier"}
                      </h1>
                      {isNew && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] sm:text-[10px] font-semibold rounded-full flex items-center gap-1 shrink-0">
                          <Sparkles size={10} />
                          NEW
                        </span>
                      )}
                      {currentBranchName && !isGlobalMode && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-200 text-[9px] sm:text-[10px] font-semibold rounded-full flex items-center gap-1 shrink-0">
                          <Building2 size={10} />
                          {currentBranchName}
                        </span>
                      )}
                    </div>
                    <p className="text-indigo-200 text-xs sm:text-sm mt-0.5 truncate">
                      {isNew
                        ? currentBranchName
                          ? `Adding to: ${currentBranchName}`
                          : "Fill in the details to create a new supplier"
                        : `ID: ${supplier.supplierId || supplier.supplier_id?.slice(-8) || "N/A"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isEdit && (
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                      <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${completionPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-white/80 font-medium">
                        {completionPercent}%
                      </span>
                    </div>
                  )}

                  {isEdit && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`
                        hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                        transition-all duration-200 shadow-sm
                        ${
                          isSaving
                            ? "bg-white/20 text-white/50 cursor-not-allowed"
                            : "bg-white text-indigo-700 hover:bg-indigo-50 hover:shadow-md"
                        }
                      `}
                    >
                      {isSaving ? (
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

            {/* Tabs with Error Indicators */}
            <div className="shrink-0 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-hide">
              <div className="flex px-2 sm:px-4 min-w-max">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const errorCount = tabErrorCounts[tab.id];

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium 
                        transition-all duration-200 whitespace-nowrap border-b-2
                        ${
                          isActive
                            ? "text-indigo-700 border-indigo-600 bg-white"
                            : errorCount > 0
                              ? "text-red-500 border-transparent hover:text-red-600 hover:bg-red-50/50"
                              : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-white/50"
                        }
                      `}
                    >
                      <Icon
                        size={14}
                        className={
                          isActive
                            ? "text-indigo-600"
                            : errorCount > 0
                              ? "text-red-500"
                              : ""
                        }
                      />
                      <span>{tab.label}</span>
                      {tab.id === "existing" && (
                        <span
                          className={`
                          ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full
                          ${isActive ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"}
                        `}
                        >
                          {loadingSuppliers ? "..." : existingSuppliers.length}
                        </span>
                      )}
                      {errorCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-red-100 text-red-600">
                          {errorCount}
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
                          error={formErrors.name}
                        />
                        <FormField
                          label="GST Number"
                          icon={Hash}
                          value={formData.gst}
                          editable={isEdit}
                          onChange={(v) => updateField("gst", v)}
                          placeholder="e.g., 27AABCU9603R1ZM"
                          hint="15-character GST Identification Number"
                          error={formErrors.gst}
                          validationType="gst"
                          maxLength={15}
                          uppercase
                        />
                      </div>

                      <div className="mt-4 sm:mt-5">
                        <FormField
                          label="Address Line 1"
                          icon={MapPin}
                          value={formData.addressLine1 || formData.address}
                          editable={isEdit}
                          onChange={(v) => updateField("addressLine1", v)}
                          placeholder="Street address, building name"
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
                        <FormField
                          label="City"
                          icon={MapPin}
                          value={formData.city}
                          editable={isEdit}
                          onChange={(v) => updateField("city", v)}
                          placeholder="City"
                        />
                        <FormField
                          label="State"
                          icon={MapPin}
                          value={formData.state}
                          editable={isEdit}
                          onChange={(v) => updateField("state", v)}
                          placeholder="State"
                        />
                        <FormField
                          label="Pincode"
                          icon={Hash}
                          value={formData.pincode}
                          editable={isEdit}
                          onChange={(v) => updateField("pincode", v)}
                          placeholder="6 digits"
                          error={formErrors.pincode}
                          validationType="pincode"
                          maxLength={6}
                          numbersOnly
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5">
                        <FormField
                          label="Drug License No."
                          icon={FileText}
                          value={formData.drugLicense}
                          editable={isEdit}
                          onChange={(v) => updateField("drugLicense", v)}
                          placeholder="e.g., 20B/12345/2024"
                          error={formErrors.drugLicense}
                          validationType="drugLicense"
                          maxLength={25}
                          uppercase
                        />
                        <FormField
                          label="PAN Number"
                          icon={Hash}
                          value={formData.panNumber}
                          editable={isEdit}
                          onChange={(v) => updateField("panNumber", v)}
                          placeholder="e.g., ABCDE1234F"
                          error={formErrors.panNumber}
                          validationType="panNumber"
                          maxLength={10}
                          uppercase
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
                    />

                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                        <FormField
                          label="Office Phone"
                          icon={Phone}
                          value={formData.officePhone || formData.contact}
                          editable={isEdit}
                          onChange={(v) => {
                            updateField("officePhone", v);
                            updateField("contact", v);
                          }}
                          required
                          type="tel"
                          placeholder="10 digit phone number"
                          error={formErrors.officePhone}
                          validationType="officePhone"
                          maxLength={10}
                          numbersOnly
                        />
                        <FormField
                          label="Mobile / Personal"
                          icon={Phone}
                          value={formData.personalPhone}
                          editable={isEdit}
                          onChange={(v) => updateField("personalPhone", v)}
                          type="tel"
                          placeholder="10 digit phone number"
                          error={formErrors.personalPhone}
                          validationType="personalPhone"
                          maxLength={10}
                          numbersOnly
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
                          error={formErrors.email}
                          validationType="email"
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
                          onChange={(v) => updateField("accountNo", v)}
                          placeholder="9-18 digit account number"
                          error={formErrors.accountNo}
                          validationType="accountNo"
                          maxLength={18}
                          numbersOnly
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
                          onChange={(v) => updateField("ifsc", v)}
                          placeholder="e.g., HDFC0001234"
                          error={formErrors.ifsc}
                          validationType="ifsc"
                          maxLength={11}
                          uppercase
                          inputClassName="font-mono tracking-wider"
                          hint="11-character bank branch code"
                        />
                      </div>
                    </div>

                    <SectionHeader
                      icon={Clock}
                      title="Payment Terms"
                      subtitle="Credit and payment settings"
                    />

                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        <FormField
                          label="Credit Days"
                          icon={Clock}
                          value={formData.creditDays}
                          editable={isEdit}
                          onChange={(v) => updateField("creditDays", v)}
                          type="number"
                          placeholder="30"
                          hint="Default credit period (0-365)"
                          numbersOnly
                          maxLength={3}
                        />
                        <FormField
                          label="Credit Limit"
                          icon={CreditCard}
                          value={formData.creditLimit}
                          editable={isEdit}
                          onChange={(v) => updateField("creditLimit", v)}
                          type="number"
                          placeholder="100000"
                          hint="Maximum credit amount (₹)"
                        />
                        <FormField
                          label="Payment Mode"
                          icon={Landmark}
                          value={formData.paymentMode}
                          editable={isEdit}
                          onChange={(v) => updateField("paymentMode", v)}
                          placeholder="NEFT / RTGS / Cheque"
                          className="sm:col-span-2 lg:col-span-1"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/*  EXISTING SUPPLIERS TAB */}
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
                      title="Select Existing Supplier"
                      subtitle={
                        currentBranchName
                          ? `From ${currentBranchName}`
                          : "Choose from your supplier directory"
                      }
                      badge={
                        loadingSuppliers
                          ? "Loading..."
                          : `${filteredSuppliers.length} suppliers`
                      }
                    />

                    {/* Search Bar */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={16} />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, GST, phone, location..."
                        className="w-full h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm
                          focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400
                          transition-all duration-200 shadow-sm placeholder:text-slate-400"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                        >
                          <X size={14} className="text-slate-400" />
                        </button>
                      )}
                    </div>

                    {/* RESPONSIVE SUPPLIER TABLE */}
                    <SupplierTableComponent
                      suppliers={filteredSuppliers}
                      selectedId={selectedSupplierId}
                      onSelect={handleSelectSupplier}
                      searchQuery={searchQuery}
                      visibleRows={visibleRows}
                      rowHeight={rowHeight}
                      isMobile={isMobile}
                      loading={loadingSuppliers}
                    />

                    {/* Quick Add Option */}
                    {isEdit && (
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab("general")}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                            border-2 border-dashed border-slate-300 rounded-xl
                            text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50
                            transition-all duration-200 text-sm font-medium"
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
              <div className="text-xs text-slate-500 hidden sm:block">
                {isEdit && (
                  <span className="flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    Fields marked with{" "}
                    <span className="text-red-500 font-medium">*</span> are
                    required
                  </span>
                )}
              </div>

              {/* Error Summary in Footer */}
              {Object.keys(formErrors).length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-xs text-red-600 font-medium">
                    {Object.keys(formErrors).length} validation error
                    {Object.keys(formErrors).length > 1 ? "s" : ""}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {isEdit && (
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`
                      flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold
                      transition-all duration-200 shadow-sm
                      ${
                        isSaving
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-[#05015A] text-white hover:bg-indigo-700 hover:shadow-md"
                      }
                    `}
                  >
                    {isSaving ? (
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
