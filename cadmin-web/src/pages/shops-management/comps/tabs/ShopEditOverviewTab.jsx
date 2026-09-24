// cadmin-web/src/pages/shops-management/comps/tabs/ShopEditOverviewTab.jsx (do not remove this comment)
import { Building2, User, MapPin, AlertTriangle } from "lucide-react";
import DetailRow from "../../../../components/common/DetailRow";

const BUSINESS_TYPES = [
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership" },
  { value: "Private Limited", label: "Private Limited" },
  { value: "LLP", label: "LLP" },
];

const ShopEditOverviewTab = ({ shop, formData, onFormChange }) => {
  if (!shop) return null;

  const owner = shop.owner;

  return (
    <div className="space-y-6">
      {/* Editable Business Information */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 size={16} />
          Business Information
          <span className="text-xs text-indigo-500 font-normal ml-2">
            (Editing)
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {/* Read-only fields */}
          <DetailRow
            label="Shop ID"
            value={shop.shop_id}
            isEditing={false}
          />
          <DetailRow
            label="Business Name"
            value={formData.business_name}
            isEditing={true}
            fieldName="business_name"
            onChange={(val) => onFormChange("business_name", val)}
          />

          <DetailRow
            label="GST Number"
            value={formData.gst_number}
            isEditing={true}
            fieldName="gst_number"
            onChange={(val) => onFormChange("gst_number", val)}
          />

          <DetailRow
            label="Business Type"
            value={formData.business_type}
            isEditing={true}
            fieldName="business_type"
            type="select"
            options={BUSINESS_TYPES}
            onChange={(val) => onFormChange("business_type", val)}
          />

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

        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            Changing business details may require re-verification. Verification
            status cannot be edited manually.
          </p>
        </div>
      </div>

      {/* Editable Address Section — moved into Overview */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin size={16} />
          Business Address
          <span className="text-xs text-indigo-500 font-normal ml-2">
            (Editing)
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div className="md:col-span-2">
            <DetailRow
              label="Address"
              value={formData.address_line_1}
              isEditing={true}
              fieldName="address_line_1"
              onChange={(val) => onFormChange("address_line_1", val)}
            />
          </div>

          <DetailRow
            label="City"
            value={formData.city}
            isEditing={true}
            fieldName="city"
            onChange={(val) => onFormChange("city", val)}
          />

          <DetailRow
            label="State"
            value={formData.state}
            isEditing={true}
            fieldName="state"
            type="text"
            onChange={(val) => onFormChange("state", val)}
          />

          <DetailRow
            label="Pincode"
            value={formData.pincode}
            isEditing={true}
            fieldName="pincode"
            onChange={(val) => onFormChange("pincode", val)}
          />
        </div>
      </div>

      {/* Owner Information (Read only) */}
      {owner && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User size={16} />
            Owner Information
            <span className="text-xs text-gray-400 font-normal ml-2">
              (Read Only)
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow
              label="Full Name"
              value={owner.full_name}
              isEditing={false}
            />
            <DetailRow label="Email" value={owner.email} isEditing={false} />
            <DetailRow
              label="Username"
              value={owner.username ? `@${owner.username}` : "N/A"}
              isEditing={false}
            />
            <DetailRow
              label="Phone"
              value={owner.phone_number || "N/A"}
              isEditing={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopEditOverviewTab;
