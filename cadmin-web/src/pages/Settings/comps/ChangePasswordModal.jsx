// cadmin-web/src/pages/Settings/comps/ChangePasswordModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Settings/comps/ChangePasswordModal.jsx

import { useState } from "react";
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { changePassword } from "../../../api/cadminProfile";

const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setError("");
  };

  const checks = [
    { label: "At least 8 characters", pass: form.newPassword.length >= 8 },
    { label: "Contains a number", pass: /\d/.test(form.newPassword) },
    {
      label: "Contains uppercase letter",
      pass: /[A-Z]/.test(form.newPassword),
    },
    {
      label: "Passwords match",
      pass:
        form.newPassword === form.confirmPassword &&
        form.confirmPassword.length > 0,
    },
  ];

  const allValid =
    form.currentPassword.length > 0 && checks.every((c) => c.pass);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.currentPassword) {
      setError("Current password is required");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError("New password must be different");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      onClose("Password changed successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const PasswordInput = ({ label, field, showKey }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 block">
        {label}
      </label>
      <div className="relative">
        <Lock
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type={show[showKey] ? "text" : "password"}
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="w-full pl-9 pr-10 h-10 border border-gray-200 rounded-xl text-sm
                     outline-none focus:ring-2 focus:ring-indigo-500/20
                     focus:border-indigo-500 transition-all"
        />
        <button
          type="button"
          onClick={() => setShow((p) => ({ ...p, [showKey]: !p[showKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                     hover:text-gray-600 transition-colors"
        >
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

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
            <Lock size={18} />
            <h3 className="text-base font-semibold">Change Password</h3>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <PasswordInput
            label="Current Password"
            field="currentPassword"
            showKey="current"
          />
          <PasswordInput
            label="New Password"
            field="newPassword"
            showKey="new"
          />
          <PasswordInput
            label="Confirm New Password"
            field="confirmPassword"
            showKey="confirm"
          />

          {/* Strength checks */}
          {form.newPassword.length > 0 && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2 border border-gray-100">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center
                                   flex-shrink-0 transition-colors
                                   ${c.pass ? "bg-emerald-100" : "bg-gray-100"}`}
                  >
                    <Check
                      size={10}
                      className={c.pass ? "text-emerald-600" : "text-gray-300"}
                    />
                  </div>
                  <span
                    className={c.pass ? "text-emerald-700" : "text-gray-400"}
                  >
                    {c.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div
              className="flex items-center gap-2 text-red-600 text-xs
                            bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
            >
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

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
              disabled={saving || !allValid}
              className="px-4 py-2 text-sm font-medium text-white bg-[#05015A]
                         hover:bg-[#06027a] rounded-xl transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
