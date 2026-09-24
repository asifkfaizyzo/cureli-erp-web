// cadmin-web/src/pages/Settings/comps/ActivityTab.jsx (do not remove this comment)
// pharmacy-web/src/pages/Settings/comps/ActivityTab.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Activity,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Monitor,
  Globe,
  Clock,
  ShieldCheck,
  KeyRound,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { getMyActivity } from "../../../api/cadminProfile";

// ── Action metadata ────────────────────────────────────────────────────────
const ACTION_META = {
  // ── Self-service (CAdminActivityLog keys) ─────────────────────────────
  UPDATE_CONTACT: {
    label: "Contact Updated",
    icon: Phone,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  UPDATE_IDENTITY: {
    label: "Identity Updated",
    icon: User,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  CHANGE_PASSWORD: {
    label: "Password Changed",
    icon: KeyRound,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  LOGIN: {
    label: "Logged In",
    icon: ShieldCheck,
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  LOGOUT: {
    label: "Logged Out",
    icon: ShieldCheck,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },

  // ── AuditLog action keys ───────────────────────────────────────────────
  CADMIN_LOGIN_SUCCESS: {
    label: "Logged In",
    icon: ShieldCheck,
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  CADMIN_LOGOUT: {
    label: "Logged Out",
    icon: ShieldCheck,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  },
  CADMIN_PROFILE_UPDATED: {
    label: "Profile Updated",
    icon: User,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  CADMIN_PASSWORD_RESET_COMPLETED: {
    label: "Password Changed",
    icon: KeyRound,
    color: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  CADMIN_ROLE_CHANGED: {
    label: "Role Changed",
    icon: ShieldCheck,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  CADMIN_CREATED: {
    label: "Account Created",
    icon: User,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  CADMIN_ACTIVATED: {
    label: "Account Activated",
    icon: ShieldCheck,
    color: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  CADMIN_SUSPENDED: {
    label: "Account Suspended",
    icon: ShieldCheck,
    color: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

const getActionMeta = (action) =>
  ACTION_META[action] ?? {
    label: action.replace(/_/g, " "),
    icon: Activity,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDateTime = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateTime(d);
};

// ── Render metadata fields correctly ──────────────────────────────────────

const Field = ({ label, value }) => {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="text-xs text-gray-500 flex items-start gap-1.5">
      <span className="font-medium text-gray-600 capitalize min-w-[5rem]">
        {label}:
      </span>
      <span>{String(value)}</span>
    </div>
  );
};

const Diff = ({ label, from, to }) => {
  if (from === undefined && to === undefined) return null;
  return (
    <div className="text-xs text-gray-500 flex items-start gap-1.5">
      <span className="font-medium text-gray-600 capitalize min-w-[5rem]">
        {label}:
      </span>
      <span>
        <span className="line-through text-red-400">{String(from ?? "—")}</span>
        {" → "}
        <span className="text-green-600">{String(to ?? "—")}</span>
      </span>
    </div>
  );
};

const fieldLabel = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

/**
 * Render metadata based on action type.
 * AuditLog metadata is a flat object — never { from, to } pairs at root.
 */
const MetadataView = ({ action, metadata }) => {
  if (!metadata || typeof metadata !== "object") return null;

  // ── Profile updates — have before/after diffs ──────────────────────────
  if (
    action === "CADMIN_PROFILE_UPDATED" ||
    action === "UPDATE_CONTACT" ||
    action === "UPDATE_IDENTITY"
  ) {
    if (metadata.before && metadata.after) {
      const fields = metadata.changed_fields || Object.keys(metadata.before);
      return (
        <div className="space-y-1">
          {fields.map((f) => (
            <Diff
              key={f}
              label={fieldLabel(f)}
              from={metadata.before[f]}
              to={metadata.after[f]}
            />
          ))}
        </div>
      );
    }
    if (metadata.changed_fields) {
      return (
        <Field label="Changed" value={metadata.changed_fields.join(", ")} />
      );
    }
    return null;
  }

  // ── Login ──────────────────────────────────────────────────────────────
  if (action === "CADMIN_LOGIN_SUCCESS" || action === "LOGIN") {
    return (
      <div className="space-y-1">
        <Field label="Username" value={metadata.username} />
        <Field label="Login Method" value={metadata.login_method} />
        <Field label="Session Type" value={metadata.session_type} />
      </div>
    );
  }

  // ── Logout ─────────────────────────────────────────────────────────────
  if (action === "CADMIN_LOGOUT" || action === "LOGOUT") {
    return (
      <div className="space-y-1">
        <Field label="Username" value={metadata.username} />
        <Field label="Logout Type" value={metadata.logout_type} />
      </div>
    );
  }

  // ── Password reset ─────────────────────────────────────────────────────
  if (
    action === "CADMIN_PASSWORD_RESET_COMPLETED" ||
    action === "CHANGE_PASSWORD"
  ) {
    return <Field label="Method" value={metadata.reset_method} />;
  }

  // ── Role changed ───────────────────────────────────────────────────────
  if (action === "CADMIN_ROLE_CHANGED") {
    const event = metadata.event;
    if (event === "roles_assigned" && metadata.role_names) {
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {metadata.role_names.map((name) => (
              <span
                key={name}
                className="px-2 py-0.5 bg-purple-100 text-purple-700
                           rounded-full text-[11px] font-medium border border-purple-200"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      );
    }
    if (
      event === "role_created" ||
      event === "role_updated" ||
      event === "role_deleted"
    ) {
      return <Field label="Role" value={metadata.role_name} />;
    }
    return null;
  }

  // ── Fallback — show all flat string/number fields ──────────────────────
  const flat = Object.entries(metadata).filter(
    ([k, v]) =>
      (typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean") &&
      !["self_update", "super_admin_only"].includes(k),
  );
  if (!flat.length) return null;
  return (
    <div className="space-y-1">
      {flat.map(([k, v]) => (
        <Field key={k} label={fieldLabel(k)} value={String(v)} />
      ))}
    </div>
  );
};

// ── Changes display (legacy support) ───────────────────────────────────────
const ChangesView = ({ changes }) => {
  if (!changes || typeof changes !== "object") return null;
  const entries = Object.entries(changes);
  if (!entries.length) return null;

  return (
    <div className="space-y-1">
      {entries.map(([field, val]) => (
        <div
          key={field}
          className="text-xs text-gray-500 flex items-start gap-1.5"
        >
          <span className="font-medium text-gray-600 capitalize min-w-[5rem]">
            {fieldLabel(field)}:
          </span>
          {val && typeof val === "object" && "from" in val ? (
            <span>
              <span className="line-through text-red-400">
                {String(val.from ?? "—")}
              </span>
              {" → "}
              <span className="text-green-600">{String(val.to ?? "—")}</span>
            </span>
          ) : (
            <span>
              {typeof val === "object" ? JSON.stringify(val) : String(val)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Single log row ─────────────────────────────────────────────────────────
const LogRow = ({ log }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = getActionMeta(log.action);
  const Icon = meta.icon;

  // Field name normalisation — service returns camelCase or snake_case
  const ipAddress = log.ipAddress || log.ip_address;
  const userAgent = log.userAgent || log.user_agent;
  const createdAt = log.createdAt || log.created_at;
  const metadata = log.metadata;
  const changes = log.changes;

  const hasDetails = metadata || changes || ipAddress || userAgent;

  return (
    <div
      className="border border-gray-100 rounded-xl overflow-hidden
                    hover:border-gray-200 transition-colors"
    >
      <button
        onClick={() => hasDetails && setExpanded((p) => !p)}
        className={`w-full flex items-start gap-4 p-4 text-left
                    ${hasDetails ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}`}
      >
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-lg border flex items-center justify-center
                         flex-shrink-0 ${meta.color}`}
        >
          <Icon size={16} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full
                              text-[10px] font-semibold border ${meta.color}`}
            >
              {meta.label}
            </span>
            <span className="text-xs text-gray-400">{timeAgo(createdAt)}</span>
          </div>
          {log.description && log.description !== log.action && (
            <p className="text-sm text-gray-700 mt-1">{log.description}</p>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex-shrink-0 text-right hidden sm:block">
          <p className="text-xs text-gray-400">{formatDateTime(createdAt)}</p>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50/50">
          {/* Metadata (AuditLog format) */}
          {metadata && (
            <div className="mt-3">
              <MetadataView action={log.action} metadata={metadata} />
            </div>
          )}

          {/* Changes (legacy CAdminActivityLog format) */}
          {changes && !metadata && (
            <div className="mt-3">
              <ChangesView changes={changes} />
            </div>
          )}

          {/* IP + UA */}
          <div className="mt-3 flex flex-wrap gap-4">
            {ipAddress && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Globe size={12} className="text-gray-400" />
                <span className="font-medium">IP:</span>
                <span className="font-mono">{ipAddress}</span>
              </div>
            )}
            {userAgent && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 max-w-xs truncate">
                <Monitor size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate">{userAgent}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────
const ActivityTab = ({ cadminId }) => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const debounceRef = useRef(null);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQ(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit: 15 };
      if (debouncedQ) params.action = debouncedQ;

      const res = await getMyActivity(params);
      const data = res.data?.data;

      setLogs(data?.logs ?? []);
      setPagination(data?.pagination ?? null);
    } catch (err) {
      console.error("Failed to fetch activity:", err);
      setError(err.response?.data?.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Empty state ──────────────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Activity size={28} className="text-gray-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-700">
        No activity found
      </h3>
      <p className="text-sm text-gray-400 mt-1">
        {debouncedQ
          ? "Try a different search term"
          : "Your activity will appear here"}
      </p>
    </div>
  );

  return (
    <div
      className="h-full bg-white rounded-xl border border-gray-200 shadow-sm
                    overflow-hidden flex flex-col"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-[#000060]" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Activity Log
              </h2>
              <p className="text-xs text-gray-500">
                {pagination
                  ? `${pagination.total} event${pagination.total !== 1 ? "s" : ""} total`
                  : "All your account activity"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search / filter by action */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by action…"
                className="pl-8 pr-8 py-2 border border-gray-300 rounded-lg text-xs
                           focus:ring-2 focus:ring-[#000060]/20 focus:border-[#000060]
                           outline-none w-48"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100
                         rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#000060]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm text-gray-600">{error}</p>
            <button
              onClick={fetchLogs}
              className="text-xs text-[#000060] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div
          className="flex-shrink-0 px-6 py-3 border-t border-gray-100 bg-gray-50
                        flex items-center justify-between"
        >
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
            {" · "}
            {pagination.total} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!pagination.hasPrev || loading}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600
                         hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter((p) => {
                const cur = pagination.page;
                return (
                  p === 1 ||
                  p === pagination.totalPages ||
                  (p >= cur - 1 && p <= cur + 1)
                );
              })
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-2 text-gray-400 text-xs"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
                                ${
                                  p === pagination.page
                                    ? "bg-[#000060] text-white"
                                    : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                  >
                    {p}
                  </button>
                ),
              )}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasNext || loading}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-600
                         hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTab;
