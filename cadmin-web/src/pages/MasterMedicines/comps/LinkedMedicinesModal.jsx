// cadmin-web/src/pages/MasterMedicines/comps/LinkedMedicinesModal.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/LinkedMedicinesModal.jsx

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Link2,
  Unlink,
  Store,
  Calendar,
  User,
  Hash,
  Search,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const LinkedMedicinesModal = ({ isOpen, medicine, linkedData = [], onClose, onUnlink }) => {
  // ═══════════════════════════════════════════════════════════
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  // ═══════════════════════════════════════════════════════════
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "occurrenceCount", order: "desc" });
  const [confirmUnlink, setConfirmUnlink] = useState(null);

  // Get linked medicines from prop
  const linkedMedicines = linkedData;

  // Filter & Sort - MUST be called unconditionally
  const filteredLinked = useMemo(() => {
    let result = [...linkedMedicines];

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(
        (lm) =>
          lm.originalName?.toLowerCase().includes(search) ||
          lm.shopName?.toLowerCase().includes(search)
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === "linkedAt") {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      }

      if (sortConfig.order === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [linkedMedicines, searchText, sortConfig]);

  // Stats - MUST be called unconditionally
  const totalOccurrences = useMemo(() => {
    return linkedMedicines.reduce((sum, lm) => sum + (lm.occurrenceCount || 0), 0);
  }, [linkedMedicines]);

  const uniqueShops = useMemo(() => {
    return [...new Set(linkedMedicines.map((lm) => lm.shopId))].length;
  }, [linkedMedicines]);

  // ESC key handler - MUST be called unconditionally
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (confirmUnlink) {
          setConfirmUnlink(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, confirmUnlink]);

  // Reset state on open - MUST be called unconditionally
  useEffect(() => {
    if (isOpen) {
      setSearchText("");
      setConfirmUnlink(null);
    }
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════
  // EARLY RETURN - AFTER ALL HOOKS
  // ═══════════════════════════════════════════════════════════
  if (!isOpen || !medicine) return null;

  // ═══════════════════════════════════════════════════════════
  // HANDLERS & HELPERS (not hooks, safe to be after early return)
  // ═══════════════════════════════════════════════════════════
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      order: prev.key === key && prev.order === "desc" ? "asc" : "desc",
    }));
  };

  const handleUnlink = (linked) => {
    setConfirmUnlink(linked);
  };

  const confirmUnlinkAction = () => {
    if (confirmUnlink) {
      onUnlink(medicine.id, confirmUnlink.id);
      setConfirmUnlink(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown size={12} className="text-gray-300" />;
    return sortConfig.order === "asc" ? (
      <ChevronUp size={12} className="text-indigo-600" />
    ) : (
      <ChevronDown size={12} className="text-indigo-600" />
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden 
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Link2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">Linked Shop Medicines</h2>
                <p className="text-white/80 text-sm truncate max-w-md">
                  {medicine.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Link2 size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600">Total Linked</p>
              <p className="text-lg font-bold text-blue-900">{linkedMedicines.length}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Hash size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-600">Total Occurrences</p>
              <p className="text-lg font-bold text-green-900">{totalOccurrences}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-blue-200" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Store size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-purple-600">Unique Shops</p>
              <p className="text-lg font-bold text-purple-900">{uniqueShops}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or shop..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full h-9 pl-9 pr-4 border border-gray-300 rounded-lg text-sm
                         focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {linkedMedicines.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Link2 size={48} className="mb-3 opacity-50" />
              <p className="text-lg font-medium">No Linked Medicines</p>
              <p className="text-sm">This master medicine has no shop medicines linked to it</p>
            </div>
          ) : filteredLinked.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search size={48} className="mb-3 opacity-50" />
              <p className="text-lg font-medium">No Results</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("originalName")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                      Original Name <SortIcon column="originalName" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("shopName")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                      <Store size={14} />
                      Shop <SortIcon column="shopName" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort("occurrenceCount")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                      <Hash size={14} />
                      Count <SortIcon column="occurrenceCount" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("linkedAt")}
                      className="flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                      <Calendar size={14} />
                      Linked At <SortIcon column="linkedAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      Linked By
                    </div>
                  </th>
                  <th className="w-20 px-4 py-3 text-center text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLinked.map((linked, index) => (
                  <tr
                    key={linked.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{linked.originalName}</p>
                        <p className="text-xs text-gray-500 font-mono">{linked.normalizedName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Store size={14} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{linked.shopName}</p>
                          <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            View Shop <ExternalLink size={10} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold">
                        {linked.occurrenceCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-gray-700">{formatDate(linked.linkedAt)}</p>
                        <p className="text-xs text-gray-500">{formatTime(linked.linkedAt)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          linked.linkedBy === "System"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {linked.linkedBy}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleUnlink(linked)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                          title="Unlink Medicine"
                        >
                          <Unlink size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Master ID: <span className="font-mono">{medicine.id}</span>
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium
                         hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Unlink Confirmation Dialog */}
        {confirmUnlink && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div
              className="bg-white rounded-xl shadow-2xl p-6 m-4 max-w-md w-full animate-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirm Unlink</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Are you sure you want to unlink{" "}
                    <strong>"{confirmUnlink.originalName}"</strong> from{" "}
                    <strong>{confirmUnlink.shopName}</strong>?
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    This will move it back to the unmapped queue for re-mapping.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setConfirmUnlink(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmUnlinkAction}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium
                                 hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Unlink size={16} />
                      Unlink
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedMedicinesModal;