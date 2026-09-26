// pharmacy-web/src/pages/settings/profile/comps/ChangeEmailModal.jsx (do not remove this comment)
// Q:\YourZeroesAndOnes\cureli\curely_erp\pharmacy-web\src\pages\settings\profile\comps\ChangeEmailModal.jsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

import {
  initiateEmailChange,
  verifyEmailChange,
} from "../../../../api/profile";

/**
 * ChangeEmailModal
 * Multi-step modal for changing email
 * Step 1: Enter current password + new email
 * Step 2: Enter OTP sent to new email
 */
const ChangeEmailModal = ({ currentEmail, onClose }) => {
  // Step state: 1 = password + email, 2 = OTP verification
  const [step, setStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    current_password: "",
    new_email: "",
    otp: "",
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  // OTP state
  const [otpSentTo, setOtpSentTo] = useState("");

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitError(null);
  };

  // Validate Step 1
  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.current_password) {
      newErrors.current_password = "Password is required";
    }

    if (!formData.new_email) {
      newErrors.new_email = "New email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.new_email)) {
      newErrors.new_email = "Invalid email format";
    } else if (
      formData.new_email.toLowerCase() === currentEmail?.toLowerCase()
    ) {
      newErrors.new_email = "New email is same as current email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.otp) {
      newErrors.otp = "OTP is required";
    } else if (formData.otp.length < 4) {
      newErrors.otp = "OTP must be at least 4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Step 1 Submit - Initiate email change
  const handleStep1Submit = async () => {
    if (!validateStep1()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await initiateEmailChange({
        current_password: formData.current_password,
        new_email: formData.new_email.toLowerCase().trim(),
      });

      setOtpSentTo(response.data?.data?.email || formData.new_email);
      setStep(2);
    } catch (err) {
      console.error("Initiate email change error:", err);
      const message =
        err.response?.data?.message || "Failed to initiate email change";

      // Handle specific errors
      if (message.toLowerCase().includes("password")) {
        setErrors({ current_password: message });
      } else if (message.toLowerCase().includes("email")) {
        setErrors({ new_email: message });
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Step 2 Submit - Verify OTP
  const handleStep2Submit = async () => {
    if (!validateStep2()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await verifyEmailChange({ otp: formData.otp });
      setSuccess(true);

      // Auto close after success
      setTimeout(() => {
        onClose(true);
      }, 2000);
    } catch (err) {
      console.error("Verify email change error:", err);
      const message = err.response?.data?.message || "Failed to verify OTP";

      if (
        message.toLowerCase().includes("otp") ||
        message.toLowerCase().includes("expired")
      ) {
        setErrors({ otp: message });
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go back to step 1
  const handleBack = () => {
    setStep(1);
    setFormData((prev) => ({ ...prev, otp: "" }));
    setErrors({});
    setSubmitError(null);
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
            Email Changed!
          </h3>
          <p className="text-gray-500">
            Your email has been updated to <strong>{otpSentTo}</strong>
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
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">
              {step === 1 ? "Change Email" : "Verify Email"}
            </h2>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-1.5 rounded-full ${
                step >= 1 ? "bg-[#000060]" : "bg-gray-200"
              }`}
            />
            <div
              className={`flex-1 h-1.5 rounded-full ${
                step >= 2 ? "bg-[#000060]" : "bg-gray-200"
              }`}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Step {step} of 2</p>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <AnimatePresence mode="wait">
            {/* Step 1: Password + New Email */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <p className="text-sm text-gray-600 mb-4">
                  Enter your current password and new email address. We'll send
                  a verification code to your new email.
                </p>

                {/* Current Email Display */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Current Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {currentEmail || "Not set"}
                  </p>
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.current_password}
                      onChange={(e) =>
                        handleChange("current_password", e.target.value)
                      }
                      placeholder="Enter your password"
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.current_password
                          ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.current_password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.current_password}
                    </p>
                  )}
                </div>

                {/* New Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      value={formData.new_email}
                      onChange={(e) =>
                        handleChange("new_email", e.target.value)
                      }
                      placeholder="newemail@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.new_email
                          ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }`}
                    />
                  </div>
                  {errors.new_email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.new_email}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#000060]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail size={28} className="text-[#000060]" />
                  </div>
                  <p className="text-sm text-gray-600">
                    We've sent a verification code to
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {otpSentTo}
                  </p>
                </div>

                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.otp}
                    onChange={(e) =>
                      handleChange(
                        "otp",
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="Enter 4-digit code"
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 transition-all ${
                      errors.otp
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                    autoFocus
                  />
                  {errors.otp && (
                    <p className="text-red-500 text-xs mt-1 text-center">
                      {errors.otp}
                    </p>
                  )}
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Code expires in 10 minutes. Check your spam folder if you
                  don't see it.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Error */}
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-4"
            >
              <AlertCircle size={16} />
              {submitError}
            </motion.div>
          )}
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
            onClick={step === 1 ? handleStep1Submit : handleStep2Submit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {step === 1 ? "Sending..." : "Verifying..."}
              </>
            ) : step === 1 ? (
              <>
                Send Code
                <ArrowRight size={16} />
              </>
            ) : (
              "Verify & Change Email"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangeEmailModal;
