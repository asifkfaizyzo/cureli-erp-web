// pharmacy-web/src/pages/report/sales/PaymentCollectionPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/sales/PaymentCollectionPage.jsx

import { useState, useEffect, useCallback } from "react";
import { Wallet } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import ReportPagination from "../shared/ReportPagination";
import StatCard from "../shared/StatCard";

const LIMIT = 50;

const defaultFilters = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: firstOfMonth.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    paymentMode: "",
    search: "",
    branchId: "",
  };
};

const COLUMNS = [
  {
    key: "payment_date",
    label: "Date",
    width: "w-28",
    render: (v) =>
      new Date(v).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
  { key: "invoice_number", label: "Invoice No" },
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
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[v] || "bg-gray-100 text-gray-600"}`}
        >
          {v || "-"}
        </span>
      );
    },
  },
  { key: "reference_number", label: "Reference", render: (v) => v || "-" },
  { key: "collected_by", label: "Collected By" },
];

const EXPORT_COLUMNS = [
  { key: "payment_date", label: "Date" },
  { key: "invoice_number", label: "Invoice No" },
  { key: "customer_name", label: "Customer" },
  { key: "amount", label: "Amount" },
  { key: "payment_mode", label: "Mode" },
  { key: "reference_number", label: "Reference" },
  { key: "collected_by", label: "Collected By" },
];

const PaymentCollectionPage = () => {
  const toast = useToast();
  const branchContext = useAuthStore(selectBranchContext);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  const [filters, setFilters] = useState(defaultFilters());
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [offset, setOffset] = useState(0);
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
      const res = await reportsAPI.getPaymentCollection({
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
    setOffset(0);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setOffset(0);
    setFilters(defaultFilters());
  };

  const filterConfig = [
    { key: "startDate", label: "From Date", type: "date" },
    { key: "endDate", label: "To Date", type: "date" },
    {
      key: "paymentMode",
      label: "Payment Mode",
      type: "select",
      options: [
        { value: "CASH", label: "Cash" },
        { value: "CARD", label: "Card" },
        { value: "UPI", label: "UPI" },
        { value: "CREDIT", label: "Credit" },
        { value: "ONLINE", label: "Online" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
    {
      key: "search",
      label: "",
      type: "search",
      placeholder: "Search invoice / customer...",
    },
  ];

  const sm = data?.summary;

  return (
    <ReportPageWrapper
      title="Payment Collection"
      subtitle="All payments received against sales invoices"
      icon={Wallet}
      iconColor="text-green-600"
      iconBg="bg-green-100"
      isLoading={isLoading}
      exportData={data?.payments || []}
      exportFilename="payment_collection"
      exportColumns={EXPORT_COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50 space-y-3">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />
        {sm && (
          <div className="flex gap-3">
            <StatCard
              label="Total Payments"
              value={sm.total_payments}
              color="indigo"
            />
            <StatCard
              label="Total Collected"
              value={`₹${sm.total_collected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              color="green"
            />
            {data.mode_breakdown.map((m) => (
              <div
                key={m.mode}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
              >
                <p className="text-[10px] font-medium text-gray-500 uppercase">{m.mode}</p>
                <p className="text-sm font-bold text-gray-800 mt-1">
                  ₹{m.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-gray-400">{m.count} txns</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable
          columns={COLUMNS}
          rows={data?.payments || []}
          emptyMessage="No payments found"
        />
        <ReportPagination
          total={data?.total || 0}
          limit={LIMIT}
          offset={offset}
          onPageChange={setOffset}
        />
      </div>
    </ReportPageWrapper>
  );
};

export default PaymentCollectionPage;