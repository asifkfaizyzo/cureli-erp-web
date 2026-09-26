// pharmacy-web/src/pages/settings/profile/comps/BusinessInfoCard.jsx (do not remove this comment)
// src/pages/settings/profile/comps/BusinessInfoCard.jsx

import { useState } from "react";
import {
  Building2,
  MapPin,
  FileText,
  Edit3,
  Hash,
} from "lucide-react";

import EditBusinessModal from "./EditBusinessModal";

const BusinessInfoCard = ({ shop, onUpdate }) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleModalClose = (updated) => {
    setShowEditModal(false);
    if (updated) {
      onUpdate();
    }
  };

  const formatAddress = () => {
    const parts = [
      shop.address_line_1,
      shop.address_line_2,
      shop.city,
      shop.state,
      shop.pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const InfoItem = ({ icon: Icon, label, value, note, className = "" }) => (
    <div
      className={`flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors ${className}`}
    >
      <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-[#000060]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          {note && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {note}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-gray-900 mt-0.5 break-words">
          {value || "Not provided"}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-[#000060]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Business Information
              </h2>
              <p className="text-xs text-gray-500">{shop.business_name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#000060] hover:bg-[#000060]/10 rounded-lg transition-colors"
          >
            <Edit3 size={14} />
            Edit
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Row 1: Shop Name (2 cols) + GST (2 cols) */}
            <InfoItem
              icon={Building2}
              label="Shop Name"
              value={shop.business_name}
              className="lg:col-span-2"
            />
            <InfoItem
              icon={FileText}
              label="GST Number"
              value={shop.gst_number}
              note="Cannot be changed"
              className="lg:col-span-2"
            />

            {/* Row 2: Shop ID (2 cols) + Pincode (1 col) + City (1 col) */}
            <InfoItem
              icon={Hash}
              label="Shop ID"
              value={shop.shop_id}
              note="Cannot be changed"
              className="lg:col-span-2"
            />
            <InfoItem
              icon={MapPin}
              label="Pincode"
              value={shop.pincode}
            />
            <InfoItem
              icon={MapPin}
              label="City"
              value={shop.city}
            />

            {/* Row 3: Full Address (full width) */}
            <InfoItem
              icon={MapPin}
              label="Complete Address"
              value={formatAddress()}
              className="md:col-span-2 lg:col-span-4"
            />
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditBusinessModal shop={shop} onClose={handleModalClose} />
      )}
    </>
  );
};

export default BusinessInfoCard;