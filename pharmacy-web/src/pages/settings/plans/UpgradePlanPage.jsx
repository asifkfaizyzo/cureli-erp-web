// pharmacy-web/src/pages/settings/plans/UpgradePlanPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/settings/plans/UpgradePlanPage.jsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mail,
  Sparkles,
  Check,
  Users,
  Building2,
  ArrowLeft,
} from "lucide-react";

// API
import {
  getPlans,
  getMySubscription,
  changePlan,
  confirmPayment,
  cancelPendingSubscription,
} from "../../../api/subscription";
import { fetchUserLimits } from "../../../api/users";
import { fetchBranchLimits } from "../../../api/branches";
import { useToast } from "../../../components/common/Toast"; //  ADDED

// Utils & Config
import { analyzePlanChange } from "../../../utils/planChangeUtils";
import { normalizePlans } from "../../../utils/normalizePlan"; //  NEW IMPORT

// Components
import CurrentPlanBanner from "./comps/CurrentPlanBanner";
import PlanCard from "./comps/PlanCard";
import DowngradeWarningModal from "./comps/DowngradeWarningModal";
import ComplianceModal from "./comps/ComplianceModal";
import FinalConfirmationModal from "./comps/FinalConfirmationModal";
import UpgradeConfirmModal from "./comps/UpgradeConfirmModal";
import RenewalConfirmModal from "./comps/RenewalConfirmModal";

/**
 * UpgradePlanPage
 * Plan management page for Super Admin
 * Handles upgrades (Razorpay) and downgrades (compliance flow)
 */
