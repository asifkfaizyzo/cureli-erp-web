// cadmin-web/src/pages/marketplace/Users/comps/UserDetailPanel.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Users/comps/UserDetailPanel.jsx

import {
  X,
  Phone,
  Mail,
  Calendar,
  Clock,
  ShieldOff,
  ShieldCheck,
  Smartphone,
  Trash2,
  Edit2,
  LogOut,
  CheckCircle2,
  XCircle,
  Home,
  Loader2,
  AlertTriangle,
  MapPin,
} from "lucide-react";

const fmt = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtTime = (d) =>
  !d ? "—" : new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });

const avatarGradient = (name = "") => {
  const palette = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
  ];
  return palette[name.charCodeAt(0) % palette.length || 0];
};

const InfoTile = ({ icon: Icon, label, value, verified }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <p className="text-sm font-medium text-gray-800 truncate">{value || "—"}</p>
        {verified !== undefined &&
          (verified ? (
            <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Unverified</span>
          ))}
      </div>
    </div>
  </div>
);

const SectionTitle = ({ children, count }) => (
  <div className="flex items-center justify-between mb-2.5">
    <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{children}</h4>
    {count !== undefined && (
      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}</span>
    )}
  </div>
);

const UserDetailPanel = ({
  user, detailData, detailLoading, onClose, onEdit, onBlock, onRevokeSessions, onDelete,
}) => {
  if (!user) return null;

  const initials = user.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const isSuspended = user.status === "suspended";

  return (
    <div className="h-full bg-white flex flex-col shadow-2xl">
      {/* ═══ HERO HEADER ═══ */}
      <div className="relative flex-shrink-0 bg-gradient-to-br from-[#05015A] to-[#0a0280] px-6 pt-5 pb-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient(user.full_name || "?")} flex items-center justify-center text-white text-xl font-bold shadow-lg ring-4 ring-white/10`}>
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{user.full_name || "No name"}</h3>
            <p className="text-sm text-white/70 mt-0.5">{user.phone}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 text-[10px] font-semibold px-2.5 py-1 rounded-full ${
              isSuspended ? "bg-red-500/20 text-red-100" : "bg-emerald-500/20 text-emerald-100"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? "bg-red-300" : "bg-emerald-300"}`} />
              {isSuspended ? "Suspended" : "Active"}
            </span>
          </div>
        </div>
      </div>

      {detailLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 size={26} className="animate-spin text-gray-300 mb-2" />
          <p className="text-xs text-gray-400">Loading details...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Suspension banner */}
          {isSuspended && detailData?.suspended_by && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertTriangle size={15} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 space-y-0.5">
                <p className="font-semibold">Account Suspended</p>
                <p>By {detailData.suspended_by} · {fmtTime(detailData.suspended_at)}</p>
                {detailData.suspension_reason && <p>Reason: {detailData.suspension_reason}</p>}
              </div>
            </div>
          )}

          {/* Info tiles */}
          <div className="grid grid-cols-2 gap-2.5">
            <InfoTile icon={Phone} label="Phone" value={user.phone} verified={user.phone_verified} />
            <InfoTile icon={Mail} label="Email" value={user.email} />
            <InfoTile icon={Calendar} label="Joined" value={fmt(user.created_at)} />
            <InfoTile icon={Clock} label="Last Seen" value={fmt(user.last_seen_at)} />
          </div>

          {/* Addresses */}
          {detailData?.addresses?.length > 0 && (
            <div>
              <SectionTitle count={detailData.addresses.length}>Addresses</SectionTitle>
              <div className="space-y-2">
                {detailData.addresses.map((addr) => (
                  <div key={addr.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Home size={12} className="text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-gray-700">{addr.custom_label || addr.label}</span>
                        {addr.is_default && (
                          <span className="text-[9px] bg-[#05015A] text-white px-1.5 py-0.5 rounded font-medium">DEFAULT</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        {addr.address_line_1}{addr.address_line_2 ? `, ${addr.address_line_2}` : ""}, {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions */}
          {detailData?.sessions?.length > 0 && (
            <div>
              <SectionTitle count={detailData.sessions.length}>Active Sessions</SectionTitle>
              <div className="space-y-2">
                {detailData.sessions.map((s) => (
                  <div key={s.id} className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-100">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Smartphone size={12} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {s.device_name || s.device_platform || "Unknown device"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        v{s.app_version || "—"} · {s.ip_address || "—"} · {fmtTime(s.last_active_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ACTIONS FOOTER ═══ */}
      <div className="flex-shrink-0 border-t border-gray-100 p-4 bg-gray-50/50">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button onClick={onEdit} className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
            <Edit2 size={13} /> Edit
          </button>
          <button onClick={onRevokeSessions} className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all">
            <LogOut size={13} /> Logout All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onBlock}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
              isSuspended
                ? "text-emerald-700 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100"
                : "text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-100"
            }`}
          >
            {isSuspended ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
            {isSuspended ? "Reactivate" : "Suspend"}
          </button>
          <button onClick={onDelete} className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all">
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPanel;