// cadmin-web/src/pages/Dashboard/comps/TopShopsTable.jsx (do not remove this comment)
// src/pages/Dashboard/comps/TopShopsTable.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Trophy, ArrowRight, Users, Loader2, Crown, Building2, AlertCircle,
  ChevronLeft, ChevronRight, Calendar, CheckCircle 
} from "lucide-react";
import { getTopShops } from "../../../api/cadminDashboard";

const TopShopsTable = ({ period }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getTopShops(period, page, 5);
        setData(res.data?.shops || []);
        setPagination(res.data?.pagination || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [period, page]);

  // Reset page when period changes
  useEffect(() => {
    setPage(1);
  }, [period]);

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
  };

  const RankBadge = ({ i }) => {
    if (i === 0) return <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center"><Crown size={10} className="text-white" /></div>;
    if (i === 1) return <div className="w-5 h-5 rounded bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-[9px] font-bold text-white">2</div>;
    if (i === 2) return <div className="w-5 h-5 rounded bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-[9px] font-bold text-white">3</div>;
    return <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[9px] font-semibold text-gray-500">{i + 1}</div>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur rounded-xl border border-gray-100/80 p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Top Shops</h3>
            <p className="text-[9px] text-gray-400">
              {pagination ? `${pagination.totalCount} total` : "By subscription"}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate("/shops")} 
          className="text-[10px] text-indigo-600 font-semibold flex items-center gap-0.5 hover:underline"
        >
          View All <ArrowRight size={10} />
        </button>
      </div>

      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
        </div>
      ) : error ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-gray-400">
          <AlertCircle size={24} className="mb-1" />
          <p className="text-[10px]">{error}</p>
        </div>
      ) : data.length === 0 ? (
        <div className="h-[200px] flex flex-col items-center justify-center text-gray-300">
          <Building2 size={28} className="mb-1 opacity-50" />
          <p className="text-[10px]">No shop data</p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {data.map((shop, i) => {
              const globalIndex = (page - 1) * 5 + i;
              return (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/shops?search=${encodeURIComponent(shop.name)}`)}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    globalIndex === 0 ? "bg-gradient-to-r from-amber-50 to-yellow-50" : "hover:bg-gray-50"
                  }`}
                >
                  <RankBadge i={globalIndex} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-[10px] font-medium text-gray-900 truncate">{shop.name}</p>
                      {shop.verified && (
                        <CheckCircle size={10} className="text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {shop.location && (
                        <span className="text-[9px] text-gray-400">{shop.location}</span>
                      )}
                    </div>
                  </div>

                  {/* Branches & Users */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium 
                      ${shop.branchesUsed > shop.branchesLimit && shop.branchesLimit > 0 
                        ? "bg-red-50 text-red-600" 
                        : "bg-blue-50 text-blue-600"}`}>
                      <Building2 size={8} />
                      {shop.branchesUsed}/{shop.branchesLimit || "∞"}
                    </span>
                    <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium 
                      ${shop.usersUsed > shop.usersLimit && shop.usersLimit > 0 
                        ? "bg-red-50 text-red-600" 
                        : "bg-indigo-50 text-indigo-600"}`}>
                      <Users size={8} />
                      {shop.usersUsed}/{shop.usersLimit || "∞"}
                    </span>
                  </div>

                  {/* Plan & Validity */}
                  <div className="text-right flex-shrink-0 min-w-[60px]">
                    <p className="text-[9px] font-semibold text-gray-700 truncate">{shop.plan}</p>
                    {shop.validUntil && (
                      <p className="text-[8px] text-gray-400 flex items-center gap-0.5 justify-end">
                        <Calendar size={7} />
                        {formatDate(shop.validUntil)}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
              <span className="text-[9px] text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default TopShopsTable;