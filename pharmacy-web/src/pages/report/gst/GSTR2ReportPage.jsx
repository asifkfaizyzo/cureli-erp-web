// pharmacy-web/src/pages/report/gst/GSTR2ReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/gst/GSTR2ReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { FileText } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import suppliersAPI from "../../../api/suppliers";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import ReportPagination from "../shared/ReportPagination";
import StatCard from "../shared/StatCard";

const LIMIT = 50;
const currentYear = new Date().getFullYear();

const defaultFilters = () => ({
  month: new Date().toISOString().substring(0, 7),
  quarter: "",
  supplierId: "",
  branchId: "",
});

const COLUMNS = [
  { key: "invoice_number", label: "ERP Reference No" },
  { key: "supplier_invoice_no", label: "Supplier Invoice" },
  {
    key: "invoice_date",
    label: "Date",
    render: (v) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  },
  { key: "supplier_name", label: "Supplier" },
  { key: "supplier_gstin", label: "Supplier GSTIN", align: "center" },
  { key: "taxable_amount", label: "Taxable Value", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "cgst_amount", label: "CGST Paid", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "sgst_amount", label: "SGST Paid", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "igst_amount", label: "IGST Paid", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  {
    key: "total_itc_eligible",
    label: "ITC Eligible",
    align: "right",
    render: (v) => <span className="font-bold text-green-700">₹{v.toFixed(2)}</span>,
  },
];

const GSTR2ReportPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const facets = await inventoryAPI.getFacets();
        if (facets?.success && facets.data) {
          setBranches(facets.data.branches.map((b) => ({ value: b.branch_id, label: b.branch_name })));
        }
        const supplierRes = await suppliersAPI.getAll({ limit: 1000 });
        const sList = supplierRes?.data || supplierRes || [];
        setSuppliers(sList.map((s) => ({ value: s.supplier_id, label: s.name })));
      } catch (err) {
        console.error("facets error:", err);
      }
    };
    fetchMetadata();
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportsAPI.getGstr2Report({
        ...filters,
        limit: LIMIT,
        offset,
      });
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, offset, branchContext]); // eslint-disable-line

  useEffect(() => {
    setOffset(0);
    load();
  }, [branchContext, load]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "month" && value !== "") next.quarter = "";
      if (key === "quarter" && value !== "") next.month = "";
      return next;
    });
  };

  const handleReset = () => {
    setOffset(0);
    setFilters(defaultFilters());
  };

  const filterConfig = [
    { key: "month", label: "Filing Month", type: "date" },
    {
      key: "quarter",
      label: "Filing Quarter",
      type: "select",
      options: [
        { value: `${currentYear}-Q1`, label: `Q1 (Apr - Jun ${currentYear})` },
        { value: `${currentYear}-Q2`, label: `Q2 (Jul - Sep ${currentYear})` },
        { value: `${currentYear}-Q3`, label: `Q3 (Oct - Dec ${currentYear})` },
        { value: `${currentYear}-Q4`, label: `Q4 (Jan - Mar ${currentYear + 1})` },
      ],
    },
    { key: "supplierId", label: "Supplier", type: "select", options: suppliers },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  const sm = data?.summary;

  return (
    <ReportPageWrapper
      title="GSTR-2 Inward Supplies"
      subtitle="Purchase invoice summaries and available input tax credit (ITC) profiles"
      icon={FileText}
      iconColor="text-blue-600"
      iconBg="bg-blue-100"
      isLoading={isLoading}
      exportData={data?.records || []}
      exportFilename="gstr2_itc_report"
      exportColumns={COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />

        {sm && (
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Total Inward Supplies" value={sm.total_invoices} color="indigo" />
            <StatCard label="Total Taxable purchases" value={`₹${sm.total_taxable.toLocaleString("en-IN")}`} color="blue" />
            <StatCard label="Total Input Tax Credit (ITC)" value={`₹${sm.total_itc_eligible.toLocaleString("en-IN")}`} color="green" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable columns={COLUMNS} rows={data?.records || []} emptyMessage="No inward supply records found" />
        <ReportPagination total={data?.total || 0} limit={LIMIT} offset={offset} onPageChange={setOffset} />
      </div>
    </ReportPageWrapper>
  );
};

export default GSTR2ReportPage;