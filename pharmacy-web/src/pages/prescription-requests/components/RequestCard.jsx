// pharmacy-web/src/pages/prescription-requests/components/RequestCard.jsx (do not remove this comment)
// pharmacy-web/src/pages/prescription-requests/components/RequestCard.jsx

import { FileText, Volume2, VolumeX } from 'lucide-react';

const STATUS_CONFIG = {
  SENT: {
    label:  'New Request',
    color:  'text-yellow-400',
    bg:     'bg-yellow-500/10',
    border: 'border-yellow-500/20',
    dot:    'bg-yellow-400',
    pulse:  true,
  },
  QUOTE_SENT: {
    label:  'Quote Sent',
    color:  'text-blue-400',
    bg:     'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot:    'bg-blue-400',
    pulse:  false,
  },
  ACCEPTED: {
    label:  'Quote Accepted',
    color:  'text-green-400',
    bg:     'bg-green-500/10',
    border: 'border-green-500/20',
    dot:    'bg-green-400',
    pulse:  false,
  },
  CONVERTED: {
    label:  'Order Created',
    color:  'text-green-300',
    bg:     'bg-green-500/10',
    border: 'border-green-500/10',
    dot:    'bg-green-300',
    pulse:  false,
  },
  DECLINED: {
    label:  'Declined',
    color:  'text-white/30',
    bg:     'bg-white/[0.03]',
    border: 'border-white/[0.04]',
    dot:    'bg-white/20',
    pulse:  false,
  },
  EXPIRED: {
    label:  'Expired',
    color:  'text-white/30',
    bg:     'bg-white/[0.03]',
    border: 'border-white/[0.04]',
    dot:    'bg-white/20',
    pulse:  false,
  },
};

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const RequestCard = ({
  recipient,
  isSelected,
  onSelect,
  isAlerting,
  isMuted,
  onMute,
  onUnmute,
}) => {
  const cfg = STATUS_CONFIG[recipient.status] ?? STATUS_CONFIG.SENT;

  // Show mute button only when this request is actively alerting (pending via SSE)
  const showMuteButton = isAlerting;

  const handleMuteClick = (e) => {
    e.stopPropagation(); // Don't select the card
    if (isMuted) {
      onUnmute(recipient.recipient_id);
    } else {
      onMute(recipient.recipient_id);
    }
  };

  return (
    <button
      onClick={() => onSelect(recipient.recipient_id)}
      className={`
        w-full text-left px-4 py-3.5 border-b border-white/[0.04]
        transition-colors duration-100 relative group
        ${isSelected
          ? 'bg-white/[0.08] border-l-2 border-l-white'
          : 'hover:bg-white/[0.04] border-l-2 border-l-transparent'
        }
      `}
    >
      {/* Alerting indicator — subtle left-edge glow for unmuted alerting requests */}
      {isAlerting && !isMuted && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-red-500 animate-pulse" />
      )}

      {/* Top row: request number + status + mute button */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-sm font-bold text-white">
          {recipient.request_number}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Mute / Unmute button */}
          {showMuteButton && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleMuteClick}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleMuteClick(e); }}
              title={isMuted ? 'Unmute alert for this request' : 'Mute alert for this request'}
              className={`
                inline-flex items-center justify-center
                w-6 h-6 rounded-md
                transition-all duration-150 cursor-pointer
                ${isMuted
                  ? 'bg-white/[0.06] text-white/25 hover:bg-white/[0.10] hover:text-white/50'
                  : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300'
                }
              `}
            >
              {isMuted ? (
                <VolumeX size={12} />
              ) : (
                <Volume2 size={12} className="animate-pulse" />
              )}
            </span>
          )}

          {/* Status badge */}
          <span
            className={`
              inline-flex items-center gap-1.5 px-2 py-0.5
              rounded-full text-[10px] font-semibold
              border ${cfg.bg} ${cfg.border} ${cfg.color}
            `}
          >
            <span
              className={`
                w-1.5 h-1.5 rounded-full ${cfg.dot}
                ${cfg.pulse ? 'animate-pulse' : ''}
              `}
            />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Middle row: branch name + distance */}
      <p className="text-xs text-white/50 truncate mb-1">
        {recipient.branch_name}
        {recipient.distance_km != null && (
          <span className="text-white/30 ml-1">· {recipient.distance_km} km</span>
        )}
      </p>

      {/* Bottom row: file count + quote total + time */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] text-white/30">
            <FileText size={10} />
            {recipient.file_count} file{recipient.file_count !== 1 ? 's' : ''}
          </span>

          {recipient.quote_item_count > 0 && (
            <span className="text-[11px] text-white/30">
              {recipient.quote_item_count} item{recipient.quote_item_count !== 1 ? 's' : ''}
              {recipient.quote_total > 0 && (
                <span className="text-white/50 ml-1">
                  · ₹{Number(recipient.quote_total).toFixed(0)}
                </span>
              )}
            </span>
          )}
        </div>

        <span className="text-[10px] text-white/25 flex-shrink-0">
          {formatRelativeTime(recipient.sent_at)}
        </span>
      </div>
    </button>
  );
};

export default RequestCard;