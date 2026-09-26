// pharmacy-web/src/pages/suppliers/components/AddExistingSupplierModal.jsx (do not remove this comment)
// src/pages/suppliers/components/AddExistingSupplierModal.jsx
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Search, Building2, Plus, Loader2, CheckCircle2,
  MapPin, Phone, Hash, Users
} from "lucide-react";
import { useDebounce } from "../../../hooks/useDebounce";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 }
  },
  exit: { opacity: 0, y: 20, scale: 0.96, transition: { duration: 0.15 } },
};

const AddExistingSupplierModal = ({
  open,
  onClose,
  onAdd,
  branchId,
  branchName,
  getAvailableSuppliers,
}) => {
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  
  const debouncedSearch = useDebounce(search, 300);

  // Fetch available suppliers
  const fetchSuppliers = useCallback(async (searchTerm = "") => {
    if (!branchId) return;
    
    setLoading(true);
    try {
      const result = await getAvailableSuppliers(branchId, searchTerm);
      if (result.success) {
        setSuppliers(result.data.suppliers || []);
      }
    } catch (err) {
      console.error("Failed to fetch available suppliers:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId, getAvailableSuppliers]);

  // Fetch on open and search change
  useEffect(() => {
    if (open) {
      fetchSuppliers(debouncedSearch);
    }
  }, [open, debouncedSearch, fetchSuppliers]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSuppliers([]);
      setAdding(null);
    }
  }, [open]);

  const handleAdd = async (supplier) => {
    setAdding(supplier.supplier_id);
    try {
      await onAdd(supplier.supplier_id);
      // Remove from list
      setSuppliers(prev => prev.filter(s => s.supplier_id !== supplier.supplier_id));
    } catch (err) {
      console.error("Failed to add supplier:", err);
    } finally {
      setAdding(null);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Add Existing Supplier</h2>
                    <p className="text-emerald-100 text-sm">
                      to {branchName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search suppliers by name or GST..."
                  className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400
                    transition-all duration-200"
                />
              </div>
            </div>

            {/* Supplier List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 size={32} className="text-emerald-500 animate-spin mb-3" />
                  <p className="text-gray-500">Loading suppliers...</p>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <Users size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No suppliers available</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {search 
                      ? "Try a different search term" 
                      : "All suppliers are already linked to this branch"
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {suppliers.map((supplier) => {
                    const isAdding = adding === supplier.supplier_id;
                    
                    return (
                      <div
                        key={supplier.supplier_id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-gray-400 shrink-0" />
                              <h4 className="font-semibold text-gray-800 truncate">
                                {supplier.name}
                              </h4>
                            </div>
                            
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                              {supplier.gst_number && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Hash size={10} />
                                  <span className="font-mono">{supplier.gst_number}</span>
                                </span>
                              )}
                              {supplier.office_phone && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <Phone size={10} />
                                  {supplier.office_phone}
                                </span>
                              )}
                              {supplier.city && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <MapPin size={10} />
                                  {supplier.city}
                                </span>
                              )}
                            </div>

                            {supplier.existing_branches?.length > 0 && (
                              <div className="mt-2">
                                <span className="text-[10px] text-gray-400">
                                  Currently in: 
                                </span>
                                <span className="text-[10px] text-gray-600 ml-1">
                                  {supplier.existing_branches.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleAdd(supplier)}
                            disabled={isAdding}
                            className={`
                              shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                              transition-all duration-150
                              ${isAdding
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                              }
                            `}
                          >
                            {isAdding ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Plus size={14} />
                            )}
                            {isAdding ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} available to add
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddExistingSupplierModal;