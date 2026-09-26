// pharmacy-web/src/pages/purchase/invoice/components/EditModeContent.jsx (do not remove this comment)
// pharmacy-web/src/pages/purchase/invoice/components/EditModeContent.jsx
// Edit Mode Components for Invoice Modal
//  UPDATED: Added hasLinkedReturns and linkedReturnCount props for footer display

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Building2,
  Pencil,
  Package,
  IndianRupee,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Plus,
  Loader2,
  FileText,
  ExternalLink,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { FinanceRow } from "./ViewModeContent";

// ════════════════════════════════════════════════════════════════════════════
// EDITABLE ROW COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const EditableRow = ({
  index,
  row,
  medicines,
  onChange,
  onProductSelect,
  onRemove,
  canRemove,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return medicines.slice(0, 8);
    const search = searchTerm.toLowerCase();
    return medicines
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.genericName?.toLowerCase().includes(search) ||
          p.manufacturer?.toLowerCase().includes(search),
      )
      .slice(0, 8);
  }, [medicines, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (key, value) => onChange(index, key, value);

  const handleProductClick = (product) => {
    onProductSelect(index, product);
    setShowDropdown(false);
    setSearchTerm("");
  };

  const handleProductInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleChange("name", value);
    setShowDropdown(true);
  };

  const handleProductInputFocus = () => {
    setSearchTerm(row.name || "");
    setShowDropdown(true);
  };

  const handleProductInputBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setShowDropdown(false);
    else if (e.key === "Enter" && filteredProducts.length > 0) {
      e.preventDefault();
      handleProductClick(filteredProducts[0]);
    }
  };

  const inputClass = `
    w-full h-8 px-2 text-xs bg-white border border-amber-200 rounded
    focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400
    transition-all placeholder:text-gray-300
  `;

  const hasData = row.name || row.qty;

  return (
    <tr
      className={`
      ${index % 2 === 0 ? "bg-white" : "bg-amber-50/30"}
      ${hasData ? "border-l-2 border-l-amber-500" : "border-l-2 border-l-transparent"}
      hover:bg-amber-50/50 transition-colors
    `}
    >
      <td className="px-2 py-1.5 text-center">
        <span
          className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${hasData ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"}`}
        >
          {index + 1}
        </span>
      </td>

      <td className="px-2 py-1.5 relative" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          value={showDropdown ? searchTerm : row.name}
          onChange={handleProductInputChange}
          onFocus={handleProductInputFocus}
          onBlur={handleProductInputBlur}
          onKeyDown={handleKeyDown}
          className={`${inputClass} font-medium ${row.medicine_id ? "text-green-700" : ""}`}
          placeholder="Search product..."
        />

        {row.medicine_id && !showDropdown && (
          <CheckCircle2
            size={12}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
          />
        )}

        {showDropdown && filteredProducts.length > 0 && (
          <div
            className="absolute top-full left-0 z-50 w-80 bg-white border border-amber-200 rounded-lg shadow-xl mt-1 max-h-56 overflow-auto"
            style={{
              boxShadow:
                "0 10px 40px -5px rgba(217, 119, 6, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
            }}
          >
            {searchTerm && (
              <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 sticky top-0">
                <p className="text-[10px] text-amber-600 font-medium">
                  Showing {filteredProducts.length} results for "{searchTerm}"
                </p>
              </div>
            )}
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id || idx}
                onClick={() => handleProductClick(product)}
                className={`px-3 py-2.5 hover:bg-amber-50 cursor-pointer border-b border-amber-100/50 last:border-b-0 transition-colors
                  ${row.medicine_id === product.medicine_id ? "bg-amber-50 border-l-2 border-l-amber-500" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs text-gray-800 truncate">
                      {product.name}
                    </div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span className="truncate">
                        {product.manufacturer || "-"}
                      </span>
                      {product.hsn && (
                        <>
                          <span>•</span>
                          <span className="font-mono">HSN: {product.hsn}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {row.medicine_id === product.medicine_id && (
                    <CheckCircle2
                      size={14}
                      className="text-amber-500 shrink-0 ml-2"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showDropdown && searchTerm && filteredProducts.length === 0 && (
          <div className="absolute top-full left-0 z-50 w-72 bg-white border border-amber-200 rounded-lg shadow-xl mt-1 p-4 text-center">
            <Package size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs text-gray-500">
              No products found for "{searchTerm}"
            </p>
          </div>
        )}
      </td>

      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.mfac || ""}
          onChange={(e) => handleChange("mfac", e.target.value)}
          className={`${inputClass} text-gray-600`}
          placeholder="Mfac"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.batch || ""}
          onChange={(e) => handleChange("batch", e.target.value.toUpperCase())}
          className={`${inputClass} text-center font-mono`}
          placeholder="Batch"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.exp || ""}
          onChange={(e) => handleChange("exp", e.target.value)}
          className={`${inputClass} text-center font-mono`}
          placeholder="MM/YY"
          maxLength={5}
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.pack || ""}
          onChange={(e) => handleChange("pack", e.target.value)}
          className={`${inputClass} text-center`}
          placeholder="Pk"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.qty || ""}
          onChange={(e) => handleChange("qty", e.target.value)}
          className={`${inputClass} text-center font-bold text-amber-700`}
          placeholder="0"
          min="0"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.sch || row.pQty || ""}
          onChange={(e) => handleChange("sch", e.target.value)}
          className={`${inputClass} text-center text-green-600`}
          placeholder="0"
          min="0"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.price || ""}
          onChange={(e) => handleChange("price", e.target.value)}
          className={`${inputClass} text-right`}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.discountPercent || ""}
          onChange={(e) => handleChange("discountPercent", e.target.value)}
          className={`${inputClass} text-center`}
          placeholder="0"
          min="0"
          max="100"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.sgstPercent || "6"}
          onChange={(e) => {
            const val = e.target.value;
            handleChange("cgstPercent", val);
            handleChange("sgstPercent", val);
          }}
          className={`${inputClass} text-center`}
          placeholder="6"
          min="0"
          max="50"
        />
      </td>
      <td className="px-2 py-1.5">
        <input
          type="number"
          value={row.mrp || ""}
          onChange={(e) => handleChange("mrp", e.target.value)}
          className={`${inputClass} text-right font-medium`}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
      </td>
      <td className="px-2 py-1.5">
        <div
          className={`h-8 px-2 flex items-center justify-end rounded text-sm font-bold ${Number(row.amount) > 0 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400"}`}
        >
          ₹{Number(row.amount || 0).toFixed(2)}
        </div>
      </td>
      <td className="px-2 py-1.5 text-center">
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all active:scale-95"
            title="Remove row"
          >
            <X size={14} />
          </button>
        )}
      </td>
    </tr>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN EDIT MODE CONTENT
// ════════════════════════════════════════════════════════════════════════════

const EditModeContent = ({
  invoice,
  editRows,
  editSummary,
  medicines,
  medicinesLoading,
  isConfirmed,
  formatCurrency,
  onRowChange,
  onProductSelect,
  onAddRow,
  onRemoveRow,
  tableBodyRef,
  onCreateReturn,
  showCreateReturnButton,
  onViewReturn,
  hasLinkedReturns = false, //  NEW PROP
  linkedReturnCount = 0, //  NEW PROP
}) => {
  const filledRows = editRows.filter((r) => r.name).length;

  return (
    <div className="flex-1 flex overflow-hidden relative z-10">
      {/* LEFT PANEL */}
      <div className="w-80 shrink-0 border-r border-amber-200 flex flex-col overflow-hidden bg-amber-50/30">
        {/* Supplier Card - Read Only */}
        <div className="shrink-0 p-5 border-b border-amber-200 bg-white">
          <div className="flex items-center gap-2 text-amber-700 text-xs uppercase tracking-widest mb-4">
            <Building2 size={14} />
            <span>Supplier (Locked)</span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <Building2 size={18} className="text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">
                {invoice.supplier?.name || "Unknown"}
              </h3>
              {invoice.supplier?.gst_number && (
                <p className="text-xs text-gray-500 font-mono mt-1">
                  {invoice.supplier.gst_number}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle size={12} />
            Supplier cannot be changed on existing invoices
          </p>
        </div>

        {/* Live Summary */}
        <div className="flex-1 overflow-y-auto p-5 bg-white">
          <div className="flex items-center gap-2 text-amber-700 text-xs uppercase tracking-widest mb-4">
            <IndianRupee size={14} />
            <span>Live Summary</span>
          </div>

          {/*  UPDATED: Linked Returns Warning Banner */}
          {invoice.returnInvoices && invoice.returnInvoices.length > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border-2 border-red-300 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-red-900 text-sm mb-1">
                    ⚠️ Returns Linked ({invoice.returnInvoices.length})
                  </p>
                  <p className="text-xs text-red-700 leading-relaxed mb-3">
                    This invoice has {invoice.returnInvoices.length} approved
                    return(s). You cannot save edits until returns are
                    cancelled.
                  </p>

                  {/* Return List */}
                  <div className="space-y-2 mb-3">
                    {invoice.returnInvoices.map((ret) => (
                      <div
                        key={ret.invoice_id}
                        className="flex items-center justify-between p-2 bg-white rounded border border-red-200"
                      >
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-red-500" />
                          <span className="font-mono text-xs font-semibold text-gray-900">
                            {ret.invoice_number}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({ret.return_reason?.replace(/_/g, " ")})
                          </span>
                        </div>
                        <button
                          onClick={() => onViewReturn?.(ret)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition-colors"
                          title="View Return Details"
                        >
                          <ExternalLink size={12} />
                          View
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Action Guidance */}
                  <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <AlertCircle
                      size={12}
                      className="text-amber-600 shrink-0"
                    />
                    <p className="text-xs text-amber-800">
                      <strong>To edit:</strong> Cancel returns first or create a
                      new invoice
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xl font-bold text-amber-700">
                {editSummary.totalItems}
              </div>
              <div className="text-[10px] text-amber-600 uppercase mt-1">
                Items
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xl font-bold text-amber-700">
                {editSummary.totalQty}
              </div>
              <div className="text-[10px] text-amber-600 uppercase mt-1">
                Qty
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="text-xl font-bold text-amber-700">
                {editSummary.totalFree}
              </div>
              <div className="text-[10px] text-amber-600 uppercase mt-1">
                Free
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <FinanceRow
              label="Subtotal"
              value={formatCurrency(editSummary.subTotal)}
            />
            <FinanceRow
              label="CGST"
              value={formatCurrency(editSummary.cgst)}
              small
            />
            <FinanceRow
              label="SGST"
              value={formatCurrency(editSummary.sgst)}
              small
            />
            <div className="border-t-2 border-amber-200 my-4" />
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-amber-800">Net Amount</span>
              <span className="text-2xl font-bold text-amber-700">
                {formatCurrency(editSummary.total)}
              </span>
            </div>
          </div>

          {isConfirmed && !hasLinkedReturns && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <RefreshCw size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-semibold">Stock Recalculation</p>
                  <p className="mt-1 opacity-80">On save, the system will:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-80">
                    <li>Reverse original stock entries</li>
                    <li>Add new stock based on updated quantities</li>
                    <li>Log all changes in audit trail</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/*  NEW: Show save blocked warning in summary */}
          {hasLinkedReturns && (
            <div className="mt-6 p-4 rounded-xl bg-red-100 border-2 border-red-300">
              <div className="flex items-start gap-2">
                <Ban size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-800">
                  <p className="font-bold">Save Disabled</p>
                  <p className="mt-1 opacity-90">
                    {linkedReturnCount} linked return
                    {linkedReturnCount > 1 ? "s" : ""} must be cancelled before
                    you can save changes to this invoice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Editable Table */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        <div className="shrink-0 px-4 py-3 border-b border-amber-200 flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Pencil size={14} className="text-white" />
            </div>
            <h2 className="font-semibold text-amber-800">Edit Line Items</h2>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white">
              {filledRows} / {editRows.length} items
            </span>

            {/*  NEW: Show blocked indicator in table header */}
            {hasLinkedReturns && (
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                <Ban size={12} />
                Save Blocked
              </span>
            )}
          </div>
          <button
            onClick={onAddRow}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Plus size={14} />
            Add Row
          </button>
        </div>

        <div
          ref={tableBodyRef}
          className="flex-1 overflow-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(217, 119, 6, 0.3) transparent",
          }}
        >
          {medicinesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="text-amber-500 animate-spin" />
                <p className="text-sm text-amber-700">Loading products...</p>
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="text-xs font-semibold text-white uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-500">
                  <th className="px-2 py-2 text-center w-10">#</th>
                  <th className="px-2 py-2 text-left min-w-[180px]">Product</th>
                  <th className="px-2 py-2 text-left w-24">Mfac</th>
                  <th className="px-2 py-2 text-center w-20">Batch</th>
                  <th className="px-2 py-2 text-center w-16">Expiry</th>
                  <th className="px-2 py-2 text-center w-14">Pack</th>
                  <th className="px-2 py-2 text-center w-14">Qty</th>
                  <th className="px-2 py-2 text-center w-14">Free</th>
                  <th className="px-2 py-2 text-right w-20">Rate</th>
                  <th className="px-2 py-2 text-center w-14">Dis%</th>
                  <th className="px-2 py-2 text-center w-14">GST%</th>
                  <th className="px-2 py-2 text-right w-20">MRP</th>
                  <th className="px-2 py-2 text-right w-24">Amount</th>
                  <th className="px-2 py-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {editRows.map((row, index) => (
                  <EditableRow
                    key={index}
                    index={index}
                    row={row}
                    medicines={medicines}
                    onChange={onRowChange}
                    onProductSelect={onProductSelect}
                    onRemove={onRemoveRow}
                    canRemove={editRows.length > 1}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Create Return Button - Only for CONFIRMED invoices without existing returns */}
            {showCreateReturnButton && onCreateReturn && !hasLinkedReturns && (
              <button
                onClick={onCreateReturn}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg font-medium"
              >
                <Package size={18} />
                <span className="text-sm">Create Return</span>
              </button>
            )}

            {/*  NEW: Show warning when returns exist in footer */}
            {hasLinkedReturns && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-800 rounded-xl border border-red-300">
                <AlertTriangle size={18} className="shrink-0" />
                <div>
                  <span className="font-semibold text-sm">Editing blocked</span>
                  <span className="text-xs ml-2 opacity-80">
                    Cancel {linkedReturnCount} return
                    {linkedReturnCount > 1 ? "s" : ""} to enable saving
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Additional info */}
          <div className="flex items-center gap-3">
            {hasLinkedReturns && (
              <span className="text-xs text-gray-500">
                Go to Purchase Returns → Cancel linked returns → Return to edit
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModeContent;
