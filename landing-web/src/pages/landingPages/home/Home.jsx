// landing-web/src/pages/landingPages/home/Home.jsx (do not remove this comment)

import Navbar from "../../../components/common/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Footer from "../../../components/common/Footer";
import HeroStatsCard from "./components/HeroStatsCard";
import WhyChooseUs from "./components/WhyChooseUs";
import PlatformOptions from "./components/PlatformOptions";
import ERPShowcase from "./components/ERPShowcase";
import AppInsight from "../../../components/common/AppInsight";

const Home = () => {
  return (
    <div className="bg-[linear-gradient(90deg,#1D0A36,#1D025E,#020245)] w-full overflow-x-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Hero + Features wrapper for overlapping card */}
      <div className="relative">
        {/* Hero Section */}
        <Hero />
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-5xl px-4"
          style={{ top: 'var(--card-position)' }}
        >
          <HeroStatsCard />
        </div>

        {/* Features Section */}
        <Features />

        {/* HeroStatsCard - absolutely positioned at the junction */}
        
      </div>

      <WhyChooseUs />
      <Testimonials />
      <PlatformOptions />
      <ERPShowcase />
      <FAQ />
      <AppInsight />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;