// cadmin-web/src/pages/Dashboard/comps/WelcomeBanner.jsx (do not remove this comment)
// src/pages/Dashboard/comps/WelcomeBanner.jsx

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Sunrise, Sunset, ShieldCheck, Bell, TrendingUp } from "lucide-react";

const ROLE_LABELS = {
  SUPER_CADMIN: "Super Admin",
  ANALYST: "Analyst",
  ACCOUNTANT: "Accountant",
  SALESMAN: "Salesman",
};

const PulseDot = ({ color = "emerald" }) => (
  <span className="relative flex h-1.5 w-1.5">
    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-75`} />
    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 bg-${color}-500`} />
  </span>
);

const WelcomeBanner = ({ admin, role, pendingCounts, overviewData }) => {
  const { greeting, Icon } = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { greeting: "Good morning", Icon: Sunrise };
    if (hour >= 12 && hour < 17) return { greeting: "Good afternoon", Icon: Sun };
    if (hour >= 17 && hour < 21) return { greeting: "Good evening", Icon: Sunset };
    return { greeting: "Good night", Icon: Moon };
  }, []);

  const firstName = admin?.name?.split(" ")[0] || "Admin";
  const roleDisplay = ROLE_LABELS[role] || role?.replace("_", " ");

  let totalPending = 0;
  if (role === "SUPER_CADMIN" || role === "ANALYST") {
    totalPending = (pendingCounts?.pendingVerifications || 0) +
      (pendingCounts?.pendingTickets || 0) +
      (pendingCounts?.pendingEnquiries || 0);
  } else if (role === "ACCOUNTANT") {
    totalPending = overviewData?.subscriptions?.atRiskTotal || 0;
  }

  return (
    <div className="flex-1 min-w-0">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#000060] to-violet-600 
          flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
          <Icon size={18} className="text-amber-300" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold text-gray-900 truncate">
              {greeting}, {firstName}
            </h1>
            <motion.span
              animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
              transition={{ duration: 2, delay: 0.5 }}
            >
              <Sunrise size={16} className="text-amber-500" />
            </motion.span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 rounded text-[10px] font-medium text-indigo-600">
              <ShieldCheck size={10} />
              {roleDisplay}
            </div>
            <PulseDot color="emerald" />
            <span className="text-[10px] text-gray-400">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>

            {totalPending > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-[10px] font-medium text-amber-600">
                <Bell size={10} />
                {totalPending} pending
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeBanner;