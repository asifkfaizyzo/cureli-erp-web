// cadmin-web/src/pages/User-Shop-Verifications/comps/VerificationModal.jsx (do not remove this comment)
// cadmin-web/src/components/Verification/VerificationModal.jsx

import {
  X,
  User,
  Building2,
  FileText,
  AlertTriangle,
  Loader2,
  Save,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import DocumentCard from "./DocumentCard";
import VerificationDetailsTop from "./VerificationDetailsTop";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/Toast";
import {
  getShopVerificationDetail,
  batchUpdateFiles,
} from "../../../api/cadminDocs";

//  UPDATED: Helper function to generate file URL
const getFileUrl = (storageKey) => {
  if (!storageKey) return null;
  if (storageKey.startsWith("http")) return storageKey;

  const baseURL = import.meta.env.VITE_API_URL;
  // Backend serves files via /api/files/:folder/:filename
  // storage_key contains just the filename (e.g., "1234567890-abcdef12.jpg")
  return `${baseURL}/api/files/shop_files/${storageKey}`;
};

const VerificationModal = ({ shop, onClose }) => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shopData, setShopData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [originalDocuments, setOriginalDocuments] = useState([]);

  // Rejection dialog
  const [rejectingFileId, setRejectingFileId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch shop detail + files on mount
  useEffect(() => {
    fetchShopDetails();
  }, [shop?.shop_id]);

  const fetchShopDetails = async () => {
    if (!shop?.shop_id) {
      const errorMsg = "No shop ID provided";
      setError(errorMsg);
      setLoading(false);
      toast.error("Invalid Request", errorMsg);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resp = await getShopVerificationDetail(shop.shop_id);
      const payload = resp.data?.data || {};

      if (!payload.shop) {
        throw new Error("Invalid response structure");
      }

      setShopData(payload.shop);

      //  UPDATED: Use getFileUrl helper for pdfUrl
      const mappedDocs = (payload.files || []).map((f) => ({
        file_id: f.file_id,
        name: f.original_name || f.file_type || "Document",
        file_type: f.file_type,
        date: f.uploaded_at
          ? new Date(f.uploaded_at).toLocaleDateString()
          : "N/A",
        uploader: "Shop Owner",
        size: f.file_size ? `${(f.file_size / 1024).toFixed(0)} KB` : "N/A",
        status:
          f.status === "verified"
            ? "approved"
            : f.status === "rejected"
              ? "failed"
              : "normal",
        originalStatus: f.status,
        reason: f.verification_notes || "",
        resubmission_count: f.resubmission_count || 0,
        storage_key: f.storage_key,
        mime_type: f.mime_type,
        //  UPDATED: Use new URL format
        pdfUrl: f.storage_key ? getFileUrl(f.storage_key) : null,
      }));

      setDocuments(mappedDocs);
      setOriginalDocuments(JSON.parse(JSON.stringify(mappedDocs)));
    } catch (err) {
      console.error("Failed to fetch shop detail:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load shop details";
      setError(errorMsg);
      setShopData(null);
      setDocuments([]);
      toast.error("Failed to Load", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && !rejectingFileId) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [rejectingFileId, hasUnsavedChanges]);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = documents.some((doc, index) => {
      const original = originalDocuments[index];
      if (!original) return false;
      return doc.status !== original.status || doc.reason !== original.reason;
    });
    setHasUnsavedChanges(hasChanges);
  }, [documents, originalDocuments]);

  // Validation - requires all 6 reviewed
  const canSave = useMemo(() => {
    if (!hasUnsavedChanges) return false;

    // Must review ALL documents
    const allReviewed = documents.every(
      (d) => d.status === "approved" || d.status === "failed",
    );
    if (!allReviewed) return false;

    // All rejected must have reasons
    const rejectedWithoutReason = documents.some(
      (d) => d.status === "failed" && (!d.reason || !d.reason.trim()),
    );
    if (rejectedWithoutReason) return false;

    return true;
  }, [documents, hasUnsavedChanges]);

  // Get summary stats
  const stats = useMemo(
    () => ({
      total: documents.length,
      approved: documents.filter((d) => d.status === "approved").length,
      rejected: documents.filter((d) => d.status === "failed").length,
      pending: documents.filter((d) => d.status === "normal").length,
    }),
    [documents],
  );

  // Handlers
  const handleApprove = (file_id) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.file_id === file_id ? { ...d, status: "approved", reason: "" } : d,
      ),
    );
  };

  const handleRejectClick = (file_id) => {
    setRejectingFileId(file_id);
    const doc = documents.find((d) => d.file_id === file_id);
    setRejectionReason(doc?.reason || "");
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error(
        "Rejection Reason Required",
        "Please provide a reason for rejection.",
      );
      return;
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.file_id === rejectingFileId
          ? { ...d, status: "failed", reason: rejectionReason.trim() }
          : d,
      ),
    );

    setRejectingFileId(null);
    setRejectionReason("");
  };

  const cancelReject = () => {
    setRejectingFileId(null);
    setRejectionReason("");
  };

  const handleReset = (file_id) => {
    const original = originalDocuments.find((d) => d.file_id === file_id);
    if (original) {
      setDocuments((prev) =>
        prev.map((d) =>
          d.file_id === file_id
            ? { ...d, status: original.status, reason: original.reason }
            : d,
        ),
      );
    }
  };

  // Save all changes using batch API
  const handleSave = async () => {
    if (!canSave) {
      toast.error(
        "Cannot Save",
        "Please review all documents and provide rejection reasons.",
      );
      return;
    }

    setIsSaving(true);
    try {
      // Collect changes into batch format
      const verifyIds = [];
      const rejectItems = [];

      documents.forEach((doc, index) => {
        const original = originalDocuments[index];
        if (!original) return;

        // Check if this document changed
        const hasChanged =
          doc.status !== original.status || doc.reason !== original.reason;
        if (!hasChanged) return;

        // Collect verify IDs
        if (
          doc.status === "approved" &&
          original.originalStatus !== "verified"
        ) {
          verifyIds.push(doc.file_id);
        }
        // Collect reject items with reasons
        else if (doc.status === "failed" && doc.reason.trim()) {
          rejectItems.push({
            file_id: doc.file_id,
            reason: doc.reason.trim(),
          });
        }
      });

      // Single API call for all changes
      if (verifyIds.length > 0 || rejectItems.length > 0) {
        await batchUpdateFiles({ verifyIds, rejectItems });

        // Show success toast with summary
        const approvedCount = verifyIds.length;
        const rejectedCount = rejectItems.length;
        let message = "";

        if (approvedCount > 0 && rejectedCount > 0) {
          message = `${approvedCount} document(s) approved, ${rejectedCount} rejected.`;
        } else if (approvedCount > 0) {
          message = `${approvedCount} document(s) approved successfully.`;
        } else if (rejectedCount > 0) {
          message = `${rejectedCount} document(s) rejected.`;
        }

        toast.success("Verification Complete", message);
      } else {
        toast.info("No Changes", "No changes were made.", 2000);
      }

      // Close modal and trigger refresh
      onClose(true);
    } catch (err) {
      console.error("Failed to save changes:", err);
      const errorMsg =
        err.response?.data?.message ||
        "Failed to save changes. Please try again.";
      toast.error("Save Failed", errorMsg);
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved changes. Are you sure you want to close?",
      );
      if (!confirm) return;
    }
    onClose(false);
  };

  // Get verification status badge
  const getVerificationBadge = (status) => {
    const config = {
      verified: {
        bg: "bg-emerald-500/20",
        text: "text-emerald-300",
        label: "Verified",
      },
      rejected: {
        bg: "bg-red-500/20",
        text: "text-red-300",
        label: "Rejected",
      },
      partially_rejected: {
        bg: "bg-orange-500/20",
        text: "text-orange-300",
        label: "Partially Rejected",
      },
      pending_review: {
        bg: "bg-yellow-500/20",
        text: "text-yellow-300",
        label: "Pending Review",
      },
      pending: {
        bg: "bg-blue-500/20",
        text: "text-blue-300",
        label: "Pending",
      },
    };
    const c = config[status] || config.pending;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
      >
        {c.label}
      </span>
    );
  };

  // Tabs configuration
  const tabs = [
    { id: "details", label: "Shop Details", icon: Building2 },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      count: documents.length,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => onClose(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#05015A]" />
          <p className="text-gray-600">Loading shop details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => onClose(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative bg-white rounded-2xl p-8 flex flex-col items-center gap-3 max-w-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle size={28} />
          </div>
          <h3 className="text-gray-800 font-semibold text-lg">
            Failed to Load
          </h3>
          <p className="text-gray-600 text-sm text-center">{error}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={fetchShopDetails}
              className="px-4 py-2 bg-[#05015A] text-white rounded-lg text-sm font-medium hover:bg-[#0a0280] transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => onClose(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Shop Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {shopData?.business_name?.substring(0, 2).toUpperCase() ||
                      "SH"}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white text-lg font-semibold">
                      {shopData?.business_name || "Shop"}
                    </h2>
                    {shopData?.verification_status &&
                      getVerificationBadge(shopData.verification_status)}
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <User size={14} />
                    <span>@{shopData?.owner?.username || "owner"}</span>
                    <span className="text-white/40">•</span>
                    <span>{shopData?.owner?.full_name}</span>
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {activeTab === "documents" && (
                  <button
                    onClick={handleSave}
                    disabled={!canSave || isSaving}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${
                        canSave && !isSaving
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-white/20 text-white/50 cursor-not-allowed"
                      }
                    `}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                        {hasUnsavedChanges && (
                          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        )}
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-1 px-6 bg-white border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap
                    ${
                      isActive
                        ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* CONTENT */}
          <div className="p-2 h-[60vh] overflow-auto bg-gray-50">
            {activeTab === "details" && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                {shopData ? (
                  <VerificationDetailsTop shop={shopData} />
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No shop details available
                  </p>
                )}
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-2">
                {/* Stats Bar */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-gray-600">
                        Approved:{" "}
                        <strong className="text-gray-900">
                          {stats.approved}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm text-gray-600">
                        Rejected:{" "}
                        <strong className="text-gray-900">
                          {stats.rejected}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm text-gray-600">
                        Pending:{" "}
                        <strong className="text-gray-900">
                          {stats.pending}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-500">
                    Total:{" "}
                    <strong className="text-gray-900">{stats.total}</strong>{" "}
                    documents
                  </div>
                </div>

                {/* Documents Grid */}
                {documents.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <FileText
                      size={48}
                      className="mx-auto text-gray-300 mb-3"
                    />
                    <p className="text-gray-500">No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <DocumentCard
                        key={doc.file_id}
                        doc={doc}
                        onApprove={() => handleApprove(doc.file_id)}
                        onReject={() => handleRejectClick(doc.file_id)}
                        onReset={() => handleReset(doc.file_id)}
                      />
                    ))}
                  </div>
                )}

                {/* Validation Warning */}
                {hasUnsavedChanges && !canSave && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 flex items-start gap-3">
                    <AlertTriangle
                      size={20}
                      className="text-amber-600 mt-0.5 shrink-0"
                    />
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">Cannot save yet:</span>
                      <span className="ml-1 text-amber-700">
                        Review all documents (approve or reject each one)
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Shop ID: {shopData?.shop_id} • Created:{" "}
                {shopData?.created_at
                  ? new Date(shopData.created_at).toLocaleDateString()
                  : "N/A"}
              </p>

              {shopData?.owner?.email && (
                <p className="text-xs text-gray-400">
                  Owner: {shopData.owner.email}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REJECTION DIALOG */}
      <ConfirmDialog
        isOpen={!!rejectingFileId}
        onClose={cancelReject}
        onConfirm={confirmReject}
        title="Reject Document?"
        message={
          <div className="space-y-3">
            <p className="text-gray-600">
              Please provide a reason for rejection. This will be shown to the
              shop owner.
            </p>
            <textarea
              className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
          </div>
        }
        confirmText="Reject Document"
        cancelText="Cancel"
        type="warning"
        confirmDisabled={!rejectionReason.trim()}
      />
    </>
  );
};

export default VerificationModal;
