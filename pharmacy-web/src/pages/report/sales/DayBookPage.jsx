// pharmacy-web/src/pages/report/sales/DayBookPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/sales/DayBookPage.jsx

import { useState, useEffect, useCallback } from "react";
import { BookOpen } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import StatCard from "../shared/StatCard";
import ReportTable from "../shared/ReportTable";

const today = () => new Date().toISOString().split("T")[0];

const INVOICE_COLUMNS = [
  { key: "invoice_number", label: "Invoice No" },
  { key: "customer_name", label: "Customer" },
  {
    key: "net_amount",
    label: "Amount",
    align: "right",
    render: (v) =>
      `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "is_credit_sale",
    label: "Type",
    align: "center",
    render: (v) =>
      v ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-semibold">
          Credit
        </span>
      ) : (
        <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 font-semibold">
          Cash
        </span>
      ),
  },
  {
    key: "payment_status",
    label: "Payment",
    align: "center",
    render: (v) => {
      const colors = {
        PAID: "bg-green-100 text-green-700",
        PARTIALLY_PAID: "bg-amber-100 text-amber-700",
        UNPAID: "bg-red-100 text-red-700",
      };
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[v] || "bg-gray-100"}`}
        >
          {v?.replace("_", " ")}
        </span>
      );
    },
  },
  { key: "payment_modes", label: "Mode" },
  { key: "billed_by", label: "Billed By" },
];

const PAYMENTS_COLUMNS = [
  { key: "invoice_number", label: "Invoice" },
  { key: "customer_name", label: "Customer" },
  {
    key: "amount",
    label: "Amount",
    align: "right",
    render: (v) => (
      <span className="font-semibold text-green-700">
        ₹{Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: "payment_mode",
    label: "Mode",
    align: "center",
    render: (v) => {
      const colors = {
        CASH: "bg-green-100 text-green-700",
        CARD: "bg-blue-100 text-blue-700",
        UPI: "bg-purple-100 text-purple-700",
        CREDIT: "bg-amber-100 text-amber-700",
        ONLINE: "bg-indigo-100 text-indigo-700",
      };
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[v] || "bg-gray-100"}`}
        >
          {v}
        </span>
      );
    },
  },
  { key: "reference_number", label: "Reference", render: (v) => v || "-" },
];

const RETURNS_COLUMNS = [
  { key: "invoice_number", label: "Return No" },
  { key: "parent_invoice_number", label: "Original Invoice" },
  { key: "customer_name", label: "Customer" },
  {
    key: "net_amount",
    label: "Amount",
    align: "right",
    render: (v) => (
      <span className="text-red-600 font-semibold">
        ₹{Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  { key: "refund_mode", label: "Refund Mode", render: (v) => v || "-" },
];

const DayBookPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [date, setDate] = useState(today());
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("invoices");

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
    if (!date) return;
    setIsLoading(true);
    try {
      const res = await reportsAPI.getDayBook({ date, branchId });
      setData(res.data);
    } catch (err) {
      toast.error("Error", err?.response?.data?.message || "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  }, [date, branchId, branchContext]); // eslint-disable-line

  useEffect(() => {
    load();
  }, [branchContext, load]);

  const sm = data?.summary;

  return (
    <ReportPageWrapper
      title="Day Book"
      subtitle="Complete financial snapshot of a single day"
      icon={BookOpen}
      iconColor="text-purple-600"
      iconBg="bg-purple-100"
      isLoading={isLoading}
    >
      {/* Date selector + Branch */}
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <label className="absolute -top-2 left-2 text-[9px] bg-white px-1 font-semibold text-gray-500 z-10">
              Select Date
            </label>
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 px-3 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white"
            />
          </div>
          <button
            onClick={() => setDate(today())}
            className="h-9 px-3 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
          >
            Today
          </button>
          {isGlobalMode && branches.length > 0 && (
            <div className="relative">
              <label className="absolute -top-2 left-2 text-[9px] bg-white px-1 font-semibold text-gray-500 z-10">
                Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="h-9 pl-3 pr-7 text-xs border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 bg-white appearance-none min-w-[150px]"
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Summary KPIs */}
        {sm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard
              label="Total Invoices"
              value={sm.total_invoices}
              color="indigo"
            />
            <StatCard
              label="Gross Sales"
              value={`₹${sm.gross_sales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="green"
            />
            <StatCard
              label="Cash Sales"
              value={`₹${sm.cash_sales_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              subValue={`${sm.cash_sales_count} invoices`}
              color="green"
            />
            <StatCard
              label="Credit Sales"
              value={`₹${sm.credit_sales_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              subValue={`${sm.credit_sales_count} invoices`}
              color="amber"
            />
            <StatCard
              label="Returns"
              value={`₹${sm.returns_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              subValue={`${sm.returns_count} returns`}
              color="red"
            />
            <StatCard
              label="Net Sales"
              value={`₹${sm.net_sales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="blue"
            />
            <StatCard
              label="Payments Received"
              value={`₹${sm.net_cash_collected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              subValue={`${sm.payments_received_count} payments`}
              color="purple"
            />
            <StatCard
              label="Total Discount"
              value={`₹${sm.total_discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="gray"
            />
          </div>
        )}

        {/* Payment mode breakdown */}
        {data?.payment_mode_breakdown?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {data.payment_mode_breakdown.map((m) => (
              <div
                key={m.mode}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-3"
              >
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  {m.mode}
                </span>
                <span className="text-xs font-bold text-gray-800">
                  ₹{m.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-gray-400">({m.count})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      {data && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex gap-0 border-b border-gray-200 px-5">
            {[
              { key: "invoices", label: `Invoices (${data.invoices?.length || 0})` },
              { key: "payments", label: `Payments (${data.payments?.length || 0})` },
              { key: "returns", label: `Returns (${data.returns?.length || 0})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "invoices" && (
              <ReportTable
                columns={INVOICE_COLUMNS}
                rows={data.invoices || []}
                emptyMessage="No invoices on this day"
              />
            )}
            {activeTab === "payments" && (
              <ReportTable
                columns={PAYMENTS_COLUMNS}
                rows={data.payments || []}
                emptyMessage="No payments on this day"
              />
            )}
            {activeTab === "returns" && (
              <ReportTable
                columns={RETURNS_COLUMNS}
                rows={data.returns || []}
                emptyMessage="No returns on this day"
              />
            )}
          </div>
        </div>
      )}
    </ReportPageWrapper>
  );
};

export default DayBookPage;