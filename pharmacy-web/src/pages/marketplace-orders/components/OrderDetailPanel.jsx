// pharmacy-web/src/pages/marketplace-orders/components/OrderDetailPanel.jsx

import { useState, useCallback } from "react";
import {
  X,
  Loader2,
  User,
  Users,
  MapPin,
  Package,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  Download,
  RefreshCw,
} from "lucide-react";

const STATUS_LABELS = {
  PLACED: "Placed",
  ACCEPTED: "Accepted",
  READY_FOR_PICKUP: "Ready for Pickup",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const SEX_LABEL = { MALE: "Male", FEMALE: "Female", OTHER: "Other" };

// ── Safe Currency/Price Formatting Helper ────────────────────────────────────
function formatPrice(value) {
  const num = Number(value);
  if (value === null || value === undefined || isNaN(num)) {
    return "0.00";
  }
  return num.toFixed(2);
}

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

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-white/45" />
      <span className="text-[10px] font-bold text-white/45 uppercase tracking-wider">
        {title}
      </span>
    </div>
    {children}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-xs text-white/50 flex-shrink-0">{label}</span>
    <span className="text-xs text-white/80 text-right">{value || "—"}</span>
  </div>
);

function PatientSection({ patient }) {
  if (!patient || (!patient.name && patient.age === null && !patient.sex))
    return null;
  const sexLabel = patient.sex ? (SEX_LABEL[patient.sex] ?? patient.sex) : null;
  const meta = [sexLabel, patient.age !== null ? `${patient.age} yrs` : null]
    .filter(Boolean)
    .join(" · ");
  return (
    <SectionCard title="Ordering For" icon={Users}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
          <User size={15} className="text-white/50" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white truncate">
              {patient.name}
            </span>
            {patient.is_self && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/[0.08] text-white/50 border border-white/[0.08] uppercase tracking-wide flex-shrink-0">
                Self
              </span>
            )}
          </div>
          {meta ? <p className="text-xs text-white/45 mt-0.5">{meta}</p> : null}
        </div>
      </div>
    </SectionCard>
  );
}

