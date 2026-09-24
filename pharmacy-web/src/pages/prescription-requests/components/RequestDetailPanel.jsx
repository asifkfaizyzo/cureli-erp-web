// pharmacy-web/src/pages/prescription-requests/components/RequestDetailPanel.jsx (do not remove this comment)
// pharmacy-web/src/pages/prescription-requests/components/RequestDetailPanel.jsx

import { useState, useCallback }  from 'react';
import {
  X, Loader2, MapPin, FileText, Clock,
  Package, ExternalLink, AlertCircle, CheckCircle,
} from 'lucide-react';
import QuoteBuilder from './QuoteBuilder';

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
  SENT:      'New Request',
  QUOTE_SENT: 'Quote Sent',
  ACCEPTED:  'Quote Accepted',
  CONVERTED: 'Order Created',
  DECLINED:  'Declined',
  EXPIRED:   'Expired',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function QuoteCountdown({ expiresAt }) {
  const [remaining, setRemaining] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  // Update every second
  useState(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(id); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  });

  if (remaining <= 0) {
    return (
      <span className="text-[11px] text-red-400 font-medium">
        Quote expired
      </span>
    );
  }

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining < 120; // red under 2 minutes

  return (
    <span className={`text-[11px] font-medium ${isUrgent ? 'text-red-400' : 'text-white/40'}`}>
      Quote expires in {mins}:{String(secs).padStart(2, '0')}
    </span>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-white/40" />
      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
        {title}
      </span>
    </div>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

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

  const handleOpenFile = useCallback(async (fileId) => {
    setLoadingFileId(fileId);
    try {
      const url = await onGetFileUrl(recipientId, fileId);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setLoadingFileId(null);
    }
  }, [recipientId, onGetFileUrl]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!recipientId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <FileText size={22} className="text-white/20" />
        </div>
        <p className="text-sm text-white/30 text-center">
          Select a prescription request to view details
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 size={24} className="animate-spin text-white/20" />
        <p className="text-xs text-white/30">Loading request...</p>
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

  if (!detail) return null;

  const isActionable = ['SENT', 'QUOTE_SENT'].includes(detail.status);
  const isTerminal   = ['DECLINED', 'EXPIRED', 'CONVERTED'].includes(detail.status);

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-white">
            {detail.request_number}
          </h2>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-white/35">
              {STATUS_LABELS[detail.status]}
              {detail.sent_at ? ` · ${formatDateTime(detail.sent_at)}` : ''}
            </p>
            {detail.status === 'QUOTE_SENT' && detail.quote_expires_at && (
              <QuoteCountdown expiresAt={detail.quote_expires_at} />
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* ── Prescription Images ─────────────────────────────────────────── */}
        {detail.files?.length > 0 && (
          <SectionCard title="Prescription Images" icon={FileText}>
            <div className="space-y-2">
              {detail.files.map((file) => (
                <button
                  key={file.file_id}
                  onClick={() => handleOpenFile(file.file_id)}
                  disabled={loadingFileId === file.file_id}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors text-left group disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={14} className="text-white/40 flex-shrink-0" />
                    <span className="text-xs text-white/60 truncate">
                      {file.original_name}
                    </span>
                  </div>
                  {loadingFileId === file.file_id ? (
                    <Loader2 size={13} className="animate-spin text-white/30 flex-shrink-0" />
                  ) : (
                    <ExternalLink size={13} className="text-white/30 group-hover:text-white/60 flex-shrink-0 transition-colors" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/20 leading-relaxed">
              Images are available for 7 days from the time of request
            </p>
          </SectionCard>
        )}

        {/* ── Delivery Address ────────────────────────────────────────────── */}
        {detail.delivery_address && (
          <SectionCard title="Delivery Address" icon={MapPin}>
            <p className="text-xs text-white/60 leading-relaxed">
              {[
                detail.delivery_address.address_line_1,
                detail.delivery_address.address_line_2,
                detail.delivery_address.landmark,
                detail.delivery_address.city,
                detail.delivery_address.state,
                detail.delivery_address.pincode,
              ]
                .filter(Boolean)
                .join(', ')}
            </p>
          </SectionCard>
        )}

        {/* ── Timeline ────────────────────────────────────────────────────── */}
        <SectionCard title="Timeline" icon={Clock}>
          <div className="space-y-2">
            {detail.sent_at && (
              <div className="flex justify-between">
                <span className="text-xs text-white/35">Request received</span>
                <span className="text-xs text-white/60">{formatDateTime(detail.sent_at)}</span>
              </div>
            )}
            {detail.quote_sent_at && (
              <div className="flex justify-between">
                <span className="text-xs text-white/35">Quote sent</span>
                <span className="text-xs text-white/60">{formatDateTime(detail.quote_sent_at)}</span>
              </div>
            )}
            {detail.accepted_at && (
              <div className="flex justify-between">
                <span className="text-xs text-white/35">Quote accepted</span>
                <span className="text-xs text-white/60">{formatDateTime(detail.accepted_at)}</span>
              </div>
            )}
            {detail.converted_at && (
              <div className="flex justify-between">
                <span className="text-xs text-white/35">Order created</span>
                <span className="text-xs text-white/60">{formatDateTime(detail.converted_at)}</span>
              </div>
            )}
            {detail.declined_at && (
              <div className="flex justify-between">
                <span className="text-xs text-white/35">Declined</span>
                <span className="text-xs text-white/60">{formatDateTime(detail.declined_at)}</span>
              </div>
            )}
            {detail.expired_at && (
              <div className="flex justify-between">
                <span className="text-xs text-white/35">Expired</span>
                <span className="text-xs text-white/60">{formatDateTime(detail.expired_at)}</span>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Converted order link ─────────────────────────────────────────── */}
        {detail.converted_order_id && (
          <SectionCard title="Resulting Order" icon={Package}>
            <p className="text-xs text-white/60">
              This prescription request was converted into a marketplace order.
              Find it in the Orders tab.
            </p>
          </SectionCard>
        )}

        {/* ── Decline reason ──────────────────────────────────────────────── */}
        {detail.status === 'DECLINED' && detail.decline_reason && (
          <SectionCard title="Decline Reason" icon={AlertCircle}>
            <p className="text-sm text-white/60 leading-relaxed">
              {detail.decline_reason}
            </p>
          </SectionCard>
        )}

        {/* ── Read-only quote (accepted / converted) ───────────────────────── */}
        {['ACCEPTED', 'CONVERTED'].includes(detail.status) && detail.quote_items?.length > 0 && (
          <SectionCard title="Accepted Quote" icon={CheckCircle}>
            <div className="space-y-2">
              {detail.quote_items.map((item) => (
                <div key={item.quote_item_id} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-tight ${item.is_available ? 'text-white/80' : 'text-white/30 line-through'}`}>
                      {item.medicine_name}
                    </p>
                    <p className="text-xs text-white/35 mt-0.5">
                      {[item.brand, item.pack_size].filter(Boolean).join(' · ')}
                      {item.is_substitute && (
                        <span className="ml-2 text-blue-400">Substitute</span>
                      )}
                      {!item.is_available && (
                        <span className="ml-2 text-red-400/60">Unavailable</span>
                      )}
                    </p>
                    {item.substitute_note && (
                      <p className="text-[11px] text-blue-400/70 mt-1 italic">
                        {item.substitute_note}
                      </p>
                    )}
                  </div>
                  {item.is_available && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-white/60">×{item.quantity}</p>
                      <p className="text-sm font-semibold text-white">
                        ₹{item.line_total.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Quote builder (actionable states) ───────────────────────────── */}
        {isActionable && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package size={14} className="text-white/40" />
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                {detail.status === 'QUOTE_SENT' ? 'Update Quote' : 'Build Quote'}
              </span>
            </div>
            <QuoteBuilder
              detail={detail}
              onSubmitQuote={onSubmitQuote}
              onOpenDecline={onOpenDecline}
              actionLoading={actionLoading}
              actionError={actionError}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetailPanel;