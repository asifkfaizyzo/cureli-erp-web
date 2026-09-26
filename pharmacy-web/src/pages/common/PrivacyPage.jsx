// pharmacy-web/src/pages/common/PrivacyPage.jsx (do not remove this comment)
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const PrivacyPage = () => {
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
          Privacy Policy
        </h1>

        {/* Scrollable content */}
        <div className="text-gray-700 text-sm space-y-4 overflow-y-auto pr-2 flex-1">
          <p className="text-xs text-gray-500">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              1. Introduction
            </h2>
            <p>
              Cureli ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our pharmacy
              management platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              2. Information We Collect
            </h2>
            <p>We collect several types of information:</p>

            <h3 className="font-semibold mt-3 mb-1">Personal Information</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Name (first and last)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Username and password</li>
            </ul>

            <h3 className="font-semibold mt-3 mb-1">Business Information</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Business name and type</li>
              <li>Business address</li>
              <li>GST number</li>
              <li>Drug license details</li>
              <li>Pharmacy registration documents</li>
              <li>Business registration proof</li>
              <li>PAN card information</li>
            </ul>

            <h3 className="font-semibold mt-3 mb-1">Technical Information</h3>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              3. How We Use Your Information
            </h2>
            <p>We use the collected information for:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Creating and managing your account</li>
              <li>Verifying your business credentials</li>
              <li>Providing and maintaining our services</li>
              <li>Sending verification codes and notifications</li>
              <li>Communicating with you about updates and support</li>
              <li>Improving our platform and user experience</li>
              <li>Complying with legal obligations</li>
              <li>Preventing fraud and ensuring security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              4. Information Sharing
            </h2>
            <p>
              We do not sell your personal information. We may share your data
              with:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>
                <strong>Service Providers:</strong> Vendors who assist in
                providing our services (email, SMS, cloud storage, etc.)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to
                protect our rights
              </li>
              <li>
                <strong>Business Transfers:</strong> During mergers,
                acquisitions, or asset sales
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              5. Data Security
            </h2>
            <p>
              We implement technical and organizational measures to protect your
              data, including:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Encryption</li>
              <li>Secure password hashing</li>
              <li>Access controls and authentication</li>
              <li>Regular audits</li>
              <li>HTTPS for secure transmission</li>
            </ul>
            <p className="mt-2">
              No method of internet transmission is 100% secure. We cannot
              guarantee absolute protection.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              6. Data Retention
            </h2>
            <p>
              We retain data as long as your account is active or required for
              business/legal purposes. Incomplete registrations may be removed
              after 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              7. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Access data</li>
              <li>Correct inaccuracies</li>
              <li>Request deletion</li>
              <li>Object to processing</li>
              <li>Request portability</li>
              <li>Withdraw consent anytime</li>
            </ul>
            <p className="mt-2">
              Contact: privacy@cureli.com
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              8. Cookies and Tracking
            </h2>
            <p>
              We use cookies to enhance experience, analyze usage, and maintain
              security. Disabling them may impact functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              9. Third-Party Services
            </h2>
            <p>
              Our platform may include integrations (Google Sign-In, reCAPTCHA).
              We are not responsible for third-party privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              10. Children's Privacy
            </h2>
            <p>
              Cureli is not intended for individuals under 18. We do not
              knowingly collect such data; if found, it will be deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              11. Changes to This Policy
            </h2>
            <p>
              Updates will be posted here with a new date. Continued use means
              acceptance of changes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#000060] mb-2">
              12. Contact Us
            </h2>
            <p>
              <strong>Email:</strong> privacy@cureli.com<br />
              <strong>Phone:</strong> +91 8025043217<br />
              <strong>Address:</strong> Karnataka, India
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPage;
