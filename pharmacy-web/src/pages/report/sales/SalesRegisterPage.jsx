// pharmacy-web/src/pages/report/sales/SalesRegisterPage.jsx (do not remove this comment)
// pharmacy-web/src/pages/report/sales/SalesRegisterPage.jsx

import { useState, useEffect, useCallback } from "react";
import { FileText } from "lucide-react";
import reportsAPI from "../../../api/reports";
import inventoryAPI from "../../../api/inventory";
import { useToast } from "../../../components/common/Toast";
import { useAuthStore, selectBranchContext, selectIsGlobalMode } from "../../../store/useAuthStore";
import ReportPageWrapper from "../shared/ReportPageWrapper";
import ReportFiltersBar from "../shared/ReportFiltersBar";
import ReportTable from "../shared/ReportTable";
import ReportPagination from "../shared/ReportPagination";

const LIMIT = 50;

const defaultFilters = () => {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    startDate: firstOfMonth.toISOString().split("T")[0],
    endDate: today.toISOString().split("T")[0],
    paymentStatus: "",
    search: "",
    branchId: "",
  };
};

const COLUMNS = [
  { key: "invoice_number", label: "Invoice No", width: "w-36" },
  {
    key: "invoice_date",
    label: "Date",
    width: "w-28",
    render: (v) =>
      v
        ? new Date(v).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "-",
  },
  { key: "customer_name", label: "Customer" },
  { key: "item_count", label: "Items", align: "center", width: "w-16" },
  {
    key: "subtotal",
    label: "Subtotal",
    align: "right",
    render: (v) => `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "total_discount",
    label: "Discount",
    align: "right",
    render: (v) => `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "total_tax",
    label: "Tax",
    align: "right",
    render: (v) => `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
  },
  {
    key: "net_amount",
    label: "Net Amount",
    align: "right",
    render: (v) => (
      <span className="font-semibold">
        ₹{Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colors[v] || "bg-gray-100 text-gray-600"}`}
        >
          {v?.replace("_", " ") || "-"}
        </span>
      );
    },
  },
  { key: "payment_modes", label: "Mode", align: "center" },
  { key: "billed_by", label: "Billed By" },
];

const EXPORT_COLUMNS = [
  { key: "invoice_number", label: "Invoice No" },
  { key: "invoice_date", label: "Date" },
  { key: "customer_name", label: "Customer" },
  { key: "item_count", label: "Items" },
  { key: "subtotal", label: "Subtotal" },
  { key: "total_discount", label: "Discount" },
  { key: "total_tax", label: "Tax" },
  { key: "net_amount", label: "Net Amount" },
  { key: "payment_status", label: "Payment Status" },
  { key: "payment_modes", label: "Payment Mode" },
  { key: "billed_by", label: "Billed By" },
];

const SalesRegisterPage = () => {
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
      const res = await reportsAPI.getSalesRegister({
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
      key: "paymentStatus",
      label: "Payment Status",
      type: "select",
      options: [
        { value: "PAID", label: "Paid" },
        { value: "PARTIALLY_PAID", label: "Partial" },
        { value: "UNPAID", label: "Unpaid" },
      ],
    },
    ...(isGlobalMode ? [{ key: "branchId", label: "Branch", type: "select", options: branches }] : []),
    { key: "search", label: "", type: "search", placeholder: "Search invoice / customer..." },
  ];

  const totals = data?.totals;
  const footerRow = totals
    ? {
        invoice_number: "TOTALS",
        invoice_date: "",
        customer_name: "",
        item_count: "",
        subtotal: `₹${totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        total_discount: `₹${totals.total_discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        total_tax: `₹${totals.total_tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        net_amount: `₹${totals.net_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        payment_status: "",
        payment_modes: "",
        billed_by: "",
      }
    : null;

  return (
    <ReportPageWrapper
      title="Sales Register"
      subtitle="Complete invoice-by-invoice sales record"
      icon={FileText}
      iconColor="text-blue-600"
      iconBg="bg-blue-100"
      isLoading={isLoading}
      exportData={data?.invoices || []}
      exportFilename="sales_register"
      exportColumns={EXPORT_COLUMNS}
    >
      <div className="shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <ReportFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          config={filterConfig}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <ReportTable
          columns={COLUMNS}
          rows={data?.invoices || []}
          footerRow={footerRow}
          emptyMessage="No sales invoices found"
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

export default SalesRegisterPage;