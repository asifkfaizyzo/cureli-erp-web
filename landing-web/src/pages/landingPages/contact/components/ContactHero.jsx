// landing-web/src/pages/landingPages/contact/components/ContactHero.jsx (do not remove this comment)
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const ContactHero = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <section
      className="
        w-full 
        bg-gradient-to-b from-[#05015A] to-[#02023A] 
        text-white 
        pt-24 xs:pt-28 sm:pt-32 md:pt-36 lg:pt-40
        pb-32 xs:pb-36 sm:pb-40 md:pb-44 lg:pb-48 xl:pb-52
        min-h-[50vh] xs:min-h-[55vh] sm:min-h-[60vh] md:min-h-[65vh] lg:min-h-[70vh]
        flex items-center justify-center
        px-4 sm:px-6 lg:px-8
      "
    >
      <div className="max-w-5xl mx-auto w-full text-center">
        <h2
          className="
            text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl 
            font-medium 
            bg-gradient-to-r from-white to-[#6262E2] 
            bg-clip-text text-transparent
            leading-tight
            px-4 sm:px-6
          "
          data-aos="fade-up"
        >
          Get in touch with us today
        </h2>

        <p
          className="
          mb-[5%]
            text-white/70 sm:text-white/80 
            mt-3 xs:mt-4 sm:mt-5 md:mt-6
            max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl 
            mx-auto 
            text-xs xs:text-sm sm:text-base md:text-lg
            leading-relaxed
            px-4 sm:px-6
          "
          data-aos="fade-up"
          data-aos-delay="150"
        >
          We're always here to help! Reach out to us with any questions or
          concerns and we'll be happy to assist you.
        </p>
      </div>
    </section>
  );
};

export default ContactHero;
