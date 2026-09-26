// pharmacy-web/src/pages/verification/comps/VerificationSuccess.jsx (do not remove this comment)
// src/components/verification/VerificationSuccess.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Package, Receipt, BarChart3 } from "lucide-react";
import { completeOnboarding } from "../../../api/auth";
import { getMySubscription } from "../../../api/subscription";
import { getSetupStatus } from "../../../api/setup";

// Full animated checkmark for first-time users
const AnimatedCheckmark = () => {
  return (
    <div className="relative w-40 h-40 flex-shrink-0">
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-emerald-200"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-emerald-400"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{
          duration: 1.2,
          delay: 0.5,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />

      {/* Inner circle */}
      <motion.div
        className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      />

      {/* Checkmark */}
      <motion.svg
        className="absolute inset-0 w-full h-full p-10"
        viewBox="0 0 24 24"
        fill="none"
      >
        <motion.path
          d="M4 12.5L9.5 18L20 6"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        />
      </motion.svg>

      {/* Sparkles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 bg-emerald-400 rounded-full"
          style={{ top: "50%", left: "50%" }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            x: Math.cos((i * 90 * Math.PI) / 180) * 80,
            y: Math.sin((i * 90 * Math.PI) / 180) * 80,
          }}
          transition={{ duration: 0.6, delay: 0.6 + i * 0.05 }}
        />
      ))}
    </div>
  );
};

// Simpler checkmark for returning users
const SimpleCheckmark = () => {
  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
      />
      <motion.svg
        className="absolute inset-0 w-full h-full p-6"
        viewBox="0 0 24 24"
        fill="none"
      >
        <motion.path
          d="M4 12.5L9.5 18L20 6"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        />
      </motion.svg>
    </div>
  );
};

const VerificationSuccess = ({ isFirstVerification = true }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    // Only show features animation for first-time users
    if (isFirstVerification) {
      const timer = setTimeout(() => setShowFeatures(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isFirstVerification]);

  /**
   * Determine where to navigate after verification
   * Priority:
   * 1. No subscription → /plan-selection
   * 2. Has subscription but setup incomplete → /setup
   * 3. Has subscription and setup complete → /erp/dashboard
   */
  const handleGetStarted = async () => {
    setLoading(true);
    try {
      // Step 1: Complete onboarding status on backend
      await completeOnboarding();

      // Step 2: Check subscription status
      const subRes = await getMySubscription();
      const hasActive = subRes.data?.data?.has_active_subscription === true;

      if (!hasActive) {
        console.log("📍 No active subscription → /plan-selection");
        navigate("/plan-selection", { replace: true });
        return;
      }

      // Step 3: Check if setup is complete (has branches)
      try {
        const setupRes = await getSetupStatus();
        const setupData = setupRes.data?.data;

        if (setupData?.is_complete) {
          console.log("📍 Setup complete → /erp/dashboard");
          navigate("/erp/dashboard", { replace: true });
        } else {
          console.log("📍 Setup incomplete → /setup");
          navigate("/setup", { replace: true });
        }
      } catch (setupErr) {
        console.warn(
          "Setup status check failed, defaulting to /setup",
          setupErr
        );
        navigate("/setup", { replace: true });
      }
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      navigate("/plan-selection", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Package, title: "Inventory", desc: "Track stock levels" },
    { icon: Receipt, title: "Invoices", desc: "GST billing" },
    { icon: BarChart3, title: "Analytics", desc: "Business insights" },
  ];

  // ═══════════════════════════════════════════════════════════════
  // RETURNING USER VIEW (Re-verification)
  // ═══════════════════════════════════════════════════════════════
  if (!isFirstVerification) {
    return (
      <div className="w-full h-full flex items-center justify-center px-6 font-poppins">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-xl bg-white rounded-3xl overflow-hidden text-center"
          style={{ boxShadow: "0px 8px 60px rgba(0,0,0,0.1)" }}
        >
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-[#000060] to-emerald-400" />

          <div className="flex flex-col items-center gap-6 p-10 lg:p-12">
            {/* Checkmark */}
            <SimpleCheckmark />

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 px-5 py-2 rounded-full"
            >
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-base font-semibold text-emerald-700">
                Re-Verified
              </span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl lg:text-4xl font-bold text-[#000060]"
            >
              Welcome Back!
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-500 text-lg max-w-md"
            >
              Your documents have been re-verified successfully. You're all set
              to continue using Cureli.
            </motion.p>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              onClick={handleGetStarted}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`
                flex items-center justify-center gap-3 mt-4 px-10 py-4 rounded-2xl font-bold text-lg
                transition-all duration-200
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#000060] hover:bg-[#000080] text-white shadow-xl shadow-[#000060]/25"
                }
              `}
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Loading...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight size={24} />
                  </motion.div>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // FIRST-TIME USER VIEW (Original)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="w-full h-full flex items-center justify-center px-6 font-poppins">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-6xl bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: "0px 8px 60px rgba(0,0,0,0.1)" }}
      >
        {/* Top gradient line */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-[#000060] to-emerald-400" />

        <div className="flex flex-col lg:flex-row items-center gap-12 p-10 lg:p-16">
          {/* Left Section - Checkmark & Title */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left lg:flex-1">
            <div className="flex items-center gap-8 mb-6">
              <AnimatedCheckmark />

              <div>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="inline-flex items-center gap-3 bg-emerald-50 border-2 border-emerald-200 px-5 py-2 rounded-full mb-4"
                >
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-base font-semibold text-emerald-700">
                    Verified
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-4xl lg:text-5xl font-bold text-[#000060]"
                >
                  Welcome to Cureli
                </motion.h2>
              </div>
            </div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-gray-500 text-lg lg:text-xl max-w-lg"
            >
              Your pharmacy is verified. Full access to all features is now
              available.
            </motion.p>

            {/* CTA Button - Desktop */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              onClick={handleGetStarted}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`
                hidden lg:flex items-center justify-center gap-3 mt-8 px-10 py-4 rounded-2xl font-bold text-lg
                transition-all duration-200
                ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#000060] hover:bg-[#000080] text-white shadow-xl shadow-[#000060]/25"
                }
              `}
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Setting up...
                </>
              ) : (
                <>
                  Get Started
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight size={24} />
                  </motion.div>
                </>
              )}
            </motion.button>
          </div>

          {/* Vertical Divider - Desktop */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="hidden lg:block w-px h-56 bg-gradient-to-b from-transparent via-gray-300 to-transparent"
          />

          {/* Horizontal Divider - Mobile */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="lg:hidden w-full max-w-md h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"
          />

          {/* Right Section - Features */}
          {showFeatures && (
            <div className="flex flex-row lg:flex-col gap-5 lg:gap-4 lg:flex-1">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ x: -5, backgroundColor: "#f8fafc" }}
                  className="flex items-center gap-5 p-5 rounded-2xl border-2 border-gray-100 cursor-default transition-colors flex-1 lg:flex-none"
                >
                  <div className="w-16 h-16 bg-[#000060]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon size={32} className="text-[#000060]" />
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="font-semibold text-gray-800 text-lg leading-tight">
                      {feature.title}
                    </p>
                    <p className="text-base text-gray-400 leading-tight">
                      {feature.desc}
                    </p>
                  </div>
                  <div className="sm:hidden">
                    <p className="font-semibold text-gray-800 text-sm">
                      {feature.title}
                    </p>
                  </div>
                  <Check
                    size={22}
                    className="text-emerald-500 flex-shrink-0 ml-auto hidden sm:block"
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Button - Mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="lg:hidden px-10 pb-10"
        >
          <button
            onClick={handleGetStarted}
            disabled={loading}
            className={`
              w-full flex items-center justify-center gap-3 py-5 rounded-2xl font-bold text-lg
              transition-all duration-200
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#000060] hover:bg-[#000080] text-white shadow-xl shadow-[#000060]/25"
              }
            `}
          >
            {loading ? (
              <>
                <motion.div
                  className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Setting up...
              </>
            ) : (
              <>
                Get Started
                <ArrowRight size={24} />
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerificationSuccess;
