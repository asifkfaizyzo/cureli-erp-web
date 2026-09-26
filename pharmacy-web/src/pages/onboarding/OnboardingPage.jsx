// pharmacy-web/src/pages/onboarding/OnboardingPage.jsx (do not remove this comment)
// src/pages/OnboardingPage.jsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import OnboardingHeader from "../../components/layout/OnboardingHeader";
import OnboardStepper from "../../components/layout/CustomStepper";

import IdentityForm from "./comps/pending/IdentityForm";
import EmailOTP from "./comps/pending/EmailOTP";
import PhoneDetails from "./comps/pending/PhoneDetails";
import PhoneOTP from "./comps/pending/PhoneOTP";
import BusinessInfo from "./comps/details-docs/BusinessInfo";
import BusinessTypeAndGST from "./comps/details-docs/BusinessTypeAndGST";
import UploadDrugLicense from "./comps/details-docs/UploadDrugLicense";
import UploadRegistration from "./comps/details-docs/UploadRegistration";
import UploadProof from "./comps/details-docs/UploadProof";
import UploadEALisence from "./comps/details-docs/UploadEALisence";
import UploadBPan from "./comps/details-docs/UploadBPan";
import UploadAddressProof from "./comps/details-docs/UploadAddressProof";
import CreatePassword from "./comps/pending/CreatePassword";
import { getOnboardingStatus, updateOnboardingStep } from "../../api/auth";

const OnboardingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pending_id = location.state?.pending_id;
  const email = location.state?.email;
  const firstName = location.state?.first_name;
  const lastName = location.state?.last_name;
  const provider = location.state?.provider || "password";
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [progressStep, setProgressStep] = useState(0);
  const [userName, setUserName] = useState("");

  // ------------------------------------------
  // INITIALIZE STEP ON MOUNT
  // ------------------------------------------
  useEffect(() => {
    initializeStep();
  }, []);

  const initializeStep = async () => {
    const routerStep = location.state?.resume_step;
    const token = localStorage.getItem("access_token");

    // Set user name from location state or localStorage
    if (firstName) {
      const fullName = `${firstName} ${lastName || ""}`.trim();
      setUserName(fullName);
      localStorage.setItem("user_name", fullName);
    } else {
      setUserName(localStorage.getItem("user_name") || "");
    }



    // CASE 1: Router passed a specific step (from login OTP verification)
    if (typeof routerStep === "number") {
     

      if (routerStep >= 12) {
        navigate("/verification", {
          state: { resume_step: routerStep },
          replace: true,
        });
        return;
      }

      setProgressStep(routerStep);
      setLoading(false);
      return;
    }

    // CASE 2: Has access_token = Real user exists
    // Fetch current step from backend (handles refresh correctly)
    if (token) {
      try {
        const res = await getOnboardingStatus();
        const data = res.data?.data;

      

        const step = data?.onboarding_step ?? 4;
        const userStatus = data?.status;

        // Update username from API if available
        if (data?.user_name) {
          setUserName(data.user_name);
          localStorage.setItem("user_name", data.user_name);
        }

        // If user is past onboarding, redirect appropriately
        if (
          userStatus === "pending_verification" ||
          userStatus === "verified"
        ) {
          navigate("/verification", { replace: true });
          return;
        }

        // If step is >= 12, go to verification
        if (step >= 12) {
          navigate("/verification", {
            state: { resume_step: step },
            replace: true,
          });
          return;
        }

        setProgressStep(step);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Failed to fetch onboarding status:", err);

        // If 401, clear tokens and redirect to login
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("shop_id");
          localStorage.removeItem("user_id");
          localStorage.removeItem("user_name");
          navigate("/", { replace: true });
          return;
        }

        // For other errors, still try to continue if we have pending_id
        // Fall through to Case 3
      }
    }

    // CASE 3: Fresh signup (has pending_id, no access_token)
    // This is a brand new user who just came from signup
    if (pending_id && !token) {
    
      setProgressStep(0);
      setLoading(false);
      return;
    }

    // CASE 4: No token, no pending_id = redirect to home
  
    navigate("/", { replace: true });
    setLoading(false);
  };

  // ------------------------------------------
  // NEXT STEP HANDLER
  // ------------------------------------------
  const handleContinue = async () => {
    const nextStep = progressStep + 1;

    // For steps 4+, update the backend
    if (nextStep >= 4 && nextStep <= 12) {
      try {
        await updateOnboardingStep(nextStep);
      
      } catch (err) {
        console.error("Failed to update step in backend:", err);
        // Continue anyway - don't block user progress
      }
    }

    // Redirect to verification flow
    if (nextStep >= 12) {
      navigate("/verification", {
        state: { resume_step: nextStep },
        replace: true,
      });
      return;
    }

    setProgressStep(nextStep);
  };

  // ------------------------------------------
  // RENDER STEPS
  // ------------------------------------------
  const renderStep = () => {
    switch (progressStep) {
      case 0:
        return provider === "google" ? (
          <CreatePassword pending_id={pending_id} onContinue={handleContinue} />
        ) : (
          <EmailOTP
            pending_id={pending_id}
            email={email}
            onContinue={handleContinue}
          />
        );

      case 1:
        return (
          <PhoneDetails
            pending_id={pending_id}
            onContinue={handleContinue}
            setPhone={setPhone}
          />
        );

      case 2:
        return (
          <PhoneOTP
            pending_id={pending_id}
            onContinue={handleContinue}
            phone={phone}
          />
        );

      case 3:
        return (
          <IdentityForm
            pending_id={pending_id}
            onContinue={handleContinue}
            onNext={handleContinue}
          />
        );

      case 4:
        return <BusinessInfo onContinue={handleContinue} />;
      case 5:
        return <BusinessTypeAndGST onContinue={handleContinue} />;
      case 6:
        return <UploadDrugLicense onContinue={handleContinue} />;
      case 7:
        return <UploadRegistration onContinue={handleContinue} />;
      case 8:
        return <UploadProof onContinue={handleContinue} />;
      case 9:
        return <UploadEALisence onContinue={handleContinue} />;
      case 10:
        return <UploadBPan onContinue={handleContinue} />;
      case 11:
        return <UploadAddressProof onContinue={handleContinue} />;

      default:
        navigate("/verification", {
          state: { resume_step: 12 },
          replace: true,
        });
        return null;
    }
  };

  // ------------------------------------------
  // LOADING STATE
  // ------------------------------------------
  if (loading) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh h-dvh bg-gray-50 flex flex-col font-poppins">
      {/* Header */}
      <OnboardingHeader userName={userName} />

      {/* Stepper */}
      <div className="flex-shrink-0 w-full flex justify-center px-4 pt-4 pb-2">
        <OnboardStepper currentStep={progressStep + 1} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 w-full flex justify-center overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={progressStep}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-2xl"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OnboardingPage;
