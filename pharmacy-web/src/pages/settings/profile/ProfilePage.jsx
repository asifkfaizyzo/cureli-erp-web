// pharmacy-web/src/pages/settings/profile/ProfilePage.jsx (do not remove this comment)
// src/pages/settings/profile/ProfilePage.jsx

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  User,
  Building2,
  CreditCard,
  Shield,
} from "lucide-react";

import PersonalInfoCard from "./comps/PersonalInfoCard";
import BusinessInfoCard from "./comps/BusinessInfoCard";
import SubscriptionCard from "./comps/SubscriptionCard";
import SessionsCard from "./comps/SessionsCard";

import { getProfile } from "../../../api/profile";
import { useToast } from "../../../components/common/Toast"; //  ADDED

// Import subscription store
import {
  useSubscriptionStore,
  selectNeedsRenewal,
} from "../../../store/useSubscriptionStore";
import { useAuthStore, selectIsSuperAdmin } from "../../../store/useAuthStore";

/* ───────────────── Renewal Badge Component ───────────────── */
const RenewalBadge = ({ className = "" }) => (
  <span
    className={`
      inline-flex items-center justify-center 
      w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full
      ${className}
    `}
  >
    !
  </span>
);

/**
 * ProfilePage
 * Super Admin profile settings page - Horizontal Layout
 */
const ProfilePage = () => {
  const toast = useToast(); //  ADDED

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [refreshCount, setRefreshCount] = useState(0); //  ADDED: Track refreshes

  // Subscription status for badge
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const needsRenewal = useSubscriptionStore(selectNeedsRenewal);

  // Fetch profile data
  const fetchProfile = async (showToast = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getProfile();
      setProfileData(response.data?.data || response.data);

      //  ADDED: Success toast on manual refresh
      if (showToast && refreshCount > 0) {
        toast.success(
          "Profile Updated",
          "Your profile data has been refreshed.",
        );
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      const errorMsg = err.response?.data?.message || "Failed to load profile";
      setError(errorMsg);
      //  ADDED: Error toast
      toast.error("Load Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile(false);
  }, []);

  //  ADDED: Enhanced refresh handler
  const handleRefresh = () => {
    setRefreshCount((c) => c + 1);
    fetchProfile(true);
  };

  //  ADDED: Callback for child components to show success toasts
  const handleUpdateSuccess = (message) => {
    toast.success("Update Successful", message);
    fetchProfile(false); // Refresh without toast
  };

  // Tab configuration
  const tabs = [
    { id: "personal", label: "Personal", icon: User },
    { id: "business", label: "Business", icon: Building2 },
    { id: "subscription", label: "Plan & Usage", icon: CreditCard },
    { id: "sessions", label: "Sessions", icon: Shield },
  ];

  // Loading state
  if (loading && !profileData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#000060]" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state (only on initial load)
  if (error && !profileData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Failed to load profile
            </h3>
            <p className="text-gray-500 mt-1">{error}</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition-colors"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { user, shop, subscription, sessions } = profileData;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Bar */}
      <div className="flex-shrink-0 border-gray-200 px-1 py-3">
        <div className="flex items-center justify-between">
          {/* Title & Tabs Container */}
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-xl font-bold text-[#000060]">
                Profile Settings
              </h1>
              <p className="text-xs text-gray-500">
                Manage your account and business
              </p>
            </div>

            {/* Horizontal Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                // Show badge on "Plan & Usage" tab when renewal is needed
                const showBadge =
                  isSuperAdmin && needsRenewal && tab.id === "subscription";

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white text-[#000060] shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>

                    {/* Red exclamation badge for Plan & Usage */}
                    {showBadge && <RenewalBadge />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </div>

      {/* Content Area - Full Height */}
      <div className="flex-1 overflow-auto p-4">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {activeTab === "personal" && (
            <PersonalInfoCard
              user={user}
              onUpdate={handleUpdateSuccess} //  CHANGED: Pass success callback
            />
          )}
          {activeTab === "business" && (
            <BusinessInfoCard
              shop={shop}
              onUpdate={handleUpdateSuccess} //  CHANGED: Pass success callback
            />
          )}
          {activeTab === "subscription" && (
            <SubscriptionCard subscription={subscription} />
          )}
          {activeTab === "sessions" && (
            <SessionsCard
              sessions={sessions}
              onUpdate={handleUpdateSuccess} //  CHANGED: Pass success callback
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
