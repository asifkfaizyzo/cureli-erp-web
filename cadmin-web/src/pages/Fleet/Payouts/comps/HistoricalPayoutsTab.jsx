// cadmin-web/src/pages/Fleet/Payouts/comps/HistoricalPayoutsTab.jsx (do not remove this comment)
import { useState, useEffect } from "react";
import { Loader2, Calendar } from "lucide-react";
import { getRiderPayoutHistory } from "../../../../api/cadminFleetRiderPayouts";
import Pagination from "../../../../components/common/Pagination";

const STATUS_BADGES = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const HistoricalPayoutsTab = ({ riderId }) => {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getRiderPayoutHistory(riderId, { page, limit: 6 })
      .then((res) => {
        if (!mounted) return;
        setHistory(res.data?.data?.payouts || []);
        setTotal(res.data?.data?.pagination?.total || 0);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [riderId, page]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-400">
        <Calendar size={28} className="mx-auto mb-2 text-gray-300" />
        No past payout records found for this rider.
      </div>
    );
  }

  const totalPages = Math.ceil(total / 6);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Week Period</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Gross</th>
              <th className="text-right px-3 py-2.5 font-semibold text-gray-600">Net</th>
              <th className="text-center px-3 py-2.5 font-semibold text-gray-600">Status</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Payment Ref / Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((p) => (
              <tr key={p.payout_id} className="hover:bg-gray-50/50">
                <td className="px-3 py-2.5 font-medium text-gray-900">
                  {p.week_start} to {p.week_end}
                </td>
                <td className="px-3 py-2.5 text-right font-medium text-gray-700">
                  ₹{p.gross_amount.toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-green-700">
                  ₹{p.net_amount.toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`inline-flex px-2 py-0.5 font-semibold rounded-full text-[10px] ${STATUS_BADGES[p.status] || "bg-gray-100"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-gray-600">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] truncate max-w-[140px]">
                      {p.manual_reference || "—"}
                    </span>
                    {p.manual_payment_date && (
                      <span className="text-[10px] text-gray-400">Paid: {p.manual_payment_date}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pt-2 flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default HistoricalPayoutsTab;