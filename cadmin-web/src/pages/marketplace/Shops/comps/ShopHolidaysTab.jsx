// cadmin-web/src/pages/marketplace/Shops/comps/ShopHolidaysTab.jsx (do not remove this comment)
// cadmin-web/src/pages/marketplace/Shops/comps/ShopHolidaysTab.jsx

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  getShopHolidays,
  createShopHoliday,
  deleteShopHoliday,
} from "../../../../api/cadminMarketplaceShops";

const ShopHolidaysTab = ({ shop, onUpdated }) => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  // Form states
  const [branchId, setBranchId] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState("BRANCH");

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await getShopHolidays(shop.shop_id);
      setHolidays(res.data?.data || []);
    } catch (err) {
      setError("Failed to fetch holidays data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [shop.shop_id]);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!branchId || !holidayDate) return;
    setSaving(true);
    setError(null);
    try {
      await createShopHoliday(shop.shop_id, {
        branch_id: branchId,
        holiday_date: holidayDate,
        reason: reason.trim(),
        scope,
      });
      setHolidayDate("");
      setReason("");
      fetchHolidays();
      onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save holiday");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    setDeletingId(holidayId);
    setError(null);
    try {
      await deleteShopHoliday(shop.shop_id, holidayId);
      fetchHolidays();
      onUpdated();
    } catch (err) {
      setError("Failed to remove holiday override.");
    } finally {
      setDeletingId(null);
    }
  };

  const getBranchOptions = () => {
    return (shop.branches || []).filter((b) => !!b.marketplaceSettings);
  };

  return (
    <div className="max-w-5xl grid grid-cols-3 gap-6">
      {/* Left Column: Form */}
      <div className="col-span-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm h-fit">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Calendar size={13} className="text-[#05015A]" /> Schedule Marketplace Holiday
        </h3>
        
        {getBranchOptions().length === 0 ? (
          <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-200">
            You must link and enable at least one branch on the marketplace before managing holidays.
          </div>
        ) : (
          <form onSubmit={handleAddHoliday} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Branch *</label>
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[#05015A]/20"
              >
                <option value="">-- Choose Branch --</option>
                {getBranchOptions().map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Scope Override *</label>
              <select
                required
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[#05015A]/20"
              >
                <option value="BRANCH">BRANCH (Only this branch closed)</option>
                <option value="SHOP">SHOP (All shop branches closed)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Holiday Date *</label>
              <input
                required
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[#05015A]/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Reason / Event Name</label>
              <input
                type="text"
                placeholder="e.g. Diwali, Renovations, Emergency"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-[#05015A]/20"
              />
            </div>

            {error && (
              <p className="text-[10px] text-red-500 flex items-center gap-1 font-medium bg-red-50 p-2 rounded border border-red-200">
                <AlertCircle size={11} /> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#05015A] text-white text-xs font-bold shadow-sm hover:bg-[#0a0280] disabled:opacity-50"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              Add Holiday Closure
            </button>
          </form>
        )}
      </div>

      {/* Right Column: List */}
      <div className="col-span-2 space-y-3">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
            Active Scheduled Closures ({holidays.length})
          </h3>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
              <Calendar size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500 font-semibold">No holidays or emergency closures scheduled</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {holidays.map((h) => (
                <div key={h.holiday_id} className="py-3 flex items-center justify-between group first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 mt-0.5">
                      <Clock size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">
                          {new Date(h.holiday_date).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric", weekday: "short"
                          })}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          h.scope === "SHOP" 
                            ? "bg-purple-50 text-purple-700 border-purple-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}>
                          {h.scope}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {h.reason || "No reason given"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Building2 size={10} className="text-gray-400" />
                        <span className="text-[10px] text-gray-500">
                          Branch: {h.branch?.branch?.branch_name || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={deletingId === h.holiday_id}
                    onClick={() => handleDeleteHoliday(h.holiday_id)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    {deletingId === h.holiday_id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopHolidaysTab;