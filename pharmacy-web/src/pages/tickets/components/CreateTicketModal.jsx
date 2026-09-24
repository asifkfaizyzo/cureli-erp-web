// pharmacy-web/src/pages/tickets/components/CreateTicketModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/tickets/components/CreateTicketModal.jsx

import { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileText,
  Image,
  Paperclip,
  ChevronDown,
  Lightbulb,
  Check,
} from "lucide-react";
import { createTicket } from "../../../api/tickets";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  TICKET_CATEGORY_OPTIONS,
  TIME_SLOTS,
  ATTACHMENT_CONFIG,
  isValidAttachment,
  formatFileSize,
  UPLOAD_STATUS,
} from "../../../constant/tickets";

/**
 * Compact File Chip Component
 */
const FileChip = ({ file, status, onRemove, disabled }) => {
  const isImage = file.type?.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  const getStatusColor = () => {
    switch (status) {
      case UPLOAD_STATUS.UPLOADING:
        return "bg-indigo-50 border-indigo-200 text-indigo-700";
      case UPLOAD_STATUS.SUCCESS:
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case UPLOAD_STATUS.ERROR:
        return "bg-red-50 border-red-200 text-red-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getFileIcon = () => {
    if (isImage)
      return <Image size={12} className="text-blue-500 flex-shrink-0" />;
    if (isPdf)
      return <FileText size={12} className="text-red-500 flex-shrink-0" />;
    return <FileText size={12} className="text-gray-500 flex-shrink-0" />;
  };

  const truncateName = (name, maxLen = 15) => {
    if (name.length <= maxLen) return name;
    const ext = name.split(".").pop();
    const baseName = name.substring(0, maxLen - ext.length - 4);
    return `${baseName}...${ext}`;
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor()}`}
    >
      {getFileIcon()}
      <span className="truncate" title={file.name}>
        {truncateName(file.name)}
      </span>
      {status === UPLOAD_STATUS.UPLOADING && (
        <Loader2 size={10} className="animate-spin flex-shrink-0" />
      )}
      {status === UPLOAD_STATUS.SUCCESS && (
        <CheckCircle size={10} className="flex-shrink-0" />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled || status === UPLOAD_STATUS.UPLOADING}
        className="p-0.5 hover:bg-black/10 rounded transition-colors disabled:opacity-50 flex-shrink-0"
        title="Remove"
      >
        <X size={10} />
      </button>
    </div>
  );
};

/**
 * Custom Select Component with proper dropdown positioning
 * Opens upward when near bottom of screen
 */
const CustomSelect = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const selectRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;

    // Calculate if dropdown should open upward
    if (!isOpen && selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = Math.min(options.length * 36, 200); // Approximate dropdown height

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }

    setIsOpen(!isOpen);
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={selectRef}>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-sm text-left
          border rounded-lg transition-all
          ${disabled ? "bg-gray-50 cursor-not-allowed text-gray-400" : "bg-white cursor-pointer hover:border-gray-400"}
          ${error ? "border-red-400" : isOpen ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-gray-300"}
        `}
      >
        <span
          className={selectedOption?.value ? "text-gray-900" : "text-gray-400"}
        >
          {selectedOption?.label || placeholder || "Select..."}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-[100] w-full bg-white border border-gray-200 rounded-lg shadow-lg
            max-h-[200px] overflow-auto
            ${dropdownPosition === "top" ? "bottom-full mb-1" : "top-full mt-1"}
          `}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-sm text-left
                hover:bg-indigo-50 transition-colors
                ${option.value === value ? "bg-indigo-50 text-indigo-700" : "text-gray-700"}
                ${!option.value ? "text-gray-400" : ""}
              `}
            >
              <span>{option.label}</span>
              {option.value === value && option.value && (
                <Check size={14} className="text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-[10px] text-red-500 mt-1">{error}</p>}
    </div>
  );
};

/**
 * Main CreateTicketModal Component - True 3-Column Layout
 */
const CreateTicketModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    contact_number: "",
    category: "",
    subject: "",
    description: "",
    other_category_text: "",
    preferred_slot: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const categoryOptions = [
    { label: "Select category", value: "" },
    ...TICKET_CATEGORY_OPTIONS.map((opt) => ({
      label: opt.label,
      value: opt.value,
    })),
  ];

  const timeSlotOptions = [
    { label: "Select time", value: "" },
    ...TIME_SLOTS.map((slot) => ({ label: slot.label, value: slot.value })),
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        contact_number: user?.phone_number || "",
        category: "",
        subject: "",
        description: "",
        other_category_text: "",
        preferred_slot: "",
      });
      setAttachments([]);
      setErrors({});
      setUploadError("");
    }
  }, [isOpen, user]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadError("");
    if (files.length === 0) return;

    const remainingSlots = ATTACHMENT_CONFIG.MAX_FILES - attachments.length;
    if (files.length > remainingSlots) {
      setUploadError(`Max ${ATTACHMENT_CONFIG.MAX_FILES} files`);
      return;
    }

    const newAttachments = [];
    for (const file of files) {
      const validation = isValidAttachment(file);
      if (validation.valid) {
        newAttachments.push({
          file,
          status: UPLOAD_STATUS.SUCCESS,
          error: null,
        });
      } else {
        setUploadError(validation.error);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments([...attachments, ...newAttachments]);
    }
    if (e.target) e.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
    setUploadError("");
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.contact_number) newErrors.contact_number = "Required";
    else if (!/^[0-9]{10}$/.test(formData.contact_number))
      newErrors.contact_number = "10 digits required";
    if (!formData.category) newErrors.category = "Required";
    if (formData.category === "OTHER" && !formData.other_category_text?.trim())
      newErrors.other_category_text = "Required";
    if (!formData.subject || formData.subject.trim().length < 5)
      newErrors.subject = "Min 5 characters";
    if (!formData.preferred_slot) newErrors.preferred_slot = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setAttachments((prev) =>
      prev.map((att) => ({ ...att, status: UPLOAD_STATUS.UPLOADING })),
    );

    try {
      const payload = {
        contact_number: formData.contact_number,
        category: formData.category,
        subject: formData.subject.trim(),
        preferred_slot: formData.preferred_slot,
      };

      if (formData.description?.trim())
        payload.description = formData.description.trim();
      if (
        formData.category === "OTHER" &&
        formData.other_category_text?.trim()
      ) {
        payload.other_category_text = formData.other_category_text.trim();
      }
      if (user?.branch_id) payload.branch_id = user.branch_id;

      const files = attachments.map((att) => att.file);
      if (files.length > 0) payload.attachments = files;

      await createTicket(payload);
      setAttachments((prev) =>
        prev.map((att) => ({ ...att, status: UPLOAD_STATUS.SUCCESS })),
      );
      onSuccess();
    } catch (err) {
      console.error("Failed to create ticket:", err);
      setAttachments((prev) =>
        prev.map((att) => ({ ...att, status: UPLOAD_STATUS.ERROR })),
      );

      let errorMessage = "Failed to create ticket.";
      if (err.response?.data?.message) errorMessage = err.response.data.message;
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const remainingSlots = ATTACHMENT_CONFIG.MAX_FILES - attachments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh] overflow-y-visible">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            Create Support Ticket
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form - True 3-Column Layout with overflow visible for dropdowns */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-5 flex-1 overflow-visible"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ========== COLUMN 1 ========== */}
            <div className="space-y-4">
              {/* Contact Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_number: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="10-digit number"
                  maxLength={10}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-50 ${
                    errors.contact_number ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.contact_number && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.contact_number}
                  </p>
                )}
              </div>

              {/* Category - Using Custom Select */}
              <CustomSelect
                label={
                  <>
                    Category <span className="text-red-500">*</span>
                  </>
                }
                value={formData.category}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    category: value,
                    other_category_text: "",
                  })
                }
                options={categoryOptions}
                placeholder="Select category"
                error={errors.category}
                disabled={loading}
              />

              {/* Other Category (conditional) */}
              {formData.category === "OTHER" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Specify Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.other_category_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        other_category_text: e.target.value,
                      })
                    }
                    placeholder="Type of issue"
                    maxLength={100}
                    disabled={loading}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-50 ${
                      errors.other_category_text
                        ? "border-red-400"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.other_category_text && (
                    <p className="text-[10px] text-red-500 mt-1">
                      {errors.other_category_text}
                    </p>
                  )}
                </div>
              )}

              {/* Time Slot - Using Custom Select */}
              <CustomSelect
                label={
                  <>
                    Preferred Time <span className="text-red-500">*</span>
                  </>
                }
                value={formData.preferred_slot}
                onChange={(value) =>
                  setFormData({ ...formData, preferred_slot: value })
                }
                options={timeSlotOptions}
                placeholder="Select time"
                error={errors.preferred_slot}
                disabled={loading}
              />
            </div>

            {/* ========== COLUMN 2 ========== */}
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {formData.subject.length}/200
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Brief summary of your issue"
                  maxLength={200}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:bg-gray-50 ${
                    errors.subject ? "border-red-400" : "border-gray-300"
                  }`}
                />
                {errors.subject && (
                  <p className="text-[10px] text-red-500 mt-1">
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">
                    Description
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {formData.description.length}/2000
                  </span>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={6}
                  maxLength={2000}
                  placeholder="Provide additional details..."
                  disabled={loading}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* ========== COLUMN 3 ========== */}
            <div className="space-y-4">
              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                    <Paperclip size={12} />
                    Attachments
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {attachments.length}/{ATTACHMENT_CONFIG.MAX_FILES} files
                  </span>
                </div>

                {/* Upload Area */}
                {remainingSlots > 0 && (
                  <label
                    className={`
                      flex flex-col items-center justify-center gap-2 p-4 mb-3
                      border-2 border-dashed rounded-lg cursor-pointer transition-all
                      ${
                        loading
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                          : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50"
                      }
                    `}
                  >
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Upload size={18} className="text-gray-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-700">
                        Click to upload
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        Images & PDFs • Max {ATTACHMENT_CONFIG.MAX_SIZE_MB}MB
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept={ATTACHMENT_CONFIG.ALLOWED_TYPES.join(",")}
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                )}

                {/* File List */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                      <FileChip
                        key={`${attachment.file.name}-${index}`}
                        file={attachment.file}
                        status={attachment.status}
                        onRemove={() => handleRemoveFile(index)}
                        disabled={loading}
                      />
                    ))}
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                    <AlertCircle size={12} />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="flex items-center gap-1 text-xs text-blue-800 font-medium mb-1">
                  <Lightbulb size={11} /> Tips
                </p>
                <ul className="text-[10px] text-blue-700 space-y-0.5">
                  <li>• Provide a clear subject for faster resolution</li>
                  <li>• Include screenshots if applicable</li>
                  <li>• We typically respond within 24 hours</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Error - Full Width */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end rounded-b-2xl gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium bg-[#05015A] text-white rounded-lg hover:bg-[#06027a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus size={14} />
                <span>Create Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;
