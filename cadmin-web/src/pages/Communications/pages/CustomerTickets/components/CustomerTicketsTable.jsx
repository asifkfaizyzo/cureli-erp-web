// cadmin-web/src/pages/Communications/pages/CustomerTickets/components/CustomerTicketsTable.jsx (do not remove this comment)
import React from "react";
import {
  ChevronUp,
  ChevronDown,
  Paperclip,
  Eye,
  Store,
  User,
  Phone,
} from "lucide-react";
import Pagination from "../../../../../components/common/Pagination";
import TableSkeleton from "../../../../../components/common/TableSkeleton";
import TableEmptyState from "../../../../../components/common/TableEmptyState";
import {
  getCustomerStatusConfig,
  getCustomerCategoryConfig,
} from "../../../../../config/customerTicketConfigs";

const CustomerTicketsTable = ({
  tickets,
  loading,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  totalItems,
  sortConfig,
  onSortChange,
  onViewTicket,
  hasActiveFilters,
  canViewDetail,
}) => {
  const getSortIcon = (column) => {
    if (sortConfig.sortBy !== column) return null;
    return sortConfig.order === "asc" ? (
      <ChevronUp size={14} className="text-indigo-600 inline ml-1" />
    ) : (
      <ChevronDown size={14} className="text-indigo-600 inline ml-1" />
    );
  };

  if (loading) {
    return <TableSkeleton columns={7} rows={rowsPerPage} />;
  }

  if (!tickets || tickets.length === 0) {
    return (
      <TableEmptyState
        title="No Customer Tickets Found"
        description={
          hasActiveFilters
            ? "Try adjusting your search or filters."
            : "Customer support tickets will appear here once submitted from mobile."
        }
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
            <tr>
              <th
                onClick={() => onSortChange("ticket_number")}
                className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
              >
                Ticket #{getSortIcon("ticket_number")}
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Customer
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Order & Pharmacy
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Category
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                Subject
              </th>
              <th
                onClick={() => onSortChange("status")}
                className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
              >
                Status{getSortIcon("status")}
              </th>
              <th
                onClick={() => onSortChange("created_at")}
                className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
              >
                Date{getSortIcon("created_at")}
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {tickets.map((t) => {
              const statusCfg = getCustomerStatusConfig(t.status);
              const catCfg = getCustomerCategoryConfig(t.category);

              return (
                <tr
                  key={t.ticket_id}
                  onClick={() => canViewDetail && onViewTicket(t)}
                  className={`hover:bg-indigo-50/30 transition-colors ${
                    canViewDetail ? "cursor-pointer" : ""
                  }`}
                >
                  {/* Ticket # */}
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <span>#{t.ticket_number}</span>
                      {t.attachment_count > 0 && (
                        <span className="inline-flex items-center text-xs text-gray-400">
                          <Paperclip size={12} className="ml-1" />
                          {t.attachment_count}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900 flex items-center gap-1">
                        <User size={13} className="text-gray-400" />
                        {t.customer?.full_name || "Unknown Customer"}
                      </span>
                      {t.customer?.phone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-gray-400" />
                          {t.customer.phone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Order & Shop */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-indigo-600">
                        {t.order?.order_number || "—"}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Store size={11} className="text-gray-400" />
                        {t.shop?.business_name || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                    >
                      {catCfg.label}
                    </span>
                  </td>

                  {/* Subject */}
                  <td className="py-3.5 px-4 max-w-[200px]">
                    <p className="truncate text-gray-800 font-medium">{t.subject}</p>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(t.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    {canViewDetail && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewTicket(t);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-gray-200">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default CustomerTicketsTable;