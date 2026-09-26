// pharmacy-web/src/pages/report/gst/GSTR1ReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/gst/GSTR1ReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { FileText } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import StatCard from "../shared/StatCard";

const currentYear = new Date().getFullYear();
const defaultFilters = () => ({
  month: new Date().toISOString().substring(0, 7), // "YYYY-MM"
  quarter: "",
  branchId: "",
});

const COLUMNS = [
  { key: "invoice_number", label: "Invoice No" },
  {
    key: "invoice_date",
    label: "Date",
    render: (v) => new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  },
  { key: "customer_name", label: "Customer / Recipient" },
  { key: "customer_gstin", label: "GSTIN", align: "center" },
  { key: "taxable_amount", label: "Taxable Value", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "cgst_amount", label: "CGST", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "sgst_amount", label: "SGST", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "total_tax", label: "Total Tax", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "net_amount", label: "Invoice Value", align: "right", render: (v) => `₹${v.toFixed(2)}` },
];

const HSN_COLUMNS = [
  { key: "hsn_code", label: "HSN Code", align: "center" },
  { key: "unit_of_measure", label: "UOM", align: "center" },
  { key: "total_quantity", label: "Total Quantity", align: "center" },
  { key: "taxable_value", label: "Taxable Value", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "cgst_amount", label: "CGST", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "sgst_amount", label: "SGST", align: "right", render: (v) => `₹${v.toFixed(2)}` },
  { key: "total_tax", label: "Tax Amount", align: "right", render: (v) => `₹${v.toFixed(2)}` },
];

const GSTR1ReportPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [activeSection, setActiveTab] = useState("b2b");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await inventoryAPI.getFacets();
        if (res?.success && res.data) {
          setBranches(res.data.branches.map((b) => ({ value: b.branch_id, label: b.branch_name })));
        }
      } catch (err) {
        console.error("Facets error:", err);
      }
    };
    fetchMetadata();
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportsAPI.getGstr1Report(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, branchContext]); // eslint-disable-line

  useEffect(() => { load(); }, [branchContext, load]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "month" && value !== "") next.quarter = "";
      if (key === "quarter" && value !== "") next.month = "";
      return next;
    });
  };

  const handleReset = () => {
    setFilters(defaultFilters());
  };

  const filterConfig = [
    { key: "month", label: "Filing Month", type: "date" }, // Evaluates YYYY-MM
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
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  const sm = data?.summary;

  return (
    <ReportPageWrapper
      title="GSTR-1 Outward Supplies"
      subtitle="Filing format summaries mapped to required government templates"
      icon={FileText}
      iconColor="text-green-600"
      iconBg="bg-green-100"
      isLoading={isLoading}
      exportData={activeSection === "b2b" ? data?.b2b : activeSection === "b2c" ? data?.b2c : data?.hsnSummary}
      exportFilename={`gstr1_report_${activeSection}`}
      exportColumns={activeSection === "hsn" ? HSN_COLUMNS : COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />

        {sm && (
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="B2B (Registered) Invoices" value={sm.b2b_count} color="indigo" />
            <StatCard label="B2B Taxable Value" value={`₹${sm.b2b_taxable.toLocaleString("en-IN")}`} color="blue" />
            <StatCard label="B2C (Unregistered) Invoices" value={sm.b2c_count} color="purple" />
            <StatCard label="B2C Taxable Value" value={`₹${sm.b2c_taxable.toLocaleString("en-IN")}`} color="green" />
          </div>
        )}
      </div>

      {data && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex gap-0 border-b border-gray-200 px-5 bg-white">
            {[
              { id: "b2b", label: "B2B Supplies (Registered)" },
              { id: "b2c", label: "B2C Retail (Unregistered)" },
              { id: "hsn", label: "HSN Summary" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  activeSection === tab.id
                    ? "border-green-600 text-green-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {activeSection === "b2b" && (
              <ReportTable columns={COLUMNS} rows={data.b2b} emptyMessage="No registered B2B sales invoices recorded" />
            )}
            {activeSection === "b2c" && (
              <ReportTable columns={COLUMNS} rows={data.b2c} emptyMessage="No unregistered B2C transactions recorded" />
            )}
            {activeSection === "hsn" && (
              <ReportTable columns={HSN_COLUMNS} rows={data.hsnSummary} emptyMessage="No transaction codes aggregated" />
            )}
          </div>
        </div>
      )}
    </ReportPageWrapper>
  );
};

export default GSTR1ReportPage;