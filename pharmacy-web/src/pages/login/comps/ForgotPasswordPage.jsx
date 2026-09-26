// pharmacy-web/src/pages/login/comps/ForgotPasswordPage.jsx (do not remove this comment)
// src/pages/login/comps/ForgotPasswordPage.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { forgotPassword } from "../../../api/auth";
import { useToast } from "../../../components/common/Toast";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      toast.warning("Validation Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email address");
      toast.warning("Validation Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await forgotPassword({ email });
      setSuccess(true);
      toast.success("Email Sent!", "Check your inbox for password reset instructions");
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to send reset link";
      setError(message);
      toast.error("Request Failed", message);
    } finally {
      setLoading(false);
    }
  };

  // Success State View
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
            Check Your Email
          </h2>

          <p className="text-gray-600 text-sm mb-6">
            If an account exists for <strong>{email}</strong>, you will receive
            a password reset link shortly.
          </p>

          <p className="text-gray-500 text-xs mb-6">
            Didn't receive the email? Check your spam folder or try again in a
            few minutes.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-[#000060] text-white py-2 rounded-xl hover:bg-[#000060d1] transition"
          >
            Back to Login
          </button>

          <button
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
            className="w-full mt-3 py-2 text-[#000060] font-medium hover:underline transition"
          >
            Try a different email
          </button>
        </motion.div>
      </div>
    );
  }

  // Form View
  return (
    <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center px-4 font-poppins">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-xl shadow-md p-8"
      >
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-[#000060] hover:underline mb-6"
        >
          <IoArrowBack />
          Back to Login
        </button>

        <h2 className="text-2xl font-bold text-[#000060] mb-2">
          Forgot Password?
        </h2>

        <p className="text-gray-600 text-sm mb-6">
          No worries! Enter your email address and we'll send you a link to
          reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-[#000060]">
            Email Address
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            className={`w-full mt-2 px-4 py-3 rounded-xl bg-[#F7F7FF] border text-sm
              ${error ? "border-red-500" : "border-gray-300"}
              focus:outline-none focus:ring-2 focus:ring-[#000060]`}
          />

          {error && <p className="text-red-600 text-xs mt-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#000060] text-white py-3 rounded-xl font-semibold mt-6
              hover:bg-[#000060d1] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Remember your password?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-[#000060] font-semibold cursor-pointer hover:underline"
          >
            Log in
          </span>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;