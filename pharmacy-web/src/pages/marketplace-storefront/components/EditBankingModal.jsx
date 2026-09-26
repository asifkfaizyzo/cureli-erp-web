// pharmacy-web/src/pages/marketplace-storefront/components/EditBankingModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-storefront/components/EditBankingModal.jsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Landmark,
  Check,
  AlertCircle,
  Loader2,
  CreditCard,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Smartphone,
  QrCode,
  ShieldCheck,
} from "lucide-react";

const EditBankingModal = ({ isOpen, onClose, banking, onSave }) => {
  const [form, setForm] = useState({
    bank_account_holder: "",
    bank_name: "",
    bank_branch_name: "",
    bank_ifsc: "",
    bank_account_number: "",
    bank_mmid: "",
    bank_vpa: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Seed form on open
  useEffect(() => {
    if (!isOpen || !banking) return;
    setForm({
      bank_account_holder: banking.bank_account_holder || "",
      bank_name: banking.bank_name || "",
      bank_branch_name: banking.bank_branch_name || "",
      bank_ifsc: banking.bank_ifsc || "",
      bank_account_number: banking.bank_account_number || "",
      bank_mmid: banking.bank_mmid || "",
      bank_vpa: banking.bank_vpa || "",
    });
    setErrors({});
    setSubmitErr(null);
    setShowAccountNumber(false);
  }, [isOpen, banking]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const patch = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.bank_account_holder?.trim())
      errs.bank_account_holder = "Account Holder Name is required";
    if (!form.bank_name?.trim()) errs.bank_name = "Bank Name is required";
    if (!form.bank_branch_name?.trim())
      errs.bank_branch_name = "Branch Name is required";

    const ifsc = form.bank_ifsc?.trim() || "";
    if (!ifsc) {
      errs.bank_ifsc = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      errs.bank_ifsc =
        "Enter a valid 11-character alphanumeric IFSC code (e.g. HDFC0001234)";
    }

    const accNo = form.bank_account_number?.trim() || "";
    if (!accNo) {
      errs.bank_account_number = "Account Number is required";
    } else if (accNo.length < 9) {
      errs.bank_account_number =
        "Account number must be at least 9 digits long";
    }

    if (form.bank_mmid && form.bank_mmid.trim().length !== 7) {
      errs.bank_mmid = "MMID must be exactly 7 digits";
    }

    if (form.bank_vpa && !/.+@.+/.test(form.bank_vpa.trim())) {
      errs.bank_vpa = "Enter a valid UPI ID (e.g. name@bank)";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr(null);

    if (!validate()) return;

    setIsSaving(true);
    const result = await onSave(form);
    setIsSaving(false);

    if (result?.success) {
      onClose();
    } else {
      setSubmitErr(
        result?.error || "Failed to update banking details. Please try again.",
      );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel Container */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-white/[0.08] bg-[#0d0a2e] shadow-2xl shadow-black/60 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                    <Landmark size={15} className="text-white/60" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Payout & Banking Details
                    </h2>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      Weekly payouts will be automatically settled to this
                      account
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form
                id="banking-form"
                onSubmit={handleSubmit}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
              >
                {/* Account Holder Name */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
                    <Building2 size={13} className="text-white/30" />
                    Account Holder Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.bank_account_holder}
                    onChange={(e) =>
                      patch("bank_account_holder", e.target.value)
                    }
                    placeholder="e.g. Apollo Pharmacies Limited"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/[0.04] border text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                      errors.bank_account_holder
                        ? "border-red-500/40 focus:ring-red-500/20"
                        : "border-white/10 focus:ring-white/10 focus:border-white/20"
                    }`}
                  />
                  {errors.bank_account_holder ? (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.bank_account_holder}
                    </p>
                  ) : (
                    <p className="text-[10px] text-white/25">
                      Must match the name registered with your bank account
                    </p>
                  )}
                </div>

                {/* Bank Account Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
                      <CreditCard size={13} className="text-white/30" />
                      Bank Account Number{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <span className="text-[10px] text-white/25 font-mono">
                      {(form.bank_account_number || "").length}/18
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showAccountNumber ? "text" : "password"}
                      inputMode="numeric"
                      value={form.bank_account_number || ""}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 18);
                        patch("bank_account_number", digits);
                      }}
                      placeholder="e.g. 5010045612398"
                      maxLength={18}
                      className={`
                        w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm font-mono tracking-wider
                        bg-white/[0.04] border text-white 
                        placeholder:font-sans placeholder:tracking-normal placeholder-white/20
                        focus:outline-none focus:ring-2 transition-all
                        ${
                          errors.bank_account_number
                            ? "border-red-500/40 focus:ring-red-500/20"
                            : "border-white/10 focus:ring-white/10 focus:border-white/20"
                        }
                      `}
                    />

                    {form.bank_account_number ? (
                      <button
                        type="button"
                        onClick={() => setShowAccountNumber((prev) => !prev)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/70 transition-colors focus:outline-none"
                        tabIndex={-1}
                        title={
                          showAccountNumber
                            ? "Hide account number"
                            : "Show account number"
                        }
                      >
                        {showAccountNumber ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    ) : null}
                  </div>

                  {errors.bank_account_number ? (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.bank_account_number}
                    </p>
                  ) : (
                    <p className="text-[10px] text-white/25">
                      9–18 digits as printed on your chequebook or passbook
                    </p>
                  )}
                </div>

                {/* IFSC and Bank Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Bank IFSC */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 font-medium">
                      IFSC Code <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.bank_ifsc}
                      onChange={(e) => {
                        const val = e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 11);
                        patch("bank_ifsc", val);
                      }}
                      placeholder="e.g. HDFC0001234"
                      maxLength={11}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-mono tracking-wider bg-white/[0.04] border text-white placeholder:font-sans placeholder:tracking-normal placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                        errors.bank_ifsc
                          ? "border-red-500/40 focus:ring-red-500/20"
                          : "border-white/10 focus:ring-white/10 focus:border-white/20"
                      }`}
                    />
                    {errors.bank_ifsc && (
                      <p className="text-xs text-red-400 flex items-center gap-1 leading-tight">
                        <AlertCircle size={11} className="flex-shrink-0" />{" "}
                        {errors.bank_ifsc}
                      </p>
                    )}
                  </div>

                  {/* Bank Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/70 font-medium">
                      Bank Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.bank_name}
                      onChange={(e) => patch("bank_name", e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/[0.04] border text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                        errors.bank_name
                          ? "border-red-500/40 focus:ring-red-500/20"
                          : "border-white/10 focus:ring-white/10 focus:border-white/20"
                      }`}
                    />
                    {errors.bank_name && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={11} /> {errors.bank_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bank Branch Name */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
                    <MapPin size={13} className="text-white/30" />
                    Branch Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.bank_branch_name}
                    onChange={(e) => patch("bank_branch_name", e.target.value)}
                    placeholder="e.g. Indiranagar Branch, Bengaluru"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-white/[0.04] border text-white placeholder-white/20 focus:outline-none focus:ring-2 transition-all ${
                      errors.bank_branch_name
                        ? "border-red-500/40 focus:ring-red-500/20"
                        : "border-white/10 focus:ring-white/10 focus:border-white/20"
                    }`}
                  />
                  {errors.bank_branch_name && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle size={11} /> {errors.bank_branch_name}
                    </p>
                  )}
                </div>

                {/* Optional Payout Fields */}
                <div className="pt-2">
                  <div className="p-3.5 bg-white/[0.015] border border-white/[0.05] rounded-xl space-y-3">
                    <p className="text-[10px] uppercase font-semibold tracking-wider text-white/30">
                      Optional Payout Identifiers
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* MMID */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-white/50 font-medium flex items-center gap-1">
                          <Smartphone size={11} className="text-white/30" />{" "}
                          MMID (7-digit)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={form.bank_mmid}
                          onChange={(e) => {
                            const digits = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 7);
                            patch("bank_mmid", digits);
                          }}
                          placeholder="e.g. 9876543"
                          maxLength={7}
                          className="w-full px-3 py-2 bg-white/[0.03] border border-white/5 rounded-lg text-xs font-mono text-white placeholder:font-sans placeholder-white/15 focus:outline-none focus:border-white/15 transition-colors"
                        />
                        {errors.bank_mmid && (
                          <p className="text-[10px] text-red-400">
                            {errors.bank_mmid}
                          </p>
                        )}
                      </div>

                      {/* UPI ID / VPA */}
                      <div className="space-y-1">
                        <label className="text-[11px] text-white/50 font-medium flex items-center gap-1">
                          <QrCode size={11} className="text-white/30" /> UPI ID
                          / VPA
                        </label>
                        <input
                          type="text"
                          value={form.bank_vpa}
                          onChange={(e) =>
                            patch("bank_vpa", e.target.value.trim())
                          }
                          placeholder="e.g. pharmacy@okhdfcbank"
                          className="w-full px-3 py-2 bg-white/[0.03] border border-white/5 rounded-lg text-xs text-white placeholder-white/15 focus:outline-none focus:border-white/15 transition-colors"
                        />
                        {errors.bank_vpa && (
                          <p className="text-[10px] text-red-400">
                            {errors.bank_vpa}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Guarantee Note */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.015] border border-white/[0.03]">
                  <ShieldCheck
                    size={13}
                    className="text-emerald-400/70 flex-shrink-0"
                  />
                  <p className="text-[10px] text-white/30 leading-normal">
                    Bank details are encrypted and used solely for direct
                    merchant payouts.
                  </p>
                </div>

                {submitErr && (
                  <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                    <AlertCircle
                      size={14}
                      className="text-red-400 flex-shrink-0"
                    />
                    <p className="text-xs text-red-400">{submitErr}</p>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-white/[0.06] flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="banking-form"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-[#010015] text-sm font-semibold hover:bg-white/90 transition-all disabled:opacity-40"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check size={13} /> Save Payout Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditBankingModal;
