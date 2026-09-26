// pharmacy-web/src/pages/sales/invoice/components/EditModeContent.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/invoice/components/EditModeContent.jsx
// Edit Mode Components for Sales Invoice Modal

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  User,
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
} from "lucide-react";
import { FinanceRow } from "./ViewModeContent";

// ════════════════════════════════════════════════════════════════════════════
// EDITABLE ROW COMPONENT
// ════════════════════════════════════════════════════════════════════════════

const EditableRow = ({
  index,
  row,
  medicines,
  batches,
  onBatchesLoad,
  onChange,
  onProductSelect,
  onBatchSelect,
  onRemove,
  canRemove,
}) => {
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingBatches, setLoadingBatches] = useState(false);
  const productDropdownRef = useRef(null);
  const batchDropdownRef = useRef(null);

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
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(e.target)
      ) {
        setShowProductDropdown(false);
      }
      if (
        batchDropdownRef.current &&
        !batchDropdownRef.current.contains(e.target)
      ) {
        setShowBatchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (key, value) => onChange(index, key, value);

  const handleProductClick = async (product) => {
    onProductSelect(index, product);
    setShowProductDropdown(false);
    setSearchTerm("");

    // Load batches for this product
    if (product.medicine_id && onBatchesLoad) {
      setLoadingBatches(true);
      try {
        await onBatchesLoad(product.medicine_id);
      } finally {
        setLoadingBatches(false);
      }
    }
  };

  const handleBatchClick = (batch) => {
    onBatchSelect(index, batch);
    setShowBatchDropdown(false);
  };

  const handleProductInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleChange("name", value);
    setShowProductDropdown(true);
  };

  const handleProductInputFocus = () => {
    setSearchTerm(row.name || "");
    setShowProductDropdown(true);
  };

  const inputClass = `
    w-full h-8 px-2 text-xs bg-white border border-amber-200 rounded
    focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400
    transition-all placeholder:text-gray-300
  `;

  const hasData = row.name || row.qty;
  const availableBatches = batches[row.medicine_id] || [];
  const qtyExceedsStock =
    row.availableQty > 0 && parseFloat(row.qty) > row.availableQty;

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
          className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
            hasData ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-500"
          }`}
        >
          {index + 1}
        </span>
      </td>

      {/* Product Selection */}
      <td className="px-2 py-1.5 relative" ref={productDropdownRef}>
        <input
          type="text"
          value={showProductDropdown ? searchTerm : row.name}
          onChange={handleProductInputChange}
          onFocus={handleProductInputFocus}
          onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
          className={`${inputClass} font-medium ${row.medicine_id ? "text-green-700" : ""}`}
          placeholder="Search product..."
        />

        {row.medicine_id && !showProductDropdown && (
          <CheckCircle2
            size={12}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500"
          />
        )}

        {showProductDropdown && filteredProducts.length > 0 && (
          <div
            className="absolute top-full left-0 z-50 w-80 bg-white border border-amber-200 rounded-lg shadow-xl mt-1 max-h-56 overflow-auto"
            style={{
              boxShadow:
                "0 10px 40px -5px rgba(217, 119, 6, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
            }}
          >
            {filteredProducts.map((product, idx) => (
              <div
                key={product.id || idx}
                onClick={() => handleProductClick(product)}
                className="px-3 py-2.5 hover:bg-amber-50 cursor-pointer border-b border-amber-100/50 last:border-b-0"
              >
                <div className="font-medium text-xs text-gray-800">
                  {product.name}
                </div>
                <div className="text-[10px] text-gray-500">
                  {product.manufacturer || "-"} • HSN: {product.hsn || "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </td>

      {/* Batch Selection */}
      <td className="px-2 py-1.5 relative" ref={batchDropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={row.batch || ""}
            onClick={() => row.medicine_id && setShowBatchDropdown(true)}
            readOnly
            className={`${inputClass} text-center font-mono cursor-pointer ${
              !row.medicine_id ? "bg-gray-100" : ""
            }`}
            placeholder={row.medicine_id ? "Select" : "-"}
          />
          {loadingBatches && (
            <Loader2
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-amber-500"
            />
          )}
        </div>

        {showBatchDropdown && availableBatches.length > 0 && (
          <div className="absolute top-full left-0 z-50 w-64 bg-white border border-amber-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-auto">
            <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 sticky top-0">
              <p className="text-[10px] text-amber-600 font-medium">
                {availableBatches.length} batch(es) available
              </p>
            </div>
            {availableBatches.map((batch, idx) => (
              <div
                key={batch.batch_id || idx}
                onClick={() => handleBatchClick(batch)}
                className="px-3 py-2 hover:bg-amber-50 cursor-pointer border-b border-amber-100/50 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-medium">
                    {batch.batch_number}
                  </span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    Qty: {batch.available_quantity}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Exp:{" "}
                  {batch.expiry_date
                    ? new Date(batch.expiry_date).toLocaleDateString()
                    : "-"}{" "}
                  • MRP: ₹{batch.mrp}
                </div>
              </div>
            ))}
          </div>
        )}
      </td>

      <td className="px-2 py-1.5">
        <input
          type="text"
          value={row.exp || ""}
          readOnly
          className={`${inputClass} text-center font-mono bg-gray-50`}
          placeholder="MM/YY"
        />
      </td>

      <td className="px-2 py-1.5">
        <div className="relative">
          <input
            type="number"
            value={row.qty || ""}
            onChange={(e) => handleChange("qty", e.target.value)}
            className={`${inputClass} text-center font-bold ${
              qtyExceedsStock
                ? "text-red-600 border-red-300 bg-red-50"
                : "text-amber-700"
            }`}
            placeholder="0"
            min="0"
            max={row.availableQty || undefined}
          />
          {row.availableQty > 0 && (
            <span className="absolute -bottom-3 left-0 right-0 text-center text-[9px] text-gray-400">
              Max: {row.availableQty}
            </span>
          )}
        </div>
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
          readOnly
          className={`${inputClass} text-right font-medium bg-gray-50`}
          placeholder="0.00"
        />
      </td>

      <td className="px-2 py-1.5">
        <div
          className={`h-8 px-2 flex items-center justify-end rounded text-sm font-bold ${
            Number(row.amount) > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          ₹{Number(row.amount || 0).toFixed(2)}
        </div>
      </td>

      <td className="px-2 py-1.5 text-center">
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
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
  batches,
  medicinesLoading,
  isConfirmed,
  formatCurrency,
  onRowChange,
  onProductSelect,
  onBatchSelect,
  onBatchesLoad,
  onAddRow,
  onRemoveRow,
  tableBodyRef,
  onCreateReturn,
  showCreateReturnButton,
  onViewReturn,
}) => {
  const filledRows = editRows.filter((r) => r.name).length;

  return (
    <div className="flex-1 flex overflow-hidden relative z-10">
      {/* LEFT PANEL */}
      <div className="w-80 shrink-0 border-r border-amber-200 flex flex-col overflow-hidden bg-amber-50/30">
        {/* Customer Card - Read Only */}
        <div className="shrink-0 p-5 border-b border-amber-200 bg-white">
          <div className="flex items-center gap-2 text-amber-700 text-xs uppercase tracking-widest mb-4">
            <User size={14} />
            <span>Customer (Locked)</span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <User size={18} className="text-gray-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">
                {invoice.customer?.name ||
                  invoice.customer_name ||
                  "Walk-in Customer"}
              </h3>
              {invoice.customer?.phone && (
                <p className="text-xs text-gray-500 mt-1">
                  {invoice.customer.phone}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
            <AlertCircle size={12} />
            Customer cannot be changed on existing invoices
          </p>
        </div>

        {/* Live Summary */}
        <div className="flex-1 overflow-y-auto p-5 bg-white">
          <div className="flex items-center gap-2 text-amber-700 text-xs uppercase tracking-widest mb-4">
            <IndianRupee size={14} />
            <span>Live Summary</span>
          </div>

          {/* Linked Returns Warning */}
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
                        </div>
                        <button
                          onClick={() => onViewReturn?.(ret)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition-colors"
                        >
                          <ExternalLink size={12} />
                          View
                        </button>
                      </div>
                    ))}
                  </div>

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

          <div className="grid grid-cols-2 gap-3 mb-4">
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

          {isConfirmed && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-start gap-2">
                <RefreshCw size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">
                  <p className="font-semibold">Stock Recalculation</p>
                  <p className="mt-1 opacity-80">On save, the system will:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 opacity-80">
                    <li>Restore original stock entries</li>
                    <li>Deduct new stock based on updated quantities</li>
                    <li>Log all changes in audit trail</li>
                  </ul>
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
                  <th className="px-2 py-2 text-center w-24">Batch</th>
                  <th className="px-2 py-2 text-center w-16">Expiry</th>
                  <th className="px-2 py-2 text-center w-16">Qty</th>
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
                    batches={batches}
                    onBatchesLoad={onBatchesLoad}
                    onChange={onRowChange}
                    onProductSelect={onProductSelect}
                    onBatchSelect={onBatchSelect}
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
            {showCreateReturnButton &&
              onCreateReturn &&
              !(invoice.returnInvoices?.length > 0) && (
                <button
                  onClick={onCreateReturn}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg font-medium"
                >
                  <Package size={18} />
                  <span className="text-sm">Create Return</span>
                </button>
              )}
          </div>
          <div className="flex items-center gap-3">
            {/* Reserved for future actions */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModeContent;
