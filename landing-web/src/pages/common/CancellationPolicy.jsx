// landing-web/src/pages/common/CancellationPolicy.jsx (do not remove this comment)
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const CancellationPolicy = () => {
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
          Cancellation Policy
        </h1>

        <div className="text-gray-700 text-sm space-y-4 overflow-y-auto pr-2 flex-1">

          <p className="text-xs text-gray-500">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <p>
              At Cureli, we offer flexible subscription plans for our pharmacy ERP
              platform. You may cancel your subscription at any time. This policy
              explains how cancellations work and what to expect after cancellation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              1. How to Cancel
            </h2>
            <p>You can cancel your subscription by:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Logging into your Cureli dashboard and navigating to Subscription Settings</li>
              <li>Clicking "Cancel Subscription" and confirming your request</li>
              <li>Alternatively, emailing us at <strong>support@curelihealth.com</strong> with your cancellation request</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              2. Effect of Cancellation
            </h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Cancellation immediately stops any future billing</li>
              <li>You retain full access to the platform until the end of your current billing period</li>
              <li>After the billing period ends, your account will be downgraded or deactivated</li>
              <li>Your data will be retained for 30 days after cancellation before permanent deletion</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              3. Cancellation and Refunds
            </h2>
            <p>
              Cancelling your subscription does not automatically qualify you for a
              refund of the current billing cycle. Refunds are only issued under
              conditions specified in our Refund Policy. Please review it for
              eligibility details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              4. Auto-Renewal
            </h2>
            <p>
              All Cureli subscriptions are set to auto-renew by default. To avoid
              being charged for the next billing cycle, you must cancel your
              subscription at least <strong>24 hours before</strong> your renewal date.
              Payments processed through Razorpay follow this schedule.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              5. Reactivation
            </h2>
            <p>
              You may reactivate your subscription at any time by selecting a plan
              from our pricing page and completing a new payment. Previous data
              may be restored if reactivated within the 30-day retention window.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              6. Account Termination by Cureli
            </h2>
            <p>
              Cureli reserves the right to terminate or suspend accounts that violate
              our Terms and Conditions. In such cases, no refund will be issued for
              the remaining subscription period.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              7. Contact Us
            </h2>
            <p>For cancellation-related support:</p>
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

export default CancellationPolicy;