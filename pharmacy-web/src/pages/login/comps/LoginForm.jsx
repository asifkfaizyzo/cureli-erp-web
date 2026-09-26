// pharmacy-web/src/pages/login/comps/LoginForm.jsx (do not remove this comment)
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { loginUser } from "../../../api/auth";
import LoginOtpVerification from "./LoginOtpVerification";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore } from "../../../store/useAuthStore";
import { useSetupStore } from "../../../store/useSetupStore";
import { determineAuthDestination } from "../../../utils/authRouting";

const LANDING_PAGE_URL = import.meta.env.VITE_LANDING_PAGE;

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

const LoginForm = ({ onRegisterClick }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [phoneHint, setPhoneHint] = useState("");

  const [isSuspended, setIsSuspended] = useState(false);

  const passwordRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  const setAuth = useAuthStore((state) => state.setAuth);
  const resetSetup = useSetupStore((state) => state.resetSetup);

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password.trim()) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getLoginErrorMessage = (err) => {
    // ── Backend offline / network error — check FIRST ─────────────────────
    // The axios interceptor sets error.response.data.message for network errors.
    // But we must check isNetworkError before the status-based logic below,
    // because our interceptor sets status 503 which would otherwise fall through
    // to the generic "Invalid username or password" fallback.
    if (err?.isNetworkError) {
      return err.response?.data?.message || "Unable to reach the server. Please try again later.";
    }

    const status = err?.response?.status;
    const responseMessage = err?.response?.data?.message;

    if (status === 400 || status === 401) {
      if (
        responseMessage?.toLowerCase().includes("validation") ||
        responseMessage?.toLowerCase().includes("invalid") ||
        responseMessage?.toLowerCase().includes("credentials")
      ) {
        return "Invalid username or password";
      }
    }

    if (status === 403) return null;

    if (responseMessage?.includes("signup was not completed")) return responseMessage;
    if (responseMessage?.includes("Google login")) return responseMessage;
    if (responseMessage?.includes("phone number")) return responseMessage;

    if (status === 429) {
      return responseMessage || "Too many attempts. Please try again later.";
    }

    return "Invalid username or password";
  };

  const handleDirectLogin = async (data) => {
    resetSetup();
    clearAllStaleData();
    setAuth({
      access_token: data.access_token,
      user_id: data.user_id,
      shop_id: data.shop_id,
      branch_id: data.branch_id,
      branch_name: data.branch_name,
      shop_name: data.shop_name,
      role: data.role,
      user_name: data.user_name,
      username: data.username,
    });

    toast.success("Welcome back!", "Logged in successfully.");

    setTimeout(async () => {
      const { next_step } = data;

      if (next_step === -1) {
        const destination = await determineAuthDestination(data.role);
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
    }, 300);
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setIsSuspended(false);

    try {
      const res = await loginUser({ username, password });
      const responseData = res.data.data;

      if (responseData.otp_required === false) {
        await handleDirectLogin(responseData);
        return;
      }

      const { temp_token, phone_hint } = responseData;
      setTempToken(temp_token);
      setPhoneHint(phone_hint);
      setShowOtpScreen(true);
      toast.success("OTP Sent", `Verification code sent to ${phone_hint}`);
    } catch (err) {
      console.error("Login error:", err);

      const status = err?.response?.status;
      const response = err?.response?.data;
      const errorCode = response?.data?.code;

      // ── Suspended check — skip for network errors ─────────────────────
      if (!err?.isNetworkError && (errorCode === "ACCOUNT_SUSPENDED" || status === 403)) {
        setIsSuspended(true);
        toast.error("Account Suspended", "Your account has been suspended");
        return;
      }

      const message = getLoginErrorMessage(err);
      setErrors({ general: message });
      toast.error("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOtpScreen(false);
    setTempToken("");
    setPhoneHint("");
    setPassword("");
  };

  const handleTokenUpdate = (newToken, newPhoneHint) => {
    setTempToken(newToken);
    if (newPhoneHint) setPhoneHint(newPhoneHint);
  };

  const handleBackFromSuspended = () => {
    setIsSuspended(false);
    setUsername("");
    setPassword("");
    setErrors({});
  };

  // ── OTP screen ────────────────────────────────────────────────────────────
  if (showOtpScreen) {
    return (
      <AnimatePresence mode="wait">
        <LoginOtpVerification
          tempToken={tempToken}
          phoneHint={phoneHint}
          onBack={handleBackToLogin}
          onTokenUpdate={handleTokenUpdate}
        />
      </AnimatePresence>
    );
  }

  // ── Suspended view ────────────────────────────────────────────────────────
  if (isSuspended) {
    return (
      <motion.div
        className="relative z-10 w-full max-w-sm font-poppins"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Account Suspended
          </h2>

          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            Your account has been suspended. Please contact Cureli support for
            more information about your account status.
          </p>

          <button
            onClick={() => {
              window.location.href = `${LANDING_PAGE_URL}/contact`;
            }}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-[#000060] text-white rounded-xl font-semibold hover:bg-[#000080] transition-colors"
          >
            Contact Support
            <ArrowRight size={18} />
          </button>

          <button
            onClick={handleBackFromSuspended}
            className="w-full mt-4 py-3 text-gray-600 hover:text-[#000060] font-medium transition-colors"
          >
            ← Back to Login
          </button>
        </div>

        <p className="text-center text-[13px] text-gray-400 mt-8">
          This site is protected by reCAPTCHA and the <br />
          <span
            onClick={() => navigate("/privacy")}
            className="text-[#000060] underline cursor-pointer hover:font-semibold"
          >
            Google Privacy
          </span>{" "}
          policy and{" "}
          <span
            onClick={() => navigate("/terms")}
            className="text-[#000060] underline cursor-pointer hover:font-semibold"
          >
            Terms of Service
          </span>{" "}
          apply.
        </p>
      </motion.div>
    );
  }

  // ── Normal login form ─────────────────────────────────────────────────────
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <motion.div
        className="relative z-10 w-full max-w-sm font-poppins"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-semibold mb-8 text-center text-[#000060]">
          Log in
        </h2>

        {errors.general && (
          <p className="text-red-600 text-center text-sm mb-4">
            {errors.general}
          </p>
        )}

        {/* USERNAME */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#000060]">Username</label>
          <div
            className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md 
              ${errors.username ? "bg-red-100 border-red-500 border" : "bg-[#F7F7FF]"}`}
          >
            <FaUser className="text-gray-500 text-lg" />
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  passwordRef.current.focus();
                }
              }}
              className="w-full bg-transparent outline-none text-gray-700"
            />
          </div>
          {errors.username && (
            <p className="text-red-600 text-sm mt-1">{errors.username}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="mb-4">
          <label className="text-sm font-medium text-[#000060]">Password</label>
          <div
            className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md 
              ${errors.password ? "bg-red-100 border-red-500 border" : "bg-[#F7F7FF]"}`}
          >
            <FaLock className="text-gray-500 text-lg" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              ref={passwordRef}
              onChange={(e) => setPassword(e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLogin();
                }
              }}
              className="w-full bg-transparent outline-none text-gray-700"
            />
            {showPassword ? (
              <IoEyeOutline
                className="text-gray-600 cursor-pointer text-xl"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <IoEyeOffOutline
                className="text-gray-600 cursor-pointer text-xl"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* FORGOT */}
        <div className="flex items-center justify-between text-sm my-4">
          <label className="flex items-center gap-2 text-gray-600"></label>
          <span
            onClick={() => navigate("/forgot-password")}
            className="text-[#000060] font-medium hover:underline cursor-pointer"
          >
            Forgot Password?
          </span>
        </div>

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#000060] text-white py-3 rounded-xl font-semibold mt-4 
            hover:bg-[#000060d1] transition disabled:bg-gray-400"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        {/* SIGN UP */}
        <p className="text-center mt-5 text-sm text-gray-600">
          Don't have an account?
          <span
            className="text-[#000060] font-semibold ml-1 cursor-pointer hover:underline"
            onClick={onRegisterClick}
          >
            Sign up
          </span>
        </p>

        {/* FOOTER */}
        <p className="text-center text-[13px] text-gray-400 mt-8">
          This site is protected by reCAPTCHA and the <br />
          <span
            onClick={() => navigate("/privacy")}
            className="text-[#000060] underline cursor-pointer hover:font-semibold"
          >
            Google Privacy
          </span>{" "}
          policy and{" "}
          <span
            onClick={() => navigate("/terms")}
            className="text-[#000060] underline cursor-pointer hover:font-semibold"
          >
            Terms of Service
          </span>{" "}
          apply.
        </p>
      </motion.div>
    </form>
  );
};

export default LoginForm;