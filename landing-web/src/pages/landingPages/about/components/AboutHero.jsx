// landing-web/src/pages/landingPages/about/components/AboutHero.jsx (do not remove this comment)
import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Award, HeartPulse, ClipboardList, UsersRound } from "lucide-react";

import HeroBG from "../../../../assets/images/Artboard2_result.webp";

const AboutHero = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  const stats = [
    { icon: Award, value: "5+", label: "Years of", labelBreak: "Experience", delay: 250 },
    { icon: HeartPulse, value: "10K", label: "Medical", labelBreak: "Records", delay: 300 },
    { icon: ClipboardList, value: "10K", label: "Patients", labelBreak: "Records", delay: 350 },
    { icon: UsersRound, value: "100+", label: "Our", labelBreak: "Clients", delay: 400 },
  ];

  return (
    <section className="w-full bg-transparent pt-16 sm:pt-20 md:pt-0">

      {/* FULL SCREEN HERO */}
      <div
        className="relative w-full min-h-screen bg-cover bg-center bg-no-repeat px-4 sm:px-6 md:px-12 lg:px-16 flex items-center"
        style={{
          backgroundImage: `url(${HeroBG})`,
          backgroundSize: "cover",
        }}
      >
        <div className="w-full py-20 sm:py-24 md:py-0">

          {/* TEXT - Left Aligned */}
          <div data-aos="fade-up" className="text-left ml-0 sm:ml-4 md:ml-8 lg:ml-12">
            <h1 className="font-manrope text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium text-white leading-tight sm:leading-snug">
              Built for Pharmacies. Designed to <br className="hidden sm:block" />
              Deliver Better Healthcare.
            </h1>

            <p className="font-manrope text-white/70 max-w-xl sm:max-w-2xl lg:max-w-3xl mt-4 sm:mt-5 md:mt-6 text-sm sm:text-base md:text-lg leading-relaxed">
              Cureli delivers integrated digital solutions to pharmacies, healthcare providers, and technology partners. This helps to streamline operations, speed up transactions, and integrate the technology that helps the flow of healthcare.
            </p>
          </div>

          {/* STATS - Left Aligned with Lucide Icons */}
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mt-8 sm:mt-10 md:mt-12 lg:mt-16 ml-0 sm:ml-4 md:ml-8 lg:ml-12 max-w-4xl"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-start"
                  data-aos="fade-up"
                  data-aos-delay={stat.delay}
                >
                  <IconComponent
                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mb-2 text-white/80"
                    strokeWidth={1.5}
                  />
                  <p className="font-manrope text-xl sm:text-2xl md:text-3xl font-bold text-white mt-1 sm:mt-2">
                    {stat.value}
                  </p>
                  <span className="font-manrope text-white/80 text-xs sm:text-sm md:text-base mt-1 leading-tight">
                    {stat.label} <br className="hidden sm:block" /> {stat.labelBreak}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutHero;