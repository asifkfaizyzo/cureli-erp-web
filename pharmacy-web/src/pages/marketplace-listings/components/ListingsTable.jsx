// pharmacy-web/src/pages/marketplace-listings/components/ListingsTable.jsx (do not remove this comment)
// src/pages/marketplace-listings/components/ListingsTable.jsx

import { Package, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MedicineRow from "./MedicineRow";
import UnlinkedRow from "./UnlinkedRow";

const ListingsTable = ({
  listings,
  selectedIds,
  allSelected,
  someSelected,
  onToggleSelectAll,
  onToggleSelectOne,
  onToggleVisibility,
  onSetStockStatus,
  onSetPrice,
  onOpenDrawer,
  globalEnabled,
  isLoading,
  updatingIds,
  activeTab,
  currentPage,
  totalPages,
  totalResults,
  onPageChange,
  pageSize,
}) => {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ tableLayout: "fixed", minWidth: activeTab === "linked" ? "1000px" : "600px" }}
        >
          {activeTab === "linked" ? (
            <>
              <colgroup>
                <col style={{ width: "40px" }} />
                <col style={{ width: "240px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "96px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "100px" }} />
              </colgroup>
              <thead>
                <tr className="bg-gradient-to-r from-[#05015A] to-[#0d0b3a] border-b border-white/[0.08] h-10">
                  <th className="px-3 border-r border-white/[0.07]">
                    <div className="flex items-center justify-center">
                      <CheckboxCell
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={onToggleSelectAll}
                      />
                    </div>
                  </th>
                  <HeaderCell label="Medicine" align="left" />
                  <HeaderCell label="ERP Stock" align="center" />
                  <HeaderCell label="Visible" align="center" />
                  <HeaderCell label="Stock Status" align="center" />
                  <HeaderCell label="Mkt Price" align="center" />
                  <HeaderCell label="Actions" align="center" />
                </tr>
              </thead>
            </>
          ) : (
            <>
              <colgroup>
                <col style={{ width: "300px" }} />
                <col style={{ width: "200px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "120px" }} />
              </colgroup>
              <thead>
                <tr className="bg-gradient-to-r from-[#05015A] to-[#0d0b3a] border-b border-white/[0.08] h-10">
                  <HeaderCell label="Medicine (ERP Name)" align="left" />
                  <HeaderCell label="Manufacturer" align="left" />
                  <HeaderCell label="Link Status" align="center" />
                  <HeaderCell label="ERP Stock" align="center" />
                </tr>
              </thead>
            </>
          )}

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={activeTab === "linked" ? 7 : 4} className="py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={24} className="text-white/20 animate-spin" />
                    <p className="text-sm text-white/25">Loading medicines...</p>
                  </div>
                </td>
              </tr>
            ) : listings.length === 0 ? (
              <tr>
                <td colSpan={activeTab === "linked" ? 7 : 4} className="py-20">
                  <EmptyState activeTab={activeTab} />
                </td>
              </tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {listings.map((item, index) =>
                  activeTab === "linked" ? (
                    <MedicineRow
                      key={item.listing_id}
                      listing={item}
                      index={index}
                      isSelected={selectedIds.has(item.listing_id)}
                      onToggleSelect={() => onToggleSelectOne(item.listing_id)}
                      onToggleVisibility={() =>
                        onToggleVisibility(item.listing_id)
                      }
                      onSetStockStatus={(status) =>
                        onSetStockStatus(item.listing_id, status)
                      }
                      onSetPrice={(price) =>
                        onSetPrice(item.listing_id, price)
                      }
                      onView={() => onOpenDrawer(item)}
                      globalEnabled={globalEnabled}
                      isUpdating={updatingIds.has(item.listing_id)}
                    />
                  ) : (
                    <UnlinkedRow key={item.medicine_id} medicine={item} index={index} />
                  )
                )}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] bg-white/[0.01]">
          <p className="text-[11px] text-white/25">
            Showing{" "}
            {Math.min((currentPage - 1) * pageSize + 1, totalResults)}–
            {Math.min(currentPage * pageSize, totalResults)} of {totalResults}{" "}
            medicines
          </p>
          <div className="flex items-center gap-1">
            <PageButton
              label="←"
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 1
              )
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) {
                  acc.push("ellipsis-" + p);
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p) =>
                typeof p === "string" ? (
                  <span key={p} className="w-7 text-center text-white/20 text-xs">
                    …
                  </span>
                ) : (
                  <PageButton
                    key={p}
                    label={String(p)}
                    onClick={() => onPageChange(p)}
                    active={p === currentPage}
                  />
                )
              )}
            <PageButton
              label="→"
              onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const HeaderCell = ({ label, align = "left" }) => (
  <th className={`px-3 py-2.5 text-[11px] font-semibold text-white/50 uppercase tracking-wider border-r border-white/[0.07] last:border-r-0 text-${align}`}>
    {label}
  </th>
);

const CheckboxCell = ({ checked, indeterminate, onChange }) => (
  <button
    onClick={onChange}
    className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
      checked || indeterminate
        ? "bg-blue-500 border-blue-500"
        : "bg-white/[0.04] border-white/20 hover:border-white/40"
    }`}
  >
    {indeterminate && !checked && (
      <span className="w-2 h-0.5 bg-white rounded-full" />
    )}
    {checked && (
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </button>
);

const PageButton = ({ label, onClick, disabled, active }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
      active
        ? "bg-[#05015A] border border-white/20 text-white"
        : disabled
        ? "text-white/15 cursor-not-allowed"
        : "text-white/35 hover:text-white/60 hover:bg-white/[0.05]"
    }`}
  >
    {label}
  </button>
);

const EmptyState = ({ activeTab }) => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
      <Package size={22} className="text-white/20" />
    </div>
    <div className="text-center">
      <p className="text-sm font-medium text-white/30">
        {activeTab === "linked"
          ? "No linked medicines found"
          : "No unlinked medicines"}
      </p>
      <p className="text-xs text-white/15 mt-1">
        {activeTab === "linked"
          ? "Try adjusting your search or filters"
          : "All medicines in this branch are linked to the catalog"}
      </p>
    </div>
  </div>
);

export default ListingsTable;