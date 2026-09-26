// cadmin-web/src/pages/shops-management/comps/CustomPlanModal.jsx (do not remove this comment)
// src/components/Shops/CustomPlanModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Users,
  GitBranch,
  Loader2,
  Sparkles,
  DollarSign,
  FileText,
  Building2,
  ChevronDown,
  Tag,
  Calendar,
  Gift,
  Info,
  Check,
} from "lucide-react";
import { createCustomPlan, activatePlan } from "../../../api/cadminShops";
import StyledDateFilter from "../../../components/common/StyledDateFilter";

const CustomPlanModal = ({
  isOpen,
  onClose,
  onPlanCreated,
  shopId,
  shopName = "",
}) => {
  // Basic fields
  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [maxUsers, setMaxUsers] = useState(10);
  const [maxBranches, setMaxBranches] = useState(2);
  const [price, setPrice] = useState(0);

  // Promo fields
  const [bonusMonths, setBonusMonths] = useState("");
  const [promoFreeUntil, setPromoFreeUntil] = useState("");

  // UI state
  const [showPromo, setShowPromo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPlanName("");
      setDescription("");
      setMaxUsers(10);
      setMaxBranches(2);
      setPrice(0);
      setBonusMonths("");
      setPromoFreeUntil("");
      setShowPromo(false);
      setError("");
    }
  }, [isOpen]);

  const getAutoName = () => {
    return shopName
      ? `Custom - ${shopName} - ${maxUsers}U/${maxBranches}B`
      : `Custom - ${maxUsers}U/${maxBranches}B`;
  };

  const validateForm = () => {
    if (maxUsers < 1 || maxUsers > 1000) {
      setError("Users must be between 1 and 1000");
      return false;
    }
    if (maxBranches < 1 || maxBranches > 100) {
      setError("Branches must be between 1 and 100");
      return false;
    }
    if (!shopId) {
      setError("Shop ID is required");
      return false;
    }
    if (bonusMonths !== "" && (isNaN(Number(bonusMonths)) || Number(bonusMonths) < 0 || Number(bonusMonths) > 12)) {
      setError("Bonus months must be 0-12");
      return false;
    }
    if (promoFreeUntil && new Date(promoFreeUntil) <= new Date()) {
      setError("Promo date must be in the future");
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const planData = {
        name: planName.trim() || undefined,
        description: description.trim() || undefined,
        max_users: maxUsers,
        max_branches: maxBranches,
        price: price,
      };

      if (bonusMonths !== "" && Number(bonusMonths) > 0) {
        planData.bonus_months = Number(bonusMonths);
      }

      if (promoFreeUntil) {
        const promoDate = new Date(promoFreeUntil);
        promoDate.setHours(23, 59, 59, 999);
        planData.promo_free_until = promoDate.toISOString();
      }

      const createResponse = await createCustomPlan(planData, shopId, shopName);
      const newPlan = createResponse.data?.data || createResponse.data;

      await activatePlan(newPlan.plan_id);

      onPlanCreated({ ...newPlan, status: "ACTIVE" });
    } catch (err) {
      console.error("Failed to create/activate plan:", err);
      setError(err.response?.data?.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const hasPromoValues = bonusMonths || promoFreeUntil;
  const totalDuration = 12 + (Number(bonusMonths) || 0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Create Custom Plan</h3>
                {shopName && (
                  <p className="text-white/70 text-xs">For {shopName}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onClose()}
              disabled={loading}
              className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content - Horizontal Layout */}
        <div className="p-5">
          <div className="grid grid-cols-12 gap-5">
            {/* Left Column - Main Fields */}
            <div className="col-span-7 space-y-4">
              {/* Row 1: Name & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Plan Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder={getAutoName()}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Yearly Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 pl-7 border border-gray-200 rounded-lg text-sm font-medium
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Users, Branches, Bonus */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Users size={12} className="text-indigo-500" />
                    Max Users
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <GitBranch size={12} className="text-indigo-500" />
                    Max Branches
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxBranches}
                    onChange={(e) => setMaxBranches(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Gift size={12} className="text-amber-500" />
                    Bonus Months
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    value={bonusMonths}
                    onChange={(e) => setBonusMonths(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium
                             focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 3: Description & Free Until */}
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-3">
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Description <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Brief description..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-amber-500" />
                    Free Until <span className="text-gray-400">(optional)</span>
                  </label>
                  <StyledDateFilter date={promoFreeUntil} setDate={setPromoFreeUntil} />
                </div>
              </div>
            </div>

            {/* Right Column - Summary Card */}
            <div className="col-span-5">
              <div className="h-full bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4 flex flex-col">
                <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Plan Summary
                </h4>

                {/* Summary Grid */}
                <div className="grid grid-cols-2 gap-3 flex-1">
                  <div className="bg-white/60 rounded-lg p-2.5 text-center">
                    <Users size={16} className="mx-auto text-indigo-500 mb-1" />
                    <p className="text-lg font-bold text-gray-900">{maxUsers}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Users</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2.5 text-center">
                    <GitBranch size={16} className="mx-auto text-indigo-500 mb-1" />
                    <p className="text-lg font-bold text-gray-900">{maxBranches}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Branches</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2.5 text-center">
                    <DollarSign size={16} className="mx-auto text-emerald-500 mb-1" />
                    <p className="text-lg font-bold text-gray-900">
                      {price === 0 ? "FREE" : `₹${price.toLocaleString()}`}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase">Per Year</p>
                  </div>
                  <div className="bg-white/60 rounded-lg p-2.5 text-center">
                    <Calendar size={16} className="mx-auto text-purple-500 mb-1" />
                    <p className="text-lg font-bold text-gray-900">{totalDuration}</p>
                    <p className="text-[10px] text-gray-500 uppercase">Months</p>
                  </div>
                </div>

                {/* Promo Badges */}
                {hasPromoValues && (
                  <div className="mt-3 pt-3 border-t border-indigo-200/50 flex flex-wrap gap-1.5">
                    {bonusMonths && Number(bonusMonths) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">
                        <Gift size={10} />
                        +{bonusMonths} bonus
                      </span>
                    )}
                    {promoFreeUntil && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">
                        <Calendar size={10} />
                        Free until {formatDate(promoFreeUntil)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info Bar */}
          <div className="mt-4 p-2.5 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2">
            <Info size={14} className="text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700">
              Plan will be created & activated. Click <strong>"Save Changes"</strong> in the modal header to assign it.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building2 size={14} />
            <span>For: <strong className="text-gray-700">{shopName || "Selected Shop"}</strong></span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onClose()}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || !shopId}
              className="flex items-center gap-2 px-5 py-2 bg-[#05015A] text-white rounded-lg text-sm font-medium hover:bg-[#0a0280] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Confirm
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPlanModal;