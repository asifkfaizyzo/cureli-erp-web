// cadmin-web/src/pages/marketplace/Users/MarketplaceUsersPage.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Users/MarketplaceUsersPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  RefreshCw,
  Users,
  X,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  TrendingUp,
  MoreVertical,
} from "lucide-react";
import {
  getMobileUsers,
  getMobileUserById,
  editMobileUser,
  editMobileUserPhone,
  blockMobileUser,
  revokeMobileUserSessions,
  deleteMobileUser,
} from "../../../api/cadminMobileUsers";
import UserDetailPanel from "./comps/UserDetailPanel";
import EditUserModal from "./comps/EditUserModal";
import BlockUserModal from "./comps/BlockUserModal";
import DeleteUserModal from "./comps/DeleteUserModal";

// ── Helpers ────────────────────────────────────────────────────
const fmt = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const fmtRelative = (d) => {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return fmt(d);
};

const avatarGradient = (name = "") => {
  const palette = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
  ];
  const idx = name.charCodeAt(0) % palette.length || 0;
  return palette[idx];
};

// ── Stat card ──────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, tint }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200/60">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

// ── Toast ──────────────────────────────────────────────────────
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
};

const Toast = ({ toast }) =>
  !toast ? null : (
    <div
      className={`fixed bottom-6 right-6 z-[60] px-4 py-3 rounded-xl shadow-2xl text-sm font-medium animate-[slideUp_0.2s_ease] ${
        toast.type === "error"
          ? "bg-red-600 text-white"
          : toast.type === "warning"
          ? "bg-amber-500 text-white"
          : "bg-gray-900 text-white"
      }`}
    >
      {toast.message}
    </div>
  );

// ── Row skeleton ───────────────────────────────────────────────
const RowSkeleton = () => (
  <div className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50">
    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 w-32 bg-gray-100 rounded animate-pulse" />
      <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
    </div>
    <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
  </div>
);

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
];

// ── MAIN ───────────────────────────────────────────────────────
const MarketplaceUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { toast, show: showToast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [statusFilter]);

  const fetchUsers = useCallback(
  async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getMobileUsers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter,
      });
      const d = res.data?.data;
      setUsers(d?.users || []);
      setTotalPages(d?.total_pages || 1);
      setTotalCount(d?.total || 0);
    } catch {
      showToast("Failed to load users", "error");
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },
  [page, debouncedSearch, statusFilter, showToast] // ← showToast added
);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchDetail = useCallback(async (userId) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await getMobileUserById(userId);
      setDetailData(res.data?.data || null);
    } catch {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchDetail(user.id);
  };

  const closeDrawer = () => {
    setSelectedUser(null);
    setDetailData(null);
  };

  const handleEditConfirm = async (type, data) => {
    setActionLoading(true);
    try {
      if (type === "profile") {
        await editMobileUser(selectedUser.id, data);
        showToast("Profile updated");
      } else {
        await editMobileUserPhone(selectedUser.id, data.phone);
        showToast("Phone updated");
      }
      setShowEditModal(false);
      fetchUsers({ silent: true });
      fetchDetail(selectedUser.id);
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockConfirm = async (block, reason) => {
    setActionLoading(true);
    try {
      const res = await blockMobileUser(selectedUser.id, block, reason);
      const updated = res.data?.data;
      showToast(block ? "User suspended" : "User reactivated");
      setShowBlockModal(false);
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: updated.status } : u))
      );
      setSelectedUser((prev) => (prev ? { ...prev, status: updated.status } : prev));
      fetchDetail(selectedUser.id);
    } catch (err) {
      showToast(err.response?.data?.message || "Status update failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeSessions = async () => {
    setActionLoading(true);
    try {
      const res = await revokeMobileUserSessions(selectedUser.id);
      const count = res.data?.data?.sessions_revoked || 0;
      showToast(count > 0 ? `Revoked ${count} session(s)` : "No active sessions", count > 0 ? "success" : "warning");
      fetchDetail(selectedUser.id);
    } catch {
      showToast("Failed to revoke sessions", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async (reason) => {
    setActionLoading(true);
    try {
      await deleteMobileUser(selectedUser.id, reason);
      showToast("Account deleted");
      setShowDeleteModal(false);
      closeDrawer();
      fetchUsers({ silent: true });
    } catch (err) {
      showToast(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active").length;
    const suspended = users.filter((u) => u.status === "suspended").length;
    return { active, suspended };
  }, [users]);

  return (
    <div className="h-full flex flex-col bg-gray-50/80">
      {/* ═══ HEADER ═══ */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage registered mobile app users
            </p>
          </div>
          <button
            onClick={() => fetchUsers({ silent: true })}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard icon={Users} label="Total Users" value={totalCount.toLocaleString()} tint="bg-indigo-50 text-indigo-600" />
          <StatCard icon={UserCheck} label="Active " value={stats.active} tint="bg-emerald-50 text-emerald-600" />
          <StatCard icon={UserX} label="Suspended " value={stats.suspended} tint="bg-red-50 text-red-600" />
        </div>

        {/* Filters bar */}
        <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200/60 p-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === tab.key
                    ? "bg-white text-[#05015A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:outline-none focus:border-[#05015A]/30 focus:ring-2 focus:ring-[#05015A]/10 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LIST ═══ */}
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
          {/* Column hints */}
          <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">
            <span className="flex-1">User</span>
            <span className="w-40 hidden md:block">Contact</span>
            <span className="w-24 hidden lg:block">Last Seen</span>
            <span className="w-24">Status</span>
            <span className="w-6" />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <Users size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-600">
                  {debouncedSearch ? `No results for "${debouncedSearch}"` : "No users yet"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {debouncedSearch ? "Try a different search" : "Users will appear here"}
                </p>
              </div>
            ) : (
              users.map((user) => {
                const isSelected = selectedUser?.id === user.id;
                const initials =
                  user.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                const suspended = user.status === "suspended";

                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`w-full flex items-center gap-4 px-5 py-3 border-b border-gray-50 text-left transition-all group ${
                      isSelected ? "bg-[#05015A]/[0.04]" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* User */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(user.full_name || "?")} flex items-center justify-center text-white text-xs font-bold`}>
                          {initials}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${suspended ? "bg-red-500" : "bg-emerald-500"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.full_name || <span className="text-gray-400 italic font-normal">No name</span>}
                        </p>
                        <p className="text-xs text-gray-500 truncate md:hidden">{user.phone}</p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="w-40 hidden md:block min-w-0">
                      <p className="text-xs text-gray-700 flex items-center gap-1">
                        {user.phone}
                        {user.phone_verified ? (
                          <CheckCircle2 size={11} className="text-emerald-500" />
                        ) : (
                          <XCircle size={11} className="text-gray-300" />
                        )}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email || "—"}</p>
                    </div>

                    {/* Last seen */}
                    <div className="w-24 hidden lg:block">
                      <p className="text-xs text-gray-500">{fmtRelative(user.last_seen_at)}</p>
                    </div>

                    {/* Status */}
                    <div className="w-24">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                        suspended ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${suspended ? "bg-red-500" : "bg-emerald-500"}`} />
                        {suspended ? "Suspended" : "Active"}
                      </span>
                    </div>

                    {/* Action */}
                    <div className="w-6 flex justify-center">
                      <MoreVertical size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500">
                Page <span className="font-semibold text-gray-700">{page}</span> of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ SLIDE-OVER DRAWER ═══ */}
      {selectedUser && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeDrawer}
            className="fixed inset-0 bg-gray-900/30 backdrop-blur-[2px] z-40 animate-[fadeIn_0.15s_ease]"
          />
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 animate-[slideIn_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <UserDetailPanel
              user={selectedUser}
              detailData={detailData}
              detailLoading={detailLoading}
              onClose={closeDrawer}
              onEdit={() => setShowEditModal(true)}
              onBlock={() => setShowBlockModal(true)}
              onRevokeSessions={handleRevokeSessions}
              onDelete={() => setShowDeleteModal(true)}
            />
          </div>
        </>
      )}

      {/* Modals */}
      {showEditModal && (
        <EditUserModal user={detailData || selectedUser} onConfirm={handleEditConfirm} onClose={() => setShowEditModal(false)} loading={actionLoading} />
      )}
      {showBlockModal && (
        <BlockUserModal user={selectedUser} onConfirm={handleBlockConfirm} onClose={() => setShowBlockModal(false)} loading={actionLoading} />
      )}
      {showDeleteModal && (
        <DeleteUserModal user={selectedUser} onConfirm={handleDeleteConfirm} onClose={() => setShowDeleteModal(false)} loading={actionLoading} />
      )}

      <Toast toast={toast} />

      {/* Animations */}
      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default MarketplaceUsersPage;