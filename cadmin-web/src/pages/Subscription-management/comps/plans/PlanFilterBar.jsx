// cadmin-web/src/pages/Subscription-management/comps/plans/PlanFilterBar.jsx (do not remove this comment)
import { Search, Filter, X, Layers, Sparkles, Tag } from "lucide-react";
import {
  PLAN_STATUS,
} from "../../../../config/modules/subscriptionConfig";

export default function PlanFilterBar({
  planTypeFilter,
  setPlanTypeFilter,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  planCounts,
}) {
  const statusFilters = [
    { key: "all", label: "All", count: planCounts.total },
    { key: PLAN_STATUS.DRAFT, label: "Draft", count: planCounts.draft },
    { key: PLAN_STATUS.ACTIVE, label: "Active", count: planCounts.active },
    {
      key: PLAN_STATUS.DEPRECATED,
      label: "Deprecated",
      count: planCounts.deprecated,
    },
    {
      key: PLAN_STATUS.SUSPENDED,
      label: "Suspended",
      count: planCounts.suspended,
    },
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Plan Type Toggle - PRE_MADE vs CUSTOM */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setPlanTypeFilter("PRE_MADE")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                planTypeFilter === "PRE_MADE"
                  ? "bg-[#05015A] text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            <Layers size={16} />
            Pre-made Plans
          </button>
          <button
            onClick={() => setPlanTypeFilter("CUSTOM")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                planTypeFilter === "CUSTOM"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }
            `}
          >
            <Sparkles size={16} />
            Custom Plans
          </button>
        </div>

        {/* Promo Stats (only for PRE_MADE) */}
        {planTypeFilter === "PRE_MADE" && planCounts.with_active_promo > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <Tag size={14} className="text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              {planCounts.with_active_promo} plan{planCounts.with_active_promo > 1 ? 's' : ''} with active promo
            </span>
          </div>
        )}
      </div>

      {/* Search and Status Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Status Filter Pills - Only show for PRE_MADE */}
        {planTypeFilter === "PRE_MADE" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={16} className="text-gray-400" />
            {statusFilters.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-200
                  ${
                    filter === key
                      ? "bg-[#05015A] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {label}
                <span
                  className={`
                    ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]
                    ${filter === key ? "bg-white/20" : "bg-gray-200"}
                  `}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-10 py-2.5 
              border border-gray-200 rounded-xl
              text-sm text-gray-700 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-[#05015A]/20 focus:border-[#05015A]
              transition-all duration-200
            "
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Info text for Custom Plans */}
        {planTypeFilter === "CUSTOM" && (
          <div className="text-sm text-gray-500 italic">
            Custom plans are created specifically for individual shops
          </div>
        )}
      </div>
    </div>
  );
}