// landing-web/src/pages/landingPages/contact/components/ContactFormCard.jsx (do not remove this comment)
// ContactFormCard.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { submitEnquiry } from "../../../../api/enquiries";

// Custom X (Twitter) Icon Component
const XIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ContactFormCard = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");

  const isMounted = useRef(true);
  const timeoutRef = useRef(null);

  // Social links data
  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/share/18L1w65XLr/?mibextid=wwXIfr", label: "Facebook" },
    { icon: XIcon, href: "https://x.com/cureliofficial", label: "X (Twitter)", isCustom: true },
    { icon: Instagram, href: "https://www.instagram.com/curelioffical/", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/cureli/", label: "LinkedIn" },
  ];

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (submitStatus) {
      setSubmitStatus(null);
      setSubmitMessage("");
    }
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.name = "Name is required";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (
      formData.phone &&
      formData.phone.length > 0 &&
      formData.phone.length !== 10
    ) {
      newErrors.phone = "Phone must be 10 digits";
    }

    const trimmedMessage = formData.message.trim();
    if (!trimmedMessage) {
      newErrors.message = "Message is required";
    } else if (trimmedMessage.length < 10) {
      newErrors.message = "Please enter at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) return;

      if (!executeRecaptcha) {
        setSubmitStatus("error");
        setSubmitMessage(
          "Security verification not ready. Please wait and try again."
        );
        return;
      }

      setIsSubmitting(true);
      setSubmitStatus(null);
      setSubmitMessage("");

      try {
        // Get reCAPTCHA token with timeout
        let recaptchaToken;
        try {
          recaptchaToken = await Promise.race([
            executeRecaptcha("contact_form_submit"),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("reCAPTCHA timeout")), 10000)
            ),
          ]);
        } catch {
          throw new Error("reCAPTCHA timeout");
        }

        if (!recaptchaToken) {
          throw new Error("Failed to get security token");
        }

        // Make API call
        const response = await submitEnquiry({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone || "",
          message: formData.message.trim(),
          recaptchaToken,
        });

        const result = response?.data;

        if (result?.success === true) {
          setSubmitStatus("success");

          const enquiryNumber = result?.data?.enquiry_number;
          const successMessage = enquiryNumber
            ? `Thank you! Your enquiry has been received. Our team will contact you within 24 hours.`
            : "Thank you! Your enquiry has been received. Our team will contact you within 24 hours.";

          setSubmitMessage(successMessage);

          // Reset form
          setFormData({ name: "", email: "", phone: "", message: "" });

          // Auto-clear success message after 8 seconds
          setTimeout(() => {
            setSubmitStatus(null);
            setSubmitMessage("");
          }, 8000);
        } else {
          throw new Error(result?.message || "Failed to submit enquiry");
        }
      } catch (error) {
        setSubmitStatus("error");

        // Handle specific error types
        if (error.message === "reCAPTCHA timeout") {
          setSubmitMessage(
            "Security verification timed out. Please try again."
          );
        } else if (error.response?.status === 429) {
          setSubmitMessage(
            "Too many requests. Please wait a few minutes and try again."
          );
        } else if (error.response?.status === 503) {
          setSubmitMessage(
            "Service temporarily unavailable. Please try again later."
          );
        } else if (error.response?.data?.message) {
          setSubmitMessage(error.response.data.message);
        } else if (error.message) {
          setSubmitMessage(error.message);
        } else {
          setSubmitMessage("Failed to send message. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [executeRecaptcha, formData, validateForm]
  );

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div
        className="max-w-6xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-5"
        data-aos="fade-up"
      >
        {/* Left: Form Section */}
        <div className="md:col-span-3 bg-white p-5 xs:p-6 sm:p-8 md:p-10 lg:p-12 rounded-2xl sm:rounded-3xl md:rounded-r-none">
          {/* Success Message */}
          {submitStatus === "success" && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-700 font-manrope text-sm font-medium">
                    Message Sent Successfully!
                  </p>
                  <p className="text-green-600 font-manrope text-xs mt-1">
                    {submitMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === "error" && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 font-manrope text-sm">
                {submitMessage}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5 xs:space-y-6 sm:space-y-7"
            noValidate
          >
            {/* Name */}
            <div>
              <label
                htmlFor="contact-name"
                className="block font-manrope text-xs xs:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2"
              >
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                disabled={isSubmitting}
                autoComplete="name"
                className={`w-full border-b-2 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } px-1 py-2 sm:py-2.5 font-manrope text-xs xs:text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#000060] transition-colors bg-transparent disabled:opacity-50`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1 font-manrope">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 xs:gap-6 sm:gap-8">
              <div>
                <label
                  htmlFor="contact-email"
                  className="block font-manrope text-xs xs:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2"
                >
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  autoComplete="email"
                  className={`w-full border-b-2 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } px-1 py-2 sm:py-2.5 font-manrope text-xs xs:text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#000060] transition-colors bg-transparent disabled:opacity-50`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 font-manrope">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="contact-phone"
                  className="block font-manrope text-xs xs:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2"
                >
                  Your Phone{" "}
                  <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your number"
                  disabled={isSubmitting}
                  autoComplete="tel"
                  inputMode="numeric"
                  className={`w-full border-b-2 ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  } px-1 py-2 sm:py-2.5 font-manrope text-xs xs:text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#000060] transition-colors bg-transparent disabled:opacity-50`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1 font-manrope">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor="contact-message"
                className="block font-manrope text-xs xs:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2"
              >
                Your Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="contact-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="3"
                placeholder="Enter your message"
                disabled={isSubmitting}
                className={`w-full border-b-2 ${
                  errors.message ? "border-red-500" : "border-gray-300"
                } px-1 py-2 sm:py-2.5 font-manrope text-xs xs:text-sm placeholder:text-gray-400 focus:outline-none focus:border-[#000060] transition-colors resize-none bg-transparent disabled:opacity-50`}
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1 font-manrope">
                  {errors.message}
                </p>
              )}
            </div>

            {/* reCAPTCHA Notice */}
            <p className="text-xs text-gray-400 font-manrope">
              This site is protected by reCAPTCHA and the Google{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Terms of Service
              </a>{" "}
              apply.
            </p>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !executeRecaptcha}
              className="w-full sm:w-auto px-6 xs:px-8 py-2.5 xs:py-3 bg-[#000060] text-white rounded-lg font-manrope font-semibold text-xs xs:text-sm hover:bg-[#000050] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>SENDING...</span>
                </>
              ) : (
                "SEND MESSAGE"
              )}
            </button>
          </form>
        </div>

        {/* Right: Contact Information */}
        <div
          className="md:col-span-2 relative bg-gradient-to-br from-[#000060] via-[#1a1a8f] to-[#000060] text-white p-5 xs:p-6 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-l-[2rem] lg:rounded-l-[3rem] md:rounded-r-3xl shadow-xl sm:shadow-2xl m-4 xs:m-5 md:my-5 md:mr-5 md:ml-0"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h3 className="font-manrope text-lg xs:text-xl sm:text-2xl font-bold mb-2 xs:mb-2.5 sm:mb-3">
            Contact Information
          </h3>

          <p className="font-manrope text-xs sm:text-sm text-white/70 mb-5 xs:mb-6 sm:mb-8 leading-relaxed">
            Fill up the form and our team will get back to you within 24 hours
          </p>

          <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="flex-shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="font-manrope font-semibold text-xs xs:text-sm sm:text-base mb-0.5">
                  Our Location :
                </h4>
                <p className="font-manrope text-xs sm:text-sm text-white/80 leading-relaxed">
                  Indiranagar, Bangalore North, Bangalore- 560038,
Karnataka
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="flex-shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="font-manrope font-semibold text-xs xs:text-sm sm:text-base mb-0.5">
                  Email Us :
                </h4>
                <p className="font-manrope text-xs sm:text-sm text-white/80">
                  cureliofficial@gmail.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="flex-shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center">
                <Phone className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="font-manrope font-semibold text-xs xs:text-sm sm:text-base mb-0.5">
                  Phone Number :
                </h4>
                <p className="font-manrope text-xs sm:text-sm text-white/80">
                  (+021) 117 671
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 xs:mt-8 sm:mt-10 pt-5 xs:pt-6 sm:pt-7 border-t border-white/20">
            <p className="font-manrope text-xs sm:text-sm font-medium mb-2.5 xs:mb-3 sm:mb-4">
              Follow our social media:
            </p>
            <div className="flex gap-2 xs:gap-2.5 sm:gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 xs:w-9 xs:h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300"
                  aria-label={social.label}
                >
                  {social.isCustom ? (
                    <social.icon size={14} className="xs:w-4 xs:h-4" />
                  ) : (
                    <social.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactFormCard;