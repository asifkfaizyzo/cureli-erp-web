// pharmacy-web/src/pages/sales/billing/components/CustomerDetailsCard.jsx

import { useState, useCallback } from "react";
import {
  User,
  MapPin,
  CreditCard,
  Smartphone,
  Stethoscope,
  UserCircle,
  Search,
  Wallet,
  IndianRupee,
  Truck,
  Check,
  Copy,
  Receipt,
  Lock,
} from "lucide-react";

// ============================================
// ANIMATED INPUT COMPONENT
// ============================================
const AnimatedInput = ({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  readOnly = false,
  className = "",
  type = "text",
  prefix = "",
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className={`relative ${className}`}>
      <label
        className={`absolute left-3 transition-all duration-200 pointer-events-none z-10
          ${isFocused || hasValue ? "-top-2 text-[9px] bg-white px-1 font-semibold" : "top-1/2 -translate-y-1/2 text-[10px]"}
          ${isFocused ? "text-indigo-600" : disabled || readOnly ? "text-gray-400" : "text-gray-500"}
          ${Icon ? "left-8" : "left-3"}`}
      >
        {label}
      </label>

      {Icon && (
        <div
          className={`absolute left-2.5 top-1/2 -translate-y-1/2 transition-colors duration-200
          ${isFocused ? "text-indigo-500" : disabled || readOnly ? "text-gray-300" : "text-gray-400"}`}
        >
          <Icon size={14} strokeWidth={1.5} />
        </div>
      )}

      {prefix && (
        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 font-medium">
          {prefix}
        </span>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={isFocused && !readOnly ? placeholder : ""}
        readOnly={readOnly || disabled}
        disabled={disabled}
        onFocus={() => !readOnly && !disabled && setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full h-9 text-[11px] rounded-lg border transition-all duration-200 outline-none
          ${Icon ? "pl-8" : "pl-3"} ${prefix ? "pl-12" : ""} pr-3
          ${
            disabled
              ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              : readOnly
                ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default"
                : isFocused
                  ? "border-indigo-400 ring-2 ring-indigo-100 bg-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
          }`}
      />
    </div>
  );
};

// ============================================
// TOGGLE CHECKBOX COMPONENT
// ============================================
const ToggleCheckbox = ({ checked, onChange, label, disabled = false }) => (
  <label
    className={`flex items-center gap-2 select-none ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer group"}`}
  >
    <div
      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150
        ${
          checked
            ? "bg-indigo-500 border-indigo-500"
            : disabled
              ? "bg-gray-100 border-gray-200"
              : "bg-white border-gray-300 group-hover:border-indigo-400"
        }`}
      onClick={() => !disabled && onChange(!checked)}
    >
      {checked && <Check size={10} className="text-white" strokeWidth={3} />}
    </div>
    <span
      className={`text-[10px] font-medium transition-colors whitespace-nowrap ${checked ? "text-indigo-700" : "text-gray-600"}`}
    >
      {label}
    </span>
  </label>
);

// ============================================
// MAIN COMPONENT
// ============================================
const CustomerDetailsCard = ({
  customer,
  setCustomer,
  onSearchCustomer,
  netAmount = 0,
  isLoading = false,
  billNo = "AUTO-000001",
  readOnly = false, // ← locks all fields (marketplace mode)
}) => {
  const cashReceived = parseFloat(customer?.cashReceived) || 0;
  const balance =
    customer?.paymentType === "CREDIT" ? 0 : netAmount - cashReceived;

  const updateField = useCallback(
    (field, value) => {
      if (readOnly) return; // ignore updates in read-only mode
      setCustomer((prev) => {
        const updated = { ...prev, [field]: value };
        if (field === "name" && prev.sameAsCustomer)
          updated.patientName = value;
        if (field === "sameAsCustomer" && value === true)
          updated.patientName = prev.name;
        return updated;
      });
    },
    [setCustomer, readOnly],
  );

  const handleSameAsCustomer = useCallback(
    (checked) => updateField("sameAsCustomer", checked),
    [updateField],
  );

  const copyCustomerToPatient = useCallback(() => {
    if (!readOnly && customer.name) updateField("patientName", customer.name);
  }, [customer.name, updateField, readOnly]);

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full h-full flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-2.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-200 animate-pulse" />
            <div className="w-28 h-4 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="p-4 flex-1">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-9 bg-slate-100 rounded-lg animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border w-full h-full flex flex-col overflow-visible
      ${readOnly ? "border-indigo-200" : "border-gray-100"}`}
    >
      {/* Header */}
      <div
        className={`px-4 py-2.5 border-b shrink-0
        ${
          readOnly
            ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100"
            : "bg-gradient-to-r from-indigo-50 to-purple-50 border-gray-100"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center
              ${readOnly ? "bg-indigo-200" : "bg-indigo-100"}`}
            >
              {readOnly ? (
                <Lock size={14} className="text-indigo-700" />
              ) : (
                <User size={14} className="text-indigo-600" />
              )}
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800">
                Customer & Payment Details
                {readOnly && (
                  <span className="ml-2 text-[9px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">
                    Read-only · Marketplace Order
                  </span>
                )}
              </h3>
              <p className="text-[9px] text-gray-500">
                {readOnly
                  ? "Customer details from the marketplace order"
                  : "Bill & prescription information"}
              </p>
            </div>
            <div className="col-span-2">
              <div className="relative">
                <label className="absolute left-8 -top-2 text-[9px] bg-white px-1 font-semibold text-indigo-600 z-10">
                  Bill No
                </label>
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-indigo-500">
                  <Receipt size={14} strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  value={billNo}
                  readOnly
                  className="w-full h-9 pl-8 pr-10 text-[11px] rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 font-bold cursor-not-allowed outline-none"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">
                    AUTO
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search button — disabled in marketplace mode */}
          <button
            onClick={readOnly ? undefined : onSearchCustomer}
            disabled={readOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-[10px] font-medium border
              ${
                readOnly
                  ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  : "bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200"
              }`}
          >
            <Search size={12} />
            Search Customer
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1 overflow-visible">
        {/* ROW 1: Doctor, Customer Name, Mobile, Printing Preferences */}
        <div className="grid grid-cols-12 gap-3">
          {/* Doctor Name */}
          <div className="col-span-3">
            <AnimatedInput
              label="Doctor Name"
              value={customer.doctorName}
              onChange={(e) => updateField("doctorName", e.target.value)}
              placeholder="Dr. Name"
              icon={Stethoscope}
              readOnly={readOnly}
            />
          </div>

          {/* Customer Name */}
          <div className="col-span-4">
            <AnimatedInput
              label="Customer Name"
              value={customer.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Registered customer"
              icon={User}
              readOnly={readOnly || !!customer.customer_id}
            />
          </div>

          {/* Mobile */}
          <div className="col-span-3">
            <AnimatedInput
              label="Mobile"
              value={customer.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+91 98765 43210"
              icon={Smartphone}
              type="tel"
              readOnly={readOnly}
            />
          </div>

          {/* Toggle Checklist Checkbox — Positioned explicitly to the right of Mobile field */}
          <div className="col-span-2 flex items-center justify-start h-9 self-end mb-0.5 pl-1">
            <ToggleCheckbox
              checked={customer.showDiscountOnPrint !== false} // Defaults to true if missing
              onChange={(checked) =>
                updateField("showDiscountOnPrint", checked)
              }
              label="Print Discount"
              disabled={readOnly}
            />
          </div>
        </div>

        {/* ROW 2: Patient Name, Payment */}
        <div className="grid grid-cols-12 gap-3">
          {/* Patient Name */}
          <div className="col-span-4 relative">
            <AnimatedInput
              label="Patient Name"
              value={customer.patientName}
              onChange={(e) => updateField("patientName", e.target.value)}
              placeholder="Patient name"
              icon={UserCircle}
              disabled={customer.sameAsCustomer}
              readOnly={readOnly}
            />
            <div className="absolute -top-2 right-0 flex items-center gap-1 bg-white px-1">
              <ToggleCheckbox
                checked={customer.sameAsCustomer || false}
                onChange={handleSameAsCustomer}
                label="Same as Customer"
                disabled={readOnly}
              />
              {!readOnly && !customer.sameAsCustomer && customer.name && (
                <button
                  onClick={copyCustomerToPatient}
                  className="p-0.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                  title="Copy customer name"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Payment Type */}
          <div className="col-span-2 relative">
            <label className="absolute left-8 -top-2 text-[9px] bg-white px-1 font-semibold text-gray-500 z-10">
              Payment
            </label>
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <CreditCard size={14} strokeWidth={1.5} />
            </div>
            <select
              value={customer.paymentType}
              onChange={(e) => updateField("paymentType", e.target.value)}
              disabled={readOnly}
              className={`w-full h-9 pl-8 pr-3 text-[11px] rounded-lg border outline-none transition-all font-medium
                ${
                  readOnly
                    ? "bg-slate-50 border-slate-200 text-slate-600 cursor-default"
                    : "bg-white border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                }`}
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="CREDIT">Credit</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          {/* Cash Received */}
          <div className="col-span-2">
            <AnimatedInput
              label="Cash Received"
              value={customer.cashReceived}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d.]/g, "");
                const parts = value.split(".");
                const sanitized =
                  parts.length > 2
                    ? parts[0] + "." + parts.slice(1).join("")
                    : value;
                updateField("cashReceived", sanitized);
              }}
              placeholder="0.00"
              icon={IndianRupee}
              type="text"
              readOnly={readOnly}
            />
          </div>

          {/* Balance */}
          <div
            className={`col-span-2 relative h-9 rounded-lg border flex items-center px-3
              ${
                customer.paymentType === "CREDIT" ||
                customer.paymentType === "ONLINE"
                  ? "bg-blue-50 border-blue-200"
                  : balance > 0
                    ? "bg-amber-50 border-amber-200"
                    : balance < 0
                      ? "bg-green-50 border-green-200"
                      : "bg-gray-50 border-gray-200"
              }`}
          >
            <Wallet
              size={14}
              className={`mr-2 ${
                customer.paymentType === "CREDIT" ||
                customer.paymentType === "ONLINE"
                  ? "text-blue-600"
                  : balance > 0
                    ? "text-amber-600"
                    : balance < 0
                      ? "text-green-600"
                      : "text-gray-400"
              }`}
            />
            <div className="flex-1">
              <span className="text-[9px] text-gray-500 block -mb-0.5">
                {customer.paymentType === "CREDIT"
                  ? "Credit Sale"
                  : customer.paymentType === "ONLINE"
                    ? "Paid Online"
                    : balance > 0
                      ? "Balance Due"
                      : balance < 0
                        ? "Return"
                        : "Balance"}
              </span>
              <span
                className={`text-[11px] font-bold ${
                  customer.paymentType === "CREDIT" ||
                  customer.paymentType === "ONLINE"
                    ? "text-blue-700"
                    : balance > 0
                      ? "text-amber-700"
                      : balance < 0
                        ? "text-green-700"
                        : "text-gray-600"
                }`}
              >
                {customer.paymentType === "CREDIT" ||
                customer.paymentType === "ONLINE"
                  ? `₹ ${netAmount.toFixed(2)}`
                  : `₹ ${Math.abs(balance).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* E-Way Bill */}
          <div className="col-span-2">
            <AnimatedInput
              label="E-Way Bill"
              value={customer.eWayBillNo || ""}
              onChange={(e) =>
                updateField("eWayBillNo", e.target.value.toUpperCase())
              }
              placeholder="E-Way No"
              icon={Truck}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* ROW 3: Address */}
        <div>
          <AnimatedInput
            label="Address"
            value={customer.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Enter complete customer address"
            icon={MapPin}
            className="w-full"
            readOnly={readOnly}
          />
        </div>

        {/* ROW 4: Customer info badges */}
        {customer.customer_id && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            {customer.discountPercent > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-[10px] text-green-600">
                  Customer Discount:
                </span>
                <span className="text-[11px] font-bold text-green-700">
                  {customer.discountPercent}%
                </span>
              </div>
            )}
            {customer.gstNumber && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-[10px] text-blue-600">GSTIN:</span>
                <span className="text-[11px] font-mono font-medium text-blue-700">
                  {customer.gstNumber}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Marketplace read-only notice */}
        {readOnly && (
          <div className="flex items-center gap-2 pt-2 border-t border-indigo-100">
            <Lock size={10} className="text-indigo-500 shrink-0" />
            <p className="text-[10px] text-indigo-600">
              Customer details are pre-filled from the marketplace order and
              cannot be edited.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailsCard;
