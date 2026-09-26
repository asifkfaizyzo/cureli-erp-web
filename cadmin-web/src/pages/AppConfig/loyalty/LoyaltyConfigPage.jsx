// cadmin-web/src/pages/AppConfig/loyalty/LoyaltyConfigPage.jsx (do not remove this comment)
// cadmin-web/src/pages/AppConfig/loyalty/LoyaltyConfigPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Gift,
  Coins,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { getLoyaltyConfig, updateLoyaltyConfig } from "../../../api/cadminLoyalty";
import { useToast } from "../../../components/common/Toast";

function InlineFeedback({ type, message }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div className={`flex items-center gap-1.5 text-xs ${isError ? "text-red-500" : "text-green-600"}`}>
      {isError ? <AlertCircle size={12} className="shrink-0" /> : <CheckCircle2 size={12} className="shrink-0" />}
      {message}
    </div>
  );
}

export default function LoyaltyConfigPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: null });

  // Form State
  const [config, setConfig] = useState({
    is_enabled: false,
    earn_rate_amount: 100,
    earn_basis: "TOTAL_PAYABLE",
    redemption_value: 1,
    min_redeem_points: 50,
    min_order_amount: 299,
    max_redeem_points: "",
    max_redeem_percent: "",
    points_expiry_days: "",
  });

  // Simulator State
  const [simOrderAmount, setSimOrderAmount] = useState(500);
  const [simUserPoints, setSimUserPoints] = useState(150);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLoyaltyConfig();
      const data = res.data?.data?.config;
      if (data) {
        setConfig({
          is_enabled: data.is_enabled ?? false,
          earn_rate_amount: data.earn_rate_amount ? Number(data.earn_rate_amount) : 100,
          earn_basis: data.earn_basis || "TOTAL_PAYABLE",
          redemption_value: data.redemption_value ? Number(data.redemption_value) : 1,
          min_redeem_points: data.min_redeem_points ?? 50,
          min_order_amount: data.min_order_amount ? Number(data.min_order_amount) : 299,
          max_redeem_points: data.max_redeem_points !== null ? data.max_redeem_points : "",
          max_redeem_percent: data.max_redeem_percent !== null ? Number(data.max_redeem_percent) : "",
          points_expiry_days: data.points_expiry_days !== null ? data.points_expiry_days : "",
        });
      }
      setHasChanges(false);
    } catch (err) {
      toast.error("Failed to load config", err.response?.data?.message || "Failed to load loyalty configuration");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: null, message: null }), 3500);
  }, []);

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        is_enabled: Boolean(config.is_enabled),
        earn_rate_amount: Number(config.earn_rate_amount),
        earn_basis: config.earn_basis, // ◄ Uses selected earn_basis
        redemption_value: Number(config.redemption_value),
        min_redeem_points: parseInt(config.min_redeem_points, 10),
        min_order_amount: Number(config.min_order_amount),
        max_redeem_points: config.max_redeem_points === "" ? null : parseInt(config.max_redeem_points, 10),
        max_redeem_percent: config.max_redeem_percent === "" ? null : Number(config.max_redeem_percent),
        points_expiry_days: config.points_expiry_days === "" ? null : parseInt(config.points_expiry_days, 10),
      };

      const res = await updateLoyaltyConfig(payload);
      const data = res.data?.data?.config;
      if (data) {
        setConfig({
          is_enabled: data.is_enabled,
          earn_rate_amount: Number(data.earn_rate_amount),
          earn_basis: data.earn_basis,
          redemption_value: Number(data.redemption_value),
          min_redeem_points: data.min_redeem_points,
          min_order_amount: Number(data.min_order_amount),
          max_redeem_points: data.max_redeem_points !== null ? data.max_redeem_points : "",
          max_redeem_percent: data.max_redeem_percent !== null ? Number(data.max_redeem_percent) : "",
          points_expiry_days: data.points_expiry_days !== null ? data.points_expiry_days : "",
        });
      }
      showFeedback("success", "Loyalty program settings saved");
      toast.success("Success", "Loyalty configuration saved successfully!");
      setHasChanges(false);
    } catch (err) {
      showFeedback("error", err.response?.data?.message || "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  // Live Simulator Calculations
  let simAllowedPoints = Math.min(simUserPoints, Math.floor((simOrderAmount - 1) / (config.redemption_value || 1)));

  if (config.max_redeem_points !== "") {
    simAllowedPoints = Math.min(simAllowedPoints, Number(config.max_redeem_points));
  }
  if (config.max_redeem_percent !== "") {
    const maxPtsByPercent = Math.floor((simOrderAmount * Number(config.max_redeem_percent)) / 100 / (config.redemption_value || 1));
    simAllowedPoints = Math.min(simAllowedPoints, maxPtsByPercent);
  }
  const isRedeemEligible = simOrderAmount >= config.min_order_amount && simUserPoints >= config.min_redeem_points && config.is_enabled;
  const simFinalDiscount = isRedeemEligible ? Number((simAllowedPoints * config.redemption_value).toFixed(2)) : 0;

  // Accrual base based on configured basis
  const simEarningBase = config.earn_basis === "TOTAL_PAYABLE"
    ? Math.max(0, simOrderAmount - simFinalDiscount)
    : simOrderAmount;

  const calcPointsEarned = Math.floor(simEarningBase / (config.earn_rate_amount || 100));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#05015A]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/marketplace/app-config")}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Gift size={22} className="text-[#05015A]" />
              Loyalty Program Config
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Accrue customer rewards, cap redemption values, and configure points expiry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasChanges && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#05015A] to-[#0a0280] hover:from-[#06027a] hover:to-[#0c03a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/25"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Configuration
          </button>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration Card Grid */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Toggle Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Loyalty Program Status</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md">
                  Globally enable or temporarily suspend point accrual and redemption across the mobile application.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange("is_enabled", !config.is_enabled)}
                className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                  config.is_enabled ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                    config.is_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Accrual Settings */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Coins size={16} className="text-[#05015A]" />
              <h3 className="text-sm font-bold text-gray-800">Accrual Settings</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Spend required for 1 point</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={config.earn_rate_amount}
                    onChange={(e) => handleChange("earn_rate_amount", Number(e.target.value))}
                    className="w-full h-11 pl-8 pr-4 border-2 rounded-xl text-sm font-medium focus:outline-none border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
                  />
                </div>
                <p className="text-[10px] text-gray-400">Accrues 1 loyalty point for every ₹{config.earn_rate_amount} spent.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Calculated Accrual Basis</label>
                <select
                  value={config.earn_basis}
                  onChange={(e) => handleChange("earn_basis", e.target.value)}
                  className="w-full h-11 px-4 border-2 rounded-xl text-xs font-semibold bg-white border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] focus:outline-none transition-all duration-200"
                >
                  <option value="TOTAL_PAYABLE">Total Payable Amount (Grand Total after all discounts & charges)</option>
                  <option value="SUBTOTAL">Post-Coupon Subtotal (Items minus coupon only)</option>
                </select>
                <p className="text-[10px] text-gray-400">
                  {config.earn_basis === "TOTAL_PAYABLE"
                    ? "Customer earns points on what they actually pay out-of-pocket."
                    : "Points are calculated before loyalty discount and delivery charges."}
                </p>
              </div>
            </div>
          </div>

          {/* Redemption Rules */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <ShieldCheck size={16} className="text-[#05015A]" />
              <h3 className="text-sm font-bold text-gray-800">Redemption Rules & Thresholds</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Valuation per point (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={config.redemption_value}
                    onChange={(e) => handleChange("redemption_value", Number(e.target.value))}
                    className="w-full h-11 pl-8 pr-4 border-2 rounded-xl text-sm font-medium focus:outline-none border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
                  />
                </div>
                <p className="text-[10px] text-gray-400">Redemption factor: 1 Point = ₹{config.redemption_value}</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Min. points required to redeem</label>
                <input
                  type="number"
                  min="1"
                  value={config.min_redeem_points}
                  onChange={(e) => handleChange("min_redeem_points", Number(e.target.value))}
                  className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium focus:outline-none border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
                />
                <p className="text-[10px] text-gray-400">Customer must have at least this balance to apply points.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Min. order subtotal required (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={config.min_order_amount}
                    onChange={(e) => handleChange("min_order_amount", Number(e.target.value))}
                    className="w-full h-11 pl-8 pr-4 border-2 rounded-xl text-sm font-medium focus:outline-none border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
                  />
                </div>
                <p className="text-[10px] text-gray-400">Minimum payable item cost required to authorize redemption.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Max. points redeemable / order</label>
                <input
                  type="number"
                  placeholder="No hard cap"
                  value={config.max_redeem_points}
                  onChange={(e) => handleChange("max_redeem_points", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium focus:outline-none border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
                />
                <p className="text-[10px] text-gray-400">Upper cap on point deductions per single transaction.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Max. percentage offset / order</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="No percentage cap"
                    value={config.max_redeem_percent}
                    onChange={(e) => handleChange("max_redeem_percent", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full h-11 pr-8 pl-4 border-2 rounded-xl text-sm font-medium focus:outline-none border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                </div>
                <p className="text-[10px] text-gray-400">Caps maximum point discount by percentage of item subtotal.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Points validity duration (Days)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Never Expire"
                    value={config.points_expiry_days}
                    onChange={(e) => handleChange("points_expiry_days", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full h-11 pr-12 pl-4 border-2 rounded-xl text-sm font-medium focus:outline-none border-gray-200 hover:border-gray-300 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] transition-all duration-200"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Days</span>
                </div>
                <p className="text-[10px] text-gray-400">Unused points are automatically voided daily at 2:00 AM after this duration.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulator View */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-150">
              <Sparkles size={16} className="text-[#05015A]" />
              <h3 className="text-sm font-bold text-gray-800">Live Rule Simulator</h3>
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Sample Cart Subtotal (₹)</label>
                <input
                  type="number"
                  value={simOrderAmount}
                  onChange={(e) => setSimOrderAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 border-2 rounded-lg text-xs font-semibold border-gray-200 focus:border-indigo-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Sample Customer Balance</label>
                <input
                  type="number"
                  value={simUserPoints}
                  onChange={(e) => setSimUserPoints(Number(e.target.value))}
                  className="w-full h-10 px-3 border-2 rounded-lg text-xs font-semibold border-gray-200 focus:border-indigo-400 focus:outline-none transition-colors"
                />
              </div>

              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2.5 text-xs font-medium">
                <div className="flex justify-between text-gray-600">
                  <span>Accrued points earned:</span>
                  <span className="font-bold text-emerald-600">+{calcPointsEarned} pts</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Applicable Points:</span>
                  <span className="font-bold text-gray-800">
                    {isRedeemEligible ? `${simAllowedPoints} pts` : "0 pts"}
                  </span>
                </div>

                <div className="flex justify-between text-gray-900 font-bold pt-2.5 border-t border-gray-200">
                  <span>Total discount value:</span>
                  <span className="text-[#05015A]">-₹{simFinalDiscount.toFixed(2)}</span>
                </div>
              </div>

              <InlineFeedback type={feedback.type} message={feedback.message} />

              {!isRedeemEligible && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-700 leading-snug">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    {!config.is_enabled
                      ? "Loyalty configuration globally disabled."
                      : simOrderAmount < config.min_order_amount
                      ? `Cart subtotal is less than the required ₹${config.min_order_amount} minimum limit.`
                      : `Balance contains fewer than ${config.min_redeem_points} points.`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}