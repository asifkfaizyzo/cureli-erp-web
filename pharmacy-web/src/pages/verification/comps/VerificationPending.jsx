// pharmacy-web/src/pages/verification/comps/VerificationPending.jsx (do not remove this comment)
// src/components/verification/VerificationPending.jsx

import { motion } from "framer-motion";
import { Clock, Shield, Bell, FileText, RefreshCw } from "lucide-react";

const VerificationPending = ({ onRefresh }) => {
  return (
    <div className="w-full flex flex-col items-center font-poppins">
      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl bg-white rounded-xl flex flex-col items-center py-6 sm:py-5 px-6"
        style={{ boxShadow: "0px 4px 35px rgba(0,0,0,0.08)" }}
      >
        {/* ANIMATED DOCUMENT SCANNER - Scaled down */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4 sm:mb-6">
          {/* Outer rotating ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-[#000060]/20"
            style={{ borderTopColor: "#000060" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner pulsing circle */}
          <motion.div
            className="absolute inset-2 rounded-full bg-[#000060]/5"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Document stack with scanning effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* Back documents */}
              <motion.div
                className="absolute -left-1 -top-1 w-10 h-12 sm:w-11 sm:h-13 bg-gray-200 rounded-md"
                initial={{ opacity: 0.5 }}
              />
              <motion.div
                className="absolute -left-0.5 -top-0.5 w-10 h-12 sm:w-11 sm:h-13 bg-gray-100 rounded-md"
                initial={{ opacity: 0.7 }}
              />

              {/* Main document */}
              <motion.div
                className="relative w-10 h-12 sm:w-11 sm:h-13 bg-white rounded-md border-2 border-[#000060]/30 overflow-hidden"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="mt-1.5 mx-1 space-y-0.5 sm:space-y-1">
                  <div className="h-0.5 sm:h-1 w-5 sm:w-6 bg-[#000060]/20 rounded" />
                  <div className="h-0.5 sm:h-1 w-7 sm:w-8 bg-[#000060]/20 rounded" />
                  <div className="h-0.5 sm:h-1 w-4 sm:w-5 bg-[#000060]/20 rounded" />
                  <div className="h-0.5 sm:h-1 w-6 sm:w-7 bg-[#000060]/20 rounded" />
                </div>

                <motion.div
                  className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#000060] to-transparent"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>

              <motion.div
                className="absolute -right-1.5 -bottom-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-[#000060] rounded-full flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <FileText size={10} className="text-white sm:w-3 sm:h-3" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ANIMATED DOTS */}
        <div className="flex items-center gap-1.5 mb-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#000060]"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* TITLE */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl sm:text-2xl font-semibold text-[#000060] text-center"
        >
          Verification In Progress
        </motion.h2>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 text-xs sm:text-sm text-center mt-2 max-w-md px-2"
        >
          Our team is reviewing your documents. You will be notified once the verification is completed.
        </motion.p>

        {/* CHECK STATUS BUTTON */}
        <motion.button
          onClick={onRefresh}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 sm:mt-6 flex items-center gap-2 px-5 py-2.5 bg-[#000060] text-white rounded-xl text-sm font-medium hover:bg-[#000060]/90 transition"
        >
          <RefreshCw size={16} />
          Check Status
        </motion.button>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="w-full max-w-sm h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-4 sm:my-6"
        />

        {/* INFO CARDS */}
        <div className="w-full max-w-md grid grid-cols-2 gap-3">
          {[
            {
              icon: Shield,
              iconColor: "text-emerald-600",
              bgColor: "bg-emerald-50",
              title: "Secure Process",
              desc: "Documents encrypted & secure",
            },
            {
              icon: Bell,
              iconColor: "text-[#000060]",
              bgColor: "bg-[#000060]/5",
              title: "We'll Notify You",
              desc: "Email & SMS updates",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`flex items-start gap-2 p-3 ${item.bgColor} rounded-xl border border-gray-100 cursor-default transition-shadow hover:shadow-md`}
            >
              <item.icon size={16} className={`${item.iconColor} mt-0.5 flex-shrink-0`} />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-800 leading-tight">{item.title}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 leading-tight">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* FOOTER */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-gray-500 text-[10px] sm:text-xs text-center mt-4 max-w-md"
      >
        Need help? Contact{" "}
        <a
          href="mailto:support@cureli.com"
          className="text-[#000060] font-medium hover:underline"
        >
          support@cureli.com
        </a>
      </motion.p>
    </div>
  );
};

export default VerificationPending;