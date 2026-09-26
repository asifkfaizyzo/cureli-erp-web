// pharmacy-web/src/pages/verification/VerificationPage.jsx (do not remove this comment)
// src/pages/VerificationPage.jsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import OnboardingHeader from "../../components/layout/OnboardingHeader";
import VerificationStepper from "./comps/VerificationStepper";
import VerificationPending from "./comps/VerificationPending";
import DocumentResubmission from "./comps/DocumentResubmission";
import VerificationSuccess from "./comps/VerificationSuccess";
import { getVerificationStatus } from "../../api/shopFiles";

const VerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const initialStep = location.state?.resume_step ?? null;

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(initialStep || 12);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("");
  const [isFirstVerification, setIsFirstVerification] = useState(true);

  useEffect(() => {
    setUserName(localStorage.getItem("user_name") || "");
    initializeVerification();
  }, []);

  const initializeVerification = async () => {
    if (initialStep && [12, 14, 15].includes(initialStep)) {
      setCurrentStep(initialStep);

      // Still fetch status to get isFirstVerification flag for success page
      if (initialStep === 15) {
        await fetchVerificationFlag();
      }
      setLoading(false);
      return;
    }
    await fetchStatus();
  };

  // Separate function to just get the first verification flag
  const fetchVerificationFlag = async () => {
    try {
      const resp = await getVerificationStatus();
      const data = resp.data?.data;
      setIsFirstVerification(data?.is_first_verification ?? true);

      if (data?.user_name) {
        setUserName(data.user_name);
        localStorage.setItem("user_name", data.user_name);
      }
    } catch (e) {
      console.warn("Could not fetch verification flag:", e);
    }
  };

  const fetchStatus = async () => {
    try {
      const resp = await getVerificationStatus();
      const data = resp.data?.data;


      const shopStatus = data?.verification_status;
      const userStatus = data?.user_status;
      const firstLogin = data?.first_login_after_verification;

      // Set first verification flag
      setIsFirstVerification(data?.is_first_verification ?? true);

      // Update username if available
      if (data?.user_name) {
        setUserName(data.user_name);
        localStorage.setItem("user_name", data.user_name);
      }

      

      let step = 12;

      if (shopStatus === "verified") {
        if (userStatus === "verified" && firstLogin) {
        
          navigate("/erp/dashboard");
          return;
        } else {
        
          step = 15;
        }
      } else if (
        shopStatus === "rejected" ||
        shopStatus === "partially_rejected"
      ) {
      
        step = 14;
      } else if (shopStatus === "pending_review" || shopStatus === "pending") {
      
        step = 12;
      } else {
      
        step = 12;
      }

    
      setCurrentStep(step);
    } catch (e) {
      console.error("Failed to fetch verification status:", e);

      if (e.response?.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("shop_id");
        localStorage.removeItem("user_id");
        localStorage.removeItem("user_name");
        navigate("/", { replace: true });
        return;
      }

      setError("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusRefresh = async () => {
    setLoading(true);
    await fetchStatus();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 12:
        return <VerificationPending onRefresh={handleStatusRefresh} />;
      case 14:
        return <DocumentResubmission refreshStatus={handleStatusRefresh} />;
      case 15:
        // Pass isFirstVerification prop to VerificationSuccess
        return (
          <VerificationSuccess isFirstVerification={isFirstVerification} />
        );
      default:
        return <VerificationPending onRefresh={handleStatusRefresh} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#000060] text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh h-dvh bg-gray-50 flex flex-col font-poppins">
      {/* Header */}
      <OnboardingHeader userName={userName} />

      {/* Stepper */}
      <div className="flex-shrink-0 w-full flex justify-center px-4 pt-3 pb-2">
        <VerificationStepper currentStep={currentStep} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 w-full flex flex-col items-center overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex-1 flex flex-col"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VerificationPage;
