// pharmacy-web/src/pages/prescription-requests/components/DeclineModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/prescription-requests/components/DeclineModal.jsx

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const DeclineModal = ({ open, onClose, onSubmit, isLoading }) => {
  const [reason, setReason] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    onSubmit(reason.trim() || null);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0a0825] border border-white/[0.10] rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-white">
            Decline Prescription Request
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-white/50 leading-relaxed">
            The customer will see that you have declined their request.
            You can optionally provide a reason.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/40">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. We do not stock these medicines at this branch"
              rows={3}
              maxLength={300}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
            />
            <p className="text-[10px] text-white/20 text-right">
              {reason.length}/300
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white/60 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : null}
            Decline Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclineModal;