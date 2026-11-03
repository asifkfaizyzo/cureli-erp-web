// landing-web/src/pages/common/DeliveryPolicy.jsx (do not remove this comment)
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const DeliveryPolicy = () => {
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
          Delivery Policy
        </h1>

        <div className="text-gray-700 text-sm space-y-4 overflow-y-auto pr-2 flex-1">

          <p className="text-xs text-gray-500">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <p>
              Cureli is a fully digital pharmacy ERP software platform. We do not
              sell or ship any physical products. All services are delivered
              electronically upon successful payment and verification.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              1. Service Delivery
            </h2>
            <p>Upon successful payment through Razorpay:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Account activation is processed instantly or within 24 hours</li>
              <li>Login credentials and access details are sent to your registered email</li>
              <li>Full platform access is provided through our web application</li>
              <li>Mobile app access (if applicable) is available on Android and iOS</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              2. Delivery Timeline
            </h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong>Instant Plans:</strong> Access granted immediately after payment confirmation
              </li>
              <li>
                <strong>Verified Plans:</strong> Access granted within 24 hours after document verification
              </li>
              <li>
                <strong>Custom Enterprise Plans:</strong> Onboarding scheduled within 2–3 business days
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              3. Delivery Confirmation
            </h2>
            <p>
              A confirmation email will be sent to your registered email address once
              your account is activated. If you do not receive it within 24 hours,
              please check your spam folder or contact our support team.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              4. Failed Delivery
            </h2>
            <p>
              If payment is deducted but you do not receive access within the expected
              timeline, please contact us immediately. We will investigate and resolve
              the issue or initiate a refund as per our Refund Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              5. No Physical Shipment
            </h2>
            <p>
              Cureli does not ship any physical goods. All deliverables are digital
              in nature — including software access, documentation, and support
              resources.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              6. Contact Us
            </h2>
            <p>For delivery-related queries:</p>
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

export default DeliveryPolicy;