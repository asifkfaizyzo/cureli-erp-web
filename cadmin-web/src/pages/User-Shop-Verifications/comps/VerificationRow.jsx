// cadmin-web/src/pages/User-Shop-Verifications/comps/VerificationRow.jsx (do not remove this comment)
// cadmin-web/src/components/Verification/VerificationRow.jsx

import { Eye } from "lucide-react";

const VerificationRow = ({
  shop,
  index,
  columnWidths,
  getStatusBadgeStyle,
  formatStatus,
  onRowClick,
}) => {
  // File count summary
  const filesApproved = shop.files_approved || 0;
  const filesRejected = shop.files_rejected || 0;
  const filesTotal = shop.files_total || 6;
  const fileCount = `${filesApproved}/${filesTotal}`;

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  return (
    <tr
      onClick={() => onRowClick?.(shop)}
      className="border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition-colors"
    >
      <td
        style={{ width: columnWidths.slNo }}
        className="px-3 py-3 text-gray-500 font-medium truncate"
      >
        {index}
      </td>

      <td
        style={{ width: columnWidths.shopName }}
        className="px-3 py-3 font-medium text-gray-900 truncate"
      >
        {shop.business_name || "N/A"}
      </td>

      <td
        style={{ width: columnWidths.shopId }}
        className="px-3 py-3 text-gray-600 text-xs font-mono truncate"
      >
        {shop.shop_id?.substring(0, 8)}...
      </td>

      <td
        style={{ width: columnWidths.ownerName }}
        className="px-3 py-3 text-gray-700 truncate"
      >
        {shop.owner_name || "N/A"}
      </td>

      <td
        style={{ width: columnWidths.email }}
        className="px-3 py-3 text-gray-600 text-sm truncate"
      >
        {shop.owner_email || "N/A"}
      </td>

      <td
        style={{ width: columnWidths.status }}
        className="px-3 py-3 text-center"
      >
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeStyle(shop.verification_status)}`}
        >
          {formatStatus(shop.verification_status)}
        </span>
      </td>

      <td
        style={{ width: columnWidths.fileCount }}
        className="px-3 py-3 text-center text-sm font-medium"
      >
        <div className="flex items-center justify-center gap-1">
          <span className="text-emerald-600 font-bold">{filesApproved}</span>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">{filesTotal}</span>
        </div>
      </td>

      <td
        style={{ width: columnWidths.resubCount }}
        className="px-3 py-3 text-center"
      >
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
            shop.resubmission_count > 0
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {shop.resubmission_count || 0}
        </span>
      </td>

      <td
        style={{ width: columnWidths.date }}
        className="px-3 py-3 text-gray-600 text-sm truncate"
      >
        {formatDate(shop.created_at)}
      </td>
    </tr>
  );
};

export default VerificationRow;
