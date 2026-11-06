// landing-web/src/pages/landingPages/contact/Contact.jsx (do not remove this comment)
// Contact.jsx
import { useMemo } from "react";
import ContactHero from "./components/ContactHero";
import ContactFormCard from "./components/ContactFormCard";
import MapSection from "./components/MapSection";
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const Contact = () => {
  //  Memoize reCAPTCHA key to prevent unnecessary re-renders
  const recaptchaKey = useMemo(
    () => import.meta.env.VITE_GOOGLE_CAPTCHA_ID,
    [],
  );

  return (
    <div className="w-full overflow-hidden">
      <Navbar />

      {/* Hero and Form Card Container */}
      <div className="relative">
        {/* Hero Section */}
        <ContactHero />

        {/*  FIXED: Wrap only the form component with reCAPTCHA provider */}
        <GoogleReCaptchaProvider
          reCaptchaKey={recaptchaKey}
          scriptProps={{
            async: true,
            defer: true,
            appendTo: "head",
          }}
        >
          {/* Overlapping Form Card */}
          <div className="relative -mt-20 xs:-mt-24 sm:-mt-32 md:-mt-40 lg:-mt-48 xl:-mt-56 z-10 px-4 sm:px-6 lg:px-8">
            <ContactFormCard />
          </div>
        </GoogleReCaptchaProvider>
      </div>

      {/* Content Section */}
      <div className="bg-white mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <MapSection />
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
