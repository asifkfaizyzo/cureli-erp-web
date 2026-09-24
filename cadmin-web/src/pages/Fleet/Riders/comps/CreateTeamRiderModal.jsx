// cadmin-web/src/pages/Fleet/Riders/comps/CreateTeamRiderModal.jsx (do not remove this comment)
import { useState } from "react";
import { X, Loader2, UserPlus, FileUp, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "../../../../components/common/Toast";
import { createTeamRider } from "../../../../api/cadminRiders";

const STEPS = [
  { id: "account", label: "Account Info" },
  { id: "personal", label: "Personal & Address" },
  { id: "vehicle", label: "Vehicle & Bank" },
  { id: "documents", label: "Document Uploads" },
];

const CreateTeamRiderModal = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const [activeStep, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields State
  const [form, setForm] = useState({
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
  });

  // Files Selection State
  const [files, setFiles] = useState({
    profile_photo: null,
    dl_front: null,
    dl_back: null,
    aadhaar_front: null,
    aadhaar_back: null,
    pan_front: null,
    vehicle_rc: null,
  });

  if (!isOpen) return null;

  const handleFieldChange = (field, value) => {
    setError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field, e) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [field]: file }));
    }
  };

  // Stepper Validations
  const validateStep = () => {
    if (activeStep === 0) {
      if (!/^[6-9]\d{9}$/.test(form.phone)) return "Enter a valid 10-digit phone number.";
      if (form.password.length < 8) return "Password must be at least 8 characters.";
    }
    if (activeStep === 1) {
      if (!form.full_name.trim()) return "Full name is required.";
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    }
    if (activeStep === 2) {
      if (form.vehicle_number && form.vehicle_number.trim().length < 4) return "Enter a valid vehicle number.";
      if (form.bank_ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.bank_ifsc.toUpperCase())) return "Enter a valid IFSC code.";
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
    setActiveTab((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setError(null);
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
      
      // Append core flat text values
      formData.append("phone", form.phone);
      formData.append("initial_password", form.password);
      formData.append("full_name", form.full_name.trim());
      formData.append("email", form.email.trim());
      formData.append("date_of_birth", form.dob);
      formData.append("sex", form.sex);
      formData.append("current_city", form.city.trim());
      formData.append("residential_address", form.address.trim());
      formData.append("vehicle_type", form.vehicle_type);
      formData.append("vehicle_number", form.vehicle_number.trim().toUpperCase());
      formData.append("vehicle_make_model", form.vehicle_make.trim());
      formData.append("bank_name", form.bank_name.trim());
      formData.append("bank_ifsc", form.bank_ifsc.trim().toUpperCase());
      formData.append("bank_account_number", form.bank_account.trim());
      formData.append("bank_holder_name", form.bank_holder.trim());

      // Append raw S3 document blobs
      if (files.profile_photo) formData.append("profile_photo", files.profile_photo);
      if (files.dl_front) formData.append("driving_license_front", files.dl_front);
      if (files.dl_back) formData.append("driving_license_back", files.dl_back);
      if (files.aadhaar_front) formData.append("aadhaar_front", files.aadhaar_front);
      if (files.aadhaar_back) formData.append("aadhaar_back", files.aadhaar_back);
      if (files.pan_front) formData.append("pan_front", files.pan_front);
      if (files.vehicle_rc) formData.append("vehicle_rc", files.vehicle_rc);

      await createTeamRider(formData);
      toast.success("Rider Activated", `${form.full_name || "Team rider"} created successfully.`);
      
      // Reset State
      setForm({
        phone: "", password: "", full_name: "", email: "", dob: "", sex: "",
        city: "", address: "", vehicle_type: "BIKE", vehicle_number: "",
        vehicle_make: "", bank_name: "", bank_ifsc: "", bank_account: "", bank_holder: "",
      });
      setFiles({
        profile_photo: null, dl_front: null, dl_back: null,
        aadhaar_front: null, aadhaar_back: null, pan_front: null, vehicle_rc: null,
      });

      onClose();
      onSuccess?.();
    } catch (apiErr) {
      setError(apiErr.response?.data?.message || "Failed to onboard team rider.");
    } finally {
      setLoading(false);
    }
  };

  const renderDocInput = (field, label) => (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-semibold">{label}</span>
      <label className="flex items-center justify-center gap-2 border border-dashed rounded-lg p-2.5 bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs text-[#05015A] font-semibold transition-all">
        <FileUp size={14} />
        <span className="truncate max-w-[120px]">{files[field] ? files[field].name : "Select File"}</span>
        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleFileChange(field, e)} />
      </label>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#05015A] to-[#0a0280] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <UserPlus size={20} className="text-white" />
            <div>
              <h2 className="text-white font-semibold text-base">Onboard Team Rider</h2>
              <p className="text-[10px] text-white/70">Create a direct company delivery profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-white/20 text-white hover:bg-white/30"><X size={18} /></button>
        </div>

        {/* Stepper Status Strip */}
        <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex gap-2">
            {STEPS.map((s, idx) => (
              <span key={s.id} className={idx === activeStep ? "text-[#05015A]" : "text-gray-400"}>
                {idx + 1}. {s.label} {idx < STEPS.length - 1 && "→"}
              </span>
            ))}
          </div>
          <span className="text-gray-400">Step {activeStep + 1} of 4</span>
        </div>

        {/* Dynamic Stepper Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeStep === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#05015A]/20">
                  <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r font-semibold">+91</span>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit number"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Initial Password *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-[#05015A]/20"
                />
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => handleFieldChange("full_name", e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="driver@company.com"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => handleFieldChange("dob", e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Gender</label>
                  <select
                    value={form.sex}
                    onChange={(e) => handleFieldChange("sex", e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => handleFieldChange("city", e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    placeholder="Area, block, flat etc."
                    className="w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vehicle Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Type *</label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) => handleFieldChange("vehicle_type", e.target.value)}
                    className="w-full px-3 py-2.5 border rounded-lg text-sm bg-white"
                  >
                    <option value="BIKE">Bike</option>
                    <option value="SCOOTER">Scooter</option>
                    <option value="EV">Electric Vehicle</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={form.vehicle_number}
                    onChange={(e) => handleFieldChange("vehicle_number", e.target.value)}
                    placeholder="e.g. MH02AB1234"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Make & Model</label>
                  <input
                    type="text"
                    value={form.vehicle_make}
                    onChange={(e) => handleFieldChange("vehicle_make", e.target.value)}
                    placeholder="Honda Activa"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bank Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={form.bank_holder}
                    onChange={(e) => handleFieldChange("bank_holder", e.target.value)}
                    placeholder="Name as in passbook"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={form.bank_name}
                    onChange={(e) => handleFieldChange("bank_name", e.target.value)}
                    placeholder="e.g. ICICI Bank"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={form.bank_account}
                    onChange={(e) => handleFieldChange("bank_account", e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter account number"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={form.bank_ifsc}
                    onChange={(e) => handleFieldChange("bank_ifsc", e.target.value)}
                    placeholder="e.g. ICIC0001234"
                    className="w-full px-3 py-2.5 border rounded-lg text-sm font-mono uppercase"
                    maxLength={11}
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <Sparkles size={16} className="shrink-0" />
                <span>Documents are pre-marked as Approved upon S3 uploading. Select images or PDFs.</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {renderDocInput("profile_photo", "Selfie Photo")}
                {renderDocInput("dl_front", "DL Front")}
                {renderDocInput("dl_back", "DL Back")}
                {renderDocInput("aadhaar_front", "Aadhaar Front")}
                {renderDocInput("aadhaar_back", "Aadhaar Back")}
                {renderDocInput("pan_front", "PAN Card Front")}
                {renderDocInput("vehicle_rc", "Vehicle RC")}
              </div>
            </div>
          )}

          {error && <p className="text-xs font-semibold text-red-600 animate-pulse">{error}</p>}
        </div>

        {/* Footer Navigation Bar */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between shrink-0">
          <button
            onClick={handleBack}
            disabled={activeStep === 0 || loading}
            className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-1 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            {activeStep < STEPS.length - 1 ? (
              <button onClick={handleNext} className="px-4 py-2 bg-[#05015A] text-white text-sm font-semibold rounded-lg hover:bg-[#0a0280] flex items-center gap-1">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                Complete Onboarding
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamRiderModal;