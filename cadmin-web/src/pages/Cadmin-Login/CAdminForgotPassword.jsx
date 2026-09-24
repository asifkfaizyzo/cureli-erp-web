// cadmin-web/src/pages/Cadmin-Login/CAdminForgotPassword.jsx (do not remove this comment)
import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { forgotPasswordCAdmin } from "../../api/auth";

const CAdminForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await forgotPasswordCAdmin({ email });
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send reset link");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-[#000060] mb-2">Check Email</h2>
          <p className="text-gray-600 text-sm mb-6">
            If an admin account exists for <strong>{email}</strong>, you will receive a password reset link.
          </p>

          <button
            className="w-full bg-[#000060] text-white py-3 rounded-xl mt-4 hover:bg-[#000060d1] transition"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
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
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-[#000060] hover:underline mb-6"
        >
          <IoArrowBack />
          Back to Login
        </button>

        <h2 className="text-2xl font-bold text-[#000060] mb-2">Forgot Password?</h2>

        <p className="text-gray-600 text-sm mb-6">
          Enter your admin email and we’ll send you a password reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="text-sm font-medium text-[#000060]">Email Address</label>

          <input
            type="email"
            placeholder="Enter admin email"
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
              hover:bg-[#000060d1] transition disabled:bg-gray-400"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CAdminForgotPassword;
