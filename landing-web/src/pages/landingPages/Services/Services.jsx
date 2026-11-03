// landing-web/src/pages/landingPages/Services/Services.jsx (do not remove this comment)
import Navbar from "../../../components/common/Navbar";
import Footer from "../../../components/common/Footer";
import FAQSection from "./components/FAQ";
import CTASection from "../../../components/common/CTASection";
import PricingSection from "./components/PricingSection";
import Features from "./components/Features";
import ServiceHero from "./components/ServiceHero";
import AppInsight from "../../../components/common/AppInsight";
import ServiceShowcase from "./components/ServiceShowcase";
import HowItWorks from "./components/HowItWorks";

const Pricing = () => {
  return (
    <div className="bg-[linear-gradient(90deg,#1D0A36,#1D025E,#020245)] w-full overflow-x-hidden">
      <Navbar />
      <ServiceHero />
      <Features />
      <AppInsight />
      <HowItWorks />
      <ServiceShowcase />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Pricing;
