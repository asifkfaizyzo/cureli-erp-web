// pharmacy-web/src/pages/prescription-requests/components/RequestListPanel.jsx (do not remove this comment)

import { Loader2, RefreshCw, FileText } from 'lucide-react';
import RequestCard from './RequestCard';
import { REQUEST_TABS } from '../../../hooks/marketplace/usePrescriptionRequestsPage';

const RequestListPanel = ({
  activeTab,
  recipients,
  isLoading,
  error,
  selectedId,
  onSelectRequest,
  page,
  totalPages,
  total,
  onPageChange,
  onRefresh,
  pendingRequestIds,
  mutedRequestIds,
  onMuteRequest,
  onUnmuteRequest,
}) => {
  const tab = REQUEST_TABS.find((t) => t.id === activeTab);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white/[0.01]">
      {/* Sticky Panel header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#010015] z-10">
        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
          {total > 0
            ? `${total} request${total !== 1 ? 's' : ''}`
            : 'Requests'}
        </span>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white/90 transition-colors focus:outline-none"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* List — isolated scroll container */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {isLoading && recipients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <Loader2 size={22} className="animate-spin text-white/40" />
            <p className="text-xs text-white/50">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12">
            <p className="text-sm text-red-400 text-center">{error}</p>
            <button
              onClick={onRefresh}
              className="px-4 py-2 rounded-lg bg-white/[0.06] text-white/60 text-xs font-medium hover:bg-white/[0.10] transition-colors"
            >
              Try again
            </button>
          </div>
        ) : recipients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 py-12">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <FileText size={20} className="text-white/20" />
            </div>
            <p className="text-sm font-semibold text-white/70 text-center">
              {tab?.emptyLabel ?? 'No requests'}
            </p>
            <p className="text-xs text-white/45 text-center max-w-[220px]">
              {tab?.emptyDesc ?? ''}
            </p>
          </div>
        ) : (
          recipients.map((recipient) => {
            const isAlerting = pendingRequestIds?.[recipient.recipient_id] === true;
            const isMuted    = mutedRequestIds?.[recipient.recipient_id] === true;

            return (
              <RequestCard
                key={recipient.recipient_id}
                recipient={recipient}
                isSelected={selectedId === recipient.recipient_id}
                onSelect={onSelectRequest}
                isAlerting={isAlerting}
                isMuted={isMuted}
                onMute={onMuteRequest}
                onUnmute={onUnmuteRequest}
              />
            );
          })
        )}
      </div>

      {/* Sticky Pagination Footer */}
      {totalPages > 1 && recipients.length > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between gap-2 py-2.5 px-4 border-t border-white/[0.06] bg-[#010015]">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/50 text-xs font-semibold hover:bg-white/[0.09] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-white/60 font-medium">
            <span className="text-white/90 font-bold">{page}</span> / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/50 text-xs font-semibold hover:bg-white/[0.09] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestListPanel;