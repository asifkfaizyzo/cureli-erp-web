// pharmacy-web/src/pages/report/gst/GSTR3BReportPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/gst/GSTR3BReportPage.jsx

import React, { useState, useEffect, useCallback } from "react";
import { FileText } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import StatCard from "../shared/StatCard";

const defaultFilters = () => ({
  month: new Date().toISOString().substring(0, 7),
  branchId: "",
});

const GSTR3BReportPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
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
      const res = await reportsAPI.getGstr3bReport(filters);
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [filters, branchContext]); // eslint-disable-line

  useEffect(() => { load(); }, [branchContext, load]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setFilters(defaultFilters());
  };

  const filterConfig = [
    { key: "month", label: "Select Month", type: "date" },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
  ];

  return (
    <ReportPageWrapper
      title="GSTR-3B Consolidated Return"
      subtitle="Aggregated outputs, inputs, and final payable liabilities"
      icon={FileText}
      iconColor="text-violet-600"
      iconBg="bg-violet-100"
      isLoading={isLoading}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />
      </div>

      {data && (
        <div className="flex-1 overflow-auto p-6 space-y-6 bg-white">
          
          {/* Output vs Input Summary Grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="1. Total Output Liability"
              value={`₹${data.outward_supplies.total_tax.toLocaleString("en-IN")}`}
              subValue={`Taxable Value: ₹${data.outward_supplies.taxable_value.toLocaleString("en-IN")}`}
              color="red"
            />
            <StatCard
              label="2. Total Eligible Input Tax Credit"
              value={`₹${data.inward_supplies_itc.total_itc_available.toLocaleString("en-IN")}`}
              subValue={`Taxable purchases: ₹${data.inward_supplies_itc.taxable_value.toLocaleString("en-IN")}`}
              color="green"
            />
            <StatCard
              label="3. Net GST Payable / Refund"
              value={`₹${data.net_tax_payable.total_payable.toLocaleString("en-IN")}`}
              subValue="Output Tax Liability less ITC claimed"
              color={data.net_tax_payable.total_payable > 0 ? "amber" : "green"}
            />
          </div>

          {/* Breakdown Segment */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            
            {/* Outward Supplies (Output) */}
            <div className="border border-gray-150 rounded-2xl p-4 bg-gray-50/20">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2 flex items-center justify-between">
                <span>Outward Supplies (Liabilities)</span>
                <span className="text-[10px] text-gray-400 font-normal">Sales</span>
              </h3>
              <div className="mt-3 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Taxable Value:</span>
                  <span className="font-semibold text-gray-800">₹{data.outward_supplies.taxable_value.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CGST Collected:</span>
                  <span className="font-semibold text-gray-800">₹{data.outward_supplies.cgst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">SGST Collected:</span>
                  <span className="font-semibold text-gray-800">₹{data.outward_supplies.sgst.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Inward Supplies (Input Credit) */}
            <div className="border border-gray-150 rounded-2xl p-4 bg-gray-50/20">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2 flex items-center justify-between">
                <span>Inward Supplies (ITC Claims)</span>
                <span className="text-[10px] text-gray-400 font-normal">Purchases</span>
              </h3>
              <div className="mt-3 space-y-2.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Taxable purchases:</span>
                  <span className="font-semibold text-gray-800">₹{data.inward_supplies_itc.taxable_value.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CGST Claimable:</span>
                  <span className="font-semibold text-gray-800">₹{data.inward_supplies_itc.cgst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">SGST Claimable:</span>
                  <span className="font-semibold text-gray-800">₹{data.inward_supplies_itc.sgst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">IGST Claimable:</span>
                  <span className="font-semibold text-gray-800">₹{data.inward_supplies_itc.igst.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Tax payable matrix */}
          <div className="border border-gray-150 rounded-2xl p-4 bg-gray-50/50 mt-6">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2">
              GST Payable Computation
            </h3>
            <table className="w-full text-xs mt-3">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Tax Component</th>
                  <th className="text-right py-2 font-medium">Output Liability</th>
                  <th className="text-right py-2 font-medium">Input Credit Used</th>
                  <th className="text-right py-2 font-medium">Net Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="text-gray-700">
                  <td className="py-2.5 font-medium">CGST</td>
                  <td className="text-right py-2.5">₹{data.outward_supplies.cgst.toLocaleString("en-IN")}</td>
                  <td className="text-right py-2.5">₹{data.inward_supplies_itc.cgst.toLocaleString("en-IN")}</td>
                  <td className="text-right py-2.5 font-bold text-gray-900">₹{data.net_tax_payable.cgst.toLocaleString("en-IN")}</td>
                </tr>
                <tr className="text-gray-700">
                  <td className="py-2.5 font-medium">SGST</td>
                  <td className="text-right py-2.5">₹{data.outward_supplies.sgst.toLocaleString("en-IN")}</td>
                  <td className="text-right py-2.5">₹{data.inward_supplies_itc.sgst.toLocaleString("en-IN")}</td>
                  <td className="text-right py-2.5 font-bold text-gray-900">₹{data.net_tax_payable.sgst.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}
    </ReportPageWrapper>
  );
};

export default GSTR3BReportPage;