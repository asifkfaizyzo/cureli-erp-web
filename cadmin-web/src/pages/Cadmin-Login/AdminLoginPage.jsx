// cadmin-web/src/pages/Cadmin-Login/AdminLoginPage.jsx (do not remove this comment)
// AdminLoginPage.jsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CAdminLoginForm from "./comps/CAdminLoginForm";
import CAdminOtpForm from "./comps/CAdminOtpForm";
import { AUTH_CONFIG } from "../../config/modules/authConfig.js";

import logo from "../../assets/icons/curelinew.svg";
import {
  Shield,
  Lock,
  Users,
  Settings,
  LayoutDashboard,
  BarChart,
  PieChart,
  BarChart3,
  Hexagon,
  Box,
  Key,
  Fingerprint,
  Database,
  Server,
} from "lucide-react";

const AdminLoginPage = () => {
  const [step, setStep] = useState("login");
  const [username, setUsername] = useState("");
  const [phoneHint, setPhoneHint] = useState("");

  const handleLoginSuccess = (uname, hint, directLogin = false) => {
    if (directLogin || !AUTH_CONFIG.ENABLE_OTP) {
      return;
    }
    setUsername(uname);
    setPhoneHint(hint);
    setStep("otp");
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/50 to-slate-100 font-poppins overflow-hidden flex">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#000060]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#000060]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

{/* LEFT SIDE - Variation 1: Network Nodes */}
<div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative px-12">
  {/* Logo Top Left */}
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="absolute top-8 left-8 flex items-center gap-3"
  >
    <img src={logo} alt="Cureli" className="h-13 w-auto" />
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-[#000060] font-manrope">Cureli</span>
      <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#000060] text-white rounded">ADMIN</span>
    </div>
  </motion.div>

  {/* Center Illustration - Network Nodes */}
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.6, delay: 0.2 }}
    className="relative"
  >
    <svg width="340" height="300" viewBox="0 0 340 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background Glow */}
      <circle cx="170" cy="150" r="100" fill="#000060" fillOpacity="0.03"/>
      
      {/* Connection Lines */}
      <path d="M170 150L90 90" stroke="#000060" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M170 150L250 90" stroke="#000060" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M170 150L70 160" stroke="#000060" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M170 150L270 160" stroke="#000060" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M170 150L100 220" stroke="#000060" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M170 150L240 220" stroke="#000060" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M170 150L170 60" stroke="#000060" strokeOpacity="0.2" strokeWidth="2"/>
      <path d="M170 150L170 240" stroke="#000060" strokeOpacity="0.2" strokeWidth="2"/>
      
      {/* Center Node - Admin Icon */}
      <circle cx="170" cy="150" r="40" fill="#000060"/>
      <path d="M170 135C175.523 135 180 139.477 180 145C180 150.523 175.523 155 170 155C164.477 155 160 150.523 160 145C160 139.477 164.477 135 170 135Z" fill="white"/>
      <path d="M155 170C155 162.268 161.268 156 169 156H171C178.732 156 185 162.268 185 170" stroke="white" strokeWidth="3" strokeLinecap="round"/>
      
      {/* Outer Nodes */}
      <circle cx="90" cy="90" r="16" fill="#000060" fillOpacity="0.1" stroke="#000060" strokeWidth="2"/>
      <circle cx="250" cy="90" r="16" fill="#000060" fillOpacity="0.1" stroke="#000060" strokeWidth="2"/>
      <circle cx="70" cy="160" r="12" fill="#000060" fillOpacity="0.15"/>
      <circle cx="270" cy="160" r="12" fill="#000060" fillOpacity="0.15"/>
      <circle cx="100" cy="220" r="14" fill="#000060" fillOpacity="0.1" stroke="#000060" strokeWidth="2"/>
      <circle cx="240" cy="220" r="14" fill="#000060" fillOpacity="0.1" stroke="#000060" strokeWidth="2"/>
      <circle cx="170" cy="60" r="10" fill="#000060" fillOpacity="0.2"/>
      <circle cx="170" cy="240" r="10" fill="#000060" fillOpacity="0.2"/>
      
      {/* Small decorative dots */}
      <circle cx="130" cy="100" r="4" fill="#000060" fillOpacity="0.3"/>
      <circle cx="210" cy="100" r="4" fill="#000060" fillOpacity="0.3"/>
      <circle cx="120" cy="180" r="3" fill="#000060" fillOpacity="0.2"/>
      <circle cx="220" cy="180" r="3" fill="#000060" fillOpacity="0.2"/>
    </svg>

    {/* Floating Badges */}
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -right-6 top-4 bg-white rounded-xl p-3 shadow-lg shadow-[#000060]/10 border border-slate-100"
    >
      <Users className="w-5 h-5 text-[#000060]" />
    </motion.div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -left-6 bottom-16 bg-white rounded-xl p-3 shadow-lg shadow-[#000060]/10 border border-slate-100"
    >
      <Settings className="w-5 h-5 text-[#000060]" />
    </motion.div>
  </motion.div>

  {/* Text */}
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.4 }}
    className="text-center mt-8"
  >
    <h1 className="text-2xl font-bold text-[#000060] mb-2">
      Central Management Hub
    </h1>
    <p className="text-slate-500 text-sm">
      Connected control for your entire system
    </p>
  </motion.div>
</div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <img src={logo} alt="Cureli" className="h-8 w-auto" />
            <span className="text-lg font-bold text-[#000060] font-manrope">
              Cureli Admin
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-[#000060]/5 border border-slate-100 p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {step === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <CAdminLoginForm
                    onSuccess={handleLoginSuccess}
                    enableOtp={AUTH_CONFIG.ENABLE_OTP}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <CAdminOtpForm
                    username={username}
                    phoneHint={phoneHint}
                    onBack={() => setStep("login")}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-slate-400 mt-6"
          >
            Protected by enterprise-grade security
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
