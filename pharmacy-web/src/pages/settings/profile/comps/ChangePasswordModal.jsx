// pharmacy-web/src/pages/settings/profile/comps/ChangePasswordModal.jsx (do not remove this comment)
// Q:\YourZeroesAndOnes\cureli\curely_erp\pharmacy-web\src\pages\settings\profile\comps\ChangePasswordModal.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { changePassword } from "../../../../api/profile";

/**
 * ChangePasswordModal
 * Modal for changing password
 */
const ChangePasswordModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Password requirements
  const requirements = [
    { label: "At least 8 characters", test: (p) => p.length >= 8 },
    { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "One number", test: (p) => /\d/.test(p) },
    {
      label: "One special character (@$!%*?&)",
      test: (p) => /[@$!%*?&]/.test(p),
    },
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitError(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.current_password) {
      newErrors.current_password = "Current password is required";
    }

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else {
      const failedReqs = requirements.filter(
        (r) => !r.test(formData.new_password),
      );
      if (failedReqs.length > 0) {
        newErrors.new_password = "Password does not meet requirements";
      }
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    if (
      formData.current_password === formData.new_password &&
      formData.new_password
    ) {
      newErrors.new_password =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await changePassword(formData);
      setSuccess(true);

      // Auto close after success
      setTimeout(() => {
        onClose(true);
      }, 2000);
    } catch (err) {
      console.error("Change password error:", err);
      setSubmitError(
        err.response?.data?.message || "Failed to change password",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Password Changed!
          </h3>
          <p className="text-gray-500">
            Your password has been updated successfully.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onClose(false)}
        className="absolute inset-0 bg-black/50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={formData.current_password}
                  onChange={(e) =>
                    handleChange("current_password", e.target.value)
                  }
                  placeholder="Enter current password"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.current_password
                      ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                      : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {errors.current_password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.current_password}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.new_password}
                  onChange={(e) => handleChange("new_password", e.target.value)}
                  placeholder="Enter new password"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.new_password
                      ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                      : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.new_password}
                </p>
              )}

              {/* Password Requirements */}
              {formData.new_password && (
                <div className="mt-2 space-y-1">
                  {requirements.map((req, idx) => {
                    const passed = req.test(formData.new_password);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 text-xs ${
                          passed ? "text-emerald-600" : "text-gray-400"
                        }`}
                      >
                        <CheckCircle size={12} />
                        {req.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirm_password}
                  onChange={(e) =>
                    handleChange("confirm_password", e.target.value)
                  }
                  placeholder="Confirm new password"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.confirm_password
                      ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                      : formData.confirm_password &&
                          formData.new_password === formData.confirm_password
                        ? "border-emerald-400 focus:ring-emerald-400/30 focus:border-emerald-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirm_password}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                <AlertCircle size={16} />
                {submitError}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onClose(false)}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Changing...
              </>
            ) : (
              "Change Password"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePasswordModal;
