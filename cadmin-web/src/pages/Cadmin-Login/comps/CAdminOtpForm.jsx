// cadmin-web/src/pages/Cadmin-Login/comps/CAdminOtpForm.jsx (do not remove this comment)
// CAdminOtpForm.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { verifyOtpCAdmin } from "../../../api/auth";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, ArrowLeft, RefreshCw } from "lucide-react";

const CAdminOtpForm = ({ username, phoneHint, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const refs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const t = setInterval(() => setTimer((v) => v - 1), 1000);
      return () => clearInterval(t);
    }
  }, [timer]);

  useEffect(() => {
    const code = otp.join("");
    if (
      code.length === 4 &&
      otp.every((d) => d !== "") &&
      !loading &&
      !success
    ) {
      handleVerify(code);
    }
  }, [otp]);

  const updateOtp = (value, idx) => {
    if (!/^\d?$/.test(value)) return;
    if (loading || success) return;

    const updated = [...otp];
    updated[idx] = value;
    setOtp(updated);
    setError("");

    if (value && idx < 3) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (loading || success) return;

    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtp(digits);
      refs.current[3]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (loading || success) return;

    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }

    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 4) {
        handleVerify(code);
      }
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleVerify = async (otpCode = null) => {
    const code = otpCode || otp.join("");
    if (code.length !== 4 || loading || success) return;

    setLoading(true);
    setError("");

    try {
      const res = await verifyOtpCAdmin({ username, otp: code });
      setSuccess(true);

      setTimeout(() => {
        localStorage.setItem("cadmin_access_token", res.data.data.access_token);
        navigate("/dashboard");
      }, 600);
    } catch (err) {
      setError(
        err?.response?.data?.message || "Invalid OTP. Please try again."
      );
      triggerShake();

      setTimeout(() => {
        setOtp(["", "", "", ""]);
        refs.current[0]?.focus();
      }, 300);
    }

    setLoading(false);
  };

  const getInputStyle = (idx) => {
    if (success) return "border-[#000060] bg-[#000060]/5 text-[#000060]";
    if (error) return "border-red-400 bg-red-50 text-red-600";
    if (otp[idx]) return "border-[#000060] bg-[#000060]/5 text-[#000060]";
    return "border-slate-200 bg-slate-50 focus:border-[#000060] focus:ring-2 focus:ring-[#000060]/10";
  };

  return (
    <div className="w-full font-poppins min-h-[360px]">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-500 hover:text-[#000060] transition-colors mb-5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </motion.button>

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-[#000060] mb-1">Verify OTP</h2>
        <p className="text-slate-500 text-sm">
          Code sent to{" "}
          <span className="font-medium text-slate-700">{phoneHint}</span>
        </p>
      </div>

      {/* OTP Inputs */}
      <motion.div
        animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
        onPaste={handlePaste}
        className="flex justify-center gap-3 mb-5"
      >
        {otp.map((digit, idx) => (
          <motion.input
            key={idx}
            ref={(el) => (refs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            disabled={loading || success}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`w-12 h-14 text-center text-xl font-bold rounded-lg border
                      outline-none transition-all duration-200 disabled:cursor-not-allowed
                      ${getInputStyle(idx)}`}
            value={digit}
            onChange={(e) => updateOtp(e.target.value, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          />
        ))}

        {/* Success Check */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center ml-1"
            >
              <div className="w-8 h-8 rounded-full bg-[#000060]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#000060]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg text-center"
          >
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        disabled={loading || otp.some((v) => v === "") || success}
        onClick={() => handleVerify()}
        whileHover={{ scale: loading || success ? 1 : 1.01 }}
        whileTap={{ scale: loading || success ? 1 : 0.99 }}
        className={`w-full py-3 rounded-lg font-medium transition-all duration-200 
                   flex items-center justify-center gap-2
                   ${
                     success
                       ? "bg-[#000060] text-white"
                       : "bg-[#000060] text-white hover:bg-[#000060]/90"
                   }
                   shadow-md shadow-[#000060]/20
                   disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Verified</span>
          </>
        ) : (
          <span>Verify & Continue</span>
        )}
      </motion.button>

      {/* Timer / Resend */}
      <div className="mt-5 text-center">
        {timer > 0 ? (
          <p className="text-slate-500 text-sm">
            Resend in{" "}
            <span className="font-medium text-[#000060] tabular-nums">
              00:{timer.toString().padStart(2, "0")}
            </span>
          </p>
        ) : (
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 mx-auto text-[#000060] 
                     hover:text-[#000060]/80 font-medium text-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resend OTP</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CAdminOtpForm;
