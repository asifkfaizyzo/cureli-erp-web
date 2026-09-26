// pharmacy-web/src/pages/login/LoginPage.jsx (do not remove this comment)
// src/pages/login/LoginPage.jsx

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import bgImage from "../../assets/images/login-background_result.webp";
import logo from "../../assets/icons/Artboard 24.svg";

import LoginForm from "./comps/LoginForm";
import CreateAccount from "./comps/CreateAccount";
import OtpVerify from "./comps/OtpVerify";
import ReCaptchaWrapper from "../../components/common/ReCaptchaWrapper";

import { useAuthStore } from "../../store/useAuthStore";
import { determineAuthDestination } from "../../utils/authRouting";

const LANDING_PAGE_URL = import.meta.env.VITE_LANDING_PAGE;

// ─────────────────────────────────────────────────────────────────────────────
// Session message helper
// Reads ?reason= from URL and returns a typed message object once.
// Runs outside component so it never causes a re-render on its own.
// ─────────────────────────────────────────────────────────────────────────────
const getInitialSessionMessage = (searchParams) => {
  const reason = searchParams.get("reason");

  if (reason === "session_replaced") {
    return {
      type: "warning",
      text: "You were logged out because your account was accessed from another device.",
    };
  }

  if (reason === "session_expired") {
    return {
      type: "info",
      text: "Your session has expired. Please log in again.",
    };
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// LoginPage
// ─────────────────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Auth store reads ───────────────────────────────────────────────────────
  // Read all three independently so the component only re-renders when
  // something it actually cares about changes.
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [showOtp, setShowOtp] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(() =>
    getInitialSessionMessage(searchParams),
  );

  // ── Redirect state ─────────────────────────────────────────────────────────
  // Tracks whether we are currently computing the destination for an
  // already-authenticated user. While true we show a neutral loading screen
  // instead of flashing the login form.
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Prevents the redirect effect from firing twice in React StrictMode or
  // if the component somehow re-mounts while the async lookup is in flight.
  const redirectAttempted = useRef(false);

  // ── URL cleanup ────────────────────────────────────────────────────────────
  // Replace ?reason=... from the URL after we've captured the message.
  // Done with a short delay so the replaceState happens after paint.
  const hasCleanedUrl = useRef(false);

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason && !hasCleanedUrl.current) {
      hasCleanedUrl.current = true;
      setTimeout(() => {
        window.history.replaceState({}, "", "/login");
      }, 0);
    }
  }, [searchParams]);

  // ── Authenticated redirect ─────────────────────────────────────────────────
  //
  // Gate: do NOT run until isInitialized is true.
  // Before initialization completes, isAuthenticated is unreliable — it may
  // read as false even though a valid token exists in localStorage, because
  // the initialize() call in AuthInitializer (App.jsx) hasn't finished yet.
  //
  // Flow:
  //   1. Wait for isInitialized === true
  //   2. If not authenticated → do nothing, let login form render normally
  //   3. If authenticated → call determineAuthDestination(role)
  //      Show loading UI while the async check runs
  //      Then navigate to the resolved destination
  //
  // redirectAttempted ref: prevents double-firing in StrictMode and guards
  // against the effect re-running if user/role changes mid-flight (shouldn't
  // happen but defensive).
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Not ready yet — auth store hasn't finished hydrating from localStorage
    if (!isInitialized) return;

    // Not authenticated — render login form normally
    if (!isAuthenticated) return;

    // Already attempted (StrictMode double-mount guard)
    if (redirectAttempted.current) return;

    redirectAttempted.current = true;

    const role = user?.role;

    const redirect = async () => {
      setIsRedirecting(true);

      try {
        const destination = await determineAuthDestination(role);
        navigate(destination, { replace: true });
      } catch (err) {
        // determineAuthDestination handles its own fallbacks internally,
        // so reaching here means something unexpected happened.
        // Fail open: let the login page render so user can re-authenticate.
        console.error(
          "[LoginPage] Unexpected error during redirect resolution:",
          err,
        );
        setIsRedirecting(false);
        redirectAttempted.current = false; // allow retry on next render
      }
    };

    redirect();
  }, [isInitialized, isAuthenticated, user, navigate]);

  // ── Loading screens ────────────────────────────────────────────────────────
  //
  // Two distinct loading states, each with a different reason:
  //
  // 1. !isInitialized
  //    Auth store hasn't finished reading from localStorage yet.
  //    We must not render the login form because if the user IS
  //    authenticated, showing the form even briefly is incorrect UX
  //    and can cause a visible flicker before the redirect fires.
  //
  // 2. isRedirecting
  //    Auth is confirmed. We're awaiting the async API calls inside
  //    determineAuthDestination. Show a "redirecting" indicator so
  //    the user gets feedback instead of a frozen blank screen.
  // ─────────────────────────────────────────────────────────────────────────
  if (!isInitialized || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#000060]" />
          <p className="text-gray-500 text-sm font-poppins">
            {isRedirecting ? "Redirecting you…" : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  // ── Normal login page render ───────────────────────────────────────────────
  // Only reached when:
  //   - isInitialized === true
  //   - isAuthenticated === false  (or token is expired)
  //   - isRedirecting === false
  return (
    <ReCaptchaWrapper>
      {/* Disable scroll globally */}
      <style>{`body { overflow: hidden; }`}</style>

      <div className="relative flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-white">
        {/* ── LEFT SIDE (Hero with image) ───────────────────────────────── */}
        <div className="relative w-full md:w-3/5 h-64 sm:h-80 md:h-auto">
          {/* Background image */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={bgImage}
              alt="Background"
              className="w-full h-full object-cover md:scale-125 lg:scale-145 md:-translate-x-[15%] lg:-translate-x-[25%] transition-all duration-500"
            />
          </div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#000060A3]" />

          {/* Logo */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 md:left-6 lg:left-8 md:translate-x-0 z-20 transition-all">
            <a
              href={LANDING_PAGE_URL}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src={logo}
                alt="Cureli"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
            </a>
          </div>

          {/* Hero text */}
          <div className="absolute inset-0 z-10 text-white px-6 sm:px-8 md:px-12 flex flex-col justify-center items-center md:items-start text-center md:text-left font-poppins">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 md:mt-24 lg:mt-0 transition-all">
              Welcome to Cureli
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-light leading-relaxed transition-all">
              "Smarter stock, billing, and expiry control.{" "}
              <br className="hidden sm:block" />
              Your pharmacy starts here."
            </p>
          </div>
        </div>

        {/* ── RIGHT SIDE (Form) ─────────────────────────────────────────── */}
        <div className="relative w-full md:w-2/5 bg-white px-6 py-10 sm:px-10 sm:py-12 flex items-center justify-center font-poppins">
          {/* Skewed white strip only for medium+ screens */}
          <div className="hidden md:block absolute left-[-115px] top-0 h-full w-[200px] lg:w-[220px] bg-white transform -skew-x-[12deg]" />

          {/* Form container */}
          <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm bg-white rounded-xl p-6 sm:p-8 transition-all">
            {/* Session Message Alert */}
            {sessionMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  sessionMessage.type === "warning"
                    ? "bg-orange-50 border border-orange-200 text-orange-800"
                    : "bg-blue-50 border border-blue-200 text-blue-800"
                }`}
              >
                <div className="flex items-start gap-2">
                  {sessionMessage.type === "warning" ? (
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span>{sessionMessage.text}</span>
                </div>
                <button
                  onClick={() => setSessionMessage(null)}
                  className="mt-2 text-xs underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {showOtp ? (
              <OtpVerify onBack={() => setShowOtp(false)} />
            ) : showRegister ? (
              <CreateAccount onLoginClick={() => setShowRegister(false)} />
            ) : (
              <LoginForm
                onSuccess={() => setShowOtp(true)}
                onRegisterClick={() => setShowRegister(true)}
              />
            )}
          </div>
        </div>
      </div>
    </ReCaptchaWrapper>
  );
};

export default LoginPage;
