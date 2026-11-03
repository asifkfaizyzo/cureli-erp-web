// landing-web/src/components/common/AppInsight.jsx (do not remove this comment)

import phones from "../../assets/images/appinsight.svg";
import appleLogo from "../../assets/icons/APPLE.svg";
import googlePlayLogo from "../../assets/icons/PLAYSTORE_result.webp";

const AppInsight = () => {
  return (
    <section className="py-8 xs:py-10 sm:py-14 md:py-16 lg:py-20 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10">
        
        {/* Title */}
        <div className="text-center mb-6 xs:mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-1.5 xs:mb-2 sm:mb-2.5 px-2">
            Ready to bring your pharmacy into the future with Cureli?
          </h2>
          <p className="text-xs xs:text-sm sm:text-base text-white/70 max-w-xs xs:max-w-sm sm:max-w-lg md:max-w-xl mx-auto px-4 xs:px-0 leading-relaxed">
            Implementation can be started immediately and have your branded medicine ordering and delivery system live in as little as 24 hours, with no technical knowledge required.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl xs:rounded-2xl sm:rounded-3xl md:rounded-[32px] p-3 xs:p-4 sm:p-5 md:p-8 lg:p-10 flex flex-col lg:flex-row items-center justify-between gap-3 xs:gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          
          {/* PHONES - First on mobile (top), Left on desktop */}
          <div className="flex justify-center w-full lg:w-1/2">
            <img
              src={phones}
              alt="Cureli App"
              className="w-full max-w-[160px] xs:max-w-[180px] sm:max-w-[220px] md:max-w-[240px] lg:max-w-[260px] h-auto object-contain"
            />
          </div>

          {/* CONTENT - Second on mobile (bottom), Right on desktop */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold text-gray-900 mb-1.5 xs:mb-2 sm:mb-2.5">
              Download the App now!
            </h3>
            <p className="text-xs xs:text-sm text-gray-600 mb-3 xs:mb-4 sm:mb-5 max-w-sm mx-auto lg:mx-0 leading-relaxed">
              Experience seamless and secure online medicine ordering with Cureli.
            </p>

            {/* Store Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2.5 justify-center lg:justify-start">
              <a 
                href="https://apps.apple.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center sm:justify-start gap-2 bg-black text-white px-3.5 py-2 rounded-md hover:scale-105 hover:bg-gray-900 transition-all duration-300"
              >
                <img src={appleLogo} alt="Apple Logo" className="w-4 h-4" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] text-white/70">Download on the</p>
                  <p className="text-[11px] font-semibold">App Store</p>
                </div>
              </a>

              <a 
                href="https://play.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center sm:justify-start gap-2 bg-black text-white px-3.5 py-2 rounded-md hover:scale-105 hover:bg-gray-900 transition-all duration-300"
              >
                <img src={googlePlayLogo} alt="Google Play Logo" className="w-4 h-4" />
                <div className="text-left leading-tight">
                  <p className="text-[9px] text-white/70">GET IT ON</p>
                  <p className="text-[11px] font-semibold">Google Play</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppInsight;