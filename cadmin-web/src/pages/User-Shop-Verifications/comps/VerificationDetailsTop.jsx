// cadmin-web/src/pages/User-Shop-Verifications/comps/VerificationDetailsTop.jsx (do not remove this comment)
// cadmin-web/src/components/Verification/VerificationDetailsTop.jsx

import {
  Building2,
  User,
  MapPin,
  FileText,
  Phone,
  Mail,
  Hash,
  Calendar,
} from "lucide-react";

const VerificationDetailsTop = ({ shop }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const DetailRow = ({ icon: Icon, label, value, className = "" }) => (
    <div className={`flex items-start gap-3 py-3 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-800 truncate">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 size={16} />
          Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <DetailRow
            icon={Building2}
            label="Business Name"
            value={shop?.business_name}
          />
          <DetailRow
            icon={FileText}
            label="Legal Name"
            value={shop?.legal_name}
          />
          <DetailRow icon={Hash} label="GST Number" value={shop?.gst_number} />
          <DetailRow
            icon={FileText}
            label="Business Type"
            value={shop?.business_type}
          />
          <DetailRow icon={Hash} label="Shop ID" value={shop?.shop_id} />
          <DetailRow
            icon={Calendar}
            label="Registered On"
            value={formatDate(shop?.created_at)}
          />
        </div>
      </div>

      {/* Owner Information */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User size={16} />
          Owner Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <DetailRow
            icon={User}
            label="Full Name"
            value={shop?.owner?.full_name}
          />
          <DetailRow
            icon={User}
            label="Username"
            value={shop?.owner?.username ? `@${shop.owner.username}` : null}
          />
          <DetailRow
            icon={Mail}
            label="Email Address"
            value={shop?.owner?.email}
          />
          <DetailRow
            icon={Phone}
            label="Phone Number"
            value={shop?.owner?.phone_number}
          />
        </div>
      </div>

      {/* Address Information */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin size={16} />
          Business Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          <DetailRow
            icon={MapPin}
            label="Address Line 1"
            value={shop?.address_line_1}
          />
          <DetailRow icon={MapPin} label="City" value={shop?.city} />
          <DetailRow icon={MapPin} label="State" value={shop?.state} />
          <DetailRow icon={Hash} label="Pincode" value={shop?.pincode} />
        </div>
      </div>

      {/* Verification Notes */}
      {shop?.verification_notes && (
        <div className="pt-4 border-t border-gray-100">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-amber-800 mb-2">
              Verification Notes
            </h4>
            <p className="text-sm text-amber-700">{shop.verification_notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationDetailsTop;
