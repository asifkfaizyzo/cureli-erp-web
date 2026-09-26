// cadmin-web/src/pages/marketplace/Shops/comps/EditBankDetailsModal.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/comps/EditBankDetailsModal.jsx

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Wallet,
  User,
  CreditCard,
  Lock,
  FileText,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { updateShopStorefront } from "../../../../api/cadminMarketplaceShops";

// validation helper
function validate(form) {
  const errors = {};
  if (form.bank_ifsc?.trim() && form.bank_ifsc.trim().length !== 11) {
    errors.bank_ifsc = "IFSC code must be exactly 11 characters";
  }
  return errors;
}

const EditBankDetailsModal = ({ shop, onClose, onSaved }) => {
  const mp = shop.marketplaceProfile;

  const [form, setForm] = useState({
    bank_account_holder: mp?.bank_account_holder ?? "",
    bank_name: mp?.bank_name ?? "",
    bank_branch_name: mp?.bank_branch_name ?? "",
    bank_ifsc: mp?.bank_ifsc ?? "",
    bank_account_number: mp?.bank_account_number ?? "",
    bank_mmid: mp?.bank_mmid ?? "",
    bank_vpa: mp?.bank_vpa ?? "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [submitErr, setSubmitErr] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const patch = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = async () => {
    setSubmitErr(null);
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      await updateShopStorefront(shop.shop_id, {
        bank_account_holder: form.bank_account_holder.trim() || null,
        bank_name: form.bank_name.trim() || null,
        bank_branch_name: form.bank_branch_name.trim() || null,
        bank_ifsc: form.bank_ifsc.trim().toUpperCase() || null,
        bank_account_number: form.bank_account_number.trim() || null,
        bank_mmid: form.bank_mmid.trim() || null,
        bank_vpa: form.bank_vpa.trim() || null,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaved();
      }, 900);
    } catch (err) {
      setSubmitErr(err.response?.data?.message || "Failed to save bank credentials");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                <Wallet size={16} className="text-[#05015A]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">Edit Bank & Payout Credentials</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{shop.business_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Account Holder Name</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.bank_account_holder}
                  onChange={(e) => patch("bank_account_holder", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-[#05015A]/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Bank Name</label>
              <div className="relative">
                <Wallet size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.bank_name}
                  onChange={(e) => patch("bank_name", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-xl focus:ring-2"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Branch Name</label>
              <input
                type="text"
                value={form.bank_branch_name}
                onChange={(e) => patch("bank_branch_name", e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-xl focus:ring-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">IFSC Code</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.bank_ifsc}
                    onChange={(e) => patch("bank_ifsc", e.target.value.toUpperCase())}
                    maxLength={11}
                    className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:ring-2 uppercase"
                  />
                </div>
                {errors.bank_ifsc && (
                  <p className="text-[10px] text-red-500 mt-0.5">{errors.bank_ifsc}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Account Number</label>
                <div className="relative">
                  <CreditCard size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.bank_account_number}
                    onChange={(e) => patch("bank_account_number", e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:ring-2"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">MMID</label>
                <input
                  type="text"
                  value={form.bank_mmid}
                  onChange={(e) => patch("bank_mmid", e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl focus:ring-2"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">UPI VPA</label>
                <div className="relative">
                  <FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.bank_vpa}
                    onChange={(e) => patch("bank_vpa", e.target.value)}
                    placeholder="example@ybl"
                    className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:ring-2"
                  />
                </div>
              </div>
            </div>

            {submitErr && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{submitErr}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all text-white ${
                saveSuccess ? "bg-emerald-500" : "bg-[#05015A] hover:bg-[#0a0280]"
              }`}
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin" />
              ) : saveSuccess ? (
                <Check size={12} />
              ) : (
                "Save Bank Details"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default EditBankDetailsModal;