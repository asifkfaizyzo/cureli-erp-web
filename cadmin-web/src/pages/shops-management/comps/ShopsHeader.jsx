// cadmin-web/src/pages/shops-management/comps/ShopsHeader.jsx (do not remove this comment)
// src/components/Shops/ShopsHeader.jsx

import { Search, X, Download, FileSpreadsheet } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import StyledSelect from "../../../components/common/StyledSelect";
import StyledDateFilter from "../../../components/common/StyledDateFilter";
import { useToast } from "../../../components/common/Toast";

const ShopsHeader = ({
  searchText,
  setSearchText,
  verificationFilter,
  setVerificationFilter,
  subscriptionFilter,
  setSubscriptionFilter,
  activeFilter,
  setActiveFilter,
  dateFilter,
  setDateFilter,
  shops = [],
  totalItems = 0,
}) => {
  const toast = useToast();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const exportMenuRef = useRef(null);

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters =
    !!verificationFilter ||
    !!subscriptionFilter ||
    !!activeFilter ||
    !!dateFilter ||
    !!searchText;

  const clearFilters = () => {
    setVerificationFilter("");
    setSubscriptionFilter("");
    setActiveFilter("");
    setDateFilter("");
    setSearchText("");
    toast.info("Filters Cleared", "All filters have been reset.");
  };

  // CSV generator
  const generateCSV = (data) => {
    if (!data || data.length === 0) return null;

    const headers = [
      "Shop ID",
      "Business Name",
      "Owner Name",
      "Business Type",
      "GST Number",
      "City",
      "State",
      "Verification Status",
      "Plan",
      "Subscription Status",
      "Active",
      "Created At",
    ];

    const rows = data.map((shop) => [
      shop.shop_id || "",
      shop.business_name || "",
      shop.owner?.name || shop.owner?.full_name || "",
      shop.business_type || "",
      shop.gst_number || "",
      shop.city || "",
      shop.state || "",
      shop.verification_status || "",
      shop.subscription?.name || "None",
      shop.subscription?.status || "None",
      shop.is_active ? "Active" : "Inactive",
      shop.created_at ? new Date(shop.created_at).toLocaleDateString() : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${String(c ?? "")}"`).join(",")),
    ].join("\n");

    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
  };

  const exportVisibleShops = () => {
    try {
      const blob = generateCSV(shops);
      if (!blob) {
        toast.warning("No Data", "No shops available to export.");
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `shops_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      setShowExportMenu(false);
      toast.success("Export Successful", `${shops.length} shop(s) exported to CSV.`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export Failed", "Could not export shops. Please try again.");
    }
  };

  const exportAllShops = () => {
    try {
      const blob = generateCSV(shops);
      if (!blob) {
        toast.warning("No Data", "No shops available to export.");
        return;
      }

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `shops_all_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      setShowExportMenu(false);
      toast.success("Export Successful", `${shops.length} shop(s) exported to CSV.`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export Failed", "Could not export shops. Please try again.");
    }
  };

  // Toggle menu with position calculation
  const handleToggleMenu = () => {
    if (!showExportMenu && exportMenuRef.current) {
      const rect = exportMenuRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setShowExportMenu(!showExportMenu);
  };

  // Verification status options
  const verificationOptions = [
    { value: "", label: "All Verification" },
    { value: "pending", label: "Pending" },
    { value: "pending_review", label: "Pending Review" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
    { value: "partially_rejected", label: "Partially Rejected" },
  ];

  // Subscription status options
  const subscriptionOptions = [
    { value: "", label: "All Subscriptions" },
    { value: "active", label: "Active" },
    { value: "expired", label: "Expired" },
    { value: "none", label: "No Subscription" },
  ];

  // Active status options
  const activeOptions = [
    { value: "", label: "All Status" },
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
  ];

  return (
    <div className="flex justify-between bg-white shadow-sm rounded-xl border border-gray-100 p-2">
      <div className="flex items-end gap-3">
        {/* Search */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
          <label className="text-xs text-gray-500 font-medium">Search</label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Business, owner, GST, city, pincode..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-10 pl-9 pr-8 border border-gray-200 rounded-lg text-sm 
                       bg-gray-50 focus:bg-white
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                       placeholder:text-gray-400 transition-all"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded
                         text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Verification Status Filter */}
        <StyledSelect
          label="Verification"
          value={verificationFilter}
          onChange={setVerificationFilter}
          placeholder="All Verification"
          options={verificationOptions}
        />

        {/* Subscription Status Filter */}
        <StyledSelect
          label="Subscription"
          value={subscriptionFilter}
          onChange={setSubscriptionFilter}
          placeholder="All Subscriptions"
          options={subscriptionOptions}
        />

        {/* Active Status Filter */}
        <StyledSelect
          label="Status"
          value={activeFilter}
          onChange={setActiveFilter}
          placeholder="All Status"
          options={activeOptions}
        />

        {/* Date Filter */}
        <div className="min-w-[160px]">
          <StyledDateFilter
            label="Created Date"
            date={dateFilter}
            setDate={setDateFilter}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-10 px-3 text-sm text-gray-500 hover:text-red-600 
                       hover:bg-red-50 rounded-lg
                       flex items-center gap-1.5 transition-colors"
          >
            <X size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 self-center">
        {/* Export Menu */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={handleToggleMenu}
            className="h-10 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium 
                       flex items-center gap-2 hover:bg-gray-200 transition-all"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          {showExportMenu && (
            <div
              className="fixed w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
              style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
              }}
            >
              <button
                onClick={exportVisibleShops}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 
                           flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-blue-600" />
                <div>
                  <div className="font-medium">Export Visible</div>
                  <div className="text-xs text-gray-400">
                    {shops.length} shops
                  </div>
                </div>
              </button>

              <div className="h-px bg-gray-100" />

              <button
                onClick={exportAllShops}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 
                           flex items-center gap-3 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-green-600" />
                <div>
                  <div className="font-medium">Export All (Visible)</div>
                  <div className="text-xs text-gray-400">
                    {totalItems} total
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopsHeader;