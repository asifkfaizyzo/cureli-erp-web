// cadmin-web/src/pages/marketplace/Orders/comps/OrdersFilters.jsx (do not remove this comment)
import { Search, X } from "lucide-react";
import StyledSelect from "../../../../components/common/StyledSelect";

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PLACED", label: "Placed" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const RX_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIALLY_RESPONDED", label: "Partially Responded" },
  { value: "FULLY_RESPONDED", label: "Fully Responded" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

const FULFILLMENT_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "INSTANT_DELIVERY", label: "Instant Delivery" },
  { value: "PICKUP", label: "In-Person Pickup" },
  { value: "SAME_DAY", label: "Same Day" },
  // { value: "NEXT_DAY", label: "Next Day" },
];

const OrdersFilters = ({
  viewMode,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  fulfillmentFilter = "",
  setFulfillmentFilter = () => {},
}) => {
  const isOrders = viewMode === "orders";
  const hasActiveFilters = Boolean(
    statusFilter || (isOrders && fulfillmentFilter) || search
  );

  const handleClearFilters = () => {
    setStatusFilter("");
    setFulfillmentFilter("");
    setSearch("");
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm flex-shrink-0">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={
              isOrders
                ? "Search by Order ID, Customer, or Shop..."
                : "Search by Request ID or Customer..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 sm:h-11 pl-10 pr-10 border border-gray-300 rounded-lg text-sm 
                       bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#05015A]/20 
                       focus:border-[#05015A] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
                         text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-48 lg:w-52 flex-shrink-0">
          <StyledSelect
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={isOrders ? ORDER_STATUS_OPTIONS : RX_STATUS_OPTIONS}
            placeholder="All Statuses"
          />
        </div>

        {/* Fulfillment Filter (Orders Only) */}
        {isOrders && (
          <div className="w-full sm:w-44 lg:w-48 flex-shrink-0">
            <StyledSelect
              value={fulfillmentFilter}
              onChange={(value) => setFulfillmentFilter(value)}
              options={FULFILLMENT_OPTIONS}
              placeholder="All Types"
            />
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-3 h-10 sm:h-11 text-sm text-red-600 hover:text-red-700 
                       hover:bg-red-50 border border-red-200 rounded-lg transition-all 
                       flex items-center justify-center gap-1.5 font-medium flex-shrink-0"
            title="Clear all filters"
          >
            <X size={16} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OrdersFilters;