const UpgradePlanPage = () => {
  const navigate = useNavigate();
  const toast = useToast(); //  ADDED

  // ============================================
  // STATE
  // ============================================

  // Data
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [usage, setUsage] = useState({ activeUsers: 0, activeBranches: 0 });

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected plan & analysis
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planAnalysis, setPlanAnalysis] = useState(null);

  // Modal state machine
  const [modalState, setModalState] = useState(null);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState("");

  // Compliance selections (for downgrade)
  const [complianceData, setComplianceData] = useState({
    usersToDisable: [],
    branchesToDeactivate: [],
  });

  // ============================================
  // DATA LOADING
  // ============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [plansRes, subscriptionRes, userLimitsRes, branchLimitsRes] =
        await Promise.all([
          getPlans(),
          getMySubscription(),
          fetchUserLimits(),
          fetchBranchLimits(),
        ]);

      // Plans -  NORMALIZE PLANS
      const plansData =
        plansRes.data?.data?.plans || plansRes.data?.plans || [];
      const normalizedPlans = normalizePlans(plansData);
      setPlans(normalizedPlans);

      const subData = subscriptionRes.data?.data || subscriptionRes.data;
      if (subData?.has_active_subscription && subData?.current_plan) {
        setCurrentSubscription({
          ...subData.subscription,
          plan: subData.current_plan,
        });
      } else {
        setCurrentSubscription(null);
      }

      const userCount = userLimitsRes.data?.current_count || 0;
      const branchCount = branchLimitsRes.data?.current_count || 0;
      setUsage({
        activeUsers: userCount,
        activeBranches: branchCount,
      });

      //  ADDED: Success toast on refresh (optional)
      // toast.success("Data Loaded", "Plan information updated.");
    } catch (err) {
      console.error("Failed to load data:", err);
      const errorMsg = "Failed to load plan information. Please try again.";
      setError(errorMsg);
      //  ADDED: Error toast
      toast.error("Load Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // PLAN SELECTION HANDLER
  // ============================================

  const handleSelectPlan = (plan) => {
    const analysis = analyzePlanChange(
      currentSubscription?.plan || { max_users: 0, max_branches: 0, price: 0 },
      plan,
      usage,
    );

    setSelectedPlan(plan);
    setPlanAnalysis(analysis);
    setModalError("");
    setComplianceData({ usersToDisable: [], branchesToDeactivate: [] });

    if (analysis.direction === "renew") {
      setModalState("renew_confirm");
    } else if (analysis.direction === "upgrade") {
      setModalState("upgrade_confirm");
    } else if (analysis.direction === "downgrade") {
      setModalState("downgrade_warning");
    } else {
      //  CHANGED: Alert to Toast
      toast.info("No Change", "You're already on this plan.");
    }
  };

  // ============================================
  // RENEWAL FLOW
  // ============================================

  const handleRenewConfirm = async () => {
    if (!selectedPlan || processing) return;

    setProcessing(true);
    setModalError("");

    try {
      const response = await changePlan({ plan_id: selectedPlan.plan_id });
      const data = response.data.data;

      if (data.requires_payment) {
        openRazorpayCheckout({
          ...data.razorpay,
          subscription_id: data.subscription_id,
          plan_name: selectedPlan.name,
        });
      } else {
        alert("Plan renewed successfully!");
        handleCloseModals();
        loadData();
      }
    } catch (err) {
      console.error("Renewal error:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to process renewal. Please try again.";
      setModalError(errorMsg);
      //  ADDED: Error toast
      toast.error("Renewal Failed", errorMsg);
      setProcessing(false);
    }
  };

  // ============================================
  // UPGRADE FLOW
  // ============================================

  const handleUpgradeConfirm = async () => {
    if (!selectedPlan || processing) return;

    setProcessing(true);
    setModalError("");

    try {
      const response = await changePlan({ plan_id: selectedPlan.plan_id });
      const data = response.data.data;

      if (data.requires_payment) {
        openRazorpayCheckout({
          ...data.razorpay,
          subscription_id: data.subscription_id,
          plan_name: selectedPlan.name,
        });
      } else {
        alert("Plan upgraded successfully!");
        handleCloseModals();
        loadData();
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to process upgrade. Please try again.";
      setModalError(errorMsg);
      //  ADDED: Error toast
      toast.error("Upgrade Failed", errorMsg);
      setProcessing(false);
    }
  };

  const openRazorpayCheckout = (data) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: data.name,
      description: data.description,
      order_id: data.order_id,
      prefill: data.prefill,
      theme: { color: "#000060" },
      handler: async function (response) {
        try {
          await confirmPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            subscription_id: data.subscription_id,
          });
          //  CHANGED: Alert to Toast
          toast.success(
            "Payment Successful",
            `Your plan has been upgraded to ${data.plan_name}!`,
          );
          handleCloseModals();
          loadData();
        } catch (err) {
          console.error("Payment confirmation error:", err);
          const errorMsg =
            "Payment was successful but activation failed. Please contact support.";
          setModalError(errorMsg);
          //  ADDED: Error toast
          toast.error("Activation Failed", errorMsg);
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: async function () {
          try {
            await cancelPendingSubscription(data.subscription_id);
          } catch (err) {
            console.error("Failed to cancel pending subscription:", err);
          }
          //  CHANGED: setModalError to Toast
          toast.warning("Payment Cancelled", "Your payment was cancelled.");
          setProcessing(false);
        },
        escape: false,
        backdropclose: false,
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", async function (response) {
      console.error("Payment failed:", response.error);
      try {
        await cancelPendingSubscription(data.subscription_id);
      } catch (err) {
        console.error("Failed to cancel pending subscription:", err);
      }
      const errorMsg =
        response.error.description || "Payment failed. Please try again.";
      setModalError(errorMsg);
      //  ADDED: Error toast
      toast.error("Payment Failed", errorMsg);
      setProcessing(false);
    });

    rzp.open();
  };

  // ============================================
  // DOWNGRADE FLOW
  // ============================================

  const handleDowngradeWarningAccept = () => {
    if (planAnalysis?.hasImpact) {
      setModalState("compliance");
    } else {
      setModalState("final_confirm");
    }
  };

  const handleComplianceComplete = (data) => {
    setComplianceData(data);
    setModalState("final_confirm");
  };

  const handleFinalConfirm = async () => {
    if (!selectedPlan || processing) return;

    setProcessing(true);
    setModalError("");

    try {
      const response = await changePlan({
        plan_id: selectedPlan.plan_id,
        users_to_disable: complianceData.usersToDisable,
        branches_to_deactivate: complianceData.branchesToDeactivate,
      });

      const data = response.data.data;

      //  CHANGED: Alert to Toast with details
      let message = "Plan changed successfully!";
      if (data.disabled_users > 0 || data.deactivated_branches > 0) {
        message = `Plan downgraded. ${data.disabled_users} user(s) disabled, ${data.deactivated_branches} branch(es) deactivated.`;
      }

      toast.success("Plan Changed", message);
      handleCloseModals();
      loadData();
    } catch (err) {
      console.error("Downgrade error:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to change plan. Please try again.";
      setModalError(errorMsg);
      //  ADDED: Error toast
      toast.error("Downgrade Failed", errorMsg);
      setProcessing(false);
    }
  };

  // ============================================
  // MODAL MANAGEMENT
  // ============================================

  const handleCloseModals = () => {
    if (processing) return;
    setModalState(null);
    setSelectedPlan(null);
    setPlanAnalysis(null);
    setModalError("");
    setProcessing(false);
    setComplianceData({ usersToDisable: [], branchesToDeactivate: [] });
  };

  const handleBackToWarning = () => {
    setModalState("downgrade_warning");
  };

  const handleBackToCompliance = () => {
    setModalState("compliance");
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const handleBackToProfile = () => {
    navigate("/erp/settings/profile");
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#000060]" />
          <p className="text-gray-500">Loading plans...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error && plans.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Failed to load plans
          </h3>
          <p className="text-gray-500">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleBackToProfile}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Profile
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition-colors"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="h-full flex flex-col gap-6 p-1 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToProfile}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#000060]/10 rounded-xl flex items-center justify-center">
              <CreditCard size={24} className="text-[#000060]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manage Plans</h1>
              <p className="text-sm text-gray-500">
                View and change your subscription plan
              </p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span className="text-sm">Refresh</span>
        </motion.button>
      </div>

      {/* Current Plan Banner */}
      {currentSubscription && (
        <CurrentPlanBanner subscription={currentSubscription} usage={usage} />
      )}

      {/*  REMOVED: Error Banner (using toast instead) */}

      {/* Plans Section */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Available Plans
        </h2>

        <div className="flex flex-wrap justify-center gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan_id}
              plan={plan}
              currentPlan={currentSubscription?.plan}
              usage={usage}
              onSelect={handleSelectPlan}
              disabled={processing}
            />
          ))}

          <CustomPlanCard />
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center py-4 flex-shrink-0">
        <p className="text-gray-500 text-sm">
          Need help choosing?{" "}
          <a
            href="mailto:support@cureli.com"
            className="text-[#000060] font-medium hover:underline"
          >
            Contact our team
          </a>
        </p>
      </div>

      {/* MODALS */}
      {/* ============================================ */}

      {modalState === "upgrade_confirm" && selectedPlan && (
        <UpgradeConfirmModal
          plan={selectedPlan}
          currentPlan={currentSubscription?.plan}
          onConfirm={handleUpgradeConfirm}
          onClose={handleCloseModals}
          loading={processing}
          error={modalError}
        />
      )}

      {modalState === "downgrade_warning" && selectedPlan && planAnalysis && (
        <DowngradeWarningModal
          currentPlan={currentSubscription?.plan}
          targetPlan={selectedPlan}
          analysis={planAnalysis}
          onAccept={handleDowngradeWarningAccept}
          onClose={handleCloseModals}
        />
      )}

      {modalState === "compliance" && selectedPlan && planAnalysis && (
        <ComplianceModal
          targetPlan={selectedPlan}
          analysis={planAnalysis}
          onComplete={handleComplianceComplete}
          onBack={handleBackToWarning}
          onClose={handleCloseModals}
        />
      )}

      {modalState === "renew_confirm" && selectedPlan && (
        <RenewalConfirmModal
          plan={selectedPlan}
          currentSubscription={currentSubscription}
          onConfirm={handleRenewConfirm}
          onClose={handleCloseModals}
          loading={processing}
          error={modalError}
        />
      )}

      {modalState === "final_confirm" && selectedPlan && (
        <FinalConfirmationModal
          currentPlan={currentSubscription?.plan}
          targetPlan={selectedPlan}
          complianceData={complianceData}
          hasImpact={planAnalysis?.hasImpact}
          onConfirm={handleFinalConfirm}
          onBack={
            planAnalysis?.hasImpact
              ? handleBackToCompliance
              : handleBackToWarning
          }
          onClose={handleCloseModals}
          loading={processing}
          error={modalError}
        />
      )}
    </div>
  );
};

// ============================================
// CUSTOM PLAN CARD
// ============================================

// In UpgradePlanPage.jsx — replace the CustomPlanCard function

function CustomPlanCard() {
  return (
    <div
      className={`
      group relative flex flex-col rounded-2xl p-6
      shadow-md border-2 transition-all duration-300
      bg-white hover:shadow-xl hover:-translate-y-1
      border-amber-300 border-dashed
      w-[265px] min-h-[390px]
    `}
    >
      {/* Hover overlay */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden
                      bg-gradient-to-b from-amber-500 to-orange-500
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-300 pointer-events-none"
      />

      {/* Badge */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
        <div
          className="whitespace-nowrap flex items-center gap-1.5
                        px-3 py-1 bg-amber-600 text-white text-[10px]
                        font-bold rounded-full shadow-lg uppercase tracking-wider"
        >
          <Sparkles size={10} />
          TAILORED FOR YOU
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col pt-2">
        <h2
          className="text-lg font-bold text-gray-800 group-hover:text-white
                       text-center transition-colors duration-300 mb-1"
        >
          Custom Plan
        </h2>
        <p
          className="text-xs text-gray-600 group-hover:text-white/80
                      text-center transition-colors duration-300 min-h-[32px] mb-3"
        >
          Need something specific? We'll tailor a plan for your business.
        </p>

        <div className="flex flex-col items-center mb-3">
          <span
            className="text-3xl font-extrabold text-amber-600
                           group-hover:text-white transition-colors duration-300"
          >
            Custom
          </span>
          <p
            className="text-[11px] text-gray-400 group-hover:text-white/50
                        transition-colors duration-300 mt-1"
          >
            Based on your requirements
          </p>
        </div>

        <div
          className="flex justify-center gap-6 mb-3 text-xs text-gray-600
                        group-hover:text-white/80 transition-colors duration-300"
        >
          <div className="flex items-center gap-1.5">
            <Users
              size={14}
              className="text-gray-400 group-hover:text-white/50
                                        transition-colors duration-300"
            />
            <span>Flexible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2
              size={14}
              className="text-gray-400 group-hover:text-white/50
                                            transition-colors duration-300"
            />
            <span>Flexible</span>
          </div>
        </div>

        <div
          className="h-px w-full bg-gray-200 group-hover:bg-white/20
                        transition-colors duration-300 mb-3"
        />

        <ul className="space-y-2 flex-1 mb-4">
          {[
            "Unlimited users & branches",
            "Priority 24/7 support",
            "Custom integrations",
            "Dedicated account manager",
          ].map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs">
              <Check
                size={13}
                strokeWidth={2.5}
                className="flex-shrink-0 text-amber-500 group-hover:text-amber-300
                                transition-colors duration-300"
              />
              <span
                className="text-gray-700 group-hover:text-white/90
                               transition-colors duration-300"
              >
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Button — scale only */}
        <a
          href="mailto:info@cureliofficial.com?subject=Custom%20Plan%20Inquiry"
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white text-center
             transition-colors duration-300
             hover:scale-[1.03] active:scale-[0.98]
             shadow-sm flex items-center justify-center gap-2
             bg-amber-600 text-white
             group-hover:bg-white group-hover:text-amber-600"
        >
          <Mail size={14} />
          Contact Sales
        </a>
      </div>
    </div>
  );
}

export default UpgradePlanPage;
