// pharmacy-web/src/pages/maintenance/MaintenancePage.jsx (do not remove this comment)
// pharmacy-web/src/pages/maintenance/MaintenancePage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Clock, RefreshCw, Mail } from "lucide-react";

const MaintenancePage = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const message =
    sessionStorage.getItem("maintenance_message") ||
    "We're currently performing scheduled maintenance. Please check back soon.";

  // Check if maintenance is over
  const checkMaintenanceStatus = async () => {
    setChecking(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/maintenance/status`,
      );
      const data = await response.json();

      if (data.success && !data.data.maintenance_mode) {
        // Maintenance is over
        sessionStorage.removeItem("maintenance_mode");
        sessionStorage.removeItem("maintenance_message");
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to check maintenance status:", error);
    } finally {
      setChecking(false);
      setCountdown(60);
    }
  };

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          checkMaintenanceStatus();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Check on initial load
  useEffect(() => {
    checkMaintenanceStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 font-poppins">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#000060] to-[#4f46e5] px-8 py-10 text-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Wrench size={40} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Under Maintenance
            </h1>
            <p className="text-white/80 text-sm">We'll be back shortly</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8">
            <p className="text-gray-600 text-center mb-6 leading-relaxed">
              {message}
            </p>

            {/* Status Indicator */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Scheduled Maintenance
                  </p>
                  <p className="text-xs text-amber-600">
                    Our team is working to improve your experience
                  </p>
                </div>
              </div>
            </div>

            {/* Auto-refresh Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw
                  size={16}
                  className={`text-gray-500 ${autoRefresh ? "animate-spin" : ""}`}
                  style={{ animationDuration: "3s" }}
                />
                <span className="text-sm text-gray-600">Auto-check status</span>
              </div>
              <div className="flex items-center gap-3">
                {autoRefresh && (
                  <span className="text-xs text-gray-400">
                    Checking in {countdown}s
                  </span>
                )}
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    autoRefresh ? "bg-[#000060]" : "bg-gray-300"
                  }`}
                >
                  <motion.div
                    animate={{ x: autoRefresh ? 24 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>

            {/* Manual Check Button */}
            <button
              onClick={checkMaintenanceStatus}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#000060] text-white rounded-xl font-medium hover:bg-[#000080] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Check Status Now
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Need urgent help?{" "}
              <a
                href="mailto:support@cureli.com"
                className="text-[#000060] font-medium hover:underline inline-flex items-center gap-1"
              >
                <Mail size={14} />
                Contact Support
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            We apologize for any inconvenience. Thank you for your patience.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default MaintenancePage;
