// cadmin-web/src/pages/Settings/comps/ContactModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Settings/comps/ContactModal.jsx

import { useState } from "react";
import { X, Mail, Phone, Loader2, AlertCircle, Save } from "lucide-react";
import { updateContact } from "../../../api/cadminProfile";

const ContactModal = ({ currentEmail, currentPhone, onClose }) => {
  const [email, setEmail] = useState(currentEmail || "");
  const [phone, setPhone] = useState(currentPhone || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(val);
    setErrors((p) => ({ ...p, phone: undefined }));
  };

  const validate = () => {
    const errs = {};
    const trimEmail = email.trim().toLowerCase();
    const emailChanged = trimEmail !== (currentEmail || "").toLowerCase();
    const phoneChanged = phone !== (currentPhone || "");

    if (!emailChanged && !phoneChanged) {
      errs.general = "No changes detected";
      return errs;
    }
    if (emailChanged && !trimEmail) errs.email = "Email is required";
    else if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail))
      errs.email = "Enter a valid email address";

    if (phoneChanged && !phone) errs.phone = "Phone number is required";
    else if (phoneChanged && phone.length !== 10)
      errs.phone = "Must be exactly 10 digits";
    else if (phoneChanged && !/^[6-9]/.test(phone))
      errs.phone = "Must start with 6, 7, 8, or 9";

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {};
    const trimEmail = email.trim().toLowerCase();
    if (trimEmail !== (currentEmail || "").toLowerCase())
      payload.email = trimEmail;
    if (phone !== (currentPhone || "")) payload.phone_number = phone;

    setSaving(true);
    try {
      await updateContact(payload);
      const parts = [
        payload.email && "email",
        payload.phone_number && "phone number",
      ].filter(Boolean);
      onClose(
        `${parts.map((p) => p[0].toUpperCase() + p.slice(1)).join(" and ")} updated successfully`,
      );
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Failed to update contact info",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !saving && onClose(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md
                   animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4
                        flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-white">
            <Mail size={18} />
            <h3 className="text-base font-semibold">
              Edit Contact Information
            </h3>
          </div>
          <button
            onClick={() => !saving && onClose(false)}
            disabled={saving}
            className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25
                       disabled:opacity-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 block">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({
                    ...p,
                    email: undefined,
                    general: undefined,
                  }));
                }}
                placeholder="Enter email address"
                className={`w-full pl-9 pr-3 h-10 border rounded-xl text-sm outline-none
                            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                            transition-all
                            ${errors.email ? "border-red-300 bg-red-50/50" : "border-gray-200"}`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 block">
              Phone Number
            </label>
            <div
              className={`flex items-center border rounded-xl overflow-hidden
                             focus-within:ring-2 focus-within:ring-indigo-500/20
                             focus-within:border-indigo-500 transition-all
                             ${errors.phone ? "border-red-300" : "border-gray-200"}`}
            >
              <span
                className="px-3 h-10 flex items-center bg-gray-50 text-sm
                               text-gray-500 border-r border-gray-200 select-none flex-shrink-0"
              >
                +91
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="10-digit number"
                className="flex-1 px-3 h-10 text-sm outline-none bg-white"
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.phone}
              </p>
            )}
          </div>

          {/* General error */}
          {errors.general && (
            <div
              className="flex items-center gap-2 text-red-600 text-xs
                            bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              {errors.general}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => !saving && onClose(false)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-600
                         hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#05015A]
                         hover:bg-[#06027a] rounded-xl transition-colors
                         disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
