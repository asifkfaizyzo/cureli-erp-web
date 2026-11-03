// landing-web/src/pages/landingPages/about/About.jsx (do not remove this comment)
import React from "react";

import AboutHero from "./components/AboutHero";
import AboutPartners from "./components/AboutPartners";
import AboutMission from "./components/AboutMission";
import Footer from "../../../components/common/Footer";
import Navbar from "../../../components/common/Navbar";
import CTASection from "../../../components/common/CTASection";


const About = () => {
  return (
    <div className="bg-[linear-gradient(90deg,#1D0A36,#1D025E,#020245)] w-full overflow-x-hidden">

      <Navbar />
      <AboutHero />
      <AboutPartners />
      <AboutMission />
      <CTASection />
      <Footer />
    </div>
  );
};

export default About;
