// pharmacy-web/src/pages/onboarding/comps/pending/EmailOTP.jsx (do not remove this comment)
// src/components/onboarding/EmailOTP.jsx

import { useState, useRef, useEffect } from "react";
import { sendSignupOtp, verifySignupOtp } from "../../../../api/otp";
import { Loader2, CheckCircle2, Mail, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const EmailOTP = ({ pending_id, email, onContinue }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputsRef = useRef([]);

  // Auto-focus first input
  useEffect(() => {
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Auto-submit when 4 digits filled
  useEffect(() => {
    const code = otp.join("");
    if (
      code.length === 4 &&
      otp.every((d) => d !== "") &&
      !loading &&
      !success
    ) {
      handleSubmit(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    if (loading || success) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");
    setResendSuccess(false);

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (loading || success) return;

    // Backspace navigation
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    // Enter to submit
    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 4) {
        handleSubmit(code);
      }
    }
  };

  // Paste support
  const handlePaste = (e) => {
    e.preventDefault();
    if (loading || success) return;

    const data = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(data)) {
      const digits = data.split("");
      setOtp(digits);
      inputsRef.current[3]?.focus();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;

    setResending(true);
    setError("");
    setOtp(["", "", "", ""]);
    setSuccess(false);
    setResendSuccess(false);

    try {
      await sendSignupOtp({ pending_id, isResend: true });

      // Show success message briefly
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);

      // Reset timer
      setTimer(30);

      // Focus first input
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error("Resend Email OTP error:", err);

      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Failed to resend OTP";
      const waitTime = err?.response?.data?.data?.waitTime;

      if (status === 429) {
        // Rate limited - extract wait time
        setError(msg);
        if (waitTime) {
          setTimer(waitTime);
        } else {
          // Try to extract from message
          const waitMatch = msg.match(/(\d+)\s*seconds/);
          if (waitMatch) {
            setTimer(parseInt(waitMatch[1]));
          }
        }
      } else if (status === 404) {
        setError("Session expired. Please start signup again.");
      } else {
        setError(msg);
      }
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (otpCode = null) => {
    const fullOtp = otpCode || otp.join("");
    if (fullOtp.length !== 4 || loading || success) return;

    setLoading(true);
    setError("");
    setResendSuccess(false);

    try {
      await verifySignupOtp({ pending_id, otp: fullOtp });

      setSuccess(true);

      // Brief delay to show success
      setTimeout(() => {
        onContinue();
      }, 600);
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Invalid OTP. Please try again.";
      setError(msg);
      triggerShake();

      setTimeout(() => {
        setOtp(["", "", "", ""]);
        inputsRef.current[0]?.focus();
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  const getInputClassName = (idx) => {
    const base = `w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg
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

  // Mask email for privacy
  const maskEmail = (email) => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    if (name.length <= 2) return email;
    const maskedLength = Math.min(name.length - 2, 6);
    return `${name[0]}${"*".repeat(maskedLength)}${name.slice(-1)}@${domain}`;
  };

  return (
    <div
      className="w-full max-w-sm font-poppins px-3 mt-10"
      style={{ marginLeft: "-25%" }}
    >
      <h2 className="text-[26px] font-bold text-[#000006]">
        Verify Your Email
      </h2>

      <div className="flex items-center gap-2 mt-2 mb-4">
        <Mail className="w-4 h-4 text-gray-500" />
        <p className="text-gray-500 text-sm">
          Code sent to <b className="text-[#000060]">{maskEmail(email)}</b>
        </p>
      </div>

      <div className="w-full h-[1px] bg-gray-300 mb-5" />

      <p className="text-sm font-medium text-[#000060] mb-2">
        Verification Code
      </p>

      {/* OTP Inputs */}
      <div
        className={`flex gap-3 mb-1 ${shake ? "animate-shake" : ""}`}
        onPaste={handlePaste}
      >
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={loading || success || resending}
            className={`${getInputClassName(
              i
            )} disabled:cursor-not-allowed disabled:opacity-60`}
          />
        ))}

        {/* Success indicator */}
        {success && (
          <div className="flex items-center ml-1 animate-scale-in">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        )}
      </div>

      {/* Timer / Resend */}
      <div className="text-center mt-3">
        {timer > 0 ? (
          <p className="text-sm text-gray-600">
            Resend code in{" "}
            <span className="font-medium text-[#000060]">
              00:{timer < 10 ? `0${timer}` : timer}
            </span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-[#7A3AFF] text-sm font-medium cursor-pointer hover:underline 
                       bg-transparent border-none disabled:opacity-50 disabled:cursor-not-allowed
                       inline-flex items-center gap-2"
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Resend Code"
            )}
          </button>
        )}
      </div>

      {/* Messages area - fixed height to prevent layout shift */}
      <div className="h-12 mt-2 flex items-start justify-center">
        {/* Error message */}
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

        {/* Resend success message */}
        {resendSuccess && !error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-600 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>New code sent to your email!</span>
          </motion.div>
        )}

        {/* Verification success message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-600 text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Email verified successfully!</span>
          </motion.div>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={() => handleSubmit()}
        disabled={loading || otp.some((v) => v === "") || success || resending}
        className={`w-full py-3 rounded-xl mt-4 font-medium transition-all duration-300
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
            Verified!
          </div>
        ) : (
          "Continue"
        )}
      </button>

      {/* Check spam hint */}
      {!success && (
        <p className="text-xs text-gray-400 text-center mt-3">
          Didn't receive it? Check your spam folder or try resending
        </p>
      )}

      {/* Animations */}
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

export default EmailOTP;
