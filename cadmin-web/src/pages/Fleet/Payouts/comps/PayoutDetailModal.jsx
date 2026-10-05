// cadmin-web/src/pages/Fleet/Payouts/comps/PayoutDetailModal.jsx (do not remove this comment)
import { useState, useEffect } from "react";
import { X, Loader2, User, CreditCard, FileText, CalendarDays, StickyNote, History } from "lucide-react";
import { getRiderPayoutDetail } from "../../../../api/cadminFleetRiderPayouts";
import { useToast } from "../../../../components/common/Toast";
import EarningsBreakdownTab from "./EarningsBreakdownTab";
import AttendanceCalendarTab from "./AttendanceCalendarTab";
import TeamAmountEditor from "./TeamAmountEditor";
import DeductionsEditor from "./DeductionsEditor";
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

const PayoutDetailModal = ({ riderId, weekStart, riderType, onClose, onRefresh }) => {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("earnings");

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await getRiderPayoutDetail(riderId, weekStart);
      setData(resp.data?.data);
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to load detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [riderId, weekStart]);

  const rider = data?.rider;
  const payout = data?.payout;
  const isTeam = rider?.rider_type === "TEAM";

  useEffect(() => {
    if (isTeam && activeTab === "earnings") {
      setActiveTab("amount");
    }
  }, [isTeam, activeTab]);

  const tabs = isTeam
    ? [
        { id: "amount", label: "Amount", icon: FileText },
        { id: "attendance", label: "Attendance", icon: CalendarDays },
        { id: "deductions", label: "Deductions", icon: FileText },
        { id: "bank", label: "Bank Details", icon: CreditCard },
        { id: "notes", label: "Notes", icon: StickyNote },
        { id: "history", label: "Past Payouts", icon: History },
      ]
    : [
        { id: "earnings", label: "Earnings", icon: FileText },
        { id: "deductions", label: "Deductions", icon: FileText },
        { id: "bank", label: "Bank Details", icon: CreditCard },
        { id: "notes", label: "Notes", icon: StickyNote },
        { id: "history", label: "Past Payouts", icon: History },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTeam ? "bg-purple-600" : "bg-[#05015A]"}`}>
              <User size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{rider?.full_name || "Loading..."}</h2>
              <p className="text-xs text-gray-500">
                {rider?.phone} · {data?.week_start} to {data?.week_end}
                {payout && (
                  <span className={`ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[payout.status] || "bg-gray-100"}`}>
                    {payout.status}
                  </span>
                )}
                {isTeam && (
                  <span className="ml-2 inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                    TEAM
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex items-center gap-1 px-6 border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id ? "border-[#05015A] text-[#05015A]" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {activeTab === "earnings" && !isTeam && (
                <EarningsBreakdownTab payout={payout} />
              )}
              {activeTab === "amount" && isTeam && (
                <div className="space-y-5">
                  <TeamAmountEditor payout={payout} onUpdated={() => { fetchData(); onRefresh(); }} />
                  {payout?.breakdown_snapshot?.attendance && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-2">Attendance Summary</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Days Active</p>
                          <p className="text-lg font-bold">{payout.breakdown_snapshot.attendance.days_active}/7</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Total Hours</p>
                          <p className="text-lg font-bold">{payout.breakdown_snapshot.attendance.total_hours}h</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg text-center">
                          <p className="text-xs text-gray-500">Orders</p>
                          <p className="text-lg font-bold">{payout.breakdown_snapshot.attendance.total_orders}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "attendance" && isTeam && (
                <AttendanceCalendarTab payout={payout} />
              )}
              {activeTab === "deductions" && (
                <DeductionsEditor
                  payout={payout}
                  onUpdated={() => { fetchData(); onRefresh(); }}
                />
              )}
              {activeTab === "bank" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">Bank Details</h3>
                  {rider?.bank_details?.account_number ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-gray-500">Account:</span> <span className="font-medium">{rider.bank_details.account_number}</span></div>
                      <div><span className="text-gray-500">IFSC:</span> <span className="font-medium">{rider.bank_details.ifsc}</span></div>
                      <div><span className="text-gray-500">Holder:</span> <span className="font-medium">{rider.bank_details.holder_name}</span></div>
                      <div><span className="text-gray-500">Bank:</span> <span className="font-medium">{rider.bank_details.bank_name}</span></div>
                      <div><span className="text-gray-500">Verified:</span> <span className={`font-medium ${rider.bank_details.verified ? "text-green-600" : "text-red-500"}`}>{rider.bank_details.verified ? "Yes" : "No"}</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No bank details on file.</p>
                  )}
                </div>
              )}
              {activeTab === "notes" && (
                <InternalNotesPanel
                  payout={payout}
                  onUpdated={fetchData}
                />
              )}
              {activeTab === "history" && (
                <HistoricalPayoutsTab riderId={riderId} />
              )}
            </>
          )}
        </div>

        {/* Footer: Status Transitions */}
        {payout && (
          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-3 bg-gray-50/50">
            <StatusTransitionBar
              payout={payout}
              onTransitioned={() => { fetchData(); onRefresh(); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutDetailModal;