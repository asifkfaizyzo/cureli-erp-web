// pharmacy-web/src/pages/verification/comps/DocumentResubmission.jsx (do not remove this comment)
// src/components/verification/DocumentResubmission.jsx

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Upload,
  Loader2,
  FileText,
  CheckCircle2,
  XCircle,
  X,
  File,
  Image as ImageIcon,
  Send,
  Eye,
} from "lucide-react";
import { getRejectedFiles, resubmitFile } from "../../../api/shopFiles";

const FILE_TYPE_LABELS = {
  drug_license: "Drug License",
  pharmacy_registration: "Pharmacy Registration",
  gst_certificate: "GST Certificate",
  business_registration_proof: "Business Registration",
  shop_establishment_license: "Establishment License",
  address_proof: "Address Proof",
  pan_card: "Business PAN Card",
  fssai_license: "FSSAI License",
};

const getFileIcon = (file) => {
  if (!file) return FileText;
  if (file.type === "application/pdf") return File;
  if (file.type.startsWith("image/")) return ImageIcon;
  return FileText;
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const DocumentResubmission = ({ refreshStatus }) => {
  const [loading, setLoading] = useState(true);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [allResubmitted, setAllResubmitted] = useState(false);

  const fileInputRefs = useRef({});

  useEffect(() => {
    fetchRejectedFiles();
  }, []);

  const fetchRejectedFiles = async () => {
    try {
      setError("");
      const res = await getRejectedFiles();
      const files = res.data?.data?.files || [];
      setRejectedFiles(files);
      if (files.length === 0) setAllResubmitted(true);
    } catch (err) {
      console.error("Failed to fetch rejected files:", err);
      setError(err.response?.data?.message || "Failed to load rejected documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file_id, selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Invalid file format. Please use PDF, JPEG, or PNG.");
      return;
    }

    if (selectedFile.size > maxSize) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }

    setError("");
    setSelectedFiles((prev) => ({ ...prev, [file_id]: selectedFile }));
    setUploadProgress((prev) => {
      const updated = { ...prev };
      delete updated[file_id];
      return updated;
    });
  };

  const removeSelectedFile = (file_id) => {
    setSelectedFiles((prev) => {
      const updated = { ...prev };
      delete updated[file_id];
      return updated;
    });
    if (fileInputRefs.current[file_id]) {
      fileInputRefs.current[file_id].value = "";
    }
  };

  const triggerFileInput = (file_id) => {
    fileInputRefs.current[file_id]?.click();
  };

  const allFilesSelected = rejectedFiles.length > 0 && 
    rejectedFiles.every((file) => selectedFiles[file.file_id]);

  const selectedCount = Object.keys(selectedFiles).length;
  const totalCount = rejectedFiles.length;

  const handleResubmitAll = async () => {
    if (!allFilesSelected || submitting) return;

    setSubmitting(true);
    setError("");

    const initialProgress = {};
    rejectedFiles.forEach((file) => {
      initialProgress[file.file_id] = "pending";
    });
    setUploadProgress(initialProgress);

    let hasError = false;

    for (const file of rejectedFiles) {
      setUploadProgress((prev) => ({ ...prev, [file.file_id]: "uploading" }));

      const formData = new FormData();
      formData.append("file", selectedFiles[file.file_id]);

      try {
        await resubmitFile(file.file_id, formData);
        setUploadProgress((prev) => ({ ...prev, [file.file_id]: "success" }));
      } catch (err) {
        console.error("Upload failed for:", file.file_id, err);
        setUploadProgress((prev) => ({ ...prev, [file.file_id]: "error" }));
        hasError = true;
      }
    }

    setSubmitting(false);

    if (!hasError) {
      setTimeout(() => setAllResubmitted(true), 1500);
    } else {
      setError("Some files failed to upload. Please try again.");
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#000060] animate-spin" />
      </div>
    );
  }

  // Success State
  if (allResubmitted || rejectedFiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center py-8 px-4"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
        >
          <CheckCircle2 size={32} className="text-green-600" />
        </motion.div>
        <h2 className="text-xl font-semibold text-[#000060] text-center mb-2">
          All Documents Resubmitted!
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6 max-w-sm">
          Your documents are under review. We'll notify you once complete.
        </p>
        <button
          onClick={() => refreshStatus?.()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#000060] text-white rounded-lg text-sm font-medium hover:bg-[#000060]/90 transition"
        >
          <Eye size={16} />
          View Status
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pb-4 font-poppins">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 mb-4 border border-red-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#000060]">
                  Resubmission Required
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {totalCount} document{totalCount > 1 ? "s" : ""} need correction
                </p>
              </div>
              {/* Compact Progress */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-24 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-[#000060] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#000060] whitespace-nowrap">
                  {selectedCount}/{totalCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2"
          >
            <XCircle className="text-red-500 flex-shrink-0" size={16} />
            <p className="text-red-700 text-xs flex-1">{error}</p>
            <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Grid - 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {rejectedFiles.map((file, index) => {
          const isSelected = !!selectedFiles[file.file_id];
          const selectedFile = selectedFiles[file.file_id];
          const progress = uploadProgress[file.file_id];
          const FileIcon = selectedFile ? getFileIcon(selectedFile) : FileText;

          return (
            <motion.div
              key={file.file_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                bg-white rounded-xl border transition-all duration-200 overflow-hidden
                ${progress === "success" 
                  ? "border-green-300 bg-green-50/50" 
                  : progress === "error"
                  ? "border-red-300"
                  : isSelected 
                  ? "border-[#000060] ring-1 ring-[#000060]/20" 
                  : "border-gray-200 hover:border-gray-300"
                }
              `}
            >
              {/* Card Header */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${progress === "success" ? "bg-green-100" : progress === "error" ? "bg-red-100" : "bg-gray-100"}
                  `}>
                    {progress === "success" ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : progress === "uploading" ? (
                      <Loader2 size={16} className="text-[#000060] animate-spin" />
                    ) : (
                      <FileText size={16} className="text-gray-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm text-gray-800 truncate">
                      {FILE_TYPE_LABELS[file.file_type] || file.file_type}
                    </h3>
                    {file.resubmission_count > 0 && (
                      <span className="text-[10px] text-amber-600">
                        {file.resubmission_count}x resubmitted
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Always Visible Rejection Reason */}
              <div className="px-3 py-2 bg-red-50 border-b border-red-100">
                <p className="text-xs text-red-700 leading-relaxed">
                  <span className="font-medium">Reason: </span>
                  {file.verification_notes || "Document could not be verified. Please resubmit."}
                </p>
              </div>

              {/* Upload Area */}
              <div className="p-3">
                <input
                  type="file"
                  ref={(el) => (fileInputRefs.current[file.file_id] = el)}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileSelect(file.file_id, e.target.files[0])}
                />

                {isSelected ? (
                  <div className="flex items-center justify-between gap-2 p-2 bg-[#000060]/5 rounded-lg border border-dashed border-[#000060]/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileIcon size={18} className="text-[#000060] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    {!submitting && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => triggerFileInput(file.file_id)}
                          className="px-2 py-1 text-[10px] font-medium text-[#000060] bg-white border border-[#000060]/20 rounded hover:bg-[#000060]/10 transition"
                        >
                          Change
                        </button>
                        <button
                          onClick={() => removeSelectedFile(file.file_id)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => triggerFileInput(file.file_id)}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-[#000060] hover:bg-[#000060]/5 transition group disabled:opacity-50"
                  >
                    <Upload size={16} className="text-gray-400 group-hover:text-[#000060]" />
                    <span className="text-xs text-gray-500 group-hover:text-[#000060] font-medium">
                      Upload File
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sticky Submit Bar */}
      <div className="sticky bottom-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Progress */}
            <div className="sm:hidden flex items-center gap-2">
              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-[#000060] h-1.5 rounded-full transition-all"
                  style={{ width: `${(selectedCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600">{selectedCount}/{totalCount}</span>
            </div>
            
            <p className="text-xs text-gray-500 hidden sm:block">
              {allFilesSelected ? (
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  Ready to submit
                </span>
              ) : (
                `${totalCount - selectedCount} remaining`
              )}
            </p>
          </div>

          <button
            onClick={handleResubmitAll}
            disabled={!allFilesSelected || submitting}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${allFilesSelected && !submitting
                ? "bg-[#000060] text-white hover:bg-[#000060]/90 shadow-md"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span className="hidden sm:inline">Submitting...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span className="hidden sm:inline">Resubmit All</span>
                <span className="sm:hidden">Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentResubmission;