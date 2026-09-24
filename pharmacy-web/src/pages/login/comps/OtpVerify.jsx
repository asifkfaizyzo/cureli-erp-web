// pharmacy-web/src/pages/login/comps/OtpVerify.jsx (do not remove this comment)
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { Loader2 } from "lucide-react";

const OtpVerify = ({ onBack }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const inputsRef = useRef([]);

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputsRef.current[index + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && !otp[index]) {
      inputsRef.current[index - 1].focus();
    }
  };

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Dummy submit with loader
  const handleSubmit = async () => {
    setLoading(true);

    // fake delay or add actual API later
    setTimeout(() => {
      setLoading(false);
      alert("OTP Submitted!");
    }, 1500);
  };

  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-start pt-20 font-poppins"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* BACK BUTTON */}
      <div
        className="absolute top-8 left-6 flex items-center gap-2 text-[#000060] cursor-pointer"
        onClick={onBack}
      >
        <IoArrowBackOutline className="text-xl" />
        <span className="text-lg font-medium">Back</span>
      </div>

      <h1 className="text-3xl font-semibold text-[#000060] mt-10">Verify</h1>

      <p className="mt-4 text-gray-600 text-center">
        Enter 4 digit number that sent to <br />
        <span className="font-medium text-gray-700">+91 ******9482</span>
      </p>

      <div className="flex gap-4 mt-10">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            maxLength="1"
            disabled={loading}
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className="w-14 h-16 text-center text-2xl font-semibold border border-gray-300 rounded-xl
                       focus:ring-2 focus:ring-[#000060] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        ))}
      </div>

      {/* LOADER BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={loading || otp.join("").length !== 6}
        className="w-[300px] bg-[#000060] text-white py-3 rounded-xl font-semibold mt-10 
                   hover:bg-[#000060d1] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying...
          </div>
        ) : (
          "Continue"
        )}
      </button>

      <p className="mt-4 text-sm text-gray-600">
        Re-send code in{" "}
        <span className="font-medium">
          00:{timer < 10 ? `0${timer}` : timer}
        </span>
      </p>

      <p className="text-center text-[13px] text-gray-400 mt-10 w-[300px]">
        This site is protected by reCAPTCHA and the <br />
        <span className="text-[#000060] underline cursor-pointer">Google Privacy</span>{" "}
        policy and{" "}
        <span className="text-[#000060] underline cursor-pointer">Terms of Service</span>{" "}
        apply.
      </p>
    </motion.div>
  );
};

export default OtpVerify;
