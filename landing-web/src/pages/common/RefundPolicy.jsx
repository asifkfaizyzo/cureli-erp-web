// landing-web/src/pages/common/RefundPolicy.jsx (do not remove this comment)
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col items-center py-6 px-4 font-poppins overflow-hidden">

      <div className="w-full max-w-4xl mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#000060] hover:underline"
        >
          <IoArrowBack />
          Back
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8 h-[85vh] flex flex-col"
      >
        <h1 className="text-3xl font-bold text-[#000060] mb-4">
          Refund Policy
        </h1>

        <div className="text-gray-700 text-sm space-y-4 overflow-y-auto pr-2 flex-1">

          <p className="text-xs text-gray-500">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <p>
              Cureli is a subscription-based pharmacy ERP platform. All payments
              are processed securely through Razorpay. We aim to ensure complete
              customer satisfaction; however, refunds are applicable only under
              specific conditions outlined below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              1. Refund Eligibility
            </h2>
            <p>You may be eligible for a refund in the following cases:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Duplicate or accidental payment made for the same subscription</li>
              <li>Technical failure on our end preventing service access after payment</li>
              <li>Payment successfully debited but account not activated within 24 hours</li>
              <li>Incorrect amount charged due to a platform error</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              2. Non-Refundable Cases
            </h2>
            <p>Refunds will not be issued in the following situations:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Subscription has been activated and service has been used</li>
              <li>Partial usage of the subscription period</li>
              <li>Failure to cancel subscription before the next billing cycle</li>
              <li>Change of mind after successful account activation</li>
              <li>Violation of our Terms and Conditions leading to account termination</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              3. How to Request a Refund
            </h2>
            <p>To initiate a refund request:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Email us at <strong>support@curelihealth.com</strong> with your registered email and payment details</li>
              <li>Include your Razorpay Payment ID or Order ID</li>
              <li>Describe the reason for the refund request clearly</li>
              <li>Our team will review and respond within 2 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              4. Refund Processing
            </h2>
            <p>
              Approved refunds will be processed within <strong>7 business days</strong> to
              the original payment method used during purchase. Refunds are initiated
              through Razorpay and may take additional time depending on your bank or
              card issuer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              5. Subscription Cancellation and Refunds
            </h2>
            <p>
              Cancelling your subscription stops future billing but does not automatically
              qualify for a refund of the current billing period. Please refer to our
              Cancellation Policy for more details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              6. Contact Us
            </h2>
            <p>For refund-related queries, reach out to us:</p>
            <p className="mt-2">
              <strong>Email:</strong> support@curelihealth.com<br />
              <strong>Phone:</strong> +91 7356020940<br />
              <strong>Business Hours:</strong> Monday – Saturday, 9:00 AM – 6:00 PM IST
            </p>
          </section>

        </div>
      </motion.div>
    </div>
  );
};

export default RefundPolicy;