// cadmin-web/src/pages/Fleet/Riders/comps/RiderDetailModal.jsx (do not remove this comment)
//cadmin-web\src\pages\Fleet\Riders\comps\RiderDetailModal.jsx

import { useState, useEffect } from "react";
import {
  X, User, FileText, History, Loader2, Ban, CheckCircle, AlertTriangle, ArrowLeftRight,
} from "lucide-react";
import RiderDocumentsTab from "./RiderDocumentsTab";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/Toast";
import {
  getRiderDetail,
  suspendRider,
  reactivateRider,
  convertRiderType,
} from "../../../../api/cadminRiders";

const RiderDetailModal = ({ rider: basicRider, isOpen, onClose }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);

  useEffect(() => {
    if (isOpen && basicRider?.rider_id) {
      fetchDetail(basicRider.rider_id);
    }
  }, [isOpen, basicRider?.rider_id]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setRider(null);
    }
  }, [isOpen]);

  const fetchDetail = async (id) => {
    setLoading(true);
    try {
      const resp = await getRiderDetail(id);
      setRider(resp.data?.data || resp.data);
    } catch {
      toast.error("Error", "Failed to load rider details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!rider) return;
    setActionLoading(true);
    try {
      await suspendRider(rider.rider_id, suspendReason || "Suspended by admin");
      toast.success("Suspended", `${rider.full_name} has been suspended.`);
      setShowSuspendConfirm(false);
      setSuspendReason("");
      onClose(true);
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to suspend.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!rider) return;
    setActionLoading(true);
    try {
      await reactivateRider(rider.rider_id);
      toast.success("Reactivated", `${rider.full_name} has been reactivated.`);
      onClose(true);
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed to reactivate.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!rider) return;
    const newType = rider.rider_type === "TEAM" ? "INDEPENDENT" : "TEAM";
    setConvertLoading(true);
    try {
      await convertRiderType(rider.rider_id, newType);
      toast.success("Type Changed", `${rider.full_name} is now ${newType === "TEAM" ? "Team" : "Independent"}.`);
      setShowConvertConfirm(false);
      onClose(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to convert rider type.";
      toast.error("Conversion Failed", msg);
    } finally {
      setConvertLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayName = rider?.full_name || basicRider?.full_name || "Rider";
  const isActive = rider?.status === "ACTIVE";
  const isSuspended = rider?.status === "SUSPENDED";
  const currentType = rider?.rider_type || basicRider?.rider_type;
  const targetType = currentType === "TEAM" ? "INDEPENDENT" : "TEAM";
  const targetTypeLabel = targetType === "TEAM" ? "Team" : "Independent";

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "activity", label: "Activity", icon: History },
  ];

  const DetailRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value || "—"}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onClose(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-white text-lg font-semibold">{displayName}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-emerald-500/20 text-emerald-200" : "bg-red-500/20 text-red-200"}`}>
                    {rider?.status?.replace("_", " ") || basicRider?.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentType === "TEAM" ? "bg-blue-500/20 text-blue-200" : "bg-white/20 text-white/70"}`}>
                    {currentType}
                  </span>
                </div>
                <p className="text-white/70 text-sm">{rider?.phone || basicRider?.phone}</p>
              </div>
            </div>
            <button onClick={() => onClose(false)} className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all
                  ${activeTab === tab.id ? "text-[#05015A] border-b-2 border-[#05015A]" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 h-[55vh] overflow-auto bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
          ) : !rider ? (
            <p className="text-center text-gray-400 py-20">No data</p>
          ) : activeTab === "overview" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border p-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Personal Info</h3>
                <DetailRow label="Full Name" value={rider.full_name} />
                <DetailRow label="Email" value={rider.email} />
                <DetailRow label="Date of Birth" value={rider.date_of_birth ? new Date(rider.date_of_birth).toLocaleDateString("en-IN") : null} />
                <DetailRow label="Gender" value={rider.sex} />
                <DetailRow label="City" value={rider.current_city} />
                <DetailRow label="Address" value={rider.residential_address} />
              </div>
              <div className="bg-white rounded-xl border p-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Vehicle & Bank</h3>
                <DetailRow label="Vehicle Type" value={rider.vehicle_type} />
                <DetailRow label="Vehicle Number" value={rider.vehicle_number} />
                <DetailRow label="Make/Model" value={rider.vehicle_make_model} />
                <DetailRow label="Bank Holder" value={rider.bank_holder_name} />
                <DetailRow label="Bank A/C (last 4)" value={rider.bank_account_number ? `****${rider.bank_account_number.slice(-4)}` : null} />
                <DetailRow label="Bank Verified" value={rider.bank_verified ? "Yes" : "No"} />
              </div>
              <div className="bg-white rounded-xl border p-4 md:col-span-2">
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Stats</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div><p className="text-2xl font-bold text-gray-900">{rider.rating?.toFixed(1) || "0"}</p><p className="text-xs text-gray-400">Rating</p></div>
                  <div><p className="text-2xl font-bold text-gray-900">{rider.total_deliveries || 0}</p><p className="text-xs text-gray-400">Deliveries</p></div>
                  <div><p className="text-2xl font-bold text-gray-900">{rider.total_ratings || 0}</p><p className="text-xs text-gray-400">Reviews</p></div>
                  <div><p className="text-2xl font-bold text-gray-900">{rider.is_online ? "🟢" : "⚫"}</p><p className="text-xs text-gray-400">Online</p></div>
                </div>
              </div>
            </div>
          ) : activeTab === "documents" ? (
            <RiderDocumentsTab rider={rider} onRefresh={() => fetchDetail(rider.rider_id)} />
          ) : (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
              <History size={48} className="mx-auto mb-3 opacity-30" />
              <p>Activity log coming soon.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t flex items-center justify-between">
          <p className="text-xs text-gray-400">ID: {rider?.rider_id || basicRider?.rider_id}</p>
          <div className="flex items-center gap-2">
            {/* Convert Type Button */}
            <button
              onClick={() => setShowConvertConfirm(true)}
              disabled={actionLoading || convertLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-40"
            >
              <ArrowLeftRight size={16} /> Convert to {targetTypeLabel}
            </button>

            {isActive && (
              <button
                onClick={() => setShowSuspendConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-600 hover:bg-orange-100"
              >
                <Ban size={16} /> Suspend
              </button>
            )}
            {isSuspended && (
              <button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
              >
                <CheckCircle size={16} /> Reactivate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suspend Confirmation */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => setShowSuspendConfirm(false)}
        onConfirm={handleSuspend}
        title="Suspend Rider?"
        message={`Are you sure you want to suspend "${displayName}"? They will not be able to accept orders.`}
        confirmText="Suspend"
        cancelText="Cancel"
        type="warning"
        loading={actionLoading}
      />

      {/* Convert Type Confirmation */}
      <ConfirmDialog
        isOpen={showConvertConfirm}
        onClose={() => setShowConvertConfirm(false)}
        onConfirm={handleConvert}
        title={`Convert to ${targetTypeLabel}?`}
        message={
          <span>
            Change <strong>{displayName}</strong> from{" "}
            <strong>{currentType}</strong> to <strong>{targetType}</strong>?
            <br />
            <span className="text-xs text-gray-500 mt-1 block">
              This will fail if the rider has active deliveries in progress.
            </span>
          </span>
        }
        confirmText={`Convert to ${targetTypeLabel}`}
        cancelText="Cancel"
        type="info"
        loading={convertLoading}
      />
    </div>
  );
};

export default RiderDetailModal;