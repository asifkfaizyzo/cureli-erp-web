// pharmacy-web/src/pages/suppliers/components/ManageSupplierBranchesModal.jsx (do not remove this comment)
// src/pages/suppliers/components/ManageSupplierBranchesModal.jsx
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Building2, Check, Save, Loader2, AlertTriangle,
  Layers, Shield, RefreshCw, Minus, Plus, Power, PowerOff,
  Trash2, AlertCircle, CheckCircle2, Zap, Building, 
  Phone, Mail, MapPin, Hash, Calendar, Package,
  ChevronRight, Link2, Unlink
} from "lucide-react";

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

const ManageSupplierBranchesModal = ({
  open,
  supplier,
  onClose,
  onSave,
  onDeactivate,
  onReactivate,
  onRemoveFromAll,
  getSupplierBranches,
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchData, setBranchData] = useState(null);
  const [selectedBranches, setSelectedBranches] = useState(new Set());
  const [originalBranches, setOriginalBranches] = useState(new Set());
  const [error, setError] = useState(null);
  
  const [isSupplierActive, setIsSupplierActive] = useState(true);
  const [currentView, setCurrentView] = useState('branches');
  const [actionLoading, setActionLoading] = useState(false);
  const [reactivateBranchId, setReactivateBranchId] = useState(null);

  useEffect(() => {
    if (open && supplier?.supplier_id) {
      setBranchData(null);
      setSelectedBranches(new Set());
      setOriginalBranches(new Set());
      setError(null);
      setCurrentView('branches');
      setReactivateBranchId(null);
      setIsSupplierActive(true);
      fetchBranchData();
    } else if (!open) {
      setBranchData(null);
      setSelectedBranches(new Set());
      setOriginalBranches(new Set());
      setError(null);
      setLoading(true);
      setCurrentView('branches');
      setReactivateBranchId(null);
    }
  }, [open, supplier?.supplier_id]);

  const fetchBranchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSupplierBranches(supplier.supplier_id);
      
      if (result.success) {
        setBranchData(result.data);
        setIsSupplierActive(result.data.supplier?.is_active ?? true);
        
        const linkedIds = new Set(
          result.data.branches
            .filter(b => b.is_linked)
            .map(b => b.branch_id)
        );
        
        setSelectedBranches(linkedIds);
        setOriginalBranches(new Set(linkedIds));
        
        if (!result.data.supplier?.is_active && result.data.branches.length > 0) {
          const mainBranch = result.data.branches.find(b => b.branch_type === 'main');
          setReactivateBranchId(mainBranch?.branch_id || result.data.branches[0].branch_id);
        }
      } else {
        setError(result.error || "Failed to load branch data");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBranch = (branchId) => {
    if (!isSupplierActive) return;
    
    setSelectedBranches(prev => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (branchData?.branches) {
      setSelectedBranches(new Set(branchData.branches.map(b => b.branch_id)));
    }
  };

  const deselectAll = () => {
    setSelectedBranches(new Set());
  };

  const changes = useMemo(() => {
    const toAdd = [];
    const toRemove = [];

    selectedBranches.forEach(id => {
      if (!originalBranches.has(id)) {
        const branch = branchData?.branches.find(b => b.branch_id === id);
        if (branch) toAdd.push(branch);
      }
    });

    originalBranches.forEach(id => {
      if (!selectedBranches.has(id)) {
        const branch = branchData?.branches.find(b => b.branch_id === id);
        if (branch) toRemove.push(branch);
      }
    });

    return { toAdd, toRemove, hasChanges: toAdd.length > 0 || toRemove.length > 0 };
  }, [selectedBranches, originalBranches, branchData]);

  const handleSave = async () => {
    if (selectedBranches.size === 0) {
      setCurrentView('removeAll');
      return;
    }

    if (!changes.hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await onSave(supplier.supplier_id, Array.from(selectedBranches));
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to save changes");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!onDeactivate) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      const result = await onDeactivate(supplier.supplier_id);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to deactivate supplier");
        setCurrentView('branches');
      }
    } catch (err) {
      setError(err.message);
      setCurrentView('branches');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!onReactivate || !reactivateBranchId) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      const result = await onReactivate(supplier.supplier_id, reactivateBranchId);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to reactivate supplier");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromAll = async () => {
    if (!onRemoveFromAll) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      const result = await onRemoveFromAll(supplier.supplier_id);
      
      if (result.success) {
        onClose();
      } else {
        setError(result.error || "Failed to remove from all branches");
        setCurrentView('branches');
      }
    } catch (err) {
      setError(err.message);
      setCurrentView('branches');
    } finally {
      setActionLoading(false);
    }
  };

  if (!open) return null;

  // Left Sidebar Content
  const renderLeftSidebar = () => (
    <div className="flex flex-col h-full">
      {/* Supplier Avatar & Name */}
      <div className="text-center lg:text-left mb-6">
        <div className={`
          w-16 h-16 lg:w-20 lg:h-20 rounded-2xl mx-auto lg:mx-0 mb-4
          flex items-center justify-center text-2xl lg:text-3xl font-bold
          ${isSupplierActive 
            ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white" 
            : "bg-gradient-to-br from-red-500 to-red-600 text-white"
          }
        `}>
          {supplier?.name?.charAt(0)?.toUpperCase() || "S"}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
          {supplier?.name || "Supplier"}
        </h3>
        <div className={`
          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
          ${isSupplierActive 
            ? "bg-green-100 text-green-700" 
            : "bg-red-100 text-red-700"
          }
        `}>
          {isSupplierActive ? (
            <>
              <CheckCircle2 size={12} />
              Active
            </>
          ) : (
            <>
              <PowerOff size={12} />
              Inactive
            </>
          )}
        </div>
      </div>

      {/* Supplier Details */}
      <div className="space-y-3 mb-6 flex-1">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Supplier Info
        </h4>
        
        {branchData?.supplier?.gst_number && (
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Hash size={14} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase">GST Number</p>
              <p className="font-mono text-gray-800 truncate">{branchData.supplier.gst_number}</p>
            </div>
          </div>
        )}

        {branchData?.supplier?.phone && (
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Phone size={14} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase">Phone</p>
              <p className="text-gray-800 truncate">{branchData.supplier.phone}</p>
            </div>
          </div>
        )}

        {branchData?.supplier?.email && (
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Mail size={14} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase">Email</p>
              <p className="text-gray-800 truncate">{branchData.supplier.email}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Package size={14} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase">Invoices</p>
            <p className="font-semibold text-gray-800">{branchData?.supplier?.invoice_count || 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <Building size={14} className="text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase">Linked Branches</p>
            <p className="font-semibold text-gray-800">
              {originalBranches.size} of {branchData?.total_branches || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{selectedBranches.size}</div>
          <div className="text-[10px] text-indigo-500 uppercase font-medium">Selected</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-gray-600">{branchData?.total_branches || 0}</div>
          <div className="text-[10px] text-gray-500 uppercase font-medium">Total</div>
        </div>
      </div>

      {/* Quick Actions - Only for active suppliers */}
      {isSupplierActive && (onDeactivate || onRemoveFromAll) && (
        <div className="mt-auto pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h4>
          <div className="space-y-2">
            {onDeactivate && (
              <button
                onClick={() => setCurrentView('deactivate')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <PowerOff size={14} />
                Deactivate Supplier
                <ChevronRight size={14} className="ml-auto" />
              </button>
            )}
            {onRemoveFromAll && originalBranches.size > 0 && (
              <button
                onClick={() => setCurrentView('removeAll')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <Unlink size={14} />
                Unlink All Branches
                <ChevronRight size={14} className="ml-auto" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Right Content - Branches View
  const renderBranchesContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <Loader2 size={40} className="text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading branches...</p>
        </div>
      );
    }

    if (error && currentView === 'branches') {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <p className="text-red-600 font-medium text-center mb-2">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchBranchData();
            }}
            className="mt-2 text-sm text-indigo-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      );
    }

    // Deactivated Supplier View
    if (!isSupplierActive) {
      return (
        <div className="flex flex-col h-full">
          {/* Deactivated Banner */}
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <PowerOff size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800 mb-1">Supplier Deactivated</h3>
                <p className="text-sm text-red-600">
                  This supplier is currently inactive and not available in any branch.
                </p>
              </div>
            </div>
          </div>

          {/* Reactivate Section */}
          {onReactivate && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Power size={18} className="text-green-600" />
                <h4 className="font-semibold text-gray-900">Reactivate Supplier</h4>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select a branch to link this supplier to when reactivating:
              </p>
              
              {/* Branch Grid for Reactivation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {branchData?.branches.map((branch) => (
                  <button
                    key={branch.branch_id}
                    onClick={() => setReactivateBranchId(branch.branch_id)}
                    className={`
                      p-4 rounded-xl border-2 transition-all duration-200
                      flex items-center gap-3 text-left
                      ${reactivateBranchId === branch.branch_id
                        ? "border-green-500 bg-green-50 shadow-sm"
                        : "border-gray-200 hover:border-green-300 bg-white hover:bg-green-50/50"
                      }
                    `}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      ${reactivateBranchId === branch.branch_id
                        ? "bg-green-500"
                        : "bg-gray-100"
                      }
                    `}>
                      {reactivateBranchId === branch.branch_id ? (
                        <Check size={20} className="text-white" strokeWidth={3} />
                      ) : (
                        <Building size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 truncate">{branch.branch_name}</span>
                        {branch.branch_type === 'main' && (
                          <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded shrink-0">
                            MAIN
                          </span>
                        )}
                      </div>
                      {branch.location && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{branch.location}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertTriangle size={14} />
                    {error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Reactivate Button */}
          {onReactivate && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleReactivate}
                disabled={actionLoading || !reactivateBranchId}
                className={`
                  w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold
                  transition-all duration-200 shadow-sm
                  ${actionLoading || !reactivateBranchId
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-md"
                  }
                `}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Reactivating...
                  </>
                ) : (
                  <>
                    <Power size={18} />
                    Reactivate Supplier
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      );
    }

    // Deactivate Confirmation View
    if (currentView === 'deactivate') {
      return (
        <div className="flex flex-col items-center justify-center h-full py-8">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <PowerOff size={40} className="text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Deactivate Supplier?</h3>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            This will deactivate <strong>{supplier?.name}</strong> for your entire shop.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 w-full max-w-md">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800 mb-2">What happens:</p>
                <ul className="text-amber-700 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    Supplier will be removed from all {originalBranches.size} branch(es)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    Cannot create new purchase orders
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    Existing invoices remain unaffected
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    Can be reactivated later
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 w-full max-w-md p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle size={14} />
                {error}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 w-full max-w-md">
            <button
              onClick={() => {
                setCurrentView('branches');
                setError(null);
              }}
              disabled={actionLoading}
              className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeactivate}
              disabled={actionLoading}
              className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <PowerOff size={18} />
                  Deactivate
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    // Remove from All Confirmation
    if (currentView === 'removeAll') {
      return (
        <div className="flex flex-col items-center justify-center h-full py-8">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
            <Unlink size={40} className="text-amber-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Remove from All Branches?</h3>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            This will unlink <strong>{supplier?.name}</strong> from all {originalBranches.size} branch(es).
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8 w-full max-w-md">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800 mb-2">Note:</p>
                <ul className="text-blue-700 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    Supplier remains active in your database
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    Will not appear in any branch's supplier list
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    Can be re-linked to branches later
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 w-full max-w-md p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle size={14} />
                {error}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 w-full max-w-md">
            <button
              onClick={() => {
                setCurrentView('branches');
                setError(null);
              }}
              disabled={actionLoading}
              className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveFromAll}
              disabled={actionLoading}
              className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Unlink size={18} />
                  Remove All
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    // Main Branches View (default)
    return (
      <div className="flex flex-col h-full">
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-lg font-bold text-gray-900">Branch Access</h4>
            <p className="text-sm text-gray-500">Select branches where this supplier is available</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              disabled={selectedBranches.size === branchData?.branches.length}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={14} />
              Select All
            </button>
            <button
              onClick={deselectAll}
              disabled={selectedBranches.size === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus size={14} />
              Clear All
            </button>
          </div>
        </div>

        {/* Branch Grid */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {branchData?.branches.map((branch) => {
              const isSelected = selectedBranches.has(branch.branch_id);
              const isMain = branch.branch_type === "main";
              const wasOriginallyLinked = originalBranches.has(branch.branch_id);
              const isNewlyAdded = isSelected && !wasOriginallyLinked;
              const isBeingRemoved = !isSelected && wasOriginallyLinked;

              return (
                <motion.button
                  key={branch.branch_id}
                  onClick={() => toggleBranch(branch.branch_id)}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex items-center gap-3 text-left group
                    ${isSelected
                      ? isNewlyAdded
                        ? "border-green-400 bg-green-50"
                        : "border-indigo-500 bg-indigo-50"
                      : isBeingRemoved
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50"
                    }
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                    ${isSelected 
                      ? isNewlyAdded 
                        ? "bg-green-500" 
                        : "bg-indigo-500" 
                      : isBeingRemoved 
                        ? "bg-red-200" 
                        : "bg-gray-100 group-hover:bg-gray-200"
                    }
                  `}>
                    {isSelected ? (
                      <Check size={20} className="text-white" strokeWidth={3} />
                    ) : isBeingRemoved ? (
                      <Minus size={20} className="text-red-500" strokeWidth={3} />
                    ) : (
                      <Building size={20} className="text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm truncate ${
                        isSelected 
                          ? isNewlyAdded ? "text-green-700" : "text-indigo-700" 
                          : isBeingRemoved ? "text-red-600" : "text-gray-700"
                      }`}>
                        {branch.branch_name}
                      </span>
                      {isMain && (
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                          Main
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {wasOriginallyLinked && branch.linked_at && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(branch.linked_at).toLocaleDateString()}
                        </span>
                      )}
                      {isNewlyAdded && (
                        <span className="text-[10px] font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                          + Adding
                        </span>
                      )}
                      {isBeingRemoved && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                          − Removing
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`
                    w-3 h-3 rounded-full shrink-0 transition-all
                    ${isSelected 
                      ? isNewlyAdded ? "bg-green-400" : "bg-indigo-400" 
                      : isBeingRemoved ? "bg-red-400" : "bg-gray-200"
                    }
                  `} />
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Changes Summary Bar */}
        {changes.hasChanges && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-amber-800">Unsaved Changes</span>
                  </div>
                  <div className="h-4 w-px bg-amber-300" />
                  {changes.toAdd.length > 0 && (
                    <span className="text-sm text-green-600 font-semibold">
                      +{changes.toAdd.length} adding
                    </span>
                  )}
                  {changes.toRemove.length > 0 && (
                    <span className="text-sm text-red-600 font-semibold">
                      −{changes.toRemove.length} removing
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedBranches(new Set(originalBranches))}
                  className="text-xs font-medium text-amber-700 hover:text-amber-800 underline"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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

          {/* Panel - Horizontal Layout */}
          <motion.div
            className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header - Mobile */}
            <div className={`lg:hidden px-5 py-4 ${
              !isSupplierActive 
                ? "bg-gradient-to-r from-red-600 to-red-700" 
                : "bg-gradient-to-r from-[#05015A] to-indigo-700"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    {!isSupplierActive ? (
                      <PowerOff size={20} className="text-white" />
                    ) : (
                      <Layers size={20} className="text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {!isSupplierActive ? "Supplier Inactive" : "Manage Branches"}
                    </h2>
                    <p className="text-white/70 text-sm truncate max-w-[180px]">
                      {supplier?.name || "Supplier"}
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

            {/* Left Sidebar - Desktop */}
            <div className={`
              hidden lg:flex flex-col w-80 shrink-0 p-6
              ${!isSupplierActive 
                ? "bg-gradient-to-b from-red-50 to-red-100/50 border-r border-red-200" 
                : "bg-gradient-to-b from-gray-50 to-white border-r border-gray-100"
              }
            `}>
              {/* Close Button - Desktop */}
              <div className="flex items-center justify-between mb-6">
                <div className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide
                  ${!isSupplierActive 
                    ? "bg-red-100 text-red-700" 
                    : "bg-indigo-100 text-indigo-700"
                  }
                `}>
                  Supplier Details
                </div>
                <button
                  onClick={fetchBranchData}
                  disabled={loading}
                  className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
              
              {!loading && renderLeftSidebar()}
              
              {loading && (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 size={24} className="text-indigo-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Right Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Desktop Header */}
              <div className={`
                hidden lg:flex items-center justify-between px-6 py-4 border-b
                ${!isSupplierActive ? "border-red-100" : "border-gray-100"}
              `}>
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${!isSupplierActive 
                      ? "bg-red-100" 
                      : "bg-indigo-100"
                    }
                  `}>
                    {!isSupplierActive ? (
                      <PowerOff size={20} className="text-red-600" />
                    ) : currentView === 'deactivate' ? (
                      <AlertTriangle size={20} className="text-red-600" />
                    ) : currentView === 'removeAll' ? (
                      <Unlink size={20} className="text-amber-600" />
                    ) : (
                      <Building size={20} className="text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {!isSupplierActive 
                        ? "Reactivate Supplier" 
                        : currentView === 'deactivate' 
                          ? "Deactivate Supplier"
                          : currentView === 'removeAll'
                            ? "Remove from All Branches"
                            : "Branch Access Management"
                      }
                    </h2>
                    <p className="text-sm text-gray-500">
                      {!isSupplierActive 
                        ? "Select a branch to reactivate this supplier"
                        : currentView === 'branches'
                          ? `${branchData?.total_branches || 0} branches available`
                          : "Review and confirm action"
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 lg:p-6 overflow-y-auto">
                {/* Mobile: Supplier Info (Collapsible) */}
                <div className="lg:hidden mb-4">
                  <details className="group">
                    <summary className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer list-none">
                      <span className="text-sm font-semibold text-gray-700">Supplier Details</span>
                      <ChevronRight size={16} className="text-gray-400 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                      {!loading && renderLeftSidebar()}
                    </div>
                  </details>
                </div>

                {renderBranchesContent()}
              </div>

              {/* Footer - Only for active suppliers in branches view */}
              {!loading && isSupplierActive && currentView === 'branches' && (
                <div className="px-5 lg:px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-500 text-center sm:text-left">
                    {branchData && (
                      <span>
                        Originally linked to <strong>{originalBranches.size}</strong> branch(es)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={onClose}
                      className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || (!changes.hasChanges && selectedBranches.size > 0)}
                      className={`
                        flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                        transition-all duration-200 shadow-sm min-w-[140px]
                        ${saving || (!changes.hasChanges && selectedBranches.size > 0)
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : selectedBranches.size === 0
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-gradient-to-r from-[#05015A] to-indigo-600 text-white hover:shadow-md"
                        }
                      `}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : selectedBranches.size === 0 ? (
                        <>
                          <Unlink size={16} />
                          Remove All
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Footer for deactivated supplier */}
              {!loading && !isSupplierActive && (
                <div className="px-5 lg:px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ManageSupplierBranchesModal;