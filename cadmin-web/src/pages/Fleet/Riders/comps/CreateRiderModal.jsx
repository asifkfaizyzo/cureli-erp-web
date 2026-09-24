// cadmin-web/src/pages/Fleet/Riders/comps/CreateRiderModal.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Riders/comps/CreateRiderModal.jsx

import { useState } from "react";
import {
  X,
  Loader2,
  UserPlus,
  FileUp,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Users,
  User,
  Phone,
  Lock,
  Mail,
  Calendar as CalendarIcon,
  MapPin,
  Bike,
  CreditCard,
  IdCard,
} from "lucide-react";
import { useToast } from "../../../../components/common/Toast";
import { createTeamRider } from "../../../../api/cadminRiders";
import StyledSelect from "../../../../components/common/StyledSelect";
import StyledDateFilter from "../../../../components/common/StyledDateFilter";

const STEPS = [
  { id: "account", label: "Account Info" },
  { id: "personal", label: "Personal & Address" },
  { id: "vehicle", label: "Vehicle & Bank" },
  { id: "documents", label: "Document Uploads" },
];

const REQUIRED_DOCS = [
  { field: "profile_photo", label: "Selfie Photo" },
  { field: "dl_front", label: "DL Front" },
  { field: "dl_back", label: "DL Back" },
  { field: "aadhaar_front", label: "Aadhaar Front" },
  { field: "aadhaar_back", label: "Aadhaar Back" },
  { field: "pan_front", label: "PAN Card Front" },
  { field: "vehicle_rc", label: "Vehicle RC" },
];

const INITIAL_FORM = {
  rider_type: "TEAM",
  phone: "",
  password: "",
  full_name: "",
  email: "",
  dob: "",
  sex: "",
  city: "",
  address: "",
  vehicle_type: "BIKE",
  vehicle_number: "",
  vehicle_make: "",
  bank_name: "",
  bank_ifsc: "",
  bank_account: "",
  bank_holder: "",
};

const INITIAL_FILES = {
  profile_photo: null,
  dl_front: null,
  dl_back: null,
  aadhaar_front: null,
  aadhaar_back: null,
  pan_front: null,
  vehicle_rc: null,
};

