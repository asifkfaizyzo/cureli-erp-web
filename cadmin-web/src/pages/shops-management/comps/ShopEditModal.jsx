// cadmin-web/src/pages/shops-management/comps/ShopEditModal.jsx (do not remove this comment)
// src/components/Shops/ShopEditModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  Users,
  GitBranch,
  History,
  Save,
  Loader2,
} from "lucide-react";
import { getShopById, updateShop } from "../../../api/cadminShops";
import { useToast } from "../../../components/common/Toast";

// Tab Components
import ShopEditOverviewTab from "./tabs/ShopEditOverviewTab";
import ShopEditAddressTab from "./tabs/ShopEditAddressTab";
import ShopEditSubscriptionTab from "./tabs/ShopEditSubscriptionTab";
import ShopEditDocumentsTab from "./tabs/ShopEditDocumentsTab";
import ShopUsersTab from "./tabs/ShopUsersTab";
import ShopBranchesTab from "./tabs/ShopBranchesTab";
import ShopActivityTab from "./tabs/ShopActivityTab";

const ShopEditModal = ({ shop: basicShop, isOpen, onClose }) => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("overview");

  // Full shop data
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data for editable fields
  const [formData, setFormData] = useState({
    business_name: "",
    gst_number: "",
    business_type: "",
    address_line_1: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Track if form has changes
  const [hasChanges, setHasChanges] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch full shop details
  useEffect(() => {
    if (isOpen && basicShop?.shop_id) {
      fetchShopDetails(basicShop.shop_id);
    }
  }, [isOpen, basicShop?.shop_id]);

  const fetchShopDetails = async (shopId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getShopById(shopId);
      const shopData = response.data?.data || response.data;
      setShop(shopData);

      // Initialize form data
      setFormData({
        business_name: shopData.business_name || "",
        gst_number: shopData.gst_number || "",
        business_type: shopData.business_type || "",
        address_line_1: shopData.address_line_1 || "",
        city: shopData.city || "",
        state: shopData.state || "",
        pincode: shopData.pincode || "",
      });

      setHasChanges(false);
    } catch (err) {
      console.error("Failed to fetch shop details:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to load shop details";
      setError(errorMessage);
      toast.error("Failed to Load Shop", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setShop(null);
      setError(null);
      setFormData({
        business_name: "",
        gst_number: "",
        business_type: "",
        address_line_1: "",
        city: "",
        state: "",
        pincode: "",
      });
      setHasChanges(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, hasChanges]);

  // Handle form changes
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!shop || !hasChanges) return;

    setSaveLoading(true);
    try {
      // Build payload with only changed fields
      const payload = {};

      if (formData.business_name !== shop.business_name) {
        payload.business_name = formData.business_name;
      }
      if (formData.gst_number !== shop.gst_number) {
        payload.gst_number = formData.gst_number;
      }
      if (formData.business_type !== shop.business_type) {
        payload.business_type = formData.business_type;
      }
      if (formData.address_line_1 !== shop.address_line_1) {
        payload.address_line_1 = formData.address_line_1;
      }
      if (formData.city !== shop.city) {
        payload.city = formData.city;
      }
      if (formData.state !== shop.state) {
        payload.state = formData.state;
      }
      if (formData.pincode !== shop.pincode) {
        payload.pincode = formData.pincode;
      }

      if (Object.keys(payload).length === 0) {
        setHasChanges(false);
        return;
      }

      await updateShop(shop.shop_id, payload);

      // Show success toast
      toast.success(
        "Shop Updated",
        `${shop.business_name || "Shop"} details saved successfully.`
      );

      onClose(true); // Close and refresh
    } catch (err) {
      console.error("Save failed:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Failed to save changes. Please try again.";
      toast.error("Save Failed", errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to close?"
      );
      if (!confirm) return;
    }
    onClose(false);
  };

  // Refresh shop data (called after subscription/document changes)
  const handleRefresh = () => {
    if (shop?.shop_id) {
      fetchShopDetails(shop.shop_id);
      toast.info("Data Refreshed", "Loading latest shop data...", 2000);
    }
  };

  if (!isOpen) return null;

  // Tab configuration
  const tabs = [
    { id: "overview", label: "Overview", icon: Building2, editable: true },
    { id: "address", label: "Address", icon: MapPin, editable: true },
    {
      id: "subscription",
      label: "Subscription",
      icon: CreditCard,
      editable: true,
    },
    { id: "documents", label: "Documents", icon: FileText, editable: true },
    { id: "users", label: "Users", icon: Users, editable: false },
    { id: "branches", label: "Branches", icon: GitBranch, editable: false },
    { id: "activity", label: "Activity", icon: History, editable: false },
  ];

  // Get current tab config
  const currentTab = tabs.find((t) => t.id === activeTab);
  const isEditableTab =
    currentTab?.editable &&
    (activeTab === "overview" || activeTab === "address");

  // Verification status badge
  const getVerificationBadge = (status) => {
    const config = {
      verified: {
        bg: "bg-emerald-500/20",
        text: "text-emerald-300",
        label: "Verified",
      },
      pending: {
        bg: "bg-blue-500/20",
        text: "text-blue-300",
        label: "Pending",
      },
      pending_review: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-300",
        label: "Pending Review",
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-300",
        label: "Rejected",
      },
      partially_rejected: {
        bg: "bg-orange-500/20",
        text: "text-orange-300",
        label: "Partially Rejected",
      },
    };
    const style = config[status] || config.pending;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>
    );
  };

  // Render tab content
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="ml-3 text-gray-500">Loading shop details...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <p className="text-lg font-medium">Error loading shop</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => fetchShopDetails(basicShop?.shop_id)}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!shop) return null;

    switch (activeTab) {
      case "overview":
        return (
          <ShopEditOverviewTab
            shop={shop}
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case "address":
        return (
          <ShopEditAddressTab
            shop={shop}
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case "subscription":
        return (
          <ShopEditSubscriptionTab shop={shop} onRefresh={handleRefresh} />
        );
      case "documents":
        return <ShopEditDocumentsTab shop={shop} onRefresh={handleRefresh} />;
      case "users":
        return <ShopUsersTab shop={shop} />;
      case "branches":
        return <ShopBranchesTab shop={shop} />;
      case "activity":
        return <ShopActivityTab shop={shop} />;
      default:
        return null;
    }
  };

  // Display values
  const displayName = shop?.business_name || basicShop?.business_name || "Shop";
  const displayType = shop?.business_type || basicShop?.business_type || "";
  const displayVerification =
    shop?.verification_status || basicShop?.verification_status || "pending";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Shop Info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white text-lg font-semibold">
                    Edit: {displayName}
                  </h2>
                  {displayType && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      {displayType}
                    </span>
                  )}
                  {getVerificationBadge(displayVerification)}
                </div>
                <p className="text-white/70 text-sm mt-0.5">
                  Make changes to shop details
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/* Save Button - Show for editable tabs */}
              {isEditableTab && (
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saveLoading}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      hasChanges && !saveLoading
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-white/20 text-white/50 cursor-not-allowed"
                    }
                  `}
                >
                  {saveLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                      {hasChanges && (
                        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                    </>
                  )}
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap
                  ${
                    isActive
                      ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                      : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                <Icon size={16} />
                {tab.label}
                {tab.editable && (
                  <span
                    className="w-1.5 h-1.5 bg-amber-400 rounded-full"
                    title="Editable"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between">
            {/* Left: Meta Info */}
            <p className="text-xs text-gray-400">
              Shop ID:{" "}
              {shop?.shop_id || basicShop?.shop_id?.slice(0, 8)}
              • Last Updated:{" "}
              {shop?.updated_at
                ? new Date(shop.updated_at).toLocaleDateString()
                : "N/A"}
            </p>

            {/* Right: Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>

              {isEditableTab && (
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saveLoading}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      hasChanges && !saveLoading
                        ? "bg-[#05015A] text-white hover:bg-[#0a0280]"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }
                  `}
                >
                  {saveLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopEditModal;

