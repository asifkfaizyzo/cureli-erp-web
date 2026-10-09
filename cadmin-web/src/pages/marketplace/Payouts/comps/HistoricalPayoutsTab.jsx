import { useState, useEffect } from "react";
import { getPharmacyPayoutHistory } from "../../../../api/cadminPharmacyPayouts";
import Pagination from "../../../../components/common/Pagination";
import { Loader2 } from "lucide-react";

const STATUS_STYLES = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const HistoricalPayoutsTab = ({ shopId }) => {
  const [payouts, setPayouts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const loadHistory = async (page = 1) => {
    setLoading(true);
    try {
      const resp = await getPharmacyPayoutHistory(shopId, { page, limit: 10 });
      const data = resp.data?.data;
      setPayouts(data?.payouts || []);
      if (data?.pagination) setPagination(data.pagination);
    } catch {
      // silent catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, [shopId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-gray-400 gap-2">
        <Loader2 size={20} className="animate-spin text-[#05015A]" />
        <span className="text-xs">Loading past settlements...</span>
      </div>
    );
  }

  if (payouts.length === 0) {
    return <p className="text-xs text-gray-400 py-6 text-center">No past payouts found for this pharmacy.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Settlement History</h3>
        <span className="text-xs text-gray-500 font-medium">Total: {pagination.total} Weeks</span>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3.5 py-2.5 font-semibold text-gray-600">Settlement Week</th>
              <th className="text-right px-3.5 py-2.5 font-semibold text-gray-600">Gross (Subtotal)</th>
              <th className="text-right px-3.5 py-2.5 font-semibold text-gray-600">Commission</th>
              <th className="text-right px-3.5 py-2.5 font-semibold text-gray-600">Net Disbursed</th>
              <th className="text-center px-3.5 py-2.5 font-semibold text-gray-600">Status</th>
              <th className="text-left px-3.5 py-2.5 font-semibold text-gray-600">UTR / Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payouts.map((p) => (
              <tr key={p.payout_id} className="hover:bg-gray-50/50">
                <td className="px-3.5 py-2.5 font-medium text-gray-900">{p.week_start} → {p.week_end}</td>
                <td className="px-3.5 py-2.5 text-right">{fmt(p.gross_amount)}</td>
                <td className="px-3.5 py-2.5 text-right text-amber-700 font-medium">{fmt(p.commission_amount)}</td>
                <td className="px-3.5 py-2.5 text-right text-emerald-700 font-bold">{fmt(p.net_amount)}</td>
                <td className="px-3.5 py-2.5 text-center">
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${STATUS_STYLES[p.status] || "bg-gray-100"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 font-mono text-gray-500">{p.manual_reference || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pt-2 flex justify-end">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => loadHistory(p)}
          />
        </div>
      )}
    </div>
  );
};

export default HistoricalPayoutsTab;