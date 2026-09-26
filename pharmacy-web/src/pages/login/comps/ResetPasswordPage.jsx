// pharmacy-web/src/pages/login/comps/ResetPasswordPage.jsx (do not remove this comment)
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { resetPassword } from "../../../api/auth";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const confirmRef = useRef(null);

  const validate = () => {
    if (!password.trim()) return "Password is required";
    if (password.length < 8) return "Min 8 characters";
    if (!/[A-Z]/.test(password)) return "Missing uppercase letter";
    if (!/[a-z]/.test(password)) return "Missing lowercase letter";
    if (!/[0-9]/.test(password)) return "Missing number";
    if (!/[!@#$%^&*]/.test(password)) return "Missing special character";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to reset password. Link may have expired."
      );
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4 font-poppins">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-xl shadow-md p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[#000060] mb-2">
            Password Reset Successful!
          </h2>

          <p className="text-gray-600 text-sm mb-6">
            Your password has been changed successfully. You can now log in with
            your new password.
          </p>

          <p className="text-gray-500 text-xs">Redirecting to login page...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4 font-poppins">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-md p-8"
      >
        <h2 className="text-2xl font-bold text-[#000060] mb-2">
          Reset Your Password
        </h2>

        <p className="text-gray-600 text-sm mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit}>
          {/* NEW PASSWORD */}
          <label className="text-sm font-medium text-[#000060]">
            New Password
          </label>

          <div
            className={`flex items-center gap-2 mt-2 px-4 py-3 rounded-xl bg-[#F7F7FF] border
              ${error ? "border-red-500" : "border-gray-300"}`}
          >
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmRef.current?.focus();
                }
              }}
              className="w-full bg-transparent outline-none text-sm"
            />

            {showPassword ? (
              <IoEyeOutline
                className="text-gray-600 text-lg cursor-pointer"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <IoEyeOffOutline
                className="text-gray-600 text-lg cursor-pointer"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          {/* PASSWORD RULES */}
          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
            <PasswordRule valid={password.length >= 8} text="8+ chars" />
            <PasswordRule valid={/[A-Z]/.test(password)} text="uppercase" />
            <PasswordRule valid={/[a-z]/.test(password)} text="lowercase" />
            <PasswordRule valid={/[0-9]/.test(password)} text="number" />
            <PasswordRule valid={/[!@#$%^&*]/.test(password)} text="special" />
          </div>

          {/* CONFIRM PASSWORD */}
          <label className="text-sm font-medium text-[#000060] block mt-4">
            Confirm Password
          </label>

          <div
            className={`flex items-center gap-2 mt-2 px-4 py-3 rounded-xl bg-[#F7F7FF] border
              ${error ? "border-red-500" : "border-gray-300"}`}
          >
            <input
              ref={confirmRef}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              className="w-full bg-transparent outline-none text-sm"
            />

            {showConfirm ? (
              <IoEyeOutline
                className="text-gray-600 text-lg cursor-pointer"
                onClick={() => setShowConfirm(false)}
              />
            ) : (
              <IoEyeOffOutline
                className="text-gray-600 text-lg cursor-pointer"
                onClick={() => setShowConfirm(true)}
              />
            )}
          </div>

          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#000060] text-white py-3 rounded-xl font-semibold mt-6
              hover:bg-[#000060d1] transition disabled:bg-gray-400"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;

const PasswordRule = ({ valid, text }) => (
  <span
    className={`px-2 py-1 rounded-full border text-[10px]
      ${
        valid
          ? "border-green-500 text-green-600"
          : "border-gray-400 text-gray-500"
      }`}
  >
    {valid ? "✔" : "•"} {text}
  </span>
);