const OrderDetailPanel = ({
  orderId,
  orderDetail,
  isLoading,
  error,
  actionLoading,
  actionError,
  onClose,
  onBillAndAccept,
  onOpenReject,
  onMarkReady,
  onComplete,
  onGetPrescriptionUrl,
  onGetInvoiceUrl,
  onRegenerateInvoice,
}) => {
  const [loadingPrescriptionId, setLoadingPrescriptionId] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoicePending, setInvoicePending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleOpenPrescription = useCallback(
    async (prescriptionId) => {
      setLoadingPrescriptionId(prescriptionId);
      try {
        const url = await onGetPrescriptionUrl(orderId, prescriptionId);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      } finally {
        setLoadingPrescriptionId(null);
      }
    },
    [orderId, onGetPrescriptionUrl],
  );

  const handleDownloadInvoice = useCallback(async () => {
    setInvoiceLoading(true);
    setInvoicePending(false);
    try {
      const result = await onGetInvoiceUrl(orderId);
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else if (result?.pending) {
        setInvoicePending(true);
      }
    } finally {
      setInvoiceLoading(false);
    }
  }, [orderId, onGetInvoiceUrl]);

  const handleRegenerate = useCallback(async () => {
    if (!onRegenerateInvoice) return;
    setRegenerating(true);
    setInvoicePending(false);
    try {
      const success = await onRegenerateInvoice(orderId);
      if (success) {
        // Wait a moment for S3 to settle, then try download
        setTimeout(async () => {
          const result = await onGetInvoiceUrl(orderId);
          if (result?.url) {
            window.open(result.url, "_blank", "noopener,noreferrer");
          } else {
            setInvoicePending(true);
          }
        }, 3000);
      }
    } finally {
      setRegenerating(false);
    }
  }, [orderId, onRegenerateInvoice, onGetInvoiceUrl]);

  if (!orderId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <Package size={22} className="text-white/30" />
        </div>
        <p className="text-sm text-white/40 text-center">
          Select an order to view details
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={24} className="animate-spin text-white/30" />
        <p className="text-xs text-white/40">Loading order...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
        <p className="text-sm text-red-400 text-center">{error}</p>
      </div>
    );
  }

  if (!orderDetail) return null;

  const {
    order_number,
    status,
    customer_name,
    customer_phone,
    delivery_address,
    items,
    prescriptions,
    total_amount,
    subtotal,
    service_charge,
    delivery_fee,
    km_surcharge,
    tip,
    requires_prescription,
    notes,
    rejection_reason,
    rejection_reason_other,
    placed_at,
    accepted_at,
    ready_at,
    completed_at,
    rejected_at,
    cancelled_at,
    payment_method,
    patient,
  } = orderDetail;

  const canBillAndAccept = status === "PLACED";
  const canReject = status === "PLACED";
  const canMarkReady = status === "ACCEPTED";
  const canComplete = status === "READY_FOR_PICKUP";
  const isTerminal = ["COMPLETED", "REJECTED", "CANCELLED"].includes(status);
  const hasInvoice = ["READY_FOR_PICKUP", "COMPLETED"].includes(status);

  const hasFeeBreakdown =
    (service_charge && Number(service_charge) > 0) ||
    (delivery_fee && Number(delivery_fee) > 0) ||
    (km_surcharge && Number(km_surcharge) > 0) ||
    (tip && Number(tip) > 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-white">{order_number}</h2>
          <p className="text-xs text-white/45 mt-0.5">
            {STATUS_LABELS[status]}
            {placed_at ? ` · ${formatDateTime(placed_at)}` : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable body with layout safeguards and customized scrollbar */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {actionError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            <AlertCircle size={14} className="flex-shrink-0" />
            {actionError}
          </div>
        )}

        <SectionCard title="Customer" icon={User}>
          <InfoRow label="Name" value={customer_name} />
          <InfoRow label="Phone" value={customer_phone} />
        </SectionCard>

        <PatientSection patient={patient} />

        {delivery_address && (
          <SectionCard title="Delivery Address" icon={MapPin}>
            <p className="text-xs text-white/75 leading-relaxed mb-2">
              {[
                delivery_address.address_line_1,
                delivery_address.address_line_2,
                delivery_address.landmark,
                delivery_address.city,
                delivery_address.state,
                delivery_address.pincode,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            {delivery_address.recipient_name && (
              <InfoRow
                label="Recipient"
                value={delivery_address.recipient_name}
              />
            )}
            {delivery_address.recipient_phone && (
              <InfoRow label="Phone" value={delivery_address.recipient_phone} />
            )}
          </SectionCard>
        )}

        <SectionCard title="Order Items" icon={Package}>
          <div className="space-y-3">
            {items?.map((item) => (
              <div
                key={item.item_id}
                className="flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/90 font-medium leading-tight truncate">
                    {item.medicine_name}
                  </p>
                  <p className="text-xs text-white/45 mt-0.5">
                    {[item.brand, item.pack_size].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-white/45">
                    Qty: {item.quantity} × ₹{formatPrice(item.unit_price)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-white flex-shrink-0">
                  ₹{formatPrice(item.line_total)}
                </span>
              </div>
            ))}

            <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs text-white/50">Subtotal</span>
                <span className="text-xs text-white/80">
                  ₹{formatPrice(subtotal)}
                </span>
              </div>
              {hasFeeBreakdown && (
                <>
                  {Number(service_charge) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">
                        Service charge
                      </span>
                      <span className="text-xs text-white/80">
                        ₹{formatPrice(service_charge)}
                      </span>
                    </div>
                  )}
                  {Number(delivery_fee) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">
                        Delivery fee
                      </span>
                      <span className="text-xs text-white/80">
                        ₹{formatPrice(delivery_fee)}
                      </span>
                    </div>
                  )}
                  {Number(km_surcharge) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">
                        Distance surcharge
                      </span>
                      <span className="text-xs text-white/80">
                        ₹{formatPrice(km_surcharge)}
                      </span>
                    </div>
                  )}
                  {Number(tip) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">Tip</span>
                      <span className="text-xs text-white/80">
                        ₹{formatPrice(tip)}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between pt-1">
                <span className="text-sm font-bold text-white">Total</span>
                <span className="text-sm font-bold text-white">
                  ₹{formatPrice(total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/50">Payment</span>
                <span className="text-xs text-white/80">{payment_method}</span>
              </div>
            </div>
          </div>
        </SectionCard>

        {requires_prescription && prescriptions?.length > 0 && (
          <SectionCard title="Prescriptions" icon={FileText}>
            <div className="space-y-2">
              {prescriptions.map((p) => (
                <button
                  key={p.prescription_id}
                  onClick={() => handleOpenPrescription(p.prescription_id)}
                  disabled={loadingPrescriptionId === p.prescription_id}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText
                      size={14}
                      className="text-white/50 flex-shrink-0"
                    />
                    <span className="text-xs text-white/75 truncate">
                      {p.original_name}
                    </span>
                  </div>
                  {loadingPrescriptionId === p.prescription_id ? (
                    <Loader2
                      size={13}
                      className="animate-spin text-white/40 flex-shrink-0"
                    />
                  ) : (
                    <ExternalLink
                      size={13}
                      className="text-white/40 group-hover:text-white/70 flex-shrink-0 transition-colors"
                    />
                  )}
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {notes && (
          <SectionCard title="Customer Notes" icon={FileText}>
            <p className="text-sm text-white/75 leading-relaxed">{notes}</p>
          </SectionCard>
        )}

        {status === "REJECTED" && rejection_reason && (
          <SectionCard title="Rejection Reason" icon={XCircle}>
            <InfoRow
              label="Reason"
              value={rejection_reason.replace(/_/g, " ")}
            />
            {rejection_reason_other && (
              <InfoRow label="Details" value={rejection_reason_other} />
            )}
          </SectionCard>
        )}

        <SectionCard title="Timeline" icon={Clock}>
          <div className="space-y-2">
            {placed_at && (
              <InfoRow label="Placed" value={formatDateTime(placed_at)} />
            )}
            {accepted_at && (
              <InfoRow label="Accepted" value={formatDateTime(accepted_at)} />
            )}
            {ready_at && (
              <InfoRow label="Ready" value={formatDateTime(ready_at)} />
            )}
            {completed_at && (
              <InfoRow label="Completed" value={formatDateTime(completed_at)} />
            )}
            {rejected_at && (
              <InfoRow label="Rejected" value={formatDateTime(rejected_at)} />
            )}
            {cancelled_at && (
              <InfoRow label="Cancelled" value={formatDateTime(cancelled_at)} />
            )}
          </div>
        </SectionCard>
      </div>

      {/* Sticky Action Footer */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.06] space-y-2 bg-black/20">
        {/* Invoice Download Action */}
        {hasInvoice && onGetInvoiceUrl && (
          <>
            {invoicePending ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  <Clock size={13} className="animate-pulse" />
                  Invoice PDF is still generating...
                </div>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="w-full h-10 flex items-center justify-center gap-2 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white/70 hover:text-white/90 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {regenerating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  {regenerating ? "Regenerating..." : "Retry Generation"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleDownloadInvoice}
                disabled={invoiceLoading}
                className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white/75 hover:text-white/90 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {invoiceLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Download size={15} />
                )}
                Download Invoice (2-page PDF)
              </button>
            )}
          </>
        )}

        {!isTerminal && (
          <>
            {/* PLACED Stage Actions */}
            {canBillAndAccept && (
              <div className="flex gap-2">
                <button
                  onClick={() => onBillAndAccept(orderDetail.order_id)}
                  disabled={actionLoading}
                  className="flex-1 h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ShoppingBag size={15} />
                  )}
                  Bill & Accept
                </button>
                <button
                  onClick={() => onOpenReject(orderDetail.order_id)}
                  disabled={actionLoading}
                  className="flex-1 h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle size={15} />
                  Reject
                </button>
              </div>
            )}

            {/* ACCEPTED Stage Actions */}
            {canMarkReady && (
              <button
                onClick={() => onMarkReady(orderDetail.order_id)}
                disabled={actionLoading}
                className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle size={15} />
                )}
                Mark Ready for Pickup
              </button>
            )}

            {/* READY FOR PICKUP Stage Actions */}
            {canComplete && (
              <button
                onClick={() => onComplete(orderDetail.order_id)}
                disabled={actionLoading}
                className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/80 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle size={15} />
                )}
                Mark Completed
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPanel;
