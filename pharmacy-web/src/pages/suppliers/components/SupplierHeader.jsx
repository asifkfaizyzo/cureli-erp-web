// pharmacy-web/src/pages/suppliers/components/SupplierHeader.jsx (do not remove this comment)
// src/pages/suppliers/components/SupplierHeader.jsx
import React from "react";
import { 
  User, 
  Phone, 
  Plus, 
  RotateCcw,
  Hash,
  Users,
  Building2,
  Layers,
  AlertTriangle
} from "lucide-react";

const FilterField = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
      <Icon size={10} />
      {label}
    </label>
    {children}
  </div>
);

const SupplierHeader = ({ 
  filters, 
  onChange, 
  onReset, 
  onAdd,
  onAddExisting,
  isGlobalMode = false,
  currentBranchName = "",
  isSuperAdmin = false,
}) => {
  const inputBase = `
    h-8 px-3
    bg-white border border-slate-300 rounded-lg
    text-xs text-slate-700 placeholder:text-slate-400
    focus:outline-none focus:border-indigo-500 
    focus:ring-2 focus:ring-indigo-500/20
    hover:border-slate-400
    transition-all duration-150
  `;

  const hasActiveFilters = filters && Object.values(filters).some(
    (val) => val && val.trim() !== ""
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm font-poppins overflow-hidden">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isGlobalMode ? (
            <Layers size={16} className="text-blue-600" />
          ) : (
            <Users size={16} className="text-indigo-600" />
          )}
          <h3 className="text-sm font-bold text-slate-800">
            Supplier Filters
            {!isGlobalMode && currentBranchName && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                • {currentBranchName}
              </span>
            )}
          </h3>
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          )}
          {isGlobalMode && (
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-semibold rounded-full flex items-center gap-1">
              <Layers size={10} />
              All Branches View
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 h-7 px-3 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
          >
            <RotateCcw size={12} />
            Reset
          </button>
          
          {/* ADD EXISTING - Super Admin only, not in global mode */}
          {isSuperAdmin && onAddExisting && !isGlobalMode && (
            <button
              onClick={onAddExisting}
              className="flex items-center gap-1.5 h-7 px-3 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all"
              title="Add supplier from another branch"
            >
              <Users size={12} />
              Add Existing
            </button>
          )}
          
          <button
            onClick={onAdd}
            disabled={isGlobalMode}
            className={`
              flex items-center gap-1.5 h-7 px-4 text-xs font-semibold rounded-lg shadow-sm transition-all
              ${isGlobalMode
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#000060] text-white hover:bg-[#2626b0]'
              }
            `}
            title={isGlobalMode ? "Select a branch to add suppliers" : "Add new supplier"}
          >
            <Plus size={12} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Global Mode Warning */}
      {isGlobalMode && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-start gap-2">
          <AlertTriangle size={14} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            <span className="font-semibold">Read-only mode:</span> Select a specific branch from the header to add or edit suppliers.
          </p>
        </div>
      )}

      {/* Filter Fields */}
      <div className="flex flex-wrap items-end gap-4 p-4">
        
        <FilterField label="Supplier Name" icon={User}>
          <input
            type="text"
            className={`${inputBase} w-48`}
            placeholder="Search by name..."
            value={filters?.name || ""}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </FilterField>

        <FilterField label="Supplier ID" icon={Hash}>
          <input
            type="text"
            className={`${inputBase} w-32`}
            placeholder="ID..."
            value={filters?.supplierId || ""}
            onChange={(e) => onChange("supplierId", e.target.value)}
          />
        </FilterField>

        <FilterField label="Contact" icon={Phone}>
          <input
            type="text"
            className={`${inputBase} w-40`}
            placeholder="Phone number..."
            value={filters?.contact || ""}
            onChange={(e) => onChange("contact", e.target.value)}
          />
        </FilterField>

      </div>
    </div>
  );
};

export default SupplierHeader;