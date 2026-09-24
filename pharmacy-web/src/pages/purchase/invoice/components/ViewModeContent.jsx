// pharmacy-web/src/pages/purchase/invoice/components/ViewModeContent.jsx (do not remove this comment)
// pharmacy-web/src/pages/purchase/invoice/components/ViewModeContent.jsx
// View Mode Components for Invoice Modal

import React from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  IndianRupee,
  AlertCircle,
  Shield,
  Pencil,
  AlertTriangle,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// FINANCE ROW HELPER
// ════════════════════════════════════════════════════════════════════════════

export const FinanceRow = ({
  label,
  value,
  valueClass = "text-[#000060]/70",
  small = false,
}) => (
  <div
    className={`flex justify-between items-center ${small ? "text-xs" : "text-sm"}`}
  >
    <span className="text-[#000060]/50">{label}</span>
    <span className={`font-medium ${valueClass}`}>{value}</span>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// VIEW LEFT PANEL
// ════════════════════════════════════════════════════════════════════════════

const ViewLeftPanel = ({
  invoice,
  formatCurrency,
  formatDate,
  totalQty,
  totalFree,
  itemCount,
  canEdit,
  isConfirmed,
  onEnterEditMode,
}) => (
  <div className="w-80 shrink-0 border-r border-[#000060]/10 flex flex-col overflow-hidden bg-[#000060]/[0.02]">
    {/* Supplier Card */}
    <div className="shrink-0 p-5 border-b border-[#000060]/10 bg-white">
      <div className="flex items-center gap-2 text-[#000060]/60 text-xs uppercase tracking-widest mb-4">
        <Building2 size={14} />
        <span>Supplier</span>
      </div>

      {invoice.supplier ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center border border-[#000060]/10"
              style={{ background: "rgba(0, 0, 96, 0.05)" }}
            >
              <Building2 size={18} className="text-[#000060]/70" />
            </div>
            <div>
              <h3 className="font-semibold text-[#000060]">
                {invoice.supplier.name}
              </h3>
              {invoice.supplier.supplier_code && (
                <p className="text-xs text-[#000060]/40 font-mono">
                  {invoice.supplier.supplier_code}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {(invoice.supplier.office_phone ||
              invoice.supplier.personal_phone) && (
              <div className="flex items-center gap-2 text-sm text-[#000060]/70">
                <Phone size={14} className="text-[#000060]/40" />
                <span>
                  {invoice.supplier.office_phone ||
                    invoice.supplier.personal_phone}
                </span>
              </div>
            )}
            {invoice.supplier.email && (
              <div className="flex items-center gap-2 text-sm text-[#000060]/70">
                <Mail size={14} className="text-[#000060]/40" />
                <span className="truncate">{invoice.supplier.email}</span>
              </div>
            )}
            {invoice.supplier.gst_number && (
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#000060]/40" />
                <span className="font-mono text-xs px-2 py-1 rounded bg-[#000060]/5 text-[#000060]/80 border border-[#000060]/10">
                  {invoice.supplier.gst_number}
                </span>
              </div>
            )}
          </div>

          {(invoice.supplier.address_line_1 || invoice.supplier.city) && (
            <div className="flex gap-2 pt-3 border-t border-[#000060]/10">
              <MapPin size={14} className="text-[#000060]/40 shrink-0 mt-0.5" />
              <p className="text-xs text-[#000060]/50 leading-relaxed">
                {[
                  invoice.supplier.address_line_1,
                  invoice.supplier.city,
                  invoice.supplier.state,
                  invoice.supplier.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-[#000060]/40">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Supplier info not available</p>
        </div>
      )}
    </div>

    {/* Summary Stats */}
    <div className="shrink-0 p-5 border-b border-[#000060]/10 bg-white">
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-[#000060]/5 border border-[#000060]/10">
          <div className="text-xl font-bold text-[#000060]">{itemCount}</div>
          <div className="text-[10px] text-[#000060]/50 uppercase mt-1">
            Products
          </div>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#000060]/10 border border-[#000060]/15">
          <div className="text-xl font-bold text-[#000060]">{totalQty}</div>
          <div className="text-[10px] text-[#000060]/50 uppercase mt-1">
            Quantity
          </div>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#000060]/10 border border-[#000060]/15">
          <div className="text-xl font-bold text-[#000060]">{totalFree}</div>
          <div className="text-[10px] text-[#000060]/50 uppercase mt-1">
            Free
          </div>
        </div>
      </div>
    </div>

    {/* Financial Summary */}
    <div
      className="flex-1 overflow-y-auto p-5 bg-white"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0, 0, 96, 0.2) transparent",
      }}
    >
      <div className="flex items-center gap-2 text-[#000060]/60 text-xs uppercase tracking-widest mb-4">
        <IndianRupee size={14} />
        <span>Financials</span>
      </div>

      <div className="space-y-3">
        <FinanceRow label="Subtotal" value={formatCurrency(invoice.subtotal)} />
        {parseFloat(invoice.discount_amount) > 0 && (
          <FinanceRow
            label="Discount"
            value={`- ${formatCurrency(invoice.discount_amount)}`}
            valueClass="text-[#000060]/80"
          />
        )}
        <FinanceRow
          label="Taxable Amount"
          value={formatCurrency(invoice.taxable_amount)}
        />
        <div className="border-t border-dashed border-[#000060]/10 my-3" />
        {parseFloat(invoice.cgst_amount) > 0 && (
          <FinanceRow
            label="CGST"
            value={formatCurrency(invoice.cgst_amount)}
            small
          />
        )}
        {parseFloat(invoice.sgst_amount) > 0 && (
          <FinanceRow
            label="SGST"
            value={formatCurrency(invoice.sgst_amount)}
            small
          />
        )}
        {parseFloat(invoice.igst_amount) > 0 && (
          <FinanceRow
            label="IGST"
            value={formatCurrency(invoice.igst_amount)}
            small
          />
        )}
        <FinanceRow
          label="Total Tax"
          value={formatCurrency(invoice.total_tax)}
          valueClass="text-[#000060]/90"
        />
        {invoice.round_off !== 0 && (
          <FinanceRow
            label="Round Off"
            value={formatCurrency(invoice.round_off)}
            small
          />
        )}
        <div className="border-t-2 border-[#000060]/20 my-4" />
        <div className="flex justify-between items-center py-2">
          <span className="font-semibold text-[#000060]">Net Amount</span>
          <span className="text-2xl font-bold text-[#000060]">
            {formatCurrency(invoice.net_amount)}
          </span>
        </div>

        {invoice.payment_status !== "PAID" && (
          <div className="mt-4 p-4 rounded-xl bg-[#000060]/5 border border-[#000060]/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#000060]/60">Paid</span>
              <span className="font-semibold text-[#000060]">
                {formatCurrency(invoice.paid_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#000060]">
                Balance
              </span>
              <span className="text-lg font-bold text-[#000060]">
                {formatCurrency(invoice.balance_amount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Edit CTA */}
      {canEdit && (
        <div className="mt-6 pt-4 border-t border-[#000060]/10">
          {isConfirmed && (
            <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={16}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <div className="text-xs text-amber-700">
                  <p className="font-semibold">Super Admin Override</p>
                  <p className="mt-0.5 opacity-80">
                    Editing will adjust inventory stock levels automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onEnterEditMode}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all shadow-lg ${
              isConfirmed
                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                : "bg-[#000060] text-white hover:bg-[#000060]/90 shadow-[#000060]/20"
            }`}
          >
            {isConfirmed ? <Shield size={18} /> : <Pencil size={18} />}
            <span>
              {isConfirmed ? "Edit as Super Admin" : "Edit This Invoice"}
            </span>
          </button>
          <p
            className={`text-xs text-center mt-2 ${isConfirmed ? "text-amber-600" : "text-[#000060]/50"}`}
          >
            {isConfirmed
              ? "⚠️ Stock will be automatically adjusted"
              : "Opens inline editor"}
          </p>
        </div>
      )}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// VIEW RIGHT PANEL - ITEMS TABLE
// ════════════════════════════════════════════════════════════════════════════

const ViewRightPanel = ({
  invoice,
  formatCurrency,
  formatDate,
  totalQty,
  totalFree,
  itemCount,
}) => (
  <div className="flex-1 flex flex-col overflow-hidden bg-white">
    {/* Table Header */}
    <div className="shrink-0 px-6 py-4 border-b border-[#000060]/10 flex items-center justify-between bg-[#000060]/[0.02]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#000060]/10 flex items-center justify-center">
          <Package size={16} className="text-[#000060]/70" />
        </div>
        <h2 className="font-semibold text-[#000060]">Line Items</h2>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#000060] text-white">
          {itemCount} items
        </span>
      </div>
    </div>

    {/* Table Container */}
    <div
      className="flex-1 overflow-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0, 0, 96, 0.2) transparent",
      }}
    >
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="text-xs font-semibold text-[#000060]/60 uppercase tracking-wider bg-[#000060]/[0.03]">
            <th className="px-4 py-3 text-center w-12 border-b border-[#000060]/10">
              #
            </th>
            <th className="px-4 py-3 text-left min-w-[200px] border-b border-[#000060]/10">
              Product
            </th>
            <th className="px-4 py-3 text-center w-28 border-b border-[#000060]/10">
              Batch
            </th>
            <th className="px-4 py-3 text-center w-24 border-b border-[#000060]/10">
              Expiry
            </th>
            <th className="px-4 py-3 text-center w-20 border-b border-[#000060]/10">
              Pack
            </th>
            <th className="px-4 py-3 text-right w-16 border-b border-[#000060]/10">
              Qty
            </th>
            <th className="px-4 py-3 text-right w-16 border-b border-[#000060]/10">
              Free
            </th>
            <th className="px-4 py-3 text-right w-24 border-b border-[#000060]/10">
              Rate
            </th>
            <th className="px-4 py-3 text-right w-24 border-b border-[#000060]/10">
              MRP
            </th>
            <th className="px-4 py-3 text-center w-16 border-b border-[#000060]/10">
              Disc%
            </th>
            <th className="px-4 py-3 text-center w-16 border-b border-[#000060]/10">
              GST%
            </th>
            <th className="px-4 py-3 text-right w-28 border-b border-[#000060]/10">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#000060]/5">
          {invoice.lineItems && invoice.lineItems.length > 0 ? (
            invoice.lineItems.map((item, i) => {
              if (!item) return null;
              const gstPercent =
                (parseFloat(item.cgst_percent) || 0) +
                (parseFloat(item.sgst_percent) || 0);
              const isExpiringSoon =
                item.expiry_date &&
                new Date(item.expiry_date) <
                  new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

              return (
                <tr
                  key={item.item_id || `item-${i}`}
                  className="hover:bg-[#000060]/[0.02] transition-colors group"
                >
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-mono text-[#000060]/40 group-hover:text-[#000060]/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-[#000060] text-sm">
                        {item.medicine?.name || "Unknown Product"}
                      </span>
                      {item.medicine?.generic_name && (
                        <p className="text-[10px] text-[#000060]/40 italic mt-0.5">
                          {item.medicine.generic_name}
                        </p>
                      )}
                      {item.medicine?.manufacturer && (
                        <p className="text-[10px] text-[#000060]/30 mt-0.5">
                          {item.medicine.manufacturer}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-xs px-2 py-1 rounded bg-[#000060]/5 text-[#000060]/70 border border-[#000060]/10">
                      {item.batch_number || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs ${isExpiringSoon ? "text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded" : "text-[#000060]/60"}`}
                    >
                      {formatDate(item.expiry_date)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-[#000060]/50">
                    {item.pack_size || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-[#000060]">
                      {parseFloat(item.quantity) || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-[#000060]/70">
                      {parseFloat(item.free_quantity) || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-[#000060]/70">
                    {formatCurrency(item.purchase_rate)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-[#000060]">
                    {formatCurrency(item.mrp)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(parseFloat(item.trade_discount) || 0) > 0 ? (
                      <span className="text-xs font-semibold text-[#000060]/80">
                        {item.trade_discount}%
                      </span>
                    ) : (
                      <span className="text-xs text-[#000060]/30">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-medium text-[#000060]/70">
                      {gstPercent.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold text-[#000060]">
                      {formatCurrency(item.line_total)}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={12} className="px-4 py-20 text-center">
                <div className="flex flex-col items-center gap-4 text-[#000060]/40">
                  <Package size={48} strokeWidth={1} className="opacity-30" />
                  <div>
                    <p className="font-medium text-[#000060]/60">
                      No items found
                    </p>
                    <p className="text-sm mt-1 text-[#000060]/40">
                      This invoice has no items
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>

        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <tfoot className="sticky bottom-0 border-t-2 border-[#000060]/20 bg-white">
            <tr className="text-sm font-semibold">
              <td
                colSpan={5}
                className="px-4 py-4 text-right text-[#000060]/60"
              >
                Grand Totals
              </td>
              <td className="px-4 py-4 text-right text-[#000060] font-bold">
                {totalQty}
              </td>
              <td className="px-4 py-4 text-right text-[#000060]/80 font-bold">
                {totalFree}
              </td>
              <td colSpan={4} className="px-4 py-4"></td>
              <td className="px-4 py-4 text-right">
                <span className="text-lg font-bold text-[#000060]">
                  {formatCurrency(invoice.net_amount)}
                </span>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// MAIN VIEW MODE CONTENT
// ════════════════════════════════════════════════════════════════════════════

const ViewModeContent = ({
  invoice,
  formatCurrency,
  formatDate,
  totalQty,
  totalFree,
  itemCount,
  canEdit,
  isConfirmed,
  onEnterEditMode,
}) => (
  <div className="flex-1 flex overflow-hidden relative z-10">
    <ViewLeftPanel
      invoice={invoice}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
      totalQty={totalQty}
      totalFree={totalFree}
      itemCount={itemCount}
      canEdit={canEdit}
      isConfirmed={isConfirmed}
      onEnterEditMode={onEnterEditMode}
    />
    <ViewRightPanel
      invoice={invoice}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
      totalQty={totalQty}
      totalFree={totalFree}
      itemCount={itemCount}
    />
  </div>
);

export default ViewModeContent;
