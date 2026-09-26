// cadmin-web/src/pages/Cadmin-Login/comps/CAdminLoginForm.jsx (do not remove this comment)
// CAdminLoginForm.jsx
import { useState, useRef } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { loginCAdmin, loginCAdminDirect } from "../../../api/auth";
import {
  Loader2,
  CheckCircle2,
  User,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CAdminLoginForm = ({ onSuccess, enableOtp = false }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username is required";
    if (!password.trim()) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      if (enableOtp) {
        const res = await loginCAdmin({ username, password });
        const phone_hint = res.data.data.phone_hint;
        setLoading(false);
        onSuccess(username, phone_hint);
      } else {
        const res = await loginCAdminDirect({ username, password });
        const accessToken = res.data.data.access_token;

        //  Store token IMMEDIATELY — before any navigation or timeout
        localStorage.setItem("cadmin_access_token", accessToken);

        setLoading(false);
        setSuccess(true);

        // Navigate after success animation — token is already in localStorage
        setTimeout(() => {
          navigate("/dashboard");
        }, 1800);
      }
    } catch (err) {
      setErrors({
        general:
          err?.response?.data?.message ||
          "Invalid credentials. Please try again.",
      });
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="w-full font-poppins relative min-h-[360px]">
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            {/* Animated Rings */}
            <div className="relative">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.4, 1.8],
                    opacity: [0.4, 0.2, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                  }}
                  className="absolute rounded-full border-2 border-[#000060]"
                  style={{
                    width: 80,
                    height: 80,
                    left: -40,
                    top: -40,
                  }}
                />
              ))}

              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="relative z-10 w-16 h-16 rounded-xl bg-[#000060] flex items-center justify-center shadow-lg shadow-[#000060]/30"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <CheckCircle2
                    className="w-8 h-8 text-white"
                    strokeWidth={2.5}
                  />
                </motion.div>
              </motion.div>

              {/* Decorative Dots */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`dot-${i}`}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * 60 * Math.PI) / 180) * 60,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 60,
                    opacity: [1, 1, 0],
                  }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#000060]"
                />
              ))}
            </div>

            {/* Success Text */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative z-10 text-center mt-6"
            >
              <h3 className="text-xl font-bold text-[#000060] mb-1">
                Welcome Back
              </h3>
              <p className="text-slate-500 text-sm">
                Redirecting to dashboard...
              </p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative z-10 w-40 h-1 bg-slate-200 rounded-full mt-5 overflow-hidden"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.0, delay: 0.6, ease: "easeInOut" }}
                className="h-full bg-[#000060] rounded-full"
              />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#000060]">Admin Login</h2>
              <p className="text-slate-500 text-sm mt-1">
                Enter your credentials to continue
              </p>
            </div>

            {/* Error Alert */}
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-5 p-3 bg-red-50 border border-red-100 rounded-lg"
                >
                  <p className="text-red-600 text-sm text-center">
                    {errors.general}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div
                  className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                              ${
                                focusedField === "username"
                                  ? "text-[#000060]"
                                  : "text-slate-400"
                              }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Enter username"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200
                            bg-slate-50 text-slate-700 placeholder:text-slate-400 text-sm
                            focus:bg-white focus:outline-none
                            ${
                              errors.username
                                ? "border-red-300 focus:border-red-400"
                                : "border-slate-200 focus:border-[#000060] focus:ring-2 focus:ring-[#000060]/10"
                            }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-xs mt-1.5"
                >
                  {errors.username}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div
                  className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200
                              ${
                                focusedField === "password"
                                  ? "text-[#000060]"
                                  : "text-slate-400"
                              }`}
                >
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-all duration-200
                            bg-slate-50 text-slate-700 placeholder:text-slate-400 text-sm
                            focus:bg-white focus:outline-none
                            ${
                              errors.password
                                ? "border-red-300 focus:border-red-400"
                                : "border-slate-200 focus:border-[#000060] focus:ring-2 focus:ring-[#000060]/10"
                            }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  onKeyPress={handleKeyPress}
                  ref={passwordRef}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 
                           hover:text-[#000060] transition-colors"
                >
                  {showPassword ? (
                    <IoEyeOutline className="text-lg" />
                  ) : (
                    <IoEyeOffOutline className="text-lg" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-xs mt-1.5"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="text-right mb-5">
              <button
                type="button"
                onClick={() => navigate("/admin-forgot-password")}
                className="text-sm text-[#000060] hover:text-[#000060]/80 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              disabled={loading}
              onClick={handleSubmit}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full py-3 rounded-lg font-medium transition-all duration-200 
                         flex items-center justify-center gap-2 group
                         bg-[#000060] text-white hover:bg-[#000060]/90
                         shadow-md shadow-[#000060]/20 hover:shadow-lg hover:shadow-[#000060]/25
                         disabled:bg-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{enableOtp ? "Sending OTP..." : "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CAdminLoginForm;