const GENDER_OPTIONS = [
  { value: "", label: "Select Gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const VEHICLE_TYPES = [
  { value: "BIKE", label: "Bike" },
  { value: "SCOOTER", label: "Scooter" },
  { value: "EV", label: "Electric Vehicle" },
  { value: "OTHER", label: "Other" },
];

// Simple input wrapper with focus / error styling (inspired by AddAdminModal FormInput)
function TextField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  maxLength,
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
        {Icon && <Icon size={12} className="text-gray-400" />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 border-2 rounded-xl text-sm
                   font-medium placeholder:font-normal placeholder:text-gray-300
                   focus:outline-none focus:border-[#05015A] focus:shadow-[0_0_0_2px_rgba(5,1,90,0.08)]
                   border-gray-200 bg-white hover:border-gray-300"
      />
    </div>
  );
}

const CreateRiderModal = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [activeStep, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [missingDocs, setMissingDocs] = useState([]);

  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [files, setFiles] = useState({ ...INITIAL_FILES });

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setError(null);
    setMissingDocs([]);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      setError(null);
      setMissingDocs((prev) => prev.filter((f) => f !== field));
      setFiles((prev) => ({ ...prev, [field]: file }));
    }
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!/^[6-9]\d{9}$/.test(form.phone))
        return "Enter a valid 10-digit phone number.";
      if (form.password.length < 8)
        return "Password must be at least 8 characters.";
    }
    if (activeStep === 1) {
      if (!form.full_name.trim()) return "Full name is required.";
      if (
        form.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      )
        return "Enter a valid email.";
    }
    if (activeStep === 2) {
      if (form.vehicle_number && form.vehicle_number.trim().length < 4)
        return "Enter a valid vehicle number.";
      if (
        form.bank_ifsc &&
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bank_ifsc.toUpperCase())
      )
        return "Enter a valid IFSC code.";
    }
    if (activeStep === 3) {
      const missing = REQUIRED_DOCS.filter((d) => !files[d.field]).map(
        (d) => d.field,
      );
      if (missing.length > 0) {
        setMissingDocs(missing);
        return `Please upload all required documents (${missing.length} missing).`;
      }
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setMissingDocs([]);
    setActiveTab((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
    setMissingDocs([]);
    setActiveTab((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("rider_type", form.rider_type);
      formData.append("phone", form.phone);
      formData.append("initial_password", form.password);
      formData.append("full_name", form.full_name.trim());
      formData.append("email", form.email.trim());
      formData.append("date_of_birth", form.dob);
      formData.append("sex", form.sex);
      formData.append("current_city", form.city.trim());
      formData.append("residential_address", form.address.trim());
      formData.append("vehicle_type", form.vehicle_type);
      formData.append(
        "vehicle_number",
        form.vehicle_number.trim().toUpperCase(),
      );
      formData.append("vehicle_make_model", form.vehicle_make.trim());
      formData.append("bank_name", form.bank_name.trim());
      formData.append("bank_ifsc", form.bank_ifsc.trim().toUpperCase());
      formData.append("bank_account_number", form.bank_account.trim());
      formData.append("bank_holder_name", form.bank_holder.trim());

      formData.append("profile_photo", files.profile_photo);
      formData.append("driving_license_front", files.dl_front);
      formData.append("driving_license_back", files.dl_back);
      formData.append("aadhaar_front", files.aadhaar_front);
      formData.append("aadhaar_back", files.aadhaar_back);
      formData.append("pan_front", files.pan_front);
      formData.append("vehicle_rc", files.vehicle_rc);

      await createTeamRider(formData);
      const typeLabel = form.rider_type === "TEAM" ? "Team" : "Independent";
      toast.success(
        "Rider Activated",
        `${form.full_name || typeLabel + " rider"} created successfully.`,
      );

      setForm({ ...INITIAL_FORM });
      setFiles({ ...INITIAL_FILES });
      setMissingDocs([]);
      setActiveTab(0);

      onClose();
      onSuccess?.();
    } catch (apiErr) {
      const msg =
        apiErr.response?.data?.message || "Failed to onboard rider.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderDocInput = (field, label) => {
    const isMissing = missingDocs.includes(field);
    return (
      <div className="flex flex-col gap-1" key={field}>
        <span
          className={`text-xs font-semibold ${
            isMissing ? "text-red-600" : "text-gray-600"
          }`}
        >
          {label} <span className="text-red-500">*</span>
        </span>
        <label
          className={`flex items-center justify-between gap-2 border rounded-xl px-3 py-2.5 cursor-pointer text-xs font-semibold transition-all
            ${
              isMissing
                ? "border-red-400 bg-red-50 text-red-600 hover:bg-red-100"
                : files[field]
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-dashed border-gray-300 bg-gray-50 text-[#05015A] hover:bg-gray-100"
            }`}
        >
          <span className="flex items-center gap-2">
            <FileUp size={14} />
            <span className="truncate max-w-[140px]">
              {files[field] ? files[field].name : "Select file"}
            </span>
          </span>
          {files[field] && (
            <span className="text-[10px] text-emerald-700 font-medium">
              Uploaded
            </span>
          )}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFileChange(field, e)}
          />
        </label>
      </div>
    );
  };

  const typeLabel = form.rider_type === "TEAM" ? "Team" : "Independent";
  const progress = ((activeStep + 1) / STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#05015A] to-[#0a0280] flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
              <UserPlus size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">
                Onboard {typeLabel} Rider
              </h2>
              <p className="text-[11px] text-white/70">
                Create a direct company delivery profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-3 pb-2 border-b bg-gray-50/70 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-2 flex-wrap">
              {STEPS.map((s, idx) => {
                const isActive = idx === activeStep;
                const isCompleted = idx < activeStep;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all
                      ${
                        isActive
                          ? "bg-[#05015A] text-white shadow-sm"
                          : isCompleted
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-white text-gray-500 border border-gray-200"
                      }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold
                        ${
                          isActive
                            ? "bg-white/20"
                            : isCompleted
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-200 text-gray-600"
                        }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
            <span className="text-[11px] text-gray-500">
              Step {activeStep + 1} of {STEPS.length}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#05015A] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
          {activeStep === 0 && (
            <div className="space-y-5">
              {/* Rider Type */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Users size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Rider Type
                  </h3>
                </div>
                <div className="inline-flex rounded-xl bg-gray-100/70 p-1 gap-1">
                  {["TEAM", "INDEPENDENT"].map((t) => {
                    const isSelected = form.rider_type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleFieldChange("rider_type", t)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all
                          ${
                            isSelected
                              ? "bg-white text-[#05015A] shadow-sm border border-[#05015A]/30"
                              : "text-gray-500 border border-transparent hover:border-gray-300"
                          }`}
                      >
                        {t === "TEAM" ? (
                          <Users
                            size={14}
                            className={
                              isSelected ? "text-[#05015A]" : "text-gray-400"
                            }
                          />
                        ) : (
                          <User
                            size={14}
                            className={
                              isSelected ? "text-[#05015A]" : "text-gray-400"
                            }
                          />
                        )}
                        <span>
                          {t === "TEAM" ? "Team Rider" : "Independent Rider"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {form.rider_type === "TEAM"
                    ? "Managed directly by your fleet. Auto-verified on creation."
                    : "Independent contractor. Auto-verified on creation."}
                </p>
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Phone size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Account Info
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center border-2 rounded-xl overflow-hidden focus-within:border-[#05015A] focus-within:shadow-[0_0_0_2px_rgba(5,1,90,0.08)] bg-white border-gray-200">
                      <span className="px-3 py-2.5 bg-gray-50 text-gray-600 text-xs border-r font-semibold">
                        +91
                      </span>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) =>
                          handleFieldChange(
                            "phone",
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        placeholder="10-digit number"
                        className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <TextField
                    label="Initial Password"
                    icon={Lock}
                    type="password"
                    value={form.password}
                    onChange={(val) => handleFieldChange("password", val)}
                    placeholder="Min 8 characters"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-5">
              {/* Personal */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Personal Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="Full Name"
                    icon={User}
                    value={form.full_name}
                    onChange={(val) => handleFieldChange("full_name", val)}
                    placeholder="Enter full name"
                    required
                  />
                  <TextField
                    label="Email"
                    icon={Mail}
                    type="email"
                    value={form.email}
                    onChange={(val) => handleFieldChange("email", val)}
                    placeholder="driver@company.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {/* Date of Birth using StyledDateFilter */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Date of Birth
                    </label>
                    <StyledDateFilter
                      date={form.dob}
                      setDate={(dateStr) => handleFieldChange("dob", dateStr)}
                    />
                  </div>

                  {/* Gender using StyledSelect */}
                  <StyledSelect
                    label="Gender"
                    value={form.sex}
                    onChange={(val) => handleFieldChange("sex", val)}
                    options={GENDER_OPTIONS}
                    placeholder="Select Gender"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <MapPin size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Address Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      City
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) =>
                          handleFieldChange("city", e.target.value)
                        }
                        placeholder="e.g. Mumbai"
                        className="w-full pl-8 pr-3 py-2.5 border-2 rounded-xl text-sm focus:border-[#05015A] focus:shadow-[0_0_0_2px_rgba(5,1,90,0.08)] bg-white border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        handleFieldChange("address", e.target.value)
                      }
                      placeholder="Area, block, flat etc."
                      className="w-full px-3 py-2.5 border-2 rounded-xl text-sm focus:border-[#05015A] focus:shadow-[0_0_0_2px_rgba(5,1,90,0.08)] bg-white border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-6">
              {/* Vehicle */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Bike size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Vehicle Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StyledSelect
                    label="Type"
                    value={form.vehicle_type}
                    onChange={(val) => handleFieldChange("vehicle_type", val)}
                    options={VEHICLE_TYPES}
                    placeholder="Select type"
                  />
                  <TextField
                    label="Vehicle Number"
                    icon={IdCard}
                    value={form.vehicle_number}
                    onChange={(val) =>
                      handleFieldChange("vehicle_number", val)
                    }
                    placeholder="e.g. MH02AB1234"
                  />
                  <TextField
                    label="Make & Model"
                    icon={Bike}
                    value={form.vehicle_make}
                    onChange={(val) => handleFieldChange("vehicle_make", val)}
                    placeholder="Honda Activa"
                  />
                </div>
              </div>

              {/* Bank */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <CreditCard size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Bank Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    label="Account Holder Name"
                    value={form.bank_holder}
                    onChange={(val) => handleFieldChange("bank_holder", val)}
                    placeholder="Name as in passbook"
                  />
                  <TextField
                    label="Bank Name"
                    value={form.bank_name}
                    onChange={(val) => handleFieldChange("bank_name", val)}
                    placeholder="e.g. ICICI Bank"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <TextField
                    label="Bank Account Number"
                    value={form.bank_account}
                    onChange={(val) =>
                      handleFieldChange(
                        "bank_account",
                        val.replace(/\D/g, ""),
                      )
                    }
                    placeholder="Enter account number"
                  />
                  <TextField
                    label="IFSC Code"
                    value={form.bank_ifsc}
                    onChange={(val) => handleFieldChange("bank_ifsc", val)}
                    placeholder="e.g. ICIC0001234"
                    maxLength={11}
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-5">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                <Sparkles size={16} className="shrink-0 mt-0.5 text-amber-500" />
                <span>
                  All 7 documents are <strong>mandatory</strong>. They will be
                  auto-approved upon upload.
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {REQUIRED_DOCS.map((d) => renderDocInput(d.field, d.label))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs font-semibold text-red-600 animate-pulse mt-1">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t flex justify-between items-center shrink-0">
          <button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex gap-2 items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            {activeStep < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-[#05015A] text-white text-sm font-semibold rounded-lg hover:bg-[#0a0280] flex items-center gap-1.5"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 font-semibold"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                Complete Onboarding
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRiderModal;