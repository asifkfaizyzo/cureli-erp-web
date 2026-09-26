// cadmin-web/src/pages/Fleet/Riders/comps/RiderDocumentsTab.jsx (do not remove this comment)
// cadmin-web/src/pages/Fleet/Riders/comps/RiderDocumentsTab.jsx

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  X,
  RotateCcw,
} from "lucide-react";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";
import { useToast } from "../../../../components/common/Toast";
import { reviewDocument } from "../../../../api/cadminRiders";

const BACKEND_URL = import.meta.env.VITE_API_URL || "";
const CDN = import.meta.env.VITE_CDN_DOMAIN;

function getDocUrl(key) {
  if (!key) return null;
  if (key.startsWith("http")) return key;
  if (CDN) return `https://${CDN}/rider_documents/${key}`;
  return `${BACKEND_URL}/api/files/rider_documents/${key}`;
}

const DOC_LABELS = {
  DRIVING_LICENSE_FRONT: "Driving License",
  VEHICLE_RC: "Vehicle RC Document",
  AADHAAR_FRONT: "Aadhaar Card",
  PAN_FRONT: "PAN Card",
  PROFILE_PHOTO: "Live Photo",
};

const RiderDocumentsTab = ({ rider, onRefresh }) => {
  const toast = useToast();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoom, setZoom] = useState(100);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const docs = rider?.documents || [];

  const handleApprove = async (doc) => {
    setActionLoading(true);
    try {
      await reviewDocument(rider.rider_id, doc.document_id, "APPROVED");
      toast.success(
        "Approved",
        `${DOC_LABELS[doc.type] || doc.type} approved.`,
      );
      onRefresh?.();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await reviewDocument(
        rider.rider_id,
        rejectTarget.document_id,
        "REJECTED",
        rejectReason.trim(),
      );
      toast.success(
        "Rejected",
        `${DOC_LABELS[rejectTarget.type] || rejectTarget.type} rejected.`,
      );
      setRejectTarget(null);
      setRejectReason("");
      onRefresh?.();
    } catch (err) {
      toast.error("Error", err.response?.data?.message || "Failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (docs.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
        <FileText size={48} className="mx-auto mb-3 opacity-30" />
        <p>No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => {
          const url = getDocUrl(doc.storage_key);
          const backUrl = getDocUrl(doc.back_storage_key);

          return (
            <div
              key={doc.document_id}
              className="bg-white rounded-xl border p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-xs text-gray-900">
                      {DOC_LABELS[doc.type] || doc.type}
                    </h4>
                    {doc.resubmission_count > 1 && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-semibold">
                        #{doc.resubmission_count}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium mt-1 px-2 py-0.5 rounded-full ${
                      doc.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : doc.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {doc.status === "APPROVED" && <CheckCircle size={10} />}
                    {doc.status === "REJECTED" && <XCircle size={10} />}
                    {doc.status === "PENDING" && <Clock size={10} />}
                    {doc.status}
                  </span>
                </div>

                {doc.status !== "APPROVED" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleApprove(doc)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectTarget(doc);
                        setRejectReason(doc.rejection_reason || "");
                      }}
                      disabled={actionLoading}
                      className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {doc.rejection_reason && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                  <strong>Reason:</strong> {doc.rejection_reason}
                </div>
              )}

              {/* Image previews */}
              <div className="flex gap-2">
                {url && (
                  <div
                    className="relative flex-1 group cursor-pointer overflow-hidden rounded-lg border bg-gray-50"
                    onClick={() => {
                      setZoom(100);
                      setPreviewUrl(url);
                    }}
                  >
                    <img
                      src={url}
                      alt="Front side"
                      className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center transition-all">
                      <Eye
                        size={20}
                        className="text-white opacity-0 group-hover:opacity-100"
                      />
                    </div>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded font-medium">
                      Front
                    </span>
                  </div>
                )}

                {backUrl && (
                  <div
                    className="relative flex-1 group cursor-pointer overflow-hidden rounded-lg border bg-gray-50"
                    onClick={() => {
                      setZoom(100);
                      setPreviewUrl(backUrl);
                    }}
                  >
                    <img
                      src={backUrl}
                      alt="Back side"
                      className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg flex items-center justify-center transition-all">
                      <Eye
                        size={20}
                        className="text-white opacity-0 group-hover:opacity-100"
                      />
                    </div>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded font-medium">
                      Back
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Preview Modal with Zoom */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative w-full max-w-5xl h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[#05015A] shrink-0">
              <span className="text-white text-xs font-semibold">
                Document Preview
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 25, 50))}
                    className="p-1 text-white/80 hover:text-white"
                  >
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-white text-xs px-2">{zoom}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 25, 250))}
                    className="p-1 text-white/80 hover:text-white"
                  >
                    <ZoomIn size={14} />
                  </button>
                </div>
                <button
                  onClick={() => window.open(previewUrl, "_blank")}
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded"
                >
                  <ExternalLink size={15} />
                </button>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="p-1.5 text-white hover:bg-red-500/50 rounded ml-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center p-4">
              <img
                src={previewUrl}
                alt="Document preview"
                className="max-w-full max-h-full object-contain transition-transform duration-150"
                style={{ transform: `scale(${zoom / 100})` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <ConfirmDialog
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        title="Reject Document?"
        message={
          <div>
            <p className="text-xs text-gray-600 mb-2">
              Reject{" "}
              <strong>
                {DOC_LABELS[rejectTarget?.type] || rejectTarget?.type}
              </strong>
              ?
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Rejection reason (required)..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-xs resize-none focus:ring-2 focus:ring-red-400"
              autoFocus
            />
          </div>
        }
        confirmText="Reject"
        cancelText="Cancel"
        type="warning"
        loading={actionLoading}
        confirmDisabled={!rejectReason.trim()}
      />
    </>
  );
};

export default RiderDocumentsTab;
