// pharmacy-web/src/pages/login/comps/LoginOtpVerification.jsx (do not remove this comment)
// src/pages/login/comps/LoginOtpVerification.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { verifyLoginOtp, resendLoginOtp } from "../../../api/auth";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

import { useAuthStore } from "../../../store/useAuthStore";
import { useSetupStore } from "../../../store/useSetupStore";
import { useToast } from "../../../components/common/Toast";
import { determineAuthDestination } from "../../../utils/authRouting";

// Constants
const RESEND_TIMER_SECONDS = 60;

const clearAllStaleData = () => {
  const keysToRemove = [
    "cureli-auth-storage",
    "cureli-setup-storage",
    "menu-storage",
    "access_token",
    "user_id",
    "shop_id",
    "user_name",
    "branch_name",
    "shop_name",
  ];

  keysToRemove.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key}:`, e);
    }
  });

  sessionStorage.clear();
};

const LoginOtpVerification = ({
  tempToken,
  phoneHint,
  onBack,
  onTokenUpdate,
}) => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const resetSetup = useSetupStore((state) => state.resetSetup);
  const toast = useToast();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(RESEND_TIMER_SECONDS);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [currentTempToken, setCurrentTempToken] = useState(tempToken);
  const [currentPhoneHint, setCurrentPhoneHint] = useState(phoneHint);

  const inputsRef = useRef([]);

  // ── FIX: Track last attempted code to prevent duplicate verify calls ──
  const lastAttemptedCodeRef = useRef("");

  // Focus first input on mount
  useEffect(() => {
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Sync props → state when parent updates token after resend
  useEffect(() => {
    setCurrentTempToken(tempToken);
  }, [tempToken]);

  useEffect(() => {
    setCurrentPhoneHint(phoneHint);
  }, [phoneHint]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleVerify = useCallback(
    async (otpCode) => {
      if (!otpCode || otpCode.length !== 4 || loading || success) return;

      setLoading(true);
      setError("");
      setResendSuccess(false);

      try {
        const res = await verifyLoginOtp({
          temp_token: currentTempToken,
          otp: otpCode,
        });

        const {
          access_token,
          next_step,
          shop_id,
          user_id,
          branch_id,
          branch_name,
          shop_name,
          role,
          user_name,
          username,
        } = res.data.data;

        setSuccess(true);
        toast.success("Verified!", "Logging you in...");

        resetSetup();
        clearAllStaleData();
        setAuth({
          access_token,
          user_id,
          shop_id,
          branch_id,
          branch_name,
          shop_name,
          role,
          user_name,
          username,
        });

        setTimeout(async () => {
          if (next_step === -1) {
            const destination = await determineAuthDestination(role);
            navigate(destination, { replace: true });
            return;
          }

          if ([12, 14, 15].includes(next_step)) {
            navigate("/verification", {
              state: { resume_step: next_step },
              replace: true,
            });
            return;
          }

          navigate("/onboarding", {
            state: { resume_step: next_step },
            replace: true,
          });
        }, 600);
      } catch (err) {
        console.error("OTP verification error:", err);
        const msg =
          err?.response?.data?.message || "Invalid OTP. Please try again.";

        setError(msg);
        toast.error("Verification Failed", msg);
        triggerShake();

        setTimeout(() => {
          setOtp(["", "", "", ""]);
          // ── FIX: Clear the ref so the next code the user types can be verified ──
          lastAttemptedCodeRef.current = "";
          inputsRef.current[0]?.focus();
        }, 300);

        setLoading(false);
      }
    },
    [
      loading,
      success,
      currentTempToken,
      toast,
      resetSetup,
      setAuth,
      navigate,
      triggerShake,
    ],
  );

  // Auto-verify when all 4 digits are entered
  useEffect(() => {
    const code = otp.join("");
    if (
      code.length === 4 &&
      otp.every((d) => d !== "") &&
      !loading &&
      !success &&
      code !== lastAttemptedCodeRef.current // ── FIX: prevent re-verify of same code
    ) {
      lastAttemptedCodeRef.current = code; // ── FIX: mark as attempted
      handleVerify(code);
    }
  }, [otp, loading, success, handleVerify]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    if (loading || success) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    setError("");
    setResendSuccess(false);

    // ── FIX: Reset attempted ref when user starts typing a new code ──
    lastAttemptedCodeRef.current = "";

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (loading || success) return;

    if (e.key === "Backspace" && index > 0 && !otp[index]) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 4) {
        lastAttemptedCodeRef.current = code;
        handleVerify(code);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (loading || success) return;

    const data = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(data)) {
      const digits = data.split("");
      setOtp(digits);
      lastAttemptedCodeRef.current = ""; // ── FIX: allow auto-verify of pasted code
      inputsRef.current[3]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;

    setResending(true);
    setError("");
    setOtp(["", "", "", ""]);
    setSuccess(false);
    setResendSuccess(false);
    lastAttemptedCodeRef.current = ""; // ── FIX: reset on resend

    try {
      const res = await resendLoginOtp({
        temp_token: currentTempToken,
      });

      const { temp_token: newToken, phone_hint: newPhoneHint } = res.data.data;

      setCurrentTempToken(newToken);
      if (newPhoneHint) {
        setCurrentPhoneHint(newPhoneHint);
      }

      if (onTokenUpdate) {
        onTokenUpdate(newToken, newPhoneHint);
      }

      setResendSuccess(true);
      toast.success(
        "OTP Resent",
        `New code sent to ${newPhoneHint || "your phone"}`,
      );

      setTimeout(() => setResendSuccess(false), 3000);
      setTimer(RESEND_TIMER_SECONDS);

      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error("Resend OTP error:", err);

      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Failed to resend OTP";
      const waitTime = err?.response?.data?.data?.waitTime;

      if (status === 401) {
        setError("Session expired. Please login again.");
        toast.error("Session Expired", "Please login again");
        setTimeout(() => {
          onBack?.();
        }, 2000);
      } else if (status === 429) {
        setError(msg);
        toast.warning("Too Many Requests", msg);

        if (waitTime && waitTime > 0) {
          setTimer(waitTime);
        } else {
          const waitMatch = msg.match(/(\d+)\s*seconds/);
          if (waitMatch) {
            setTimer(parseInt(waitMatch[1]));
          } else {
            setTimer(RESEND_TIMER_SECONDS);
          }
        }
      } else {
        setError(msg);
        toast.error("Resend Failed", msg);
      }
    } finally {
      setResending(false);
    }
  };

  const getInputClassName = (idx) => {
    const base = `w-14 h-16 text-center text-2xl font-semibold border-2 rounded-xl
                  outline-none transition-all duration-200`;

    if (success) {
      return `${base} border-green-500 bg-green-50 text-green-600`;
    }
    if (error) {
      return `${base} border-red-500 bg-red-50`;
    }
    if (otp[idx]) {
      return `${base} border-[#000060] bg-[#F7F7FF] text-[#000060]`;
    }
    return `${base} border-gray-300 focus:border-[#000060] focus:ring-2 focus:ring-[#000060]/20`;
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs < 10 ? `0${secs}` : secs}`;
    }
    return `00:${secs < 10 ? `0${secs}` : secs}`;
  };

  return (
    <div className="w-full h-screen font-poppins relative">
      <button
        type="button"
        onClick={onBack}
        disabled={loading || resending}
        className="absolute top-8 left-6 flex items-center gap-2 text-[#000060] cursor-pointer hover:opacity-70 transition-opacity z-10 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <IoArrowBackOutline className="text-xl" />
        <span className="text-lg font-medium">Back</span>
      </button>

      <motion.div
        className="w-full h-full flex flex-col items-center justify-start pt-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h1 className="text-3xl font-semibold text-[#000060] mt-10">
            Verify Your Identity
          </h1>

          <p className="mt-4 text-gray-600 text-center">
            Enter 4-digit code sent to <br />
            <span className="font-medium">
              {currentPhoneHint || "+91 ******0000"}
            </span>
          </p>

          <div
            className={`flex gap-4 mt-10 ${shake ? "animate-shake" : ""}`}
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={loading || success || resending}
                className={`${getInputClassName(index)} disabled:cursor-not-allowed disabled:opacity-60`}
              />
            ))}

            {success && (
              <div className="flex items-center ml-2 animate-scale-in">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            )}
          </div>

          <div className="h-12 mt-4 flex items-center justify-center">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-600 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {resendSuccess && !error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-green-600 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>New code sent to your phone!</span>
              </motion.div>
            )}
          </div>

          {/* Manual verify button */}
          <button
            onClick={() => {
              const code = otp.join("");
              lastAttemptedCodeRef.current = code;
              handleVerify(code);
            }}
            disabled={
              loading || otp.join("").length !== 4 || success || resending
            }
            className={`w-[300px] py-3 rounded-xl font-semibold mt-4 transition-all duration-300
              ${
                success
                  ? "bg-green-500 text-white"
                  : "bg-[#000060] text-white hover:bg-[#000060d1] disabled:bg-gray-400"
              } disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Verifying...
              </div>
            ) : success ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Success!
              </div>
            ) : (
              "Continue"
            )}
          </button>

          <div className="mt-4 text-sm text-gray-600">
            {timer > 0 ? (
              <p>
                Re-send code in{" "}
                <span className="font-medium text-[#000060]">
                  {formatTimer(timer)}
                </span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[#000060] font-medium cursor-pointer hover:underline bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </button>
            )}
          </div>

          {!success && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Didn't receive it? Check your phone signal or try resending
            </p>
          )}
        </motion.div>
      </motion.div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LoginOtpVerification;