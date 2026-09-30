import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center py-6 px-4 font-sans">
      {/* Back Button */}
      <div className="w-full max-w-4xl mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#000060] hover:underline font-semibold"
        >
          <IoArrowBack size={18} />
          Back
        </button>
      </div>

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-xl shadow-md p-6 md:p-8 flex flex-col"
      >
        <h1 className="text-3xl font-bold text-[#000060] mb-2">
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-500 mb-6">
          Last Updated: {new Date().toLocaleDateString()}
        </p>

        {/* Scrollable Content Container */}
        <div className="text-gray-700 text-sm space-y-6 overflow-y-auto pr-2 max-h-[70vh]">
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-bold text-[#000060] mb-2">
              1. Introduction & Scope
            </h2>
            <p className="leading-relaxed">
              Cureli ("we," "our," or "us") is committed to protecting your
              privacy. This Privacy Policy applies to all services and platforms
              within the Cureli healthcare ecosystem, including the{" "}
              <strong>Cureli Customer Mobile Application</strong>, the{" "}
              <strong>Cureli ERP Platform</strong>, and the{" "}
              <strong>
                Cureli Rider Mobile Application (Delivery Partner App)
              </strong>
              . This policy explains how we collect, process, utilize, share,
              and protect your data.
            </p>
          </section>

          {/* Section 2 - PROMINENT LOCATION DISCLOSURE (Critical for Play Store Approval) */}
          <section className="bg-blue-50 p-5 rounded-lg border border-blue-200">
            <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
              2. Prominent Disclosure: Location Data Collection (Cureli Rider
              App)
            </h2>
            <p className="font-semibold text-blue-950 mb-3 leading-relaxed">
              The Cureli Rider mobile application collects and processes precise
              location data (GPS coordinates) to facilitate medicine dispatch,
              delivery routing, and order fulfillment.
            </p>
            <ul className="list-disc list-inside space-y-2 text-blue-900 leading-relaxed ml-2">
              <li>
                <strong>Background Location Access:</strong> Precise location is
                collected
                <strong>
                  {" "}
                  both in the foreground and in the background
                </strong>{" "}
                (even when the application is minimized, closed, not actively
                being interacted with, or when the mobile device screen is
                locked).
              </li>
              <li>
                <strong>Purpose of Background Location:</strong> Background
                location tracking is vital for calculating real-time Estimated
                Times of Arrival (ETAs) for pharmacies and customers, detecting
                geofenced entry/exit milestones at pharmacy pickup points and
                customer drop-off locations, and keeping the tracking continuous
                while the delivery partner uses external navigation systems
                (like Google Maps).
              </li>
              <li>
                <strong>How to Turn Off:</strong> Location tracking is only
                active when a delivery partner manually switches their status to
                "Online" and stops completely when they toggle their status to
                "Offline" or log out.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-lg font-bold text-[#000060] mb-2">
              3. Information We Collect
            </h2>
            <p className="mb-3 leading-relaxed">
              We collect several types of information across our services:
            </p>

            <div className="space-y-4 pl-2">
              <div>
                <h3 className="font-bold text-gray-900">
                  A. Personal Information
                </h3>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>
                    Full name, email address, phone number, and physical/billing
                    addresses.
                  </li>
                  <li>
                    Account login credentials, usernames, passwords, and
                    security PINs.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  B. Delivery Partner Verification Details (Riders Only)
                </h3>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>
                    <strong>Government IDs & KYC Documents:</strong> Aadhaar
                    Card, PAN Card, Driving License, and Vehicle Registration
                    Certificate (RC).
                  </li>
                  <li>
                    <strong>Live Selfies & Photos:</strong> Captured via camera
                    for identity validation, profile pictures, and fraud
                    prevention during onboarding.
                  </li>
                  <li>
                    <strong>Financial Information:</strong> Bank account
                    numbers, IFSC codes, and UPI IDs to process delivery
                    earnings, tips, and incentive payouts.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  C. Pharmacy & Business Operational Data
                </h3>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>
                    Pharmacy trade names, commercial registration proofs, and
                    drug license numbers.
                  </li>
                  <li>
                    Invoices, billing details, drug inventory records, and
                    digital prescriptions.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  D. Technical & Device Data
                </h3>
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>
                    IP address, device hardware models, OS versions, and push
                    notification tokens (FCM tokens).
                  </li>
                  <li>
                    In-app activity logs, system performance metrics, and
                    telemetry data.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-lg font-bold text-[#000060] mb-2">
              4. How We Use Your Information
            </h2>
            <p className="mb-2 leading-relaxed">
              We utilize collected data for the following purposes:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1.5 leading-relaxed">
              <li>
                Configuring, securing, and maintaining user and rider accounts.
              </li>
              <li>
                Performing identity verification, background checks, and KYC
                evaluations.
              </li>
              <li>
                Providing active delivery dispatches and matching riders with
                optimal pharmacy orders.
              </li>
              <li>
                Displaying live route progress and ETAs to customers and
                pharmacies.
              </li>
              <li>
                Calculating, tracking, and distributing financial earnings and
                payouts to delivery partners.
              </li>
              <li>
                Securing medicine handovers utilizing dynamic in-app OTP
                validations.
              </li>
              <li>
                Communicating critical service updates, legal disclosures, and
                system alerts.
              </li>
              <li>
                Mitigating security threats, fraud, policy violations, and
                platform abuse.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-lg font-bold text-[#000060] mb-2">
              5. How Information is Shared
            </h2>
            <p className="mb-2 leading-relaxed">
              We respect user privacy and do not sell your personal data.
              Sharing occurs strictly under operational conditions:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1.5 leading-relaxed">
              <li>
                <strong>Rider-to-Customer & Pharmacy:</strong> Active delivery
                partners have their precise live location, profile photo, and
                phone number shared with the respective pharmacy and receiving
                customer for safety and progress verification.
              </li>
              <li>
                <strong>Third-Party Integrations:</strong> Infrastructure
                providers such as database hosts, SMS channels (OTP dispatch),
                payment interfaces, and the Google Maps API (used for route
                rendering).
              </li>
              <li>
                <strong>Legal Compliance:</strong> Sharing with government
                regulators or law enforcement when legally required.
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-lg font-bold text-[#000060] mb-2">
              6. Data Security
            </h2>
            <p className="leading-relaxed">
              All payload transfers across our systems are encrypted using
              industry-standard TLS/HTTPS protocols. Sensitive records (such as
              identity papers, selfie photos, and bank coordinates) are isolated
              in cloud environments using role-based restricted access controls.
              No internet medium is 100% secure, but we enforce multiple
              defenses to protect your data.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold text-[#000060] mb-2">
              7. Retention & Account/Data Deletion Rights
            </h2>
            <p className="mb-3 leading-relaxed">
              We retain account data for as long as your profile remains active,
              or as required by Indian taxation, corporate, or financial
              regulations.
            </p>
            <p className="leading-relaxed">
              All registered users, customers, and delivery partners have the
              right to request deletion of their account and associated data.
              You can submit a deletion request by visiting our Contact Page at{" "}
              <a
                href="https://curelihealth.com/contact"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline font-semibold"
              >
                https://curelihealth.com/contact
              </a>{" "}
              or by writing to us directly at{" "}
              <a
                href="mailto:info@curelihealth.com"
                className="text-blue-600 hover:underline font-semibold"
              >
                info@curelihealth.com
              </a>
              .
            </p>
            <p className="mt-2 leading-relaxed">
              Upon request processing and identity validation, your profile,
              upload archives (Aadhaar, PAN, DL), selfie photos, and precise
              location histories will be completely deleted from our active
              servers within 30 days.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-lg font-bold text-[#000060] mb-2">
              8. Children's Privacy
            </h2>
            <p className="leading-relaxed">
              The Cureli platform is restricted to individuals aged 18 and
              older. We do not knowingly process details of individuals under
              the age of 18. If we detect such files, they are purged
              immediately.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-lg font-bold text-[#000060] mb-2">
              9. Contact Information
            </h2>
            <p className="mb-2 leading-relaxed">
              For questions, feedback, or exercising deletion rights, contact
              our privacy desk:
            </p>
            <div className="mt-2 pl-4 border-l-4 border-[#000060] space-y-1">
              <p className="font-semibold text-gray-950">
                Cureli Healthcare India
              </p>
              <p>
                <strong>Email:</strong> info@curelihealth.com
              </p>
              <p>
                <strong>Phone:</strong> +91 7356020940
              </p>
              <p>
                <strong>Address:</strong> Bangalore, Karnataka, India
              </p>
              <p>
                <strong>Website:</strong>{" "}
                <a
                  href="https://curelihealth.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  https://curelihealth.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPage;
