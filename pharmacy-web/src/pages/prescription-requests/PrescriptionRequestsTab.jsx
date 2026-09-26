// pharmacy-web/src/pages/prescription-requests/PrescriptionRequestsTab.jsx (do not remove this comment)
// pharmacy-web/src/pages/prescription-requests/PrescriptionRequestsTab.jsx

import { usePrescriptionRequestsPage, REQUEST_TABS }
  from '../../hooks/marketplace/usePrescriptionRequestsPage';
import RequestListPanel    from './components/RequestListPanel';
import RequestDetailPanel  from './components/RequestDetailPanel';
import DeclineModal        from './components/DeclineModal';

// Tab bar for requests — reuses the same visual style as OrdersTabBar
// but is self-contained since it uses different tab definitions
const RequestsTabBar = ({ activeTab, onTabChange, counts = {} }) => (
  <div className="flex items-center gap-1 border-b border-white/[0.06] px-4 flex-shrink-0">
    {REQUEST_TABS.map((tab) => {
      const isActive = activeTab === tab.id;
      const count    = counts[tab.id];
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            relative flex items-center gap-2 px-3 py-2.5 text-xs font-medium
            border-b-2 transition-all duration-150
            ${isActive
              ? 'border-white text-white'
              : 'border-transparent text-white/40 hover:text-white/70 hover:border-white/20'}
          `}
        >
          {tab.label}
          {count > 0 && (
            <span
              className={`
                px-1.5 py-0.5 rounded-full text-[9px] font-bold min-w-[16px] text-center
                ${isActive && tab.id === 'SENT'
                  ? 'bg-red-500 text-white animate-pulse'
                  : isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/50'}
              `}
            >
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const PrescriptionRequestsTab = () => {
  const page = usePrescriptionRequestsPage();

  const tabCounts = {
    [page.activeTab]: page.total,
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">

      {/* Sub-tab bar */}
      <RequestsTabBar
        activeTab={page.activeTab}
        onTabChange={page.onTabChange}
        counts={tabCounts}
      />

      {/* Two-panel layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-[380px_1fr]">

        {/* Left: request list */}
        <RequestListPanel
          activeTab={page.activeTab}
          recipients={page.recipients}
          isLoading={page.isLoading}
          error={page.error}
          selectedId={page.selectedId}
          onSelectRequest={page.onSelectRequest}
          page={page.page}
          totalPages={page.totalPages}
          total={page.total}
          onPageChange={page.onPageChange}
          onRefresh={page.onRefresh}
          pendingRequestIds={page.pendingRequestIds}
          mutedRequestIds={page.mutedRequestIds}
          onMuteRequest={page.onMuteRequest}
          onUnmuteRequest={page.onUnmuteRequest}
        />

        {/* Right: request detail + quote builder */}
        <RequestDetailPanel
          recipientId={page.selectedId}
          detail={page.detail}
          isLoading={page.isDetailLoading}
          error={page.detailError}
          actionLoading={page.actionLoading}
          actionError={page.actionError}
          onClose={page.onCloseDetail}
          onGetFileUrl={page.onGetFileUrl}
          onSubmitQuote={page.onSubmitQuote}
          onOpenDecline={page.onOpenDecline}
        />
      </div>

      {/* Decline modal */}
      <DeclineModal
        open={page.declineModal.open}
        onClose={page.onCloseDecline}
        onSubmit={page.onDeclineSubmit}
        isLoading={page.actionLoading}
      />
    </div>
  );
};

export default PrescriptionRequestsTab;