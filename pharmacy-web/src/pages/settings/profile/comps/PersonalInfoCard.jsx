// pharmacy-web/src/pages/settings/profile/comps/PersonalInfoCard.jsx (do not remove this comment)
// Q:\YourZeroesAndOnes\cureli\curely_erp\pharmacy-web\src\pages\settings\profile\comps\PersonalInfoCard.jsx

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Calendar, Edit3, AtSign } from "lucide-react";

import ChangeEmailModal from "./ChangeEmailModal";
import ChangePhoneModal from "./ChangePhoneModal";
import ChangePasswordModal from "./ChangePasswordModal";

/**
 * PersonalInfoCard
 * Displays personal information with edit options - Horizontal Layout
 */
const PersonalInfoCard = ({ user, onUpdate }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPhone = (phone) => {
    if (!phone) return "Not set";
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  };

  const handleModalClose = (updated) => {
    setShowEmailModal(false);
    setShowPhoneModal(false);
    setShowPasswordModal(false);
    if (updated) {
      onUpdate();
    }
  };

  // Info item component for consistent styling
  const InfoItem = ({ icon: Icon, label, value, editable, onEdit }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-[#000060]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {value}
          </p>
        </div>
      </div>
      {editable && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#000060] bg-[#000060]/5 hover:bg-[#000060]/10 rounded-lg transition-colors flex-shrink-0 ml-3"
        >
          <Edit3 size={12} />
          Change
        </button>
      )}
    </div>
  );

  return (
    <>
      <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <User size={20} className="text-[#000060]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h2>
              <p className="text-xs text-gray-500">
                {user.full_name} • @{user.username}
              </p>
            </div>
          </div>
        </div>

        {/* Content - Horizontal Grid */}
        <div className="p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Full Name - View Only */}
            <InfoItem icon={User} label="Full Name" value={user.full_name} />

            {/* Username - View Only */}
            <InfoItem icon={AtSign} label="Username" value={user.username} />

            {/* Email - Editable */}
            <InfoItem
              icon={Mail}
              label="Email Address"
              value={user.email || "Not set"}
              editable
              onEdit={() => setShowEmailModal(true)}
            />

            {/* Phone - Editable */}
            <InfoItem
              icon={Phone}
              label="Phone Number"
              value={formatPhone(user.phone_number)}
              editable
              onEdit={() => setShowPhoneModal(true)}
            />

            {/* Password - Editable */}
            <InfoItem
              icon={Lock}
              label="Password"
              value="••••••••••••"
              editable
              onEdit={() => setShowPasswordModal(true)}
            />

            {/* Member Since - View Only */}
            <InfoItem
              icon={Calendar}
              label="Member Since"
              value={formatDate(user.created_at)}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={user.email}
          onClose={handleModalClose}
        />
      )}

      {showPhoneModal && (
        <ChangePhoneModal
          currentPhone={user.phone_number}
          onClose={handleModalClose}
        />
      )}

      {showPasswordModal && <ChangePasswordModal onClose={handleModalClose} />}
    </>
  );
};

export default PersonalInfoCard;
