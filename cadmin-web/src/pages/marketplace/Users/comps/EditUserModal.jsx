// cadmin-web/src/pages/marketplace/Users/comps/EditUserModal.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Users/comps/EditUserModal.jsx

import { useState, useEffect } from "react";
import { User, Mail, Phone, X, Save } from "lucide-react";

const EditUserModal = ({ user, onConfirm, onClose, loading }) => {
  const [tab, setTab] = useState("profile"); // "profile" | "phone"
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setErrors({});
    }
  }, [user]);

  if (!user) return null;

  const validateProfile = () => {
    const errs = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.full_name = "Name must be at least 2 characters";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Invalid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validatePhone = () => {
    const errs = {};
    const stripped = phone.replace(/^\+?91/, "").replace(/\s/g, "");
    if (!/^[6-9]\d{9}$/.test(stripped)) {
      errs.phone = "Enter a valid 10-digit Indian mobile number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (tab === "profile") {
      if (!validateProfile()) return;
      onConfirm("profile", {
        full_name: fullName.trim(),
        email: email.trim() || null,
      });
    } else {
      if (!validatePhone()) return;
      onConfirm("phone", { phone: phone.trim() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <User size={16} className="text-[#05015A]" />
            <h3 className="font-semibold text-gray-800">Edit User</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { key: "profile", label: "Profile", icon: User },
            { key: "phone", label: "Phone Number", icon: Phone },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setErrors({});
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === key
                  ? "border-[#05015A] text-[#05015A]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {tab === "profile" ? (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]/40 ${
                    errors.full_name
                      ? "border-red-400"
                      : "border-gray-200"
                  }`}
                />
                {errors.full_name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Email{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]/40 ${
                    errors.email ? "border-red-400" : "border-gray-200"
                  }`}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 flex-shrink-0">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone.replace(/^\+?91/, "")}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={`flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]/40 ${
                    errors.phone ? "border-red-400" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Changing the phone number will mark it as unverified. The user
                must verify on next login.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#05015A] hover:bg-[#0a0280] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;