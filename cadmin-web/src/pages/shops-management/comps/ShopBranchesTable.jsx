// cadmin-web/src/pages/shops-management/comps/ShopBranchesTable.jsx (do not remove this comment)
// src/components/Shops/ShopBranchesTable.jsx
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, GitBranch, Loader2, Ban } from "lucide-react";
import Pagination from "./Pagination";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

/**
 * Local dummy branches generator (for now)
 * Real app should fetch branches from API using shopId
 */
const fakeBranchesForShop = (shopId) => {
  // create 7 sample branches per shop with deterministic content from shopId
  const base = Number(shopId.slice(-2)) || 1;
  return Array.from({ length: 7 }).map((_, i) => ({
    branch_id: `${shopId}-br-${i + 1}`,
    branch_name: `Branch ${i + 1}`,
    city: [
      "Kochi",
      "Pune",
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Calicut",
      "Kollam",
    ][i % 7],
    is_active: (i + base) % 3 !== 0,
  }));
};

const BranchRow = ({ b, idx, onToggle }) => {
  return (
    <tr
      className={`border-b border-gray-100 transition-all duration-150 ${
        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
      } hover:bg-indigo-50 ${!b.is_active ? "opacity-60" : ""}`}
    >
      <td className="p-3 font-medium text-gray-900">{idx + 1}</td>
      <td className="p-3 text-gray-900 font-medium">{b.branch_name}</td>
      <td className="p-3 text-gray-600">{b.city}</td>
      <td className="p-3 text-center">
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            b.is_active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {b.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {b.is_active ? "Active" : "Inactive"}
        </span>
      </td>
      <td className="p-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onToggle(b)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
          >
            {b.is_active ? <Ban size={14} /> : <CheckCircle size={14} />}
          </button>
        </div>
      </td>
    </tr>
  );
};

const ShopBranchesTable = ({ shopId, rowsPerPage = 5 }) => {
  const [branches, setBranches] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetBranch, setTargetBranch] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const totalPages = Math.max(1, Math.ceil((total || 0) / rowsPerPage));

  useEffect(() => {
    if (!shopId) return;
    const b = fakeBranchesForShop(shopId);
    setBranches(b);
    setTotal(b.length);
  }, [shopId]);

  const pageBranches = branches.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleToggle = (branch) => {
    setTargetBranch(branch);
    setShowConfirm(true);
  };

  const confirmToggle = () => {
    setToggleLoading(true);
    setTimeout(() => {
      setBranches((prev) =>
        prev.map((b) =>
          b.branch_id === targetBranch.branch_id
            ? { ...b, is_active: !b.is_active }
            : b
        )
      );
      setShowConfirm(false);
      setTargetBranch(null);
      setToggleLoading(false);
    }, 400);
  };

  if (!shopId) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <GitBranch size={16} /> Branches ({total})
        </h4>
      </div>

      {branches.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
          <GitBranch size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No branches found</p>
        </div>
      ) : (
        <>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-3 font-semibold text-gray-600">
                    #
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Branch Name
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    City
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="text-center p-3 font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageBranches.map((b, idx) => (
                  <BranchRow
                    key={b.branch_id}
                    b={b}
                    idx={(page - 1) * rowsPerPage + idx}
                    onToggle={handleToggle}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * rowsPerPage + 1} to{" "}
              {Math.min(page * rowsPerPage, total)} of {total} results
            </div>
            <Pagination
              totalPages={totalPages}
              currentPage={page}
              setCurrentPage={setPage}
            />
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setTargetBranch(null);
        }}
        onConfirm={confirmToggle}
        title={targetBranch?.is_active ? "Suspend Branch?" : "Activate Branch?"}
        message={
          targetBranch?.is_active
            ? `Suspend "${targetBranch?.branch_name}"?`
            : `Activate "${targetBranch?.branch_name}"?`
        }
        confirmText={targetBranch?.is_active ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={targetBranch?.is_active ? "warning" : "success"}
        loading={toggleLoading}
      />
    </div>
  );
};

export default ShopBranchesTable;
