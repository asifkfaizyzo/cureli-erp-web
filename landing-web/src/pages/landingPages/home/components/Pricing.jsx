// landing-web/src/pages/landingPages/home/components/Pricing.jsx (do not remove this comment)
import { useEffect } from "react";
import AOS from "aos";
import { Check } from "lucide-react";

const Pricing = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const plans = [
    {
      name: "Basic Plan",
      price: "FREE",
      period: "/month",
      description: "Get started with our Basic plan kickstart your Cureli journey.",
      features: [
        "Only 2 users",
        "Single Branch",
      ],
    },
    {
      name: "Professional",
      price: "₹1,499",
      period: "/month",
      description: "Perfect for growing businesses with advanced features.",
      features: [
        "Up to 6 users",
        "Two Branch",
      ],
    },
    {
      name: "Enterprise",
      price: "₹2,999",
      period: "/month",
      description: "Complete solution for large-scale operations.",
      features: [
        "12 Users",
        "Three Branches",
      ],
    },
    {
      name: "Custom",
      price: "Contact",
      period: "us",
      description: "Tailored solutions for your unique business needs.",
      features: [
        "Custom users",
        "Custom Branches",
        "Custom Pricing",
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="relative py-16 sm:py-20 md:py-24 lg:py-32 rounded-b-[50px] sm:rounded-b-[60px] md:rounded-b-[80px] lg:rounded-b-[100px] overflow-hidden"
      style={{ backgroundColor: "#E8EEF7" }}
    >
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20">
          <h2
            className="font-manrope text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-[#05015A] mb-2 sm:mb-3 lg:mb-4 px-4"
            data-aos="fade-up"
          >
            Grow Confidently with <span className="text-[#6B46C1]">Predicatable</span>
            <br className="hidden sm:block" />
            Pricing
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              className="group relative flex flex-col p-6 sm:p-7 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#B8A8E8]/60 to-[#E8DFF5]/40 backdrop-blur-sm border border-white/40 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out hover:scale-[1.03] hover:-translate-y-2 min-h-[420px] sm:min-h-[450px] lg:min-h-[480px]"
            >
              {/* Plan Name */}
              <h3 className="font-manrope text-lg sm:text-xl lg:text-2xl font-bold text-[#05015A] mb-4 sm:mb-5 lg:mb-6 transition-colors duration-300 group-hover:text-[#6B46C1]">
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mb-4 sm:mb-5">
                <span className="font-manrope text-xl sm:text-2xl font-bold text-[#05015A] transition-all duration-300 group-hover:text-[#6B46C1]">
                  ₹ {plan.price}
                </span>
                <span className="font-manrope text-xs sm:text-sm text-gray-700 ml-1">
                  {plan.period}
                </span>
              </div>

              {/* Description - Fixed Height */}
              <p className="font-manrope text-xs sm:text-sm text-gray-700 mb-5 sm:mb-6 leading-relaxed min-h-[50px] sm:min-h-[60px] transition-colors duration-300 group-hover:text-gray-800">
                {plan.description}
              </p>

              {/* Features - Flex Grow to Push Button Down */}
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li 
                    key={i} 
                    className="flex items-start gap-2 transition-all duration-300 group-hover:translate-x-1"
                  >
                    <Check 
                      className="text-[#05015A] mt-0.5 flex-shrink-0 transition-all duration-300 group-hover:text-[#6B46C1] group-hover:scale-110" 
                      size={16} 
                    />
                    <span className="font-manrope text-xs sm:text-sm text-gray-800 transition-colors duration-300 group-hover:text-gray-900">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Button - Always at Bottom */}
              <button className="w-full py-3 sm:py-3.5 bg-[#05015A] text-white font-manrope font-semibold text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-[#6B46C1] transition-all duration-300 shadow-md hover:shadow-xl mt-auto transform hover:scale-[1.02]">
                Get Plan
              </button>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#6B46C1]/0 to-[#6B46C1]/0 group-hover:from-[#6B46C1]/10 group-hover:to-[#6B46C1]/5 transition-all duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Pricing;
