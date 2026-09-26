// pharmacy-web/src/pages/plan-selection/PlanSelectionPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/plan-selection/PlanSelectionPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

import {
  getPlans,
  selectPlan,
  confirmPayment,
  cancelPendingSubscription,
} from "../../api/subscription";
import { normalizePlans } from "../../utils/normalizePlan";
import PlanCard from "./comps/PlanCard";
import CustomPlanCard from "./comps/CustomPlanCard";
import PlanConfirmModal from "./comps/PlanConfirmModal";
import OnboardingHeader from "../../components/layout/OnboardingHeader";
import { useSetupStore } from "../../store/useSetupStore";

const PlanSelectionPage = () => {
  const navigate = useNavigate();
  const resetSetup = useSetupStore((state) => state.resetSetup);

  // State
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  // Modal state
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState("");

  // Load plans and user name
  useEffect(() => {
    setUserName(localStorage.getItem("user_name") || "");
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getPlans();
      const backendPlans = res.data?.data?.plans || [];
      const normalizedPlans = normalizePlans(backendPlans);
      setPlans(normalizedPlans);
    } catch (err) {
      console.error("Failed to load plans:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load plans. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Open modal with selected plan
  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setModalError("");
    setModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (processing) return;
    setModalOpen(false);
    setSelectedPlan(null);
    setModalError("");
  };

  /**
   * Navigate to setup with fresh state
   * CRITICAL: Reset setup store to prevent stale data causing redirect loops
   */
  const navigateToSetup = () => {
    resetSetup();
    navigate("/setup", { replace: true, state: { fromPlanSelection: true } });
  };

  // Confirm plan selection
  const handleConfirmPlan = async () => {
    if (!selectedPlan || processing) return;

    try {
      setProcessing(true);
      setModalError("");

      const res = await selectPlan({ plan_id: selectedPlan.plan_id });
      const data = res.data?.data;

      if (data.is_free) {
        // FREE PLAN (Standard or Promo) - Direct activation
        navigateToSetup();
        return;
      }

      // PAID PLAN - Open Razorpay checkout
      const { razorpay: razorpayData, subscription_id } = data;

      openRazorpayCheckout({
        ...razorpayData,
        subscription_id,
        plan_name: selectedPlan.name,
      });
    } catch (err) {
      console.error("Plan selection error:", err);
      setModalError(
        err.response?.data?.message ||
          "Unable to process your request. Please try again.",
      );
      setProcessing(false);
    }
  };

  // Open Razorpay checkout
  const openRazorpayCheckout = (data) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: data.name,
      description: data.description,
      order_id: data.order_id,
      prefill: data.prefill,
      theme: {
        color: "#000060",
      },
      handler: async function (response) {
        try {
          await confirmPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            subscription_id: data.subscription_id,
          });
          navigateToSetup();
        } catch (err) {
          console.error("Payment confirmation error:", err);
          setModalError(
            "Payment was successful but activation failed. Please contact support.",
          );
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
          setModalError("Payment was cancelled. Please try again.");
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

      setModalError(
        response.error.description ||
          "Payment failed. Please try again or use a different payment method.",
      );
      setProcessing(false);
    });

    rzp.open();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <OnboardingHeader userName={userName} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-[#000060] animate-spin" />
            <p className="text-gray-600 text-lg font-medium">
              Loading plans...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <OnboardingHeader userName={userName} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Unable to Load Plans
            </h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadPlans}
              className="flex items-center gap-2 px-6 py-3 bg-[#000060] text-white rounded-xl font-semibold hover:bg-[#000080] transition-all"
            >
              <RefreshCw size={18} />
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <OnboardingHeader userName={userName} />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#000060]">
              Choose Your Plan
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mt-2">
              Select the plan that best fits your business needs. Upgrade or
              downgrade anytime.
            </p>
          </div>

          {/* Error Banner (non-critical) */}
          {error && plans.length > 0 && (
            <div className="mb-8 max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 font-bold text-xl ml-4"
              >
                ×
              </button>
            </div>
          )}

          {/* Plans Grid */}
          <div className="flex flex-wrap justify-center gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.plan_id}
                plan={plan}
                onSelect={handleSelectPlan}
                isSelecting={false}
              />
            ))}
            <CustomPlanCard />
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
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
        </div>
      </main>

      {/* Confirmation Modal */}
      <PlanConfirmModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        plan={selectedPlan}
        onConfirm={handleConfirmPlan}
        loading={processing}
        error={modalError}
      />
    </div>
  );
};

export default PlanSelectionPage;
