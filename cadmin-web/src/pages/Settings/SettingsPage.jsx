// cadmin-web/src/pages/Settings/SettingsPage.jsx (do not remove this comment)
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }           from "framer-motion";
import {
  Settings, User, Activity,
  RefreshCw, Loader2, AlertCircle,
} from "lucide-react";

import ProfileCard  from "./comps/ProfileCard";
import ActivityTab  from "./comps/ActivityTab";
import NoPermission from "../../components/common/NoPermission";
import { getMyProfile }        from "../../api/cadminProfile";
import { useToast }            from "../../components/common/Toast";
import { useCAdminPermission } from "../../hooks/useCAdminPermission";
import { CADMIN_PERMISSIONS }  from "../../config/cadminPermissions";

const SettingsPage = () => {
  const toast = useToast();
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();

  // Activity tab requires settings.view
  const canViewActivity = isSuperCAdmin || hasPermission(CADMIN_PERMISSIONS.SETTINGS_VIEW);

  const TABS = [
    { id: "profile",  label: "Profile",  icon: User },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  const [activeTab,   setActiveTab]   = useState("profile");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);

  const fetchProfile = useCallback(async (showToast = false) => {
    try {
      profileData ? setRefreshing(true) : setLoading(true);
      setError(null);
      const res  = await getMyProfile();
      const data = res.data?.data;
      setProfileData(data);
      if (showToast) toast.success("Refreshed", "Profile data updated");
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      const msg = err.response?.data?.message || "Failed to load profile";
      setError(msg);
      if (showToast) toast.error("Load Failed", msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profileData, toast]);

  useEffect(() => { fetchProfile(false); }, []); // eslint-disable-line

  const handleUpdateSuccess = useCallback((message) => {
    toast.success("Updated", message);
    fetchProfile(false);
  }, [toast, fetchProfile]);

  if (loading && !profileData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#000060]" />
          <p className="text-gray-500 text-sm">Loading settings…</p>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Failed to load settings</h3>
            <p className="text-gray-500 mt-1 text-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchProfile(false)}
            className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white
                       rounded-lg hover:bg-[#000080] transition-colors text-sm"
          >
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header — unchanged */}
      <div className="flex-shrink-0 px-1 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-xs text-gray-500">Manage your account and preferences</p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                                font-medium transition-all
                                ${active
                                  ? "bg-white text-[#000060] shadow-sm"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "profile" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchProfile(true)}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                         rounded-lg transition-colors disabled:opacity-50"
              title="Refresh profile"
            >
              <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {activeTab === "profile" && profileData?.profile && (
              <ProfileCard
                profile={profileData.profile}
                onUpdate={handleUpdateSuccess}
              />
            )}

            {activeTab === "activity" && (
              canViewActivity && profileData?.profile ? (
                <ActivityTab cadminId={profileData.profile.id} />
              ) : !canViewActivity ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <NoPermission
                    variant="block"
                    icon="lock"
                    title="Activity Restricted"
                    description="You don't have permission to view activity logs.
                                 Contact your Super Admin to request access."
                  />
                </div>
              ) : null
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SettingsPage;