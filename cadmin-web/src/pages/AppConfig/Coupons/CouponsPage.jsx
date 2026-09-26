// cadmin-web/src/pages/AppConfig/Coupons/CouponsPage.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Coupons/CouponsPage.jsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Percent,
  IndianRupee,
  RefreshCw,
  X,
  Loader2, 
  PlusCircle,
} from "lucide-react";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponActive,
  deleteCoupon,
} from "../../../api/cadminCoupons";
import { useToast } from "../../../components/common/Toast";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import StyledSelect from "../../../components/common/StyledSelect";

const fmt = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const StatCard = ({ icon: Icon, label, value, tint }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200/60 shadow-sm">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tint}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

export default function CouponsPage() {
  const navigate = useNavigate();
  const toast = useToast(); // ◄ Updated to get the raw toast function

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "FLAT",
    value: 50,
    max_discount: "",
    min_order_amount: 0,
    max_uses_total: "",
    max_uses_per_user: 1,
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: "",
    is_active: true,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadCoupons = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await listCoupons({ search: debouncedSearch, status: statusFilter });
      setCoupons(res.data?.data?.coupons || []);
    } catch {
      toast.error("Error", "Failed to load coupons");
      setCoupons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, statusFilter, toast]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setForm({
        code: coupon.code,
        description: coupon.description || "",
        type: coupon.type,
        value: Number(coupon.value),
        max_discount: coupon.max_discount ? Number(coupon.max_discount) : "",
        min_order_amount: Number(coupon.min_order_amount || 0),
        max_uses_total: coupon.max_uses_total || "",
        max_uses_per_user: coupon.max_uses_per_user || 1,
        valid_from: new Date(coupon.valid_from).toISOString().split("T")[0],
        valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().split("T")[0] : "",
        is_active: coupon.is_active,
      });
    } else {
      setEditingCoupon(null);
      setForm({
        code: "",
        description: "",
        type: "FLAT",
        value: 50,
        max_discount: "",
        min_order_amount: 0,
        max_uses_total: "",
        max_uses_per_user: 1,
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: "",
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description,
        type: form.type,
        value: Number(form.value),
        max_discount: form.type === "PERCENTAGE" && form.max_discount ? Number(form.max_discount) : null,
        min_order_amount: Number(form.min_order_amount || 0),
        max_uses_total: form.max_uses_total ? parseInt(form.max_uses_total, 10) : null,
        max_uses_per_user: form.max_uses_per_user ? parseInt(form.max_uses_per_user, 10) : null,
        valid_from: form.valid_from,
        valid_until: form.valid_until ? form.valid_until : null,
        is_active: form.is_active,
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.coupon_id, payload);
        toast.success("Success", "Coupon details updated successfully");
      } else {
        await createCoupon(payload);
        toast.success("Success", "Voucher coupon registered successfully");
      }

      setModalOpen(false);
      loadCoupons({ silent: true });
    } catch (err) {
      toast.error("Operation failed", err.response?.data?.message || "Failed to save coupon");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await toggleCouponActive(coupon.coupon_id, !coupon.is_active);
      toast.success("Success", `Coupon ${!coupon.is_active ? "activated" : "deactivated"} successfully`);
      loadCoupons({ silent: true });
    } catch {
      toast.error("Error", "Status change failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteCoupon(deleteTargetId);
      toast.success("Success", "Coupon deactivated and archived successfully");
      setDeleteTargetId(null);
      loadCoupons({ silent: true });
    } catch {
      toast.error("Error", "Archiving operation failed");
    }
  };

  const stats = useMemo(() => {
    const active = coupons.filter((c) => c.is_active).length;
    const inactive = coupons.filter((c) => !c.is_active).length;
    return { active, inactive };
  }, [coupons]);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-gray-200 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/marketplace/app-config")}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Ticket size={22} className="text-[#05015A]" />
              Promotions & Coupons
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Launch discount campaign codes, configure limits, and monitor usage limits.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#05015A] hover:bg-[#05015A]/90 transition-all shadow-md"
        >
          <Plus size={15} />
          Create New Coupon
        </button>
      </div>

      <div className="p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Ticket} label="Total Registered" value={coupons.length} tint="bg-indigo-50 text-indigo-600" />
          <StatCard icon={CheckCircle2} label="Active Status" value={stats.active} tint="bg-emerald-50 text-emerald-600" />
          <StatCard icon={XCircle} label="Disabled Status" value={stats.inactive} tint="bg-gray-100 text-gray-500" />
        </div>

        {/* Filters bar */}
        <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-gray-200/60 p-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
            {["ALL", "ACTIVE", "INACTIVE"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  statusFilter === tab
                    ? "bg-white text-[#05015A] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search coupon code..."
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

        {/* Coupon Listing Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/50 text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-poppins">
            <span className="flex-1">Code</span>
            <span className="w-36">Discount Factor</span>
            <span className="w-28">Min. Spend</span>
            <span className="w-24">Redeemed</span>
            <span className="w-40">Period</span>
            <span className="w-24">State</span>
            <span className="w-24 text-right">Actions</span>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#05015A]" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-xs">
              No active coupon promotions configured.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {coupons.map((coupon) => (
                <div key={coupon.coupon_id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="bg-indigo-50/70 border border-indigo-200/60 px-2.5 py-1 rounded-lg font-mono text-xs font-bold text-[#05015A] uppercase">
                      {coupon.code}
                    </span>
                    <p className="text-[11px] text-gray-400 mt-1.5 truncate">{coupon.description || "No description provided"}</p>
                  </div>

                  <div className="w-36 flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    {coupon.type === "PERCENTAGE" ? (
                      <>
                        <Percent size={14} className="text-blue-500" />
                        <span>{Number(coupon.value)}%</span>
                        {coupon.max_discount && <span className="text-[10px] text-gray-400 font-normal">(Max ₹{coupon.max_discount})</span>}
                      </>
                    ) : (
                      <>
                        <IndianRupee size={14} className="text-emerald-500" />
                        <span>₹{Number(coupon.value)} OFF</span>
                      </>
                    )}
                  </div>

                  <div className="w-28 text-xs text-gray-600 font-medium">₹{Number(coupon.min_order_amount)}</div>

                  <div className="w-24 text-xs text-gray-600 font-semibold">
                    {coupon.total_used} / {coupon.max_uses_total ?? "∞"}
                  </div>

                  <div className="w-40 text-xs text-gray-500 leading-snug">
                    <p className="font-medium text-gray-600">{fmt(coupon.valid_from)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{coupon.valid_until ? `Until ${fmt(coupon.valid_until)}` : "Ongoing limit"}</p>
                  </div>

                  <div className="w-24">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      coupon.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-gray-100 text-gray-500 border border-gray-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${coupon.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                      {coupon.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="w-24 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      title={coupon.is_active ? "Pause Coupon" : "Resume Coupon"}
                    >
                      {coupon.is_active ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                    </button>
                    <button
                      onClick={() => handleOpenModal(coupon)}
                      className="p-1 rounded-md text-gray-400 hover:text-[#05015A] hover:bg-gray-100"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(coupon.coupon_id)}
                      className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-gray-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide Modal Container */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => !actionLoading && setModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh]">
            <div className="px-6 py-4 bg-gradient-to-r from-[#05015A] to-[#0a0280] text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <Ticket size={20} />
                <h3 className="text-lg font-bold tracking-tight">
                  {editingCoupon ? "Edit Coupon" : "Register Coupon"}
                </h3>
              </div>
              <button onClick={() => setModalOpen(false)} disabled={actionLoading} className="text-white/80 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold text-gray-600">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label>Coupon Code Code</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingCoupon}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. WELCOME50"
                    className="w-full h-11 px-4 border-2 rounded-xl text-sm font-bold uppercase font-mono border-gray-200 focus:outline-none focus:border-indigo-400 disabled:bg-gray-50 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label>Promo Type</label>
                  <StyledSelect
                    value={form.type}
                    onChange={(v) => setForm({ ...form, type: v })}
                    options={[
                      { value: "FLAT", label: "Flat Rupee Discount" },
                      { value: "PERCENTAGE", label: "Percentage % Off" },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label>{form.type === "FLAT" ? "Discount value (₹)" : "Percent discount (%)"}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium border-gray-200 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  />
                </div>

                {form.type === "PERCENTAGE" && (
                  <div className="space-y-1.5">
                    <label>Maximum Cap Discount (₹)</label>
                    <input
                      type="number"
                      placeholder="Unlimited cap"
                      value={form.max_discount}
                      onChange={(e) => setForm({ ...form, max_discount: e.target.value === "" ? "" : Number(e.target.value) })}
                      className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium border-gray-200 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label>Description Note</label>
                <input
                  type="text"
                  placeholder="Appears on customer checkout billing details"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium border-gray-200 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label>Minimum Required Spend (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) })}
                    className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium border-gray-200 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label>Customer usage limit</label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses_per_user}
                    onChange={(e) => setForm({ ...form, max_uses_per_user: Number(e.target.value) })}
                    className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium border-gray-200 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label>Campaign Valid From</label>
                  <input
                    type="date"
                    required
                    value={form.valid_from}
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium border-gray-200 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label>Campaign Valid Until</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full h-11 px-4 border-2 rounded-xl text-sm font-medium border-gray-200 focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 border-2 border-gray-200 hover:bg-gray-100 font-bold rounded-xl text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#05015A] to-[#0a0280] hover:from-[#06027a] hover:to-[#0c03a0] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Soft-Delete Archive Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="Archive Coupon"
        message="Are you sure you want to deactivate and soft-delete this coupon? Existing checkout histories will retain their billing records, but the namespace code will be released."
        confirmLabel="Archive"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}