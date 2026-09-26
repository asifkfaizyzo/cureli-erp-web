// pharmacy-web/src/pages/onboarding/comps/pending/PhoneDetails.jsx (do not remove this comment)
import { useState, useRef, useEffect } from "react";
import { sendSmsOtp } from "../../../../api/otp";
import { Loader2 } from "lucide-react";

const PhoneDetails = ({ pending_id, onContinue, setPhone }) => {
  // Rename local state to avoid conflict with prop
  const [localPhone, setLocalPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validatePhone = () => {
    if (!/^[0-9]{10}$/.test(localPhone)) {
      setError("Enter a valid 10-digit phone number");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePhone()) return;

    setLoading(true);
    setError("");

    try {
      await sendSmsOtp({ pending_id, phone: localPhone });
      // Pass phone to parent before continuing
      setPhone(localPhone);
      onContinue();
    } catch (err) {
      const message = err.response?.data?.message;
      const status = err.response?.status;

      if (status === 409) {
        setError(message || "This phone number is already registered.");
      } else if (status === 429) {
        setError(message || "Please wait before requesting another OTP.");
      } else {
        setError(message || "Failed to send SMS OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-sm px-3 mt-10 font-poppins"
      style={{ marginLeft: "-20%" }}
    >
      <h2 className="text-[28px] font-bold text-[#000006]">
        Add Your Contact Details
      </h2>

      <p className="text-gray-500 text-sm leading-relaxed mt-1 mb-4">
        We require this to verify your identity. Your details remain safe.
      </p>

      <div className="w-full h-[1px] bg-gray-300 mb-5" />

      <label className="text-xs font-medium text-[#000060]">
        Phone Number *
      </label>

      <input
        ref={inputRef}
        type="tel"
        placeholder="Enter your phone number"
        value={localPhone}
        onChange={(e) => {
          // Only allow digits
          const value = e.target.value.replace(/\D/g, "").slice(0, 10);
          setLocalPhone(value);
          if (error) setError("");
        }}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className={`w-full mt-2 px-4 py-2 bg-white border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-[#000060] transition
          ${error ? "border-red-500" : "border-gray-300"}`}
      />

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || localPhone.length !== 10}
        className="w-full bg-[#000060] text-white py-2 rounded-xl mt-4
                   hover:bg-[#000060d1] transition font-medium
                   disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending...
          </div>
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
};

export default PhoneDetails;