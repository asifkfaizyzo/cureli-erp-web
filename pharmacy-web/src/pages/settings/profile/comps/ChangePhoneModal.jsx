// pharmacy-web/src/pages/settings/profile/comps/ChangePhoneModal.jsx (do not remove this comment)
// Q:\YourZeroesAndOnes\cureli\curely_erp\pharmacy-web\src\pages\settings\profile\comps\ChangePhoneModal.jsx

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  MessageSquare,
  KeyRound,
} from "lucide-react";

import {
  initiatePhoneVerifyOld,
  verifyOldPhoneOtp,
  initiatePhoneNew,
  verifyPhoneNew,
  initiatePhoneChangeWithPassword,
} from "../../../../api/profile";

/**
 * ChangePhoneModal
 * Multi-step modal for changing phone number
 *
 * Method 1 (OTP):
 *   Step 1: Send & verify OTP to old phone
 *   Step 2: Enter new phone & verify OTP sent to new phone
 *
 * Method 2 (Password):
 *   Step 1: Enter password + new phone
 *   Step 2: Verify OTP sent to new phone
 */
const ChangePhoneModal = ({ currentPhone, onClose }) => {
  // Method: 'otp' or 'password'
  const [method, setMethod] = useState(null);

  // Step state
  const [step, setStep] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    current_password: "",
    old_otp: "",
    new_phone: "",
    new_otp: "",
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  // OTP timer state
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Old phone verified flag (for OTP method)
  const [oldPhoneVerified, setOldPhoneVerified] = useState(false);

  // Format phone for display
  const formatPhone = (phone) => {
    if (!phone) return "Not set";
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  };

  // Start countdown timer
  const startCountdown = (seconds = 30) => {
    setCountdown(seconds);
    setCanResend(false);
  };

  // Countdown effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitError(null);
  };

  // Reset to method selection
  const handleBackToMethodSelection = () => {
    setMethod(null);
    setStep(1);
    setFormData({
      current_password: "",
      old_otp: "",
      new_phone: "",
      new_otp: "",
    });
    setErrors({});
    setSubmitError(null);
    setOldPhoneVerified(false);
    setCountdown(0);
  };

  // ============================================
  // OTP METHOD HANDLERS
  // ============================================

  // Select OTP method and send OTP immediately
  const handleSelectOtpMethod = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await initiatePhoneVerifyOld();
      const timeout = response.data?.data?.timeout || 300;
      startCountdown(Math.min(30, timeout));

      // Only set method if OTP was sent successfully
      setMethod("otp");
    } catch (err) {
      console.error("Send old OTP error:", err);
      const message = err.response?.data?.message || "Failed to send OTP";

      if (err.response?.status === 429) {
        const waitTime = err.response?.data?.data?.waitTime || 30;
        startCountdown(waitTime);
        setSubmitError(
          `Please wait ${waitTime} seconds before requesting again`,
        );
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify old phone OTP
  const handleVerifyOldOtp = async () => {
    if (!formData.old_otp || formData.old_otp.length < 4) {
      setErrors({ old_otp: "Please enter the OTP" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await verifyOldPhoneOtp({ otp: formData.old_otp });
      setOldPhoneVerified(true);
      setFormData((prev) => ({ ...prev, old_otp: "" })); // Clear old OTP
    } catch (err) {
      console.error("Verify old OTP error:", err);
      const message = err.response?.data?.message || "Failed to verify OTP";
      setErrors({ old_otp: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send OTP to new phone (after old phone verified)
  const handleSendNewPhoneOtp = async () => {
    if (!formData.new_phone) {
      setErrors({ new_phone: "New phone number is required" });
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.new_phone)) {
      setErrors({ new_phone: "Phone must be 10 digits" });
      return;
    }

    if (formData.new_phone === currentPhone) {
      setErrors({ new_phone: "New phone is same as current phone" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await initiatePhoneNew({
        new_phone: formData.new_phone,
      });

      const timeout = response.data?.data?.timeout || 300;
      startCountdown(Math.min(30, timeout));
      setStep(2);
    } catch (err) {
      console.error("Send new phone OTP error:", err);
      const message = err.response?.data?.message || "Failed to send OTP";

      if (message.toLowerCase().includes("phone")) {
        setErrors({ new_phone: message });
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // PASSWORD METHOD HANDLERS
  // ============================================

  // Initiate phone change with password
  const handlePasswordMethodSubmit = async () => {
    const newErrors = {};

    if (!formData.current_password) {
      newErrors.current_password = "Password is required";
    }

    if (!formData.new_phone) {
      newErrors.new_phone = "New phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.new_phone)) {
      newErrors.new_phone = "Phone must be 10 digits";
    } else if (formData.new_phone === currentPhone) {
      newErrors.new_phone = "New phone is same as current phone";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await initiatePhoneChangeWithPassword({
        current_password: formData.current_password,
        new_phone: formData.new_phone,
      });

      const timeout = response.data?.data?.timeout || 300;
      startCountdown(Math.min(30, timeout));
      setStep(2);
    } catch (err) {
      console.error("Initiate phone change error:", err);
      const message =
        err.response?.data?.message || "Failed to initiate phone change";

      if (message.toLowerCase().includes("password")) {
        setErrors({ current_password: message });
      } else if (message.toLowerCase().includes("phone")) {
        setErrors({ new_phone: message });
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // COMMON HANDLERS
  // ============================================

  // Verify new phone OTP (common for both methods)
  const handleVerifyNewOtp = async () => {
    if (!formData.new_otp || formData.new_otp.length < 4) {
      setErrors({ new_otp: "Please enter the OTP" });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await verifyPhoneNew({ otp: formData.new_otp });
      setSuccess(true);

      // Auto close after success
      setTimeout(() => {
        onClose(true);
      }, 2000);
    } catch (err) {
      console.error("Verify new OTP error:", err);
      const message = err.response?.data?.message || "Failed to verify OTP";

      if (
        message.toLowerCase().includes("otp") ||
        message.toLowerCase().includes("expired")
      ) {
        setErrors({ new_otp: message });
      } else {
        setSubmitError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (method === "otp" && step === 1 && !oldPhoneVerified) {
        await initiatePhoneVerifyOld();
      } else if (step === 2) {
        // Resend to new phone
        if (method === "password") {
          await initiatePhoneChangeWithPassword({
            current_password: formData.current_password,
            new_phone: formData.new_phone,
          });
        } else {
          await initiatePhoneNew({ new_phone: formData.new_phone });
        }
      }
      startCountdown(30);
    } catch (err) {
      console.error("Resend OTP error:", err);
      if (err.response?.status === 429) {
        const waitTime = err.response?.data?.data?.waitTime || 30;
        startCountdown(waitTime);
      } else {
        setSubmitError(err.response?.data?.message || "Failed to resend OTP");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go back
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setFormData((prev) => ({ ...prev, new_otp: "" }));
      setErrors({});
      setSubmitError(null);
    } else if (method === "otp" && oldPhoneVerified) {
      setOldPhoneVerified(false);
      setFormData((prev) => ({ ...prev, new_phone: "" }));
      setErrors({});
      setSubmitError(null);
    } else {
      handleBackToMethodSelection();
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
            Phone Changed!
          </h3>
          <p className="text-gray-500">
            Your phone has been updated to{" "}
            <strong>{formatPhone(formData.new_phone)}</strong>
          </p>
        </motion.div>
      </div>
    );
  }

  // Calculate total steps for progress bar
  const getTotalSteps = () => {
    if (method === "otp") return 3; // Verify old -> Enter new -> Verify new
    return 2; // Password + new phone -> Verify new
  };

  const getCurrentStep = () => {
    if (method === "otp") {
      if (step === 1 && !oldPhoneVerified) return 1;
      if (step === 1 && oldPhoneVerified) return 2;
      return 3;
    }
    return step;
  };

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
            {method !== null && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900">
              Change Phone Number
            </h2>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Indicator (only when method is selected) */}
        {method && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: getTotalSteps() }).map((_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    idx < getCurrentStep() ? "bg-[#000060]" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Step {getCurrentStep()} of {getTotalSteps()}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">
          <AnimatePresence mode="wait">
            {/* Method Selection */}
            {!method && (
              <motion.div
                key="method-selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Current Phone Display */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#000060]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone size={28} className="text-[#000060]" />
                  </div>
                  <p className="text-sm text-gray-600">Current phone number</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {formatPhone(currentPhone)}
                  </p>
                </div>

                <p className="text-sm text-gray-600 text-center mb-4">
                  Choose how you want to verify your identity
                </p>

                {/* Error Display */}
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

                {/* OTP Method */}
                <button
                  onClick={handleSelectOtpMethod}
                  disabled={isSubmitting}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#000060] hover:bg-[#000060]/5 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    {isSubmitting ? (
                      <Loader2
                        size={24}
                        className="text-[#000060] animate-spin"
                      />
                    ) : (
                      <MessageSquare size={24} className="text-[#000060]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Verify via OTP</p>
                    <p className="text-sm text-gray-500">
                      {isSubmitting
                        ? "Sending OTP..."
                        : "We'll send a code to your current phone"}
                    </p>
                  </div>
                  {!isSubmitting && (
                    <ArrowRight size={20} className="text-gray-400" />
                  )}
                </button>

                {/* Password Method */}
                <button
                  onClick={() => {
                    setMethod("password");
                    setSubmitError(null);
                  }}
                  disabled={isSubmitting}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#000060] hover:bg-[#000060]/5 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <KeyRound size={24} className="text-[#000060]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Verify via Password
                    </p>
                    <p className="text-sm text-gray-500">
                      Use your account password instead
                    </p>
                  </div>
                  <ArrowRight size={20} className="text-gray-400" />
                </button>
              </motion.div>
            )}

            {/* OTP Method - Step 1: Verify Old Phone */}
            {method === "otp" && step === 1 && !oldPhoneVerified && (
              <motion.div
                key="otp-step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-[#000060]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone size={28} className="text-[#000060]" />
                  </div>
                  <p className="text-sm text-gray-600">
                    We've sent a verification code to
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatPhone(currentPhone)}
                  </p>
                </div>

                {/* Old OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.old_otp}
                    onChange={(e) =>
                      handleChange(
                        "old_otp",
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="Enter OTP"
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 transition-all ${
                      errors.old_otp
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                    autoFocus
                  />
                  {errors.old_otp && (
                    <p className="text-red-500 text-xs mt-1 text-center">
                      {errors.old_otp}
                    </p>
                  )}

                  {/* Resend OTP */}
                  <div className="flex justify-center mt-2">
                    {countdown > 0 ? (
                      <p className="text-xs text-gray-500">
                        Resend OTP in {countdown}s
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 text-xs text-[#000060] hover:underline disabled:opacity-50"
                      >
                        <RefreshCw size={12} />
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* OTP Method - Step 1b: Enter New Phone (after old verified) */}
            {method === "otp" && step === 1 && oldPhoneVerified && (
              <motion.div
                key="otp-step1b"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-emerald-600" />
                  </div>
                  <p className="text-sm text-emerald-600 font-medium">
                    Current phone verified!
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Now enter your new phone number
                  </p>
                </div>

                {/* New Phone Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={formData.new_phone}
                      onChange={(e) =>
                        handleChange(
                          "new_phone",
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="9876543210"
                      maxLength={10}
                      className={`w-full pl-12 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.new_phone
                          ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }`}
                      autoFocus
                    />
                  </div>
                  {errors.new_phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.new_phone}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Password Method - Step 1: Password + New Phone */}
            {method === "password" && step === 1 && (
              <motion.div
                key="password-step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-gray-600 mb-4">
                  Enter your current password and new phone number. We'll send a
                  verification code to your new phone.
                </p>

                {/* Current Phone Display */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Current Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPhone(currentPhone)}
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

                {/* New Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={formData.new_phone}
                      onChange={(e) =>
                        handleChange(
                          "new_phone",
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="9876543210"
                      maxLength={10}
                      className={`w-full pl-12 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.new_phone
                          ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }`}
                    />
                  </div>
                  {errors.new_phone && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.new_phone}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Verify New Phone OTP (common for both methods) */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-[#000060]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone size={28} className="text-[#000060]" />
                  </div>
                  <p className="text-sm text-gray-600">
                    We've sent a verification code to your new phone
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatPhone(formData.new_phone)}
                  </p>
                </div>

                {/* New OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.new_otp}
                    onChange={(e) =>
                      handleChange(
                        "new_otp",
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="Enter OTP"
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-lg text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 transition-all ${
                      errors.new_otp
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                    autoFocus
                  />
                  {errors.new_otp && (
                    <p className="text-red-500 text-xs mt-1 text-center">
                      {errors.new_otp}
                    </p>
                  )}

                  {/* Resend OTP */}
                  <div className="flex justify-center mt-2">
                    {countdown > 0 ? (
                      <p className="text-xs text-gray-500">
                        Resend OTP in {countdown}s
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 text-xs text-[#000060] hover:underline disabled:opacity-50"
                      >
                        <RefreshCw size={12} />
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Code expires in 5 minutes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Error */}
          {submitError && method && (
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
        {method && (
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
              onClick={() => {
                if (method === "otp") {
                  if (step === 1 && !oldPhoneVerified) {
                    handleVerifyOldOtp();
                  } else if (step === 1 && oldPhoneVerified) {
                    handleSendNewPhoneOtp();
                  } else {
                    handleVerifyNewOtp();
                  }
                } else {
                  if (step === 1) {
                    handlePasswordMethodSubmit();
                  } else {
                    handleVerifyNewOtp();
                  }
                }
              }}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {step === 2 ? "Verifying..." : "Processing..."}
                </>
              ) : step === 2 ? (
                "Verify & Change Phone"
              ) : method === "otp" && !oldPhoneVerified ? (
                <>
                  Verify OTP
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Send Code
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ChangePhoneModal;
