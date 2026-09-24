// cadmin-web/src/pages/Dashboard/comps/OnboardingTable.jsx (do not remove this comment)
// src/pages/Dashboard/comps/OnboardingTable.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  UserPlus, ArrowRight, Store, Clock, CheckCircle, AlertTriangle, 
  Loader2, AlertCircle, ChevronLeft, ChevronRight, Users, Building2 
} from "lucide-react";
import { getRecentOnboarding } from "../../../api/cadminDashboard";

const OnboardingTable = () => {
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
        const res = await getRecentOnboarding(page, 5);
        
        setData(res.data?.users || []);
        setPagination(res.data?.pagination || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [page]);

  const formatTime = (d) => {
    if (!d) return "";
    const diff = Math.floor((Date.now() - new Date(d)) / 60000);
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
  };

  const StatusBadge = ({ status, step, max }) => {
    if (status === "completed") {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle size={8} />Done
        </span>
      );
    }
    if (status === "stuck") {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium bg-red-100 text-red-700">
          <AlertTriangle size={8} />Stuck
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium bg-blue-100 text-blue-700">
        <Clock size={8} />{step}/{max}
      </span>
    );
  };

  const LimitBadge = ({ used, limit, icon: Icon, color }) => {
    if (!limit) return null;
    const isOver = used > limit;
    return (
      <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium 
        ${isOver ? "bg-red-50 text-red-600" : `bg-${color}-50 text-${color}-600`}`}>
        <Icon size={8} />
        {used}/{limit}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 backdrop-blur rounded-xl border border-gray-100/80 p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <UserPlus size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900">Onboarding</h3>
            <p className="text-[9px] text-gray-400">
              {pagination ? `${pagination.totalCount} total` : "Recent signups"}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate("/users")} 
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
          <UserPlus size={28} className="mb-1 opacity-50" />
          <p className="text-[10px]">No recent signups</p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {data.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/users?search=${encodeURIComponent(item.owner_name)}`)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Store size={12} className="text-gray-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-gray-900 truncate">{item.shop_name}</p>
                  <p className="text-[9px] text-gray-400 truncate">{item.owner_name}</p>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  <StatusBadge status={item.status} step={item.step} max={item.max_steps} />
                  
                  {item.status === "completed" && (
                    <>
                      <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium 
                        ${item.branchesUsed > item.branchesLimit ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                        <Building2 size={8} />
                        {item.branchesUsed}/{item.branchesLimit || "∞"}
                      </span>
                      <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium 
                        ${item.usersUsed > item.usersLimit ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600"}`}>
                        <Users size={8} />
                        {item.usersUsed}/{item.usersLimit || "∞"}
                      </span>
                    </>
                  )}
                </div>
                
                <span className="text-[9px] text-gray-400 flex-shrink-0 w-6 text-right">
                  {formatTime(item.created_at)}
                </span>
              </motion.div>
            ))}
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

export default OnboardingTable;