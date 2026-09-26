// cadmin-web/src/pages/Cadmin-Login/CAdminResetPassword.jsx (do not remove this comment)
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { resetPasswordCAdmin } from "../../api/auth";

const CAdminResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const confirmRef = useRef();

  const validate = () => {
    if (!password.trim()) return "Password is required";
    if (password.length < 8) return "Min 8 characters required";
    if (!/[A-Z]/.test(password)) return "Add at least 1 uppercase letter";
    if (!/[a-z]/.test(password)) return "Add at least 1 lowercase letter";
    if (!/[0-9]/.test(password)) return "Add at least 1 number";
    if (!/[!@#$%^&*]/.test(password)) return "Add at least 1 symbol";
    if (password !== confirm) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errMsg = validate();
    if (errMsg) {
      setError(errMsg);
      return;
    }

    if (!token) {
      setError("Invalid or expired reset link");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await resetPasswordCAdmin({ token, password });
      setSuccess(true);
      setTimeout(() => navigate("/cadmin-login"), 2500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to reset password. Your link may have expired."
      );
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-poppins px-4">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[#000060] mb-2">
            Password Reset!
          </h2>
          <p className="text-gray-600 text-sm">Redirecting to login…</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center px-4 font-poppins">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-md p-8"
      >
        <h2 className="text-2xl font-bold text-[#000060] mb-2">Reset Password</h2>

        <p className="text-gray-600 text-sm mb-6">Enter your new admin password below.</p>

        <form onSubmit={handleSubmit}>
          {/* NEW PASSWORD */}
          <label className="text-sm font-medium text-[#000060]">New Password</label>

          <div
            className={`flex items-center gap-3 mt-2 px-4 py-3 rounded-xl bg-[#F7F7FF] border ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          >
            <input
              type={showPass ? "text" : "password"}
              placeholder="Enter new password"
              className="w-full bg-transparent outline-none text-sm"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmRef.current.focus();
              }}
            />

            {showPass ? (
              <IoEyeOutline
                className="text-gray-500 text-xl cursor-pointer"
                onClick={() => setShowPass(false)}
              />
            ) : (
              <IoEyeOffOutline
                className="text-gray-500 text-xl cursor-pointer"
                onClick={() => setShowPass(true)}
              />
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <label className="text-sm font-medium text-[#000060] block mt-4">
            Confirm Password
          </label>

          <div
            className={`flex items-center gap-3 mt-2 px-4 py-3 rounded-xl bg-[#F7F7FF] border ${
              error ? "border-red-500" : "border-gray-300"
            }`}
          >
            <input
              ref={confirmRef}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              className="w-full bg-transparent outline-none text-sm"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setError("");
              }}
            />

            {showConfirm ? (
              <IoEyeOutline
                className="text-gray-500 text-xl cursor-pointer"
                onClick={() => setShowConfirm(false)}
              />
            ) : (
              <IoEyeOffOutline
                className="text-gray-500 text-xl cursor-pointer"
                onClick={() => setShowConfirm(true)}
              />
            )}
          </div>

          {error && <p className="text-red-600 text-xs mt-3">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#000060] text-white py-3 rounded-xl font-semibold mt-6
              hover:bg-[#000060d1] transition disabled:bg-gray-400"
          >
            {loading ? "Resetting…" : "Reset Password"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CAdminResetPassword;
