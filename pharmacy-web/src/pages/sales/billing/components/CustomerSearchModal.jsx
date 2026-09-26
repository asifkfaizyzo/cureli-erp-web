// pharmacy-web/src/pages/sales/billing/components/CustomerSearchModal.jsx (do not remove this comment)
// src/pages/sales/billing/components/CustomerSearchModal.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  User,
  Phone,
  MapPin,
  Plus,
  CheckCircle2,
  Loader2,
  UserPlus,
  Users,
  CreditCard,
  Percent,
  Building2,
  AlertCircle,
  Mail,
} from "lucide-react";

// ============================================
// ANIMATED INPUT COMPONENT - FIXED
// ============================================
const AnimatedInput = ({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  required = false,
  error = null,
  className = "",
  maxLength,
  inputMode,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  //  FIX: Handle numeric values (0) properly
  const hasValue =
    value !== undefined &&
    value !== null &&
    String(value).length > 0 &&
    value !== "";

  return (
    <div className={`relative ${className}`}>
      <label
        className={`
          absolute transition-all duration-200 pointer-events-none z-10
          ${
            isFocused || hasValue
              ? "-top-2 text-[9px] bg-white px-1 font-semibold"
              : "top-1/2 -translate-y-1/2 text-[10px]"
          }
          ${isFocused ? "text-indigo-600" : error ? "text-red-500" : "text-gray-500"}
          ${Icon ? "left-9" : "left-3"}
        `}
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {Icon && (
        <div
          className={`
          absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
          ${isFocused ? "text-indigo-500" : error ? "text-red-400" : "text-gray-400"}
        `}
        >
          <Icon size={16} strokeWidth={1.5} />
        </div>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={isFocused ? placeholder : ""}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={maxLength}
        inputMode={inputMode}
        className={`
          w-full h-10 text-sm rounded-lg border transition-all duration-200 outline-none
          ${Icon ? "pl-10" : "pl-3"} pr-3
          ${
            error
              ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : isFocused
                ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
                : "border-gray-200 bg-white hover:border-gray-300"
          }
        `}
      />

      {error && (
        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={10} />
          {error}
        </p>
      )}
    </div>
  );
};

// ============================================
// CUSTOMER CARD COMPONENT
// ============================================
const CustomerCard = ({ customer, onSelect, isSelected }) => (
  <div
    onClick={() => onSelect(customer)}
    className={`
      p-3 rounded-lg border cursor-pointer transition-all duration-150
      ${
        isSelected
          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
          : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
      }
    `}
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${isSelected ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"}
        `}
        >
          <User size={18} />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">
            {customer.name}
          </h4>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Phone size={10} />
            {customer.phone}
          </p>
        </div>
      </div>
      {isSelected && <CheckCircle2 size={20} className="text-indigo-500" />}
    </div>

    <div className="mt-2 flex flex-wrap gap-2">
      {customer.discount_percent > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
          <Percent size={10} />
          {customer.discount_percent}% Discount
        </span>
      )}
      {customer.credit_limit > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
          <CreditCard size={10} />₹{customer.credit_limit} Credit
        </span>
      )}
      {customer.outstanding_balance > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
          Outstanding: ₹{customer.outstanding_balance}
        </span>
      )}
    </div>

    {customer.address_line_1 && (
      <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1 truncate">
        <MapPin size={10} />
        {customer.address_line_1}
        {customer.city && `, ${customer.city}`}
      </p>
    )}
  </div>
);

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const CustomerSearchModal = ({
  isOpen,
  onClose,
  onSelect,
  searchCustomers,
  createCustomer,
}) => {
  const [mode, setMode] = useState("search");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // New customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address_line_1: "",
    city: "",
    state: "",
    pincode: "",
    gst_number: "",
    credit_limit: "",
    credit_days: "",
    discount_percent: "",
  });

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && mode === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, mode]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setMode("search");
      setSearchTerm("");
      setSearchResults([]);
      setSelectedCustomer(null);
      setErrors({});
      setHighlightedIndex(0);
      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address_line_1: "",
        city: "",
        state: "",
        pincode: "",
        gst_number: "",
        credit_limit: "",
        credit_days: "",
        discount_percent: "",
      });
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchCustomers(searchTerm);
          setSearchResults(results || []);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchCustomers]);

  // Handle customer selection
  const handleSelect = useCallback((customer) => {
    setSelectedCustomer(customer);
  }, []);

  // Confirm selection
  const handleConfirmSelection = useCallback(() => {
    if (selectedCustomer) {
      onSelect(selectedCustomer);
      onClose();
    }
  }, [selectedCustomer, onSelect, onClose]);

  //  Email validation helper
  const isValidEmail = useCallback((email) => {
    if (!email || !email.trim()) return true; // Empty is valid (optional)
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  //  GSTIN validation helper
  const isValidGSTIN = useCallback((gst) => {
    if (!gst || !gst.trim()) return true; // Empty is valid (optional)
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
      gst,
    );
  }, []);

  // Validate new customer form
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!newCustomer.name.trim()) {
      newErrors.name = "Name is required";
    }

    //  Phone validation - must be exactly 10 digits
    if (!newCustomer.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (newCustomer.phone.length !== 10) {
      newErrors.phone = "Enter exactly 10 digits";
    }

    //  Email validation
    if (newCustomer.email && !isValidEmail(newCustomer.email)) {
      newErrors.email = "Enter a valid email address";
    }

    //  GSTIN validation
    if (newCustomer.gst_number && !isValidGSTIN(newCustomer.gst_number)) {
      newErrors.gst_number = "Enter valid 15-character GSTIN";
    }

    //  Pincode validation
    if (newCustomer.pincode && !/^\d{6}$/.test(newCustomer.pincode)) {
      newErrors.pincode = "Enter valid 6-digit pincode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [newCustomer, isValidEmail, isValidGSTIN]);

  // Handle create customer
  const handleCreateCustomer = useCallback(async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const created = await createCustomer({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        email: newCustomer.email.trim() || null,
        address_line_1: newCustomer.address_line_1.trim() || null,
        city: newCustomer.city.trim() || null,
        state: newCustomer.state.trim() || null,
        pincode: newCustomer.pincode.trim() || null,
        gst_number: newCustomer.gst_number.trim() || null,
        credit_limit: parseFloat(newCustomer.credit_limit) || 0,
        credit_days: parseInt(newCustomer.credit_days) || 0,
        discount_percent: parseFloat(newCustomer.discount_percent) || 0,
      });

      if (created) {
        onSelect(created);
        onClose();
      }
    } catch (error) {
      setErrors({ submit: error.message || "Failed to create customer" });
    } finally {
      setIsCreating(false);
    }
  }, [newCustomer, validateForm, createCustomer, onSelect, onClose]);

  // Update form field with validation clearing
  const updateField = useCallback(
    (field, value) => {
      setNewCustomer((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  //  Phone input handler - numbers only, max 10
  const handlePhoneChange = useCallback(
    (e) => {
      const numericValue = e.target.value.replace(/\D/g, "").slice(0, 10);
      updateField("phone", numericValue);
    },
    [updateField],
  );

  //  Pincode input handler - numbers only, max 6
  const handlePincodeChange = useCallback(
    (e) => {
      const numericValue = e.target.value.replace(/\D/g, "").slice(0, 6);
      updateField("pincode", numericValue);
    },
    [updateField],
  );

  //  Numeric field handler for credit fields
  const handleNumericChange = useCallback(
    (field, maxValue = Infinity) =>
      (e) => {
        const value = e.target.value.replace(/[^\d.]/g, "");
        // Handle decimal points
        const parts = value.split(".");
        let sanitized =
          parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : value;

        // Check max value for percentage
        if (field === "discount_percent" && parseFloat(sanitized) > 100) {
          sanitized = "100";
        }

        updateField(field, sanitized);
      },
    [updateField],
  );

  // Switch to create mode with search term as name
  const handleSwitchToCreate = useCallback(() => {
    setMode("create");
    if (searchTerm.trim()) {
      setNewCustomer((prev) => ({ ...prev, name: searchTerm.trim() }));
    }
    setSearchTerm("");
    setSearchResults([]);
    setSelectedCustomer(null);
    setHighlightedIndex(0);
  }, [searchTerm]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Users size={20} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {mode === "search" ? "Select Customer" : "Add New Customer"}
                </h2>
                <p className="text-xs text-gray-500">
                  {mode === "search"
                    ? "Search existing customers or add new one"
                    : "Enter customer details to create"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMode("search")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  mode === "search"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
            >
              <Search size={16} />
              Search Existing
            </button>
            <button
              onClick={() => setMode("create")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  mode === "create"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
            >
              <UserPlus size={16} />
              Add New
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === "search" ? (
            <>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or phone number..."
                  className="w-full h-12 pl-10 pr-4 text-sm border border-gray-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
                {isSearching && (
                  <Loader2
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin"
                  />
                )}
              </div>

              {/* Search Results */}
              <div className="space-y-2">
                {searchTerm.length >= 2 ? (
                  isSearching ? (
                    <div className="text-center py-8">
                      <Loader2
                        size={24}
                        className="mx-auto text-indigo-500 animate-spin"
                      />
                      <p className="text-sm text-gray-500 mt-2">Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">
                        {searchResults.length} customer
                        {searchResults.length !== 1 ? "s" : ""} found
                      </p>
                      {searchResults.map((customer) => (
                        <CustomerCard
                          key={customer.customer_id}
                          customer={customer}
                          onSelect={handleSelect}
                          isSelected={
                            selectedCustomer?.customer_id ===
                            customer.customer_id
                          }
                        />
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <Search size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        No customers found
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Try a different search or add a new customer
                      </p>
                      <button
                        onClick={handleSwitchToCreate}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                      >
                        <UserPlus size={16} />
                        Add "{searchTerm}" as new customer
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Users size={40} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      Type at least 2 characters to search
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Create Customer Form */
            <div className="space-y-4">
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {errors.submit}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <AnimatedInput
                  label="Customer Name"
                  value={newCustomer.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Full name"
                  icon={User}
                  required
                  error={errors.name}
                />
                {/*  Phone - numbers only, max 10 */}
                <AnimatedInput
                  label="Phone Number"
                  value={newCustomer.phone}
                  onChange={handlePhoneChange}
                  placeholder="10-digit mobile"
                  icon={Phone}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  error={errors.phone}
                />
              </div>

              {/*  Email with validation */}
              <AnimatedInput
                label="Email Address"
                value={newCustomer.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="email@example.com"
                icon={Mail}
                type="email"
                error={errors.email}
              />

              {/* Address */}
              <AnimatedInput
                label="Address"
                value={newCustomer.address_line_1}
                onChange={(e) => updateField("address_line_1", e.target.value)}
                placeholder="Street address"
                icon={MapPin}
              />

              <div className="grid grid-cols-3 gap-4">
                <AnimatedInput
                  label="City"
                  value={newCustomer.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                />
                <AnimatedInput
                  label="State"
                  value={newCustomer.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="State"
                />
                {/*  Pincode - numbers only, max 6 */}
                <AnimatedInput
                  label="Pincode"
                  value={newCustomer.pincode}
                  onChange={handlePincodeChange}
                  placeholder="6-digit"
                  inputMode="numeric"
                  maxLength={6}
                  error={errors.pincode}
                />
              </div>

              {/* Business Details */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-indigo-500" />
                  Business & Credit Details (Optional)
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <AnimatedInput
                    label="GSTIN"
                    value={newCustomer.gst_number}
                    onChange={(e) =>
                      updateField("gst_number", e.target.value.toUpperCase())
                    }
                    placeholder="29ABCDE1234F1Z5"
                    maxLength={15}
                    error={errors.gst_number}
                  />
                  {/*  Discount % - numbers only, max 100 */}
                  <AnimatedInput
                    label="Discount %"
                    value={newCustomer.discount_percent}
                    onChange={handleNumericChange("discount_percent")}
                    placeholder="0"
                    inputMode="decimal"
                    icon={Percent}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {/*  Credit Limit - numbers only */}
                  <AnimatedInput
                    label="Credit Limit (₹)"
                    value={newCustomer.credit_limit}
                    onChange={handleNumericChange("credit_limit")}
                    placeholder="0"
                    inputMode="decimal"
                  />
                  {/*  Credit Days - numbers only */}
                  <AnimatedInput
                    label="Credit Days"
                    value={newCustomer.credit_days}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      updateField("credit_days", value);
                    }}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>

          {mode === "search" ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Continue as Walk-in
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={!selectedCustomer}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all
                  ${
                    selectedCustomer
                      ? "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
              >
                <CheckCircle2 size={16} />
                Select Customer
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreateCustomer}
              disabled={isCreating}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create & Select
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CustomerSearchModal;
