import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

const REJECTION_REASONS = [
  { value: 'OUT_OF_STOCK',         label: 'Out of Stock'         },
  { value: 'PRESCRIPTION_INVALID', label: 'Prescription Invalid' },
  { value: 'STORE_CLOSED',         label: 'Store Closed'         },
  { value: 'OTHER',                label: 'Other'                },
];

const RejectModal = ({ open, onClose, onSubmit, isLoading, error, theme = 'dark' }) => {
  const [reason,      setReason]      = useState('');
  const [reasonOther, setReasonOther] = useState('');

  const isLight = theme === 'light';

  // Reset form state whenever the modal closes
  useEffect(() => {
    if (!open) {
      setReason('');
      setReasonOther('');
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) return;
    onSubmit(reason, reason === 'OTHER' ? reasonOther : '');
  };

  const handleClose = () => {
    onClose();
  };

  // ── Theme Style Mapping ────────────────────────────────────────────────────
  const styles = {
    modal: isLight 
      ? 'bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden' 
      : 'relative w-full max-w-md bg-[#0d0a3a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden',
    headerBorder: isLight ? 'border-gray-100' : 'border-white/[0.06]',
    title: isLight ? 'text-gray-900 font-bold text-sm' : 'text-base font-bold text-white',
    closeBtn: isLight 
      ? 'p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors' 
      : 'p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors',
    desc: isLight ? 'text-xs text-gray-500 font-medium' : 'text-sm text-white/50',
    radioUnselected: isLight 
      ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/60 hover:border-gray-300' 
      : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:border-white/20 hover:text-white/80',
    radioSelected: isLight 
      ? 'bg-red-50 border-red-200 text-red-900' 
      : 'bg-red-500/15 border-red-500/30 text-white',
    radioIndicatorOuter: (active) => isLight 
      ? `w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-red-500' : 'border-gray-300'}`
      : `w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${active ? 'border-red-400' : 'border-white/20'}`,
    radioIndicatorInner: isLight ? 'bg-red-500' : 'bg-red-400',
    textarea: isLight 
      ? 'w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 text-xs resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all'
      : 'w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/80 placeholder-white/20 text-sm resize-none focus:outline-none focus:border-white/20 transition-colors',
    cancelBtn: isLight 
      ? 'flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors' 
      : 'flex-1 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.07] text-white/60 text-sm font-semibold transition-colors disabled:opacity-50',
    rejectBtn: isLight 
      ? 'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold transition-all'
      : 'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
    errorText: isLight ? 'text-xs text-red-600 font-medium' : 'text-sm text-red-400'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-md ${styles.modal}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${styles.headerBorder}`}>
          <h2 className={styles.title}>Reject Order</h2>
          <button onClick={handleClose} className={styles.closeBtn}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className={styles.desc}>
            Select a reason for rejecting this order. The customer will be notified.
          </p>

          {/* Reason Selection Options */}
          <div className="space-y-2">
            {REJECTION_REASONS.map((r) => {
              const isSelected = reason === r.value;
              return (
                <label
                  key={r.value}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                    ${isSelected ? styles.radioSelected : styles.radioUnselected}
                  `}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={isSelected}
                    onChange={() => setReason(r.value)}
                    className="sr-only"
                  />
                  <div className={styles.radioIndicatorOuter(isSelected)}>
                    {isSelected && (
                      <div className={`w-2 h-2 rounded-full ${styles.radioIndicatorInner}`} />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide">{r.label}</span>
                </label>
              );
            })}
          </div>

          {/* Custom Textarea for "OTHER" */}
          {reason === 'OTHER' && (
            <textarea
              value={reasonOther}
              onChange={(e) => setReasonOther(e.target.value)}
              placeholder="Please describe the reason..."
              rows={3}
              required
              maxLength={300}
              className={styles.textarea}
            />
          )}

          {/* Error Message */}
          {error && (
            <p className={styles.errorText}>{error}</p>
          )}

          {/* Actions Footer */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || isLoading || (reason === 'OTHER' && !reasonOther.trim())}
              className={styles.rejectBtn}
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              Reject Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectModal;