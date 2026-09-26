// pharmacy-web/src/pages/marketplace-onboarding/steps/BankingStep.jsx (do not remove this comment)
// pharmacy-web/src/pages/marketplace-onboarding/steps/BankingStep.jsx

import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Landmark,
  AlertCircle,
  Loader2,
  Check,
  CreditCard,
  Eye,
  EyeOff,
} from "lucide-react";
import { useMarketplaceStore } from "../../../store/useMarketplaceStore";

const BankingStep = ({ onNext, onBack }) => {
  const banking = useMarketplaceStore((s) => s.banking);
  const updateBanking = useMarketplaceStore((s) => s.updateBanking);
  const submitBanking = useMarketplaceStore((s) => s.submitBanking);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  const validate = () => {
    const errs = {};
    if (!banking.bank_account_holder?.trim())
      errs.bank_account_holder = "Account Holder Name is required";
    if (!banking.bank_name?.trim()) errs.bank_name = "Bank Name is required";
    if (!banking.bank_branch_name?.trim())
      errs.bank_branch_name = "Branch Name is required";

    const ifsc = banking.bank_ifsc?.trim() || "";
    if (!ifsc) {
      errs.bank_ifsc = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      errs.bank_ifsc =
        "Enter a valid 11-character alphanumeric IFSC code (e.g. UTIB0001234)";
    }

    if (!banking.bank_account_number?.trim()) {
      errs.bank_account_number = "Account Number is required";
    } else if (banking.bank_account_number.trim().length < 9) {
      errs.bank_account_number =
        "Account number must be at least 9 characters long";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const patch = (key, val) => {
    updateBanking({ [key]: val });
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!validate()) return;

    setIsSubmitting(true);
    const res = await submitBanking();
    setIsSubmitting(false);

    if (res.success) {
      onNext();
    } else {
      setSubmitErr(
        res.error || "Failed to save banking details. Please try again.",
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <Landmark size={18} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white leading-tight">
            Settlement Banking Details
          </h2>
          <p className="text-white/40 text-xs mt-0.5">
            Your weekly payout settlements will be processed manually to this
            account.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Holder Name */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/60 font-medium">
            Account Holder Name *
          </label>
          <input
            type="text"
            value={banking.bank_account_holder}
            onChange={(e) => patch("bank_account_holder", e.target.value)}
            placeholder="e.g. Apollo Pharmacies Limited"
            className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white/[0.03] border text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all ${
              errors.bank_account_holder
                ? "border-red-500/40"
                : "border-white/10"
            }`}
          />
          {errors.bank_account_holder && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={11} /> {errors.bank_account_holder}
            </p>
          )}
        </div>

        {/* Bank Account Number */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/70 font-medium flex items-center gap-1.5">
              <CreditCard size={13} className="text-white/40" />
              Bank Account Number <span className="text-red-400">*</span>
            </label>
            <span className="text-[10px] text-white/25 font-mono">
              {(banking.bank_account_number || "").length}/18
            </span>
          </div>

          <div className="relative">
            <input
              type={showAccountNumber ? "text" : "password"}
              inputMode="numeric"
              value={banking.bank_account_number || ""}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 18);
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

            {banking.bank_account_number ? (
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
                {showAccountNumber ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            ) : null}
          </div>

          {errors.bank_account_number ? (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={11} /> {errors.bank_account_number}
            </p>
          ) : (
            <p className="text-[10px] text-white/25">
              9–18 digits as printed on your passbook or cheque
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Bank IFSC */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/60 font-medium">
              IFSC Code *
            </label>
            <input
              type="text"
              value={banking.bank_ifsc}
              onChange={(e) => patch("bank_ifsc", e.target.value.toUpperCase())}
              placeholder="e.g. UTIB0000001"
              maxLength={11}
              className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white/[0.03] border text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all ${
                errors.bank_ifsc ? "border-red-500/40" : "border-white/10"
              }`}
            />
            {errors.bank_ifsc && (
              <p className="text-xs text-red-400 flex items-center gap-1 leading-normal">
                <AlertCircle size={11} className="flex-shrink-0" />{" "}
                {errors.bank_ifsc}
              </p>
            )}
          </div>

          {/* Bank Name */}
          <div className="space-y-1.5">
            <label className="text-xs text-white/60 font-medium">
              Bank Name *
            </label>
            <input
              type="text"
              value={banking.bank_name}
              onChange={(e) => patch("bank_name", e.target.value)}
              placeholder="e.g. Axis Bank"
              className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white/[0.03] border text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all ${
                errors.bank_name ? "border-red-500/40" : "border-white/10"
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
          <label className="text-xs text-white/60 font-medium">
            Bank Branch Name *
          </label>
          <input
            type="text"
            value={banking.bank_branch_name}
            onChange={(e) => patch("bank_branch_name", e.target.value)}
            placeholder="e.g. MG Road Branch"
            className={`w-full px-4 py-2.5 rounded-xl text-sm bg-white/[0.03] border text-white placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-white/20 transition-all ${
              errors.bank_branch_name ? "border-red-500/40" : "border-white/10"
            }`}
          />
          {errors.bank_branch_name && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={11} /> {errors.bank_branch_name}
            </p>
          )}
        </div>

        {/* Optional Fields Toggle Segment */}
        <div className="pt-2">
          <div className="px-4 py-3 bg-white/[0.015] border border-white/[0.04] rounded-2xl space-y-4">
            <p className="text-xs font-semibold text-white/40">
              Optional Payout Methods
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* MMID */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 font-medium">
                  MMID
                </label>
                <input
                  type="text"
                  value={banking.bank_mmid || ""}
                  onChange={(e) => patch("bank_mmid", e.target.value)}
                  placeholder="e.g. 9876543"
                  maxLength={7}
                  className="w-full px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white placeholder-white/10 focus:outline-none focus:border-white/10"
                />
              </div>

              {/* UPI ID / VPA */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 font-medium">
                  UPI ID / VPA
                </label>
                <input
                  type="text"
                  value={banking.bank_vpa || ""}
                  onChange={(e) => patch("bank_vpa", e.target.value)}
                  placeholder="e.g. apollopharm@axis"
                  className="w-full px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white placeholder-white/10 focus:outline-none focus:border-white/10"
                />
              </div>
            </div>
          </div>
        </div>

        {submitErr && (
          <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400">{submitErr}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t border-white/[0.05]">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border border-white/10
              text-white/50 text-sm font-medium hover:border-white/20
              hover:text-white/70 transition-all flex items-center
              justify-center gap-2"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-2.5 bg-white text-[#010015] rounded-xl
              font-bold text-sm hover:bg-white/90 disabled:opacity-50
              disabled:cursor-not-allowed transition-all flex items-center
              justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                Save & Continue <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BankingStep;