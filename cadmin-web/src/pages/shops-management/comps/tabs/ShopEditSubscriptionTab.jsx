// cadmin-web/src/pages/shops-management/comps/tabs/ShopEditSubscriptionTab.jsx (do not remove this comment)
// src/components/Shops/tabs/ShopEditSubscriptionTab.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Check,
  Star,
  Plus,
  Gift,
  Sparkles,
  Users,
  GitBranch,
  Info,
} from "lucide-react";
import CustomPlanModal from "../CustomPlanModal";
import { getPlans } from "../../../../api/cadminShops";

/**
 * ShopEditSubscriptionTab
 * 
 * This component allows selecting a new plan but does NOT save it to the backend.
 * The parent (ShopDetailsModal) is responsible for calling the save API when "Save Changes" is clicked.
 * 
 * Props:
 * - shop: Current shop data
 * - selectedPlanId: Currently selected plan ID (managed by parent for persistence across tabs)
 * - onPlanChange: Callback when plan selection changes (notifies parent)
 * - onRefresh: Callback to refresh shop data
 */
const ShopEditSubscriptionTab = ({ 
  shop, 
  selectedPlanId: externalSelectedPlanId,
  onPlanChange,
  onRefresh 
}) => {
  const currentSub = shop?.currentSubscription;

  // Plans data
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [plansError, setPlansError] = useState(null);

  // Local selected plan (synced with parent)
  const [selectedPlanId, setSelectedPlanId] = useState(
    externalSelectedPlanId || currentSub?.plan?.plan_id || ""
  );

  // Custom plan modal
  const [showCustomPlanModal, setShowCustomPlanModal] = useState(false);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const dropdownTriggerRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  // Sync with external selectedPlanId when it changes
  useEffect(() => {
    if (externalSelectedPlanId !== undefined) {
      setSelectedPlanId(externalSelectedPlanId);
    }
  }, [externalSelectedPlanId]);

  // Fetch plans on mount
  useEffect(() => {
    if (shop?.shop_id) {
      fetchPlans();
    }
  }, [shop?.shop_id]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const response = await getPlans();
      const plansData =
        response.data?.data?.plans ||
        response.data?.data ||
        response.data?.plans ||
        [];

      const activePlans = Array.isArray(plansData)
        ? plansData.filter((p) => {
            if (p.type === "CUSTOM") {
              return p.created_for_shop_id === shop?.shop_id;
            }
            if (p.status === "ACTIVE" || !p.status) {
              return true;
            }
            return false;
          })
        : [];

      setPlans(activePlans);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setPlansError(err.response?.data?.message || "Failed to load plans");
      setPlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const updateDropdownPosition = useCallback(() => {
    if (dropdownTriggerRef.current) {
      const rect = dropdownTriggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 320;

      setDropdownPosition({
        top: spaceBelow > dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleDropdownToggle = () => {
    if (!isDropdownOpen) {
      updateDropdownPosition();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSelectOption = (value) => {
    if (value === "custom") {
      setShowCustomPlanModal(true);
      setIsDropdownOpen(false);
    } else {
      setSelectedPlanId(value);
      // Notify parent of change
      onPlanChange?.(value);
      setIsDropdownOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (
        dropdownTriggerRef.current && !dropdownTriggerRef.current.contains(e.target) &&
        dropdownMenuRef.current && !dropdownMenuRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Close on scroll, update on resize
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleScroll = (e) => {
      if (dropdownMenuRef.current && dropdownMenuRef.current.contains(e.target)) {
        return;
      }
      setIsDropdownOpen(false);
    };

    const handleResize = () => updateDropdownPosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isDropdownOpen, updateDropdownPosition]);

  // Helpers
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPlanName = (plan) => {
    if (!plan) return "N/A";
    return plan.name || "Unknown Plan";
  };

  const formatLimit = (value) => {
    if (value === -1) return "Unlimited";
    return value ?? "N/A";
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "N/A";
    const rupees = Number(price);
    if (rupees === 0) return "FREE";
    return `₹${rupees.toLocaleString("en-IN")}`;
  };

  const isPromoActive = (plan) => {
    if (!plan?.promo_free_until) return false;
    return new Date(plan.promo_free_until) > new Date();
  };

  // Handle custom plan created (adds to list and selects it)
  const handleCustomPlanCreated = (newPlan) => {
    // Add to local plans list
    setPlans((prev) => [...prev, newPlan]);
    // Select it
    setSelectedPlanId(newPlan.plan_id);
    // Notify parent
    onPlanChange?.(newPlan.plan_id);
    // Close modal
    setShowCustomPlanModal(false);
    // Refresh plans to ensure we have latest
    fetchPlans();
  };

  // Check if there are pending changes
  const originalPlanId = currentSub?.plan?.plan_id || "";
  const hasChanges = selectedPlanId !== originalPlanId && selectedPlanId !== "";

  // Build dropdown options
  const buildPlanOptions = () => {
    const preMadePlans = plans.filter(p => p.type !== "CUSTOM");
    const customPlans = plans.filter(p => p.type === "CUSTOM");

    const options = [];

    if (preMadePlans.length > 0) {
      options.push({ type: "header", label: "Standard Plans" });
      preMadePlans.forEach((p) => {
        options.push({
          type: "option",
          value: p.plan_id,
          label: getPlanName(p),
          sublabel: `${formatLimit(p.max_users)} users • ${formatLimit(p.max_branches)} branches`,
          price: p.price,
          bonusMonths: p.bonus_months,
          promoActive: isPromoActive(p),
          isFeatured: p.is_featured,
          isCustom: false,
        });
      });
    }

    if (customPlans.length > 0) {
      options.push({ type: "header", label: "Custom Plans" });
      customPlans.forEach((p) => {
        options.push({
          type: "option",
          value: p.plan_id,
          label: getPlanName(p),
          sublabel: `${formatLimit(p.max_users)} users • ${formatLimit(p.max_branches)} branches`,
          price: p.price,
          bonusMonths: p.bonus_months,
          promoActive: isPromoActive(p),
          isFeatured: p.is_featured,
          isCustom: true,
        });
      });
    }

    options.push({ type: "divider" });
    options.push({
      type: "action",
      value: "custom",
      label: "Create Custom Plan...",
    });

    return options;
  };

  const getStatusBadge = (status, isActive) => {
    if (isActive && status === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle size={10} /> Active
        </span>
      );
    }
    if (status === "expired" || !isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle size={10} /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock size={10} /> {status}
      </span>
    );
  };

  // Get selected plan object
  const selectedPlan = plans.find((p) => p.plan_id === selectedPlanId);

  const getSelectedLabel = () => {
    if (!selectedPlanId) return null;
    if (selectedPlan) {
      return {
        name: getPlanName(selectedPlan),
        sublabel: `${formatLimit(selectedPlan.max_users)} users • ${formatLimit(selectedPlan.max_branches)} branches`,
        isCustom: selectedPlan.type === "CUSTOM",
        bonusMonths: selectedPlan.bonus_months,
        promoActive: isPromoActive(selectedPlan),
        isFeatured: selectedPlan.is_featured,
      };
    }
    return null;
  };

  const selectedLabel = getSelectedLabel();

  // Render dropdown via portal
  const renderDropdown = () => {
    if (!isDropdownOpen || !dropdownPosition) return null;

    const options = buildPlanOptions();

    return createPortal(
      <div
        ref={dropdownMenuRef}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl py-1 overflow-hidden max-h-[320px] overflow-y-auto"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        {options.map((option, index) => {
          if (option.type === "header") {
            return (
              <div
                key={`header-${index}`}
                className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50"
              >
                {option.label}
              </div>
            );
          }

          if (option.type === "divider") {
            return <div key={`divider-${index}`} className="my-1 border-t border-gray-100" />;
          }

          if (option.type === "action") {
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelectOption(option.value)}
                className="w-full px-3 py-2.5 text-sm text-left flex items-center gap-2
                         text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Plus size={14} className="text-indigo-500" />
                <span className="font-medium">{option.label}</span>
              </button>
            );
          }

          const isSelected = selectedPlanId === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelectOption(option.value)}
              className={`w-full px-3 py-2.5 text-sm text-left flex items-center justify-between transition-colors
                ${isSelected ? "bg-indigo-50" : "hover:bg-gray-50"}`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {option.isCustom && <Star size={12} className="text-purple-500 flex-shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium truncate ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {option.promoActive ? (
                        <span className="text-blue-600 font-medium">FREE</span>
                      ) : (
                        formatPrice(option.price)
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{option.sublabel}</p>
                  {/* Badges */}
                  <div className="flex gap-1 mt-0.5">
                    {option.promoActive && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium">FREE</span>
                    )}
                    {option.bonusMonths > 0 && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[10px] font-medium">+{option.bonusMonths}mo</span>
                    )}
                  </div>
                </div>
              </div>
              {isSelected && <Check size={14} className="text-indigo-600 flex-shrink-0 ml-2" />}
            </button>
          );
        })}
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Current Subscription Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-500" />
              Current Subscription
            </h3>
          </div>

          <div className="p-5">
            {currentSub ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Plan</p>
                  <p className="font-semibold text-gray-900">{getPlanName(currentSub.plan)}</p>
                  {currentSub.plan?.type === "CUSTOM" && (
                    <span className="text-xs text-purple-600">Custom</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  {getStatusBadge(currentSub.status, currentSub.is_active)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                  <p className="font-medium text-gray-900">{formatDate(currentSub.end_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Limits</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-gray-400" />
                      {formatLimit(currentSub.user_limit_snapshot)}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch size={12} className="text-gray-400" />
                      {formatLimit(currentSub.branch_limit_snapshot)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
                <p>No active subscription</p>
              </div>
            )}
          </div>
        </div>

        {/* Change Subscription Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                Change Subscription
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">Editable</span>
              </h3>
              {hasChanges && (
                <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertTriangle size={12} />
                  Unsaved changes
                </span>
              )}
            </div>
          </div>

          <div className="p-5">
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
                <span className="ml-2 text-gray-500">Loading plans...</span>
              </div>
            ) : plansError ? (
              <div className="flex flex-col items-center justify-center py-8 text-red-500">
                <AlertTriangle size={32} className="mb-2 opacity-50" />
                <p className="text-sm">{plansError}</p>
                <button
                  onClick={fetchPlans}
                  className="mt-3 px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Plan Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Plan
                  </label>
                  <button
                    ref={dropdownTriggerRef}
                    type="button"
                    onClick={handleDropdownToggle}
                    className={`w-full px-4 py-3 bg-white border rounded-xl text-left flex items-center justify-between transition-all
                      ${isDropdownOpen ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="min-w-0 flex-1">
                      {selectedLabel ? (
                        <div className="flex items-center gap-2">
                          {selectedLabel.isCustom && <Star size={14} className="text-purple-500 flex-shrink-0" />}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-gray-900 font-medium text-sm">{selectedLabel.name}</span>
                              {selectedLabel.promoActive && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium">FREE</span>
                              )}
                              {selectedLabel.bonusMonths > 0 && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded text-[10px] font-medium">+{selectedLabel.bonusMonths}mo</span>
                              )}
                            </div>
                            <p className="text-gray-500 text-xs">{selectedLabel.sublabel}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Select a plan...</span>
                      )}
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform flex-shrink-0 ml-2 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {renderDropdown()}
                </div>

                {/* Selected Plan Preview (only show if different from current) */}
                {selectedPlan && hasChanges && (
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <h4 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
                      New Plan Details
                      {selectedPlan.type === "CUSTOM" && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Custom</span>
                      )}
                    </h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-indigo-600 text-xs">Plan</span>
                        <p className="font-medium text-indigo-900">{getPlanName(selectedPlan)}</p>
                      </div>
                      <div>
                        <span className="text-indigo-600 text-xs">Price</span>
                        <p className="font-medium text-indigo-900">
                          {isPromoActive(selectedPlan) ? (
                            <span className="text-blue-600">FREE (Promo)</span>
                          ) : (
                            formatPrice(selectedPlan.price)
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-indigo-600 text-xs">Users</span>
                        <p className="font-medium text-indigo-900">{formatLimit(selectedPlan.max_users)}</p>
                      </div>
                      <div>
                        <span className="text-indigo-600 text-xs">Branches</span>
                        <p className="font-medium text-indigo-900">{formatLimit(selectedPlan.max_branches)}</p>
                      </div>
                    </div>

                    {(selectedPlan.bonus_months > 0 || isPromoActive(selectedPlan)) && (
                      <div className="mt-3 pt-3 border-t border-indigo-200 flex flex-wrap gap-2">
                        {selectedPlan.bonus_months > 0 && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-lg text-xs font-medium text-emerald-700">
                            <Gift size={12} />
                            +{selectedPlan.bonus_months} bonus months
                          </span>
                        )}
                        {isPromoActive(selectedPlan) && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-lg text-xs font-medium text-blue-700">
                            <Calendar size={12} />
                            Free until {formatDate(selectedPlan.promo_free_until)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Info about save behavior */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
                  <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-700">
                    <p>
                      Changes made here will <strong>not be saved</strong> until you click <strong>"Save Changes"</strong> in the modal header.
                    </p>
                    {hasChanges && (
                      <p className="mt-1 text-amber-700">
                        • Subscription change is pending. Save to apply.
                      </p>
                    )}
                  </div>
                </div>

                {/* Warning about what happens on save */}
                {hasChanges && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-700">
                      <p className="font-medium">When you save, this will:</p>
                      <ul className="list-disc list-inside mt-1 space-y-0.5">
                        <li>Create a new subscription starting today</li>
                        <li>End the current subscription (if any)</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Plan Modal */}
      <CustomPlanModal
        isOpen={showCustomPlanModal}
        onClose={() => setShowCustomPlanModal(false)}
        onPlanCreated={handleCustomPlanCreated}
        shopId={shop?.shop_id}
        shopName={shop?.business_name}
      />
    </>
  );
};

export default ShopEditSubscriptionTab;