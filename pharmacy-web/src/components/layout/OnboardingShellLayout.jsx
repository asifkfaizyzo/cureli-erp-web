// pharmacy-web/src/components/layout/OnboardingShellLayout.jsx (do not remove this comment)
// src/components/layout/OnboardingShellLayout.jsx

import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import TopHeader from "./TopHeader";

// Marketplace onboarding always has dark background
const OnboardingShellLayout = () => {
  return (
    <motion.div
      className="min-h-screen flex flex-col"
      animate={{ backgroundColor: "#010015" }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
    >
      <TopHeader />
      {/* pt-16 offsets the fixed 64px (h-16) TopHeader */}
      <main className="flex-1 pt-16 overflow-y-auto">
        <Outlet />
      </main>
    </motion.div>
  );
};

export default OnboardingShellLayout;