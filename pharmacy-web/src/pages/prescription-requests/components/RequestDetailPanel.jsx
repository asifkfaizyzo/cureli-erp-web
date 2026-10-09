// pharmacy-web/src/pages/prescription-requests/components/RequestDetailPanel.jsx (do not remove this comment)

import { useState, useCallback, useEffect, useRef } from "react";
import {
  X,
  Loader2,
  MapPin,
  FileText,
  Clock,
  Package,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import QuoteBuilder from "./QuoteBuilder";

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  SENT: "New Request",
  QUOTE_SENT: "Quote Sent",
  ACCEPTED: "Quote Accepted",
  CONVERTED: "Order Created",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function QuoteCountdown({ expiresAt }) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, remaining]);

  if (remaining <= 0) {
    return (
      <span className="text-[10px] text-red-400 font-medium">
        Quote expired
      </span>
    );
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining < 120;

  return (
    <span
      className={`text-[10px] font-semibold ${isUrgent ? "text-red-400" : "text-white/45"}`}
    >
      Expires in {mins}:{String(secs).padStart(2, "0")}
    </span>
  );
}

const SectionCard = ({ title, icon: Icon, children, compact = false }) => (
  <div
    className={`bg-white/[0.03] border border-white/[0.06] rounded-xl ${compact ? "p-3" : "p-3.5"} space-y-2`}
  >
    <div className="flex items-center gap-1.5">
      <Icon size={12} className="text-white/40" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
        {title}
      </span>
    </div>
    {children}
  </div>
);

const StickySectionHeader = ({ icon: Icon, label }) => (
  <div className="sticky top-0 z-[5] bg-[#0a0825]/95 backdrop-blur-sm py-1.5 -mx-1 px-1 flex items-center gap-1.5 border-b border-white/[0.06] mb-2">
    <Icon size={11} className="text-white/50" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
      {label}
    </span>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="text-[11px] text-white/50 flex-shrink-0 font-medium">
      {label}
    </span>
    <span className="text-[11px] text-white/90 text-right font-medium">
      {value || "—"}
    </span>
  </div>
);

// ── Main Detail Panel ─────────────────────────────────────────────────────────

const RequestDetailPanel = ({
  recipientId,
  detail,
  isLoading,
  error,
  actionLoading,
  actionError,
  onClose,
  onGetFileUrl,
  onSubmitQuote,
  onOpenDecline,
}) => {
  const [loadingFileId, setLoadingFileId] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [recipientId]);

  // Hoist and sync quote items state whenever detail object changes
  useEffect(() => {
    if (detail?.quote_items?.length) {
      setQuoteItems(
        detail.quote_items.map((item) => ({
          listing_id: item.listing_id ?? "",
          medicine_name: item.medicine_name,
          brand: item.brand,
          pack_size: item.pack_size,
          unit_price: item.unit_price,
          quantity: item.quantity,
          is_available: item.is_available,
          is_substitute: item.is_substitute,
          substitute_note: item.substitute_note,
        })),
      );
    } else {
      setQuoteItems([]);
    }
  }, [detail]);

  const handleOpenFile = useCallback(
    async (fileId) => {
      setLoadingFileId(fileId);
      try {
        const url = await onGetFileUrl(recipientId, fileId);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      } finally {
        setLoadingFileId(null);
      }
    },
    [recipientId, onGetFileUrl],
  );

  const handleHeaderQuoteSubmit = async () => {
    if (quoteItems.length === 0) return;
    const payload = quoteItems.map((item) => ({
      listing_id: item.listing_id,
      quantity: item.quantity,
      is_available: item.is_available,
      is_substitute: item.is_substitute,
      substitute_note: item.substitute_note ?? null,
    }));
    await onSubmitQuote(detail.recipient_id, payload);
  };

  // ── Render States ───────────────────────────────────────────────────

  if (!recipientId)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8 bg-[#010015]">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <FileText size={22} className="text-white/20" />
        </div>
        <p className="text-sm text-white/30 text-center">
          Select a prescription request to view details
        </p>
      </div>
    );

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#010015]">
        <Loader2 size={24} className="animate-spin text-white/20" />
        <p className="text-xs text-white/30">Loading request...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8 bg-[#010015]">
        <p className="text-sm text-red-400 text-center">{error}</p>
      </div>
    );

  if (!detail) return null;

  const isActionable = ["SENT", "QUOTE_SENT"].includes(detail.status);
  const isTerminal = ["DECLINED", "EXPIRED", "CONVERTED"].includes(
    detail.status,
  );
  const canSubmitQuote = quoteItems.length > 0 && !actionLoading;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#010015]">
      {/* ── STICKY TOP COMPACT HEADER WITH ACTIONS Beside Metadata ── */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-[#010015] z-10">
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-white">
              {detail.request_number}
            </h2>
            <span className="text-[10px] font-semibold text-white/50 px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.03]">
              {STATUS_LABELS[detail.status]}
            </span>
            {detail.status === "QUOTE_SENT" && detail.quote_expires_at && (
              <QuoteCountdown expiresAt={detail.quote_expires_at} />
            )}
          </div>
          {detail.sent_at && (
            <p className="text-[10px] text-white/40 font-medium">
              Received {formatDateTime(detail.sent_at)}
            </p>
          )}
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isActionable && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleHeaderQuoteSubmit}
                disabled={!canSubmitQuote}
                className="h-7 px-2.5 rounded text-[10px] font-bold bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-100 flex items-center gap-1 disabled:opacity-40 transition-all"
              >
                {actionLoading ? (
                  <RefreshCw size={10} className="animate-spin" />
                ) : (
                  <CheckCircle size={10} />
                )}
                {detail.status === "QUOTE_SENT" ? "Update Quote" : "Send Quote"}
              </button>

              <button
                onClick={() => onOpenDecline(detail.recipient_id)}
                disabled={actionLoading}
                className="h-7 px-2.5 rounded text-[10px] font-bold bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-300 flex items-center gap-1 transition-all disabled:opacity-40"
              >
                <XCircle size={10} />
                Decline
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── SCROLLABLE BODY ── */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {actionError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/20 text-xs text-red-200">
            <AlertCircle size={12} className="flex-shrink-0" />
            {actionError}
          </div>
        )}

        {/* ── 2-COLUMN GRID (xl+) ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {/* LEFT COLUMN: Customer Metadata & Files */}
          <div className="space-y-3">
            <StickySectionHeader
              icon={FileText}
              label="Requested Prescriptions"
            />

            {detail.files?.length > 0 && (
              <SectionCard title="Prescription Files" icon={FileText} compact>
                <div className="space-y-2">
                  {detail.files.map((file) => (
                    <button
                      key={file.file_id}
                      onClick={() => handleOpenFile(file.file_id)}
                      disabled={loadingFileId === file.file_id}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors text-left group disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText
                          size={12}
                          className="text-white/40 flex-shrink-0"
                        />
                        <span className="text-xs text-white/60 truncate font-semibold">
                          {file.original_name}
                        </span>
                      </div>
                      {loadingFileId === file.file_id ? (
                        <Loader2
                          size={12}
                          className="animate-spin text-white/30"
                        />
                      ) : (
                        <ExternalLink
                          size={11}
                          className="text-white/30 group-hover:text-white"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </SectionCard>
            )}

            {detail.delivery_address && (
              <SectionCard title="Delivery Address" icon={MapPin} compact>
                <p className="text-xs text-white/80 leading-relaxed font-semibold">
                  {[
                    detail.delivery_address.address_line_1,
                    detail.delivery_address.address_line_2,
                    detail.delivery_address.landmark,
                    detail.delivery_address.city,
                    detail.delivery_address.state,
                    detail.delivery_address.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </SectionCard>
            )}

            <SectionCard title="Request Timeline" icon={Clock} compact>
              <div className="space-y-1">
                {detail.sent_at && (
                  <InfoRow
                    label="Received"
                    value={formatDateTime(detail.sent_at)}
                  />
                )}
                {detail.quote_sent_at && (
                  <InfoRow
                    label="Quote Sent"
                    value={formatDateTime(detail.quote_sent_at)}
                  />
                )}
                {detail.accepted_at && (
                  <InfoRow
                    label="Quote Accepted"
                    value={formatDateTime(detail.accepted_at)}
                  />
                )}
                {detail.converted_at && (
                  <InfoRow
                    label="Converted Order"
                    value={formatDateTime(detail.converted_at)}
                  />
                )}
                {detail.declined_at && (
                  <InfoRow
                    label="Declined"
                    value={formatDateTime(detail.declined_at)}
                  />
                )}
                {detail.expired_at && (
                  <InfoRow
                    label="Expired"
                    value={formatDateTime(detail.expired_at)}
                  />
                )}
              </div>
            </SectionCard>
          </div>

          {/* RIGHT COLUMN: Quote Action & Results */}
          <div className="space-y-3">
            <StickySectionHeader icon={Package} label="Quote Configuration" />

            {detail.converted_order_id && (
              <SectionCard title="Converted Order" icon={Package} compact>
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle size={14} />
                  <p className="text-xs font-bold">Marketplace Order Created</p>
                </div>
                <p className="text-[10px] text-white/50 mt-1">
                  This request has been fulfilled. You can find the resulting
                  invoice under the regular Orders dashboard.
                </p>
              </SectionCard>
            )}

            {detail.status === "DECLINED" && detail.decline_reason && (
              <SectionCard title="Decline Reason" icon={XCircle} compact>
                <p className="text-xs text-white/60 leading-relaxed font-medium bg-red-500/5 p-2 rounded border border-red-500/10">
                  {detail.decline_reason}
                </p>
              </SectionCard>
            )}

            {/* Read-Only accepted / converted quote */}
            {["ACCEPTED", "CONVERTED"].includes(detail.status) &&
              detail.quote_items?.length > 0 && (
                <SectionCard
                  title="Customer Accepted Quote"
                  icon={CheckCircle}
                  compact
                >
                  <div className="space-y-2">
                    {detail.quote_items.map((item) => (
                      <div
                        key={item.quote_item_id}
                        className="flex items-start justify-between gap-3 bg-white/[0.02] p-2 rounded border border-white/[0.04]"
                      >
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-semibold leading-tight ${item.is_available ? "text-white/80" : "text-white/30 line-through"}`}
                          >
                            {item.medicine_name}
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5 font-medium">
                            {[item.brand, item.pack_size]
                              .filter(Boolean)
                              .join(" · ")}
                            {item.is_substitute && (
                              <span className="ml-1.5 text-blue-400">
                                Substitute
                              </span>
                            )}
                          </p>
                        </div>
                        {item.is_available && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-white/40">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-xs font-bold text-white">
                              ₹{item.line_total.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

            {/* Active Quote Builder Section */}
            {isActionable && (
              <div className="space-y-1 bg-white/[0.01] rounded-xl p-3 border border-white/[0.04]">
                <StickySectionHeader
                  icon={Package}
                  label={
                    detail.status === "QUOTE_SENT"
                      ? "Update Quote Details"
                      : "Build Prescription Quote"
                  }
                />
                <QuoteBuilder
                  detail={detail}
                  quoteItems={quoteItems}
                  setQuoteItems={setQuoteItems}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPanel;
