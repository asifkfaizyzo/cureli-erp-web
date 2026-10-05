// cadmin-web/src/pages/Fleet/Pricing/comps/BasePay/SurgeRuleCard.jsx
import { useState, useEffect } from "react";
import { Zap, Trash2, Clock, User } from "lucide-react";

function formatRelativeTime(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCountdown(expiresAt, now) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - now;
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m remaining`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return `${hours}h ${remMins}m remaining`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h remaining`;
}

export default function SurgeRuleCard({ rule, onToggle, onDelete, disabled }) {
  const [now, setNow] = useState(Date.now());

  // Tick countdown every 30s when active with an expiry
  useEffect(() => {
    if (!rule.is_active || !rule.expires_at) return;
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [rule.is_active, rule.expires_at]);

  const displayValue = rule.calc_type === "MULTIPLIER"
    ? `${rule.value}x`
    : `+₹${rule.value}`;

  const countdown = rule.is_active ? formatCountdown(rule.expires_at, now) : null;

  return (
    <div
      className={`p-4 border rounded-xl transition-all
        ${rule.is_active
          ? "bg-orange-50/50 border-orange-200"
          : "bg-white border-gray-200"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
            ${rule.is_active ? "bg-orange-500" : "bg-gray-100"}`}>
            <Zap size={16} className={rule.is_active ? "text-white" : "text-gray-500"} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-gray-900 truncate">{rule.name}</p>
              {rule.is_active && (
                <span className="px-2 py-0.5 text-[10px] font-bold text-orange-700 bg-orange-100 rounded-full uppercase tracking-wide">
                  LIVE
                </span>
              )}
            </div>
            {rule.description && (
              <p className="text-xs text-gray-500 mb-1">{rule.description}</p>
            )}
            <p className="text-xs text-gray-400">
              <span className="font-medium text-gray-600">{displayValue}</span>
              {" • "}
              {rule.calc_type === "MULTIPLIER" ? "Multiplier" : "Flat Addition"}
            </p>

            {/* ── NEW: Audit trail (who activated + when) ── */}
            {rule.is_active && rule.activated_at && (
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                {rule.activated_by_name && (
                  <span className="flex items-center gap-1">
                    <User size={9} />
                    {rule.activated_by_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock size={9} />
                  {formatRelativeTime(rule.activated_at)}
                </span>
              </div>
            )}

            {/* ── NEW: Expiry countdown ── */}
            {rule.is_active && countdown && (
              <div className={`mt-1 text-[10px] font-medium flex items-center gap-1
                ${countdown === "Expired" ? "text-red-500" : "text-amber-600"}`}>
                <Clock size={9} />
                {countdown === "Expired"
                  ? "Expired — will auto-deactivate shortly"
                  : `Auto-expires: ${countdown}`}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onToggle(rule)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        focus:outline-none focus:ring-2 focus:ring-[#05015A]/20
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${rule.is_active ? "bg-orange-500" : "bg-gray-300"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
                          ${rule.is_active ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          {!rule.is_active && (
            <button
              type="button"
              onClick={() => onDelete(rule)}
              disabled={disabled}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}