// cadmin-web/src/pages/Fleet/Verification/comps/RiderVerificationModal.jsx

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Loader2,
  FileText,
  User,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Truck,
  CreditCard,
  Save,
} from "lucide-react";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/Toast";
import {
  getRiderDetail,
  reviewDocument,
  approveRider,
  rejectRider,
} from "../../../../api/cadminRiders";

import DetailSectionCard from "./DetailSectionCard";
import DocumentReviewCard from "./DocumentReviewCard";
import DocumentPreviewModal from "./DocumentPreviewModal";
import ReviewProgressBar from "./ReviewProgressBar";

// ── URL RESOLUTION ──────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const CDN = import.meta.env.VITE_CDN_DOMAIN;

function getDocUrl(key) {
  if (!key) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  if (key.startsWith("/api/files/")) return `${API_URL}${key}`;
  const cleanKey = key.replace(/^rider_documents\//, "").replace(/^\/+/, "");
  if (CDN) return `https://${CDN}/rider_documents/${cleanKey}`;
  return `${API_URL}/api/files/rider_documents/${cleanKey}`;
}

// ── DOC METADATA ────────────────────────────────────────────
const DOC_META = {
  DRIVING_LICENSE_FRONT: { label: "Driving License", hasBack: true, order: 1 },
  VEHICLE_RC: { label: "Vehicle RC Document", hasBack: false, order: 2 },
  AADHAAR_FRONT: { label: "Aadhaar Card", hasBack: true, order: 3 },
  PAN_FRONT: { label: "PAN Card", hasBack: false, order: 4 },
  PROFILE_PHOTO: { label: "Live Selfie Photo", hasBack: false, order: 5 },
};

const RiderVerificationModal = ({ rider: initialRider, onClose }) => {
  const toast = useToast();

  // Core state
  const [activeTab, setActiveTab] = useState("documents");
  const [rider, setRider] = useState(null);
  const [loading, setLoading] = useState(true);

  // Local per-doc decisions (before batch submit)
  // Shape: { [document_id]: { action: "APPROVED" | "REJECTED", reason: "" } }
  const [localDecisions, setLocalDecisions] = useState({});

  // Preview modal
  const [preview, setPreview] = useState(null); // { url, title }

  // Reject reason dialog for single doc
  const [rejectDocTarget, setRejectDocTarget] = useState(null);
  const [rejectDocReason, setRejectDocReason] = useState("");

  // Final submit confirmation dialog
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Close warning dialog (unsaved decisions)
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  // ── LOAD RIDER ────────────────────────────────────────────
  useEffect(() => {
    if (initialRider?.rider_id) {
      loadRiderDetail(initialRider.rider_id);
    }
  }, [initialRider?.rider_id]);

  const loadRiderDetail = async (riderId) => {
    setLoading(true);
    try {
      const resp = await getRiderDetail(riderId);
      const r = resp.data?.data || resp.data;
      setRider(r);

      // Pre-populate decisions from existing DB state so already-reviewed docs stay locked in
      const preloaded = {};
      (r.documents || []).forEach((d) => {
        if (d.status === "APPROVED") {
          preloaded[d.document_id] = { action: "APPROVED", reason: "" };
        } else if (d.status === "REJECTED" && d.was_rejected_this_cycle) {
          preloaded[d.document_id] = {
            action: "REJECTED",
            reason: d.rejection_reason || "",
          };
        }
      });
      setLocalDecisions(preloaded);
    } catch {
      toast.error("Error", "Failed to load rider application.");
    } finally {
      setLoading(false);
    }
  };

  // ── ENRICH DOCS WITH URLS + META ──────────────────────────
  const enrichedDocs = useMemo(() => {
    if (!rider?.documents) return [];
    return [...rider.documents]
      .map((d) => ({
        ...d,
        ...(DOC_META[d.type] || {
          label: d.type,
          hasBack: false,
          order: 99,
        }),
        frontUrl: getDocUrl(d.storage_key),
        backUrl: getDocUrl(d.back_storage_key),
      }))
      .sort((a, b) => a.order - b.order);
  }, [rider?.documents]);

  // ── STATS (from local decisions) ──────────────────────────
  const stats = useMemo(() => {
    const total = enrichedDocs.length;
    let approved = 0;
    let rejected = 0;
    enrichedDocs.forEach((doc) => {
      const decision = localDecisions[doc.document_id];
      if (decision?.action === "APPROVED") approved++;
      else if (decision?.action === "REJECTED") rejected++;
    });
    return { total, approved, rejected, pending: total - approved - rejected };
  }, [enrichedDocs, localDecisions]);

  const allReviewed = stats.pending === 0 && stats.total > 0;
  const anyRejected = stats.rejected > 0;
  const hasUnsubmittedChanges = Object.keys(localDecisions).length > 0;

  // ── DOC DECISION HANDLERS ─────────────────────────────────
  const handleApproveDoc = (doc) => {
    setLocalDecisions((prev) => ({
      ...prev,
      [doc.document_id]: { action: "APPROVED", reason: "" },
    }));
  };

  const handleOpenRejectDialog = (doc) => {
    setRejectDocTarget(doc);
    setRejectDocReason(localDecisions[doc.document_id]?.reason || "");
  };

  const handleConfirmRejectDoc = () => {
    if (!rejectDocTarget || !rejectDocReason.trim()) return;
    setLocalDecisions((prev) => ({
      ...prev,
      [rejectDocTarget.document_id]: {
        action: "REJECTED",
        reason: rejectDocReason.trim(),
      },
    }));
    setRejectDocTarget(null);
    setRejectDocReason("");
  };

  const handleResetDecision = (doc) => {
    setLocalDecisions((prev) => {
      const next = { ...prev };
      delete next[doc.document_id];
      return next;
    });
  };

  // ── BATCH SUBMIT ──────────────────────────────────────────
  const handleSubmitReview = async () => {
    if (!allReviewed) return;

    setSubmitting(true);
    try {
      // 1. Push each doc decision to backend
      for (const doc of enrichedDocs) {
        const decision = localDecisions[doc.document_id];
        if (!decision) continue;

        // Only call if the DB state doesn't already match the local decision
        const dbMatchesLocal =
          (decision.action === "APPROVED" && doc.status === "APPROVED") ||
          (decision.action === "REJECTED" &&
            doc.status === "REJECTED" &&
            doc.rejection_reason === decision.reason);

        if (dbMatchesLocal) continue;

        await reviewDocument(
          rider.rider_id,
          doc.document_id,
          decision.action,
          decision.action === "REJECTED" ? decision.reason : undefined
        );
      }

      // 2. Final rider-level action
      if (anyRejected) {
        // Build combined rejection message
        const rejectedItems = enrichedDocs
          .filter((d) => localDecisions[d.document_id]?.action === "REJECTED")
          .map((d) => {
            const reason = localDecisions[d.document_id].reason;
            return `• ${d.label}: ${reason}`;
          })
          .join("\n");

        const combinedReason = `Please re-upload the following documents:\n\n${rejectedItems}`;
        await rejectRider(rider.rider_id, combinedReason);

        toast.success(
          "Review Submitted",
          `${rider.full_name} has been notified to re-upload ${stats.rejected} document(s).`
        );
      } else {
        await approveRider(rider.rider_id);
        toast.success(
          "Rider Activated",
          `${rider.full_name}'s application has been approved and account activated.`
        );
      }

      setShowSubmitConfirm(false);
      onClose(true);
    } catch (err) {
      toast.error(
        "Submission Failed",
        err.response?.data?.message || "Failed to submit review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── CLOSE HANDLER ─────────────────────────────────────────
  const handleClose = () => {
    // If user has made decisions but hasn't submitted, warn them
    const hasNewDecisions = Object.entries(localDecisions).some(
      ([docId, decision]) => {
        const doc = enrichedDocs.find((d) => d.document_id === docId);
        if (!doc) return false;
        const dbMatchesLocal =
          (decision.action === "APPROVED" && doc.status === "APPROVED") ||
          (decision.action === "REJECTED" &&
            doc.status === "REJECTED" &&
            doc.rejection_reason === decision.reason);
        return !dbMatchesLocal;
      }
    );

    if (hasNewDecisions) {
      setShowCloseWarning(true);
    } else {
      onClose(false);
    }
  };

  // ── DETAIL SECTIONS ───────────────────────────────────────
  const personalFields = [
    { label: "Full Name", value: rider?.full_name },
    { label: "Phone", value: rider?.phone ? `+91 ${rider.phone}` : null },
    { label: "Email", value: rider?.email },
    {
      label: "Date of Birth",
      value: rider?.date_of_birth
        ? new Date(rider.date_of_birth).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : null,
    },
    { label: "Gender", value: rider?.sex },
    { label: "Status", value: rider?.status?.replace("_", " ") },
  ];

  const locationFields = [
    { label: "City", value: rider?.current_city },
    {
      label: "Residential Address",
      value: rider?.residential_address,
      multiline: true,
    },
  ];

  const vehicleFields = [
    { label: "Vehicle Type", value: rider?.vehicle_type },
    { label: "Registration No.", value: rider?.vehicle_number, mono: true },
    {
      label: "Make & Model",
      value: rider?.vehicle_make_model || "Not specified",
    },
  ];

  const bankFields = rider?.bank_account_number
    ? [
        { label: "Account Holder", value: rider?.bank_holder_name },
        { label: "IFSC Code", value: rider?.bank_ifsc, mono: true },
        {
          label: "Account No.",
          value: `****${rider.bank_account_number.slice(-4)}`,
          mono: true,
        },
      ]
    : null;

  // ── TABS ──────────────────────────────────────────────────
  const tabs = [
    {
      id: "documents",
      label: "Documents Review",
      icon: FileText,
      count: enrichedDocs.length,
    },
    { id: "details", label: "Applicant Details", icon: User },
  ];

  // ── RENDER ────────────────────────────────────────────────
  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {rider?.full_name
                  ? rider.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                  : "AP"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white text-lg font-semibold">
                    {rider?.full_name || "New Applicant"}
                  </h2>

                  {rider?.is_resubmission ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30 inline-flex items-center gap-1">
                      <RotateCcw size={10} /> Resubmission
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                      Initial Review
                    </span>
                  )}
                </div>
                <p className="text-white/70 text-xs mt-0.5">
                  +91 {rider?.phone} • {rider?.email || "No email provided"}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* TABS */}
          <div className="flex gap-1 px-6 bg-white border-b border-gray-200 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-md transition-all whitespace-nowrap ${
                    isActive
                      ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* BODY */}
          <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 size={32} className="animate-spin text-indigo-600" />
                <p className="text-xs text-gray-500 font-medium">
                  Loading rider application...
                </p>
              </div>
            ) : activeTab === "details" ? (
              /* ── DETAILS TAB (Read-only) ── */
              <div className="space-y-4">
                <DetailSectionCard
                  icon={User}
                  title="Personal Information"
                  fields={personalFields}
                />
                <DetailSectionCard
                  icon={MapPin}
                  title="Location & Operating Area"
                  fields={locationFields}
                />
                <DetailSectionCard
                  icon={Truck}
                  title="Vehicle Details"
                  fields={vehicleFields}
                />
                {bankFields && (
                  <DetailSectionCard
                    icon={CreditCard}
                    title="Bank Details"
                    fields={bankFields}
                  />
                )}
              </div>
            ) : (
              /* ── DOCUMENTS TAB ── */
              <div className="space-y-4">
                <ReviewProgressBar
                  total={stats.total}
                  approved={stats.approved}
                  rejected={stats.rejected}
                  pending={stats.pending}
                />

                {enrichedDocs.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                    <FileText size={48} className="mx-auto mb-2 opacity-30" />
                    <p>No documents uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrichedDocs.map((doc) => (
                      <DocumentReviewCard
                        key={doc.document_id}
                        doc={doc}
                        label={doc.label}
                        localDecision={localDecisions[doc.document_id]}
                        onApproveClick={() => handleApproveDoc(doc)}
                        onRejectClick={() => handleOpenRejectDialog(doc)}
                        onReset={() => handleResetDecision(doc)}
                        onPreview={(url, title) => setPreview({ url, title })}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-6 py-3.5 bg-white border-t border-gray-200 flex items-center justify-between shrink-0 flex-wrap gap-3">
            <div className="text-xs flex items-center gap-2">
              {allReviewed ? (
                anyRejected ? (
                  <span className="text-red-700 font-bold inline-flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    {stats.rejected} document(s) will be sent back for
                    re-upload.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1.5">
                    <ShieldCheck size={14} />
                    All documents approved. Ready to activate rider.
                  </span>
                )
              ) : (
                <span className="text-gray-500 font-medium inline-flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-500" />
                  {stats.pending} document(s) still need decision.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => setShowSubmitConfirm(true)}
                disabled={!allReviewed || submitting}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5 ${
                  !allReviewed
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : anyRejected
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <Save size={14} />
                Submit Review
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {preview && (
        <DocumentPreviewModal
          imageUrl={preview.url}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}

      {/* REJECT DOC REASON DIALOG */}
      <ConfirmDialog
        isOpen={!!rejectDocTarget}
        onClose={() => {
          setRejectDocTarget(null);
          setRejectDocReason("");
        }}
        onConfirm={handleConfirmRejectDoc}
        title={`Reject ${rejectDocTarget?.label || "Document"}?`}
        message={
          <div className="space-y-3">
            <p className="text-xs text-gray-700">
              This document will be sent back to the rider for re-upload. Please
              provide a clear, specific reason:
            </p>
            <textarea
              value={rejectDocReason}
              onChange={(e) => setRejectDocReason(e.target.value)}
              placeholder="e.g. License is expired, photo is too blurry, one edge is cut off..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs resize-none focus:ring-2 focus:ring-red-400 focus:border-red-400 focus:outline-none"
              autoFocus
            />
            <p className="text-[10px] text-gray-400 italic">
              This will not be sent yet — it's saved locally until you click
              Submit Review.
            </p>
          </div>
        }
        confirmText="Save Rejection"
        cancelText="Cancel"
        type="warning"
        confirmDisabled={!rejectDocReason.trim()}
      />

      {/* SUBMIT CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={handleSubmitReview}
        title={
          anyRejected
            ? "Submit Rejection to Rider?"
            : "Approve & Activate Rider?"
        }
        message={
          <div className="space-y-3 text-xs text-gray-700">
            {anyRejected ? (
              <>
                <p>
                  You've rejected{" "}
                  <strong className="text-red-700">
                    {stats.rejected} of {stats.total}
                  </strong>{" "}
                  documents. On submit:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>Approvals will be saved to their record.</li>
                  <li>
                    Rejected documents will be marked for re-upload with your
                    reasons.
                  </li>
                  <li>
                    Rider status will be set to{" "}
                    <strong>REJECTED (Resubmission)</strong>.
                  </li>
                  <li>
                    Rider will be notified and can re-upload only the rejected
                    documents.
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p>
                  All{" "}
                  <strong className="text-emerald-700">{stats.total}</strong>{" "}
                  documents have been approved. On submit:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600">
                  <li>
                    Rider account status will be set to{" "}
                    <strong>ACTIVE</strong>.
                  </li>
                  <li>
                    <strong>{rider?.full_name}</strong> will be able to log in,
                    set bank details, and start accepting deliveries.
                  </li>
                </ul>
              </>
            )}
          </div>
        }
        confirmText={
          anyRejected ? "Send Rejection to Rider" : "Approve & Activate"
        }
        cancelText="Go back to review"
        type={anyRejected ? "warning" : "success"}
        loading={submitting}
      />

      {/* UNSAVED CHANGES WARNING */}
      <ConfirmDialog
        isOpen={showCloseWarning}
        onClose={() => setShowCloseWarning(false)}
        onConfirm={() => {
          setShowCloseWarning(false);
          onClose(false);
        }}
        title="Discard Review Progress?"
        message="You've made changes that haven't been submitted yet. If you close now, your decisions will be lost. Are you sure?"
        confirmText="Discard & Close"
        cancelText="Continue Reviewing"
        type="warning"
      />
    </>
  );
};

export default RiderVerificationModal;