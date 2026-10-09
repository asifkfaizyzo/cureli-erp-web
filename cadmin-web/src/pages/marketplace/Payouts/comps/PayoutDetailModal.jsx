import { useState, useEffect } from "react";
import { X, Loader2, Landmark, CreditCard, FileText, ListOrdered, StickyNote, History, RefreshCw, TrendingUp } from "lucide-react";
import { getPharmacyPayoutDetail, refreshPharmacyPayout } from "../../../../api/cadminPharmacyPayouts";
import { useToast } from "../../../../components/common/Toast";
import EarningsBreakdownTab from "./EarningsBreakdownTab";
import OrdersTab from "./OrdersTab";
import AdjustmentsEditor from "./AdjustmentsEditor";
import InternalNotesPanel from "./InternalNotesPanel";
import HistoricalPayoutsTab from "./HistoricalPayoutsTab";
import StatusTransitionBar from "./StatusTransitionBar";

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PayoutDetailModal = ({ shopId, weekStart, onClose, onRefresh }) => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("earnings");

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const resp = await getPharmacyPayoutDetail(shopId, weekStart);
      setData(resp.data?.data);
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to load detail");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await refreshPharmacyPayout(shopId, weekStart);
      toast.success("Success", "Payout recalculated");
      await fetchData(true);
      onRefresh();
    } catch (err) {
      toast.error("Failed", err.response?.data?.message || "Could not recalculate");
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [shopId, weekStart]);

  const shop = data?.shop;
  const payout = data?.payout;
  const isMutable = payout?.status === "DRAFT" || payout?.status === "PENDING" || payout?.status === "FAILED";
  const cureliMargin = payout?.breakdown_snapshot?.cureli_summary?.total_cureli_margin;

  const tabs = [
    { id: "earnings", label: "Financial Statement", icon: FileText },
    { id: "orders", label: `Orders (${data?.order_line_items?.length || 0})`, icon: ListOrdered },
    { id: "adjustments", label: "Adjustments", icon: FileText },
    { id: "bank", label: "Bank Details", icon: CreditCard },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "history", label: "Past Payouts", icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#05015A] flex items-center justify-center shadow-md shadow-[#05015A]/10">
              <Landmark size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{shop?.business_name || "Loading..."}</h2>
                {payout && (
                  <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full ${STATUS_COLORS[payout.status] || "bg-gray-100"}`}>
                    {payout.status}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5 text-xs text-gray-500">
                <span>{shop?.city}{shop?.state ? `, ${shop.state}` : ""}</span>
                <span>•</span>
                <span className="font-medium text-gray-700">{data?.week_start} to {data?.week_end}</span>
                {cureliMargin !== undefined && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      <TrendingUp size={11} /> Cureli Margin: {fmt(cureliMargin)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {payout && isMutable && (
              <button
                onClick={handleRecalculate}
                disabled={isRecalculating || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-all disabled:opacity-50"
              >
                <RefreshCw size={13} className={isRecalculating ? "animate-spin" : ""} />
                Recalculate
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex items-center gap-1 px-6 border-b border-gray-100 bg-gray-50/60 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id ? "border-[#05015A] text-[#05015A]" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <Loader2 size={24} className="animate-spin text-[#05015A]" />
              <span className="text-xs font-medium">Loading payout details...</span>
            </div>
          ) : (
            <>
              {activeTab === "earnings" && <EarningsBreakdownTab payout={payout} />}
              {activeTab === "orders" && <OrdersTab orderLineItems={data?.order_line_items || []} />}
              {activeTab === "adjustments" && (
                <AdjustmentsEditor payout={payout} onUpdated={() => { fetchData(true); onRefresh(); }} />
              )}
              {activeTab === "bank" && (
                <div className="space-y-4 max-w-xl">
                  <h3 className="text-sm font-bold text-gray-900">Verified Bank Disbursal Account</h3>
                  {shop?.bank_details?.account_number ? (
                    <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div><span className="text-gray-500 block mb-0.5">Account Number</span> <span className="font-semibold text-gray-900 text-sm font-mono">{shop.bank_details.account_number}</span></div>
                      <div><span className="text-gray-500 block mb-0.5">IFSC Code</span> <span className="font-semibold text-gray-900 text-sm font-mono">{shop.bank_details.ifsc}</span></div>
                      <div><span className="text-gray-500 block mb-0.5">Account Holder</span> <span className="font-medium text-gray-800">{shop.bank_details.holder_name}</span></div>
                      <div><span className="text-gray-500 block mb-0.5">Bank Name</span> <span className="font-medium text-gray-800">{shop.bank_details.bank_name}</span></div>
                      <div><span className="text-gray-500 block mb-0.5">Branch</span> <span className="font-medium text-gray-800">{shop.bank_details.branch_name || "—"}</span></div>
                      {shop.bank_details.vpa && <div><span className="text-gray-500 block mb-0.5">UPI VPA</span> <span className="font-medium text-gray-800">{shop.bank_details.vpa}</span></div>}
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                      No bank details on file for this pharmacy. Disbursals cannot be processed.
                    </div>
                  )}
                </div>
              )}
              {activeTab === "notes" && <InternalNotesPanel payout={payout} onUpdated={() => fetchData(true)} />}
              {activeTab === "history" && <HistoricalPayoutsTab shopId={shopId} />}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {payout && (
          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-3.5 bg-gray-50/70">
            <StatusTransitionBar payout={payout} onTransitioned={() => { fetchData(true); onRefresh(); }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutDetailModal;