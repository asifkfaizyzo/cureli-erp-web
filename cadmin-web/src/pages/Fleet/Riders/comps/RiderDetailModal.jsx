// cadmin-web/src/pages/Fleet/Riders/comps/RiderDetailModal.jsx (do not remove this comment)
//cadmin-web\src\pages\Fleet\Riders\comps\RiderDetailModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  User,
  FileText,
  History,
  Loader2,
  Ban,
  CheckCircle,
  AlertCircle,
  ArrowLeftRight,
  Pencil,
  Save,
  TrendingUp,
} from "lucide-react";
import RiderDocumentsTab from "./RiderDocumentsTab";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/Toast";
import {
  getRiderDetail,
  suspendRider,
  reactivateRider,
  convertRiderType,
  updateRider,
} from "../../../../api/cadminRiders";

const RiderDetailModal = ({ rider: basicRider, isOpen, onClose }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({});
  const [originalFormData, setOriginalFormData] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Action states
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
      setIsEditing(false);
      setFormData({});
      setOriginalFormData({});
      setSaveError(null);
    }
  }, [isOpen]);

  // Handle escape key to prevent losing changes accidentally
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (isEditing && hasChanges()) {
          if (
            window.confirm(
              "You have unsaved changes. Are you sure you want to close?"
            )
          ) {
            onClose(false);
          }
        } else {
          onClose(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isEditing]);

  const fetchDetail = async (id) => {
    setLoading(true);
    setSaveError(null);
    try {
      const resp = await getRiderDetail(id);
      const riderData = resp.data?.data || resp.data;
      setRider(riderData);

      const formattedDOB = riderData.date_of_birth
        ? new Date(riderData.date_of_birth).toISOString().split("T")[0]
        : "";

      const initialForm = {
        full_name: riderData.full_name || "",
        email: riderData.email || "",
        phone: riderData.phone || "",
        date_of_birth: formattedDOB,
        sex: riderData.sex || "",
        current_city: riderData.current_city || "",
        residential_address: riderData.residential_address || "",
        vehicle_type: riderData.vehicle_type || "",
        vehicle_number: riderData.vehicle_number || "",
        vehicle_make_model: riderData.vehicle_make_model || "",
        bank_holder_name: riderData.bank_holder_name || "",
        bank_account_number: riderData.bank_account_number || "",
        bank_ifsc: riderData.bank_ifsc || "",
        bank_name: riderData.bank_name || "",
        bank_verified: riderData.bank_verified ?? false,
      };

      setFormData(initialForm);
      setOriginalFormData(initialForm);
    } catch {
      toast.error("Error", "Failed to load rider details.");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    return Object.keys(formData).some(
      (key) => formData[key] !== originalFormData[key]
    );
  };

  const handleFormChange = (field, value) => {
    setSaveError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    if (hasChanges()) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to cancel?"
        )
      ) {
        return;
      }
    }
    setFormData(originalFormData);
    setIsEditing(false);
    setSaveError(null);
  };

  const validateForm = () => {
    if (!formData.full_name?.trim()) {
      return "Full name is required";
    }
    if (!formData.phone?.trim()) {
      return "Phone number is required";
    }
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone && !/^[0-9]{10}$/.test(cleanPhone)) {
      return "Invalid phone number (must be 10 digits)";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      return "Invalid email address";
    }
    if (formData.bank_ifsc && !/^[A-Z0-9]{11}$/.test(formData.bank_ifsc.toUpperCase())) {
      return "IFSC code must be 11 characters (alphanumeric)";
    }
    return null;
  };

  const handleSaveChanges = async () => {
    if (!rider) return;

    if (!hasChanges()) {
      setIsEditing(false);
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors) {
      setSaveError(validationErrors);
      toast.error("Validation Error", validationErrors);
      return;
    }

    setSaveLoading(true);
    setSaveError(null);

    try {
      const payload = {};
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== originalFormData[key]) {
          payload[key] = formData[key];
        }
      });

      const response = await updateRider(rider.rider_id, payload);
      const updatedRider = response.data?.data || response.data;
      if (updatedRider) {
        setRider(updatedRider);
        setOriginalFormData(formData);
      }

      setIsEditing(false);
      toast.success("Saved", "Rider details successfully updated.");
    } catch (error) {
      console.error("Rider save failed:", error);
      const msg = error.response?.data?.message || "Failed to save rider changes.";
      setSaveError(msg);
      toast.error("Save Failed", msg);
    } finally {
      setSaveLoading(false);
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
      toast.error(
        "Error",
        err.response?.data?.message || "Failed to reactivate."
      );
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
      toast.success(
        "Type Changed",
        `${rider.full_name} is now ${newType === "TEAM" ? "Team" : "Independent"}.`
      );
      setShowConvertConfirm(false);
      onClose(true);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to convert rider type.";
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

  const DetailRow = ({ label, value, field, type = "text", options }) => {
    if (!isEditing) {
      return (
        <div className="flex justify-between py-2.5 border-b border-gray-100 items-center">
          <span className="text-sm text-gray-500">{label}</span>
          <span className="text-sm font-medium text-gray-900 truncate max-w-[250px]">
            {value || "—"}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5 py-2 border-b border-gray-100">
        <label className="text-xs font-semibold text-gray-500">{label}</label>
        {type === "select" ? (
          <select
            value={formData[field] ?? ""}
            onChange={(e) => handleFormChange(field, e.target.value)}
            className="w-full h-9 px-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            value={formData[field] ?? ""}
            onChange={(e) => handleFormChange(field, e.target.value)}
            rows={2}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        ) : (
          <input
            type={type}
            value={formData[field] ?? ""}
            onChange={(e) => handleFormChange(field, e.target.value)}
            className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => {
          if (isEditing && hasChanges()) {
            if (
              window.confirm(
                "You have unsaved changes. Are you sure you want to close?"
              )
            ) {
              onClose(false);
            }
          } else {
            onClose(false);
          }
        }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white text-lg font-semibold">
                      {displayName}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-red-500/20 text-red-200"
                      }`}
                    >
                      {rider?.status?.replace("_", " ") || basicRider?.status}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        currentType === "TEAM"
                          ? "bg-blue-500/20 text-blue-200"
                          : "bg-white/20 text-white/70"
                      }`}
                    >
                      {currentType}
                    </span>
                    {isEditing && hasChanges() && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">
                    {rider?.phone || basicRider?.phone}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {activeTab === "overview" && !loading && rider && (
                  <>
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saveLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
                        >
                          <X size={16} /> Cancel
                        </button>
                        <button
                          onClick={handleSaveChanges}
                          disabled={saveLoading || !hasChanges()}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-all disabled:opacity-50"
                        >
                          {saveLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {saveLoading ? "Saving..." : "Save Details"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/20 text-white hover:bg-white/30 transition-all"
                      >
                        <Pencil size={16} /> Edit Details
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => {
                    if (isEditing && hasChanges()) {
                      if (
                        window.confirm(
                          "You have unsaved changes. Are you sure you want to close?"
                        )
                      ) {
                        onClose(false);
                      }
                    } else {
                      onClose(false);
                    }
                  }}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {saveError && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700 text-sm animate-in fade-in">
              <AlertCircle size={16} />
              {saveError}
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isEditing && hasChanges() && tab.id !== "overview") {
                      if (
                        !window.confirm(
                          "You have unsaved changes. Switch tab anyway?"
                        )
                      ) {
                        return;
                      }
                      setIsEditing(false);
                      setFormData(originalFormData);
                    }
                    setActiveTab(tab.id);
                    if (tab.id !== "overview") {
                      setIsEditing(false);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all
                  ${
                    activeTab === tab.id
                      ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="p-6 h-[55vh] overflow-auto bg-gray-50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
                <span className="text-sm text-gray-500">Loading details...</span>
              </div>
            ) : !rider ? (
              <p className="text-center text-gray-400 py-20">No data</p>
            ) : activeTab === "overview" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <User size={14} /> Personal Information
                  </h3>
                  <DetailRow
                    label="Full Name"
                    value={rider.full_name}
                    field="full_name"
                  />
                  <DetailRow
                    label="Phone"
                    value={rider.phone}
                    field="phone"
                  />
                  <DetailRow
                    label="Email"
                    value={rider.email}
                    field="email"
                  />
                  <DetailRow
                    label="Date of Birth"
                    value={
                      rider.date_of_birth
                        ? new Date(rider.date_of_birth).toLocaleDateString("en-IN")
                        : null
                    }
                    field="date_of_birth"
                    type="date"
                  />
                  <DetailRow
                    label="Gender"
                    value={rider.sex}
                    field="sex"
                    type="select"
                    options={[
                      { value: "", label: "Select Gender" },
                      { value: "MALE", label: "Male" },
                      { value: "FEMALE", label: "Female" },
                      { value: "OTHER", label: "Other" },
                    ]}
                  />
                  <DetailRow
                    label="City"
                    value={rider.current_city}
                    field="current_city"
                  />
                  <DetailRow
                    label="Residential Address"
                    value={rider.residential_address}
                    field="residential_address"
                    type="textarea"
                  />
                </div>

                {/* Vehicle & Bank Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText size={14} /> Vehicle & Financials
                  </h3>
                  <DetailRow
                    label="Vehicle Type"
                    value={rider.vehicle_type}
                    field="vehicle_type"
                    type="select"
                    options={[
                      { value: "", label: "Select Vehicle Type" },
                      { value: "BIKE", label: "Bike" },
                      { value: "BICYCLE", label: "Bicycle" },
                      { value: "SCOOTER", label: "Scooter" },
                    ]}
                  />
                  <DetailRow
                    label="Vehicle Number"
                    value={rider.vehicle_number}
                    field="vehicle_number"
                  />
                  <DetailRow
                    label="Make/Model"
                    value={rider.vehicle_make_model}
                    field="vehicle_make_model"
                  />
                  <DetailRow
                    label="Bank Holder Name"
                    value={rider.bank_holder_name}
                    field="bank_holder_name"
                  />
                  <DetailRow
                    label="Bank Account Number"
                    value={rider.bank_account_number}
                    field="bank_account_number"
                  />
                  <DetailRow
                    label="Bank Name"
                    value={rider.bank_name}
                    field="bank_name"
                  />
                  <DetailRow
                    label="IFSC Code"
                    value={rider.bank_ifsc}
                    field="bank_ifsc"
                  />
                  <DetailRow
                    label="Bank Verified"
                    value={rider.bank_verified ? "Yes" : "No"}
                    field="bank_verified"
                    type="select"
                    options={[
                      { value: "true", label: "Yes" },
                      { value: "false", label: "No" },
                    ]}
                  />
                </div>

                {/* Performance Stats */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm md:col-span-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp size={14} /> Fleet Stats
                  </h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {rider.rating?.toFixed(1) || "0.0"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Rating</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {rider.total_deliveries || 0}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Deliveries</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">
                        {rider.total_ratings || 0}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Reviews</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            rider.is_online ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                          }`}
                        />
                        <span className="text-sm font-semibold text-gray-900">
                          {rider.is_online ? "Yes" : "No"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Online</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "documents" ? (
              <RiderDocumentsTab
                rider={rider}
                onRefresh={() => fetchDetail(rider.rider_id)}
              />
            ) : (
              <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
                <History size={48} className="mx-auto mb-3 opacity-30" />
                <p>Activity log coming soon.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-white border-t flex items-center justify-between">
            <p className="text-xs text-gray-400">
              ID: {rider?.rider_id || basicRider?.rider_id}
            </p>
            <div className="flex items-center gap-2">
              {/* Convert Type Button */}
              <button
                onClick={() => setShowConvertConfirm(true)}
                disabled={actionLoading || convertLoading || isEditing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-40"
              >
                <ArrowLeftRight size={16} /> Convert to {targetTypeLabel}
              </button>

              {isActive && (
                <button
                  onClick={() => setShowSuspendConfirm(true)}
                  disabled={isEditing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors disabled:opacity-40"
                >
                  <Ban size={16} /> Suspend
                </button>
              )}
              {isSuspended && (
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading || isEditing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-40"
                >
                  <CheckCircle size={16} /> Reactivate
                </button>
              )}
            </div>
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
    </>
  );
};

export default RiderDetailModal;