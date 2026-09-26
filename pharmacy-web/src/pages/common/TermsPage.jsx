// pharmacy-web/src/pages/common/TermsPage.jsx (do not remove this comment)
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col items-center py-6 px-4 font-poppins overflow-hidden">
      
      {/* Back Button */}
      <div className="w-full max-w-4xl mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#000060] hover:underline"
        >
          <IoArrowBack />
          Back
        </button>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-xl shadow-md p-8 h-[85vh] flex flex-col"
      >
        <h1 className="text-3xl font-bold text-[#000060] mb-4">
          Terms and Conditions
        </h1>

        {/* Scrollable content */}
        <div className="text-gray-700 text-sm space-y-4 overflow-y-auto pr-2 flex-1">
          <p className="text-xs text-gray-500">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing and using Cureli's pharmacy management platform, you
              agree to be bound by these Terms and Conditions. If you do not
              agree with any part of these terms, you may not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              2. User Accounts
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your
              account credentials. You agree to accept responsibility for all
              activities that occur under your account. You must notify us
              immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              3. Business Verification
            </h2>
            <p>
              All pharmacy businesses registered on Cureli must provide valid
              documentation including drug licenses, pharmacy registration,
              business registration proof, and GST information. We reserve the
              right to verify all submitted documents and reject applications
              that do not meet our requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              4. Permitted Use
            </h2>
            <p>
              You agree to use Cureli's platform only for lawful purposes and in
              accordance with these Terms. You may not:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Use the platform in any way that violates applicable laws</li>
              <li>Attempt to gain unauthorized access to any part of the platform</li>
              <li>Interfere with or disrupt the platform's operation</li>
              <li>Upload false, misleading, or fraudulent information</li>
              <li>Impersonate another person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              5. Data and Privacy
            </h2>
            <p>
              Your use of Cureli is also governed by our Privacy Policy. We
              collect, store, and process your personal and business data in
              accordance with applicable data protection laws. By using our
              platform, you consent to such processing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              6. Intellectual Property
            </h2>
            <p>
              All content, features, and functionality on Cureli, including but
              not limited to text, graphics, logos, and software, are the
              property of Cureli and are protected by copyright, trademark, and
              other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              7. Service Availability
            </h2>
            <p>
              We strive to ensure Cureli is available 24/7, but we do not
              guarantee uninterrupted access. We reserve the right to suspend or
              terminate the service for maintenance, updates, or any other
              reason without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              8. Payment and Fees
            </h2>
            <p>
              Certain features of Cureli may require payment of fees. All fees
              are non-refundable unless otherwise stated. We reserve the right
              to change our pricing at any time with reasonable notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Cureli shall not be liable
              for any indirect, incidental, special, or consequential damages
              arising out of or related to your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              10. Account Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account at any
              time if we believe you have violated these Terms or engaged in
              fraudulent or illegal activity. Incomplete registrations may be
              automatically deleted after 30 days of inactivity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              11. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes
              will be effective immediately upon posting. Your continued use of
              Cureli after changes are posted constitutes acceptance of the
              modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              12. Contact Information
            </h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <p className="mt-2">
              <strong>Email:</strong> support@cureli.com<br />
              <strong>Phone:</strong> +91 8025043217
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsPage;
