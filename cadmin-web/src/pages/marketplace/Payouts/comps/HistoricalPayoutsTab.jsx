import { useState, useEffect } from "react";
import { getPharmacyPayoutHistory } from "../../../../api/cadminPharmacyPayouts";

const STATUS_STYLES = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const HistoricalPayoutsTab = ({ shopId }) => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await getPharmacyPayoutHistory(shopId, { limit: 20 });
        setPayouts(resp.data?.data?.payouts || []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const fmt = (n) => `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;
  if (payouts.length === 0) return <p className="text-sm text-gray-400">No past payouts.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-900">Past Payouts</h3>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">Week</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Gross</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Commission</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-600">Net</th>
              <th className="text-center px-3 py-2 font-semibold text-gray-600">Status</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">UTR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payouts.map((p) => (
              <tr key={p.payout_id}>
                <td className="px-3 py-2 font-medium text-xs">{p.week_start} → {p.week_end}</td>
                <td className="px-3 py-2 text-right">{fmt(p.gross_amount)}</td>
                <td className="px-3 py-2 text-right text-amber-700">{fmt(p.commission_amount)}</td>
                <td className="px-3 py-2 text-right text-green-700 font-medium">{fmt(p.net_amount)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${STATUS_STYLES[p.status] || "bg-gray-100"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">{p.manual_reference || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoricalPayoutsTab;