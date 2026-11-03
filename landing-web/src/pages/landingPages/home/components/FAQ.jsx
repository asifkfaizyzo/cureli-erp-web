// landing-web/src/pages/landingPages/home/components/FAQ.jsx (do not remove this comment)

import { useEffect, useState, useCallback, memo, useRef } from "react";
import AOS from "aos";
import { ChevronDown } from "lucide-react";

// ============================================
// CONSTANTS
// ============================================
const FAQS_DATA = [
  {
    id: 1,
    question:
      "Does Cureli allow creation of purchase orders and management of suppliers?",
    answer:
      "Yes! Cureli offers complete vendor management, purchase order creation, and detailed supplier tracking capabilities.",
  },
  {
    id: 2,
    question:
      "How does the ERP handle the billing and invoice generation process?",
    answer:
      "Our ERP delivers swift, GST-compliant billing with automated invoice creation and seamless payment tracking.",
  },
  {
    id: 3,
    question:
      "Can the system monitor expiry dates of medicines and manage batch details?",
    answer:
      "Absolutely! The system tracks batch numbers, expiry dates, and sends automated low-stock alerts.",
  },
  {
    id: 4,
    question:
      "Does Cureli support barcode and QR code scanning directly at the billing counter?",
    answer:
      "Yes, Cureli is fully compatible with both barcode and QR code scanning for fast, error-free billing.",
  },
  {
    id: 5,
    question:
      "Is GST automatically applied and calculated within the billing module?",
    answer:
      "Yes, every invoice is fully GST-compliant with built-in tax calculations and complete HSN code support.",
  },
  {
    id: 6,
    question: "Can I view detailed reports and track business analytics?",
    answer:
      "Yes, access comprehensive sales reports, inventory insights, tax summaries, and actionable business performance data.",
  },
  {
    id: 7,
    question:
      "Is the software manageable and easy to navigate for non-technical pharmacy staff?",
    answer:
      "Absolutely! Our simple, intuitive interface is built for everyday ease of use, backed by full training and support.",
  },
];

// ============================================
// FAQ ITEM COMPONENT
// ============================================
const FAQItem = memo(({ faq, index, isOpen, onToggle }) => {
  const answerRef = useRef(null);
  const [height, setHeight] = useState(0);

  // Calculate actual content height for smooth animation
  useEffect(() => {
    if (answerRef.current) {
      setHeight(answerRef.current.scrollHeight);
    }
  }, [isOpen]);

  return (
    <div
      className={`group bg-white border rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 ease-out ${
        isOpen
          ? "border-[#4B3B8F]/40 shadow-lg shadow-[#4B3B8F]/5"
          : "border-gray-200 shadow-sm hover:shadow-md hover:border-[#4B3B8F]/20"
      }`}
      style={{
        animation: `fadeSlideUp 0.5s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* Question Button */}
      <button
        onClick={() => onToggle(index)}
        className="w-full flex justify-between items-center text-left gap-4 px-5 py-4 sm:px-6 sm:py-5 md:px-7 md:py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4B3B8F]/50 focus-visible:ring-offset-2 rounded-xl sm:rounded-2xl"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${faq.id}`}
      >
        {/* Question Number & Text */}
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Number Badge */}
          <span
            className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-500 ${
              isOpen
                ? "bg-[#4B3B8F] text-white"
                : "bg-[#4B3B8F]/10 text-[#4B3B8F] group-hover:bg-[#4B3B8F]/20"
            }`}
          >
            {String(index + 1).padStart(2, "0")}
          </span>

          {/* Question Text */}
          <h3
            className={`font-manrope text-sm sm:text-base md:text-lg font-semibold leading-snug transition-colors duration-300 ${
              isOpen
                ? "text-[#4B3B8F]"
                : "text-gray-900 group-hover:text-[#4B3B8F]"
            }`}
          >
            {faq.question}
          </h3>
        </div>

        {/* Chevron Icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
            isOpen
              ? "bg-[#4B3B8F] text-white"
              : "bg-gray-100 text-gray-600 group-hover:bg-[#4B3B8F]/10 group-hover:text-[#4B3B8F]"
          }`}
        >
          <ChevronDown
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-500 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </button>

      {/* Answer Section - Using measured height for smooth animation */}
      <div
        id={`faq-answer-${faq.id}`}
        className="overflow-hidden transition-all duration-500 ease-out"
        style={{
          maxHeight: isOpen ? `${height}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div
          ref={answerRef}
          className="px-5 pb-5 sm:px-6 sm:pb-6 md:px-7 md:pb-6 pl-14 sm:pl-16 md:pl-[4.5rem]"
        >
          {/* Animated Line */}
          <div
            className={`h-px bg-gradient-to-r from-[#4B3B8F]/30 via-[#4B3B8F]/10 to-transparent mb-4 transition-all duration-700 origin-left ${
              isOpen ? "scale-x-100" : "scale-x-0"
            }`}
          />

          {/* Answer Text */}
          <p
            className={`font-manrope text-sm sm:text-base text-gray-600 leading-relaxed transition-all duration-500 delay-100 ${
              isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
});

FAQItem.displayName = "FAQItem";

// ============================================
// SECTION HEADER COMPONENT
// ============================================
const SectionHeader = memo(() => (
  <header className="text-center mb-10 sm:mb-12 md:mb-14 lg:mb-16">
    {/* Title */}
    <h2
      className="font-manrope text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-semibold text-[#4B3B8F] mb-3 sm:mb-4 px-4"
      data-aos="fade-up"
    >
      Frequently Asked Questions
    </h2>

    {/* Subtitle */}
    <p
      className="font-manrope text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed"
      data-aos="fade-up"
      data-aos-delay="150"
    >
      Have questions about Cureli and its suitability for your pharmacy? We get
      these questions most often from pharmacists and owners considering our
      solution for their pharmacies.
    </p>
  </header>
));

SectionHeader.displayName = "SectionHeader";

// ============================================
// MAIN FAQ COMPONENT
// ============================================
const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    // Add FAQ entrance animation keyframes
    const styleSheet = document.createElement("style");
    styleSheet.id = "faq-animations";
    styleSheet.textContent = `
      @keyframes fadeSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(styleSheet);

    return () => {
      const existing = document.getElementById("faq-animations");
      if (existing) document.head.removeChild(existing);
    };
  }, []);

  const toggleFAQ = useCallback((index) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index));
  }, []);

  return (
    <section
      id="faq"
      className="py-16 xs:py-20 sm:py-24 md:py-28 lg:py-32 overflow-hidden"
      style={{ backgroundColor: "#E8EFF7" }}
      aria-labelledby="faq-heading"
    >
      <div className="max-w-4xl xl:max-w-5xl mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10">
        {/* Section Header */}
        <SectionHeader />

        {/* FAQ Accordion - No AOS on individual items */}
        <div className="space-y-3 sm:space-y-4" role="list">
          {FAQS_DATA.map((faq, index) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={toggleFAQ}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-10 sm:mt-12 md:mt-14 text-center"
          style={{
            animation: `fadeSlideUp 0.5s ease-out ${FAQS_DATA.length * 0.08 + 0.2}s both`,
          }}
        >
          <p className="text-gray-600 text-sm sm:text-base mb-4">
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 bg-[#4B3B8F] text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg shadow-[#4B3B8F]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#4B3B8F]/30 hover:scale-105 hover:-translate-y-0.5"
          >
            <span>Contact Us</span>
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
