// cadmin-web/src/pages/shops-management/comps/tabs/ShopOverviewTab.jsx (do not remove this comment)
import { Building2, User, Shield, MapPin } from "lucide-react";
import DetailRow from "../../../../components/common/DetailRow";

const ShopOverviewTab = ({ shop }) => {
  if (!shop) return null;

  const owner = shop.owner;

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">

      {/* Business Information */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 size={16} />
          Business Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <DetailRow label="Shop ID" value={shop.shop_id} isEditing={false} />
          <DetailRow label="Business Name" value={shop.business_name} isEditing={false} />
          <DetailRow label="GST Number" value={shop.gst_number || "Not provided"} isEditing={false} />
          <DetailRow label="Business Type" value={shop.business_type || "N/A"} isEditing={false} />
          <DetailRow
            label="Verification Status"
            value={shop.verification_status}
            isEditing={false}
            type="verification"
          />
          <DetailRow
            label="Active Status"
            value={shop.is_active ? "Active" : "Inactive"}
            isEditing={false}
            type="status"
          />
        </div>

        {shop.verification_notes && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700">
              <strong>Verification Note:</strong> {shop.verification_notes}
            </p>
          </div>
        )}
      </div>

      {/* Owner Information */}
      {owner && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={16} />
            Owner Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow label="Full Name" value={owner.full_name} isEditing={false} />
            <DetailRow label="Username" value={owner.username ? `@${owner.username}` : "N/A"} isEditing={false} />
            <DetailRow label="Email" value={owner.email} isEditing={false} />
            <DetailRow label="Phone" value={owner.phone_number || "N/A"} isEditing={false} />
            <DetailRow label="Role" value={owner.role || "Super Admin"} isEditing={false} />
            <DetailRow
              label="Owner Status"
              value={owner.is_active ? "Active" : "Inactive"}
              isEditing={false}
              type="status"
            />
          </div>
        </div>
      )}

      {/* Business Address (Moved from Address Tab + simplified) */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin size={16} />
          Business Address
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <DetailRow label="Address" value={shop.address_line_1 || "N/A"} isEditing={false} />
          <DetailRow label="City" value={shop.city || "N/A"} isEditing={false} />
          <DetailRow label="State" value={shop.state || "N/A"} isEditing={false} />
          <DetailRow label="Pincode" value={shop.pincode || "N/A"} isEditing={false} />
        </div>
      </div>

      {/* Dates Only (Stats removed) */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield size={16} />
          Important Dates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <DetailRow label="Created At" value={formatDate(shop.created_at)} isEditing={false} />
          <DetailRow label="Last Updated" value={formatDateTime(shop.updated_at)} isEditing={false} />
        </div>
      </div>

    </div>
  );
};

export default ShopOverviewTab;
