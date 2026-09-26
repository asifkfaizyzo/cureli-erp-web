// pharmacy-web/src/pages/inventory/components/import/ImportResultStep.jsx (do not remove this comment)
// src/pages/inventory/components/import/ImportResultStep.jsx

import React, { useMemo, useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Link2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Building2,
  Download,
  ArrowRight,
  Package,
  GitMerge,
  RefreshCw,
  SkipForward,
  AlertCircle,
} from "lucide-react";
import inventoryImportAPI from "../../../../api/inventoryImport";

/* ── Collapsible medicine group ─────────────────────── */
const MedicineGroup = ({ title, icon: Icon, colorClass, badgeClass, items }) => {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5
                   bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon size={13} className={colorClass} />
          <span className="text-xs font-medium text-gray-700 truncate">
            {title}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeClass}`}>
            {items.length}
          </span>
        </div>
        {open
          ? <ChevronUp size={13} className="text-gray-400 shrink-0" />
          : <ChevronDown size={13} className="text-gray-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="border-t border-gray-100 max-h-40 overflow-y-auto
                        divide-y divide-gray-50">
          {items.map((item, i) => (
            <div key={`${item.key}-${i}`} className="px-3 py-2 flex items-center
                                                      justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {item.inputName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px]
                                text-gray-400">
                  <Building2 size={9} className="shrink-0" />
                  <span className="truncate">
                    {item.inputCompany || "Unknown"}
                  </span>
                  <span>·</span>
                  <span>{item.rowCount} {item.rowCount === 1 ? "batch" : "batches"}</span>
                </div>
              </div>
              {typeof item.confidence === "number" && item.confidence > 0 && (
                <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                  {item.confidence}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Main component ─────────────────────────────────── */
const ImportResultStep = ({
  result,
  medicinePlans,
  fileName,
  importJobId,
  onDone,
}) => {
  const [showErrors, setShowErrors] = useState(false);

  if (!result) return null;

  const totalWritten =
    (result.importedRows || 0) +
    (result.mergedRows   || 0) +
    (result.replacedRows || 0);

  const isFullSuccess = result.errorRows === 0 && totalWritten > 0;
  const isPartial     = result.errorRows > 0   && totalWritten > 0;
  const isFullFailure = totalWritten === 0;

  const groupedPlans = useMemo(() => {
    const plans = Object.values(medicinePlans || {});
    return {
      existing:  plans.filter((p) => p.medicineAction === "use_existing"),
      linked:    plans.filter((p) => p.medicineAction === "create_linked"),
      suggested: plans.filter((p) => p.medicineAction === "create_suggested"),
      unlinked:  plans.filter((p) => p.medicineAction === "create_unlinked"),
    };
  }, [medicinePlans]);

  const needsAttention =
    (result.catalogSuggested || 0) + (result.catalogUnlinked || 0);

  return (
    <div className="p-6 space-y-5">

      {/* ── Status banner ── */}
      <div
        className={`
          flex items-start gap-4 p-5 rounded-2xl
          ${isFullSuccess ? "bg-gray-50  border border-gray-200"  : ""}
          ${isPartial     ? "bg-amber-50 border border-amber-200" : ""}
          ${isFullFailure ? "bg-red-50   border border-red-200"   : ""}
        `}
      >
        {/* Icon */}
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center shrink-0
            ${isFullSuccess ? "bg-emerald-100" : ""}
            ${isPartial     ? "bg-amber-100"   : ""}
            ${isFullFailure ? "bg-red-100"     : ""}
          `}
        >
          {isFullSuccess && <CheckCircle  size={20} className="text-emerald-600" />}
          {isPartial     && <AlertTriangle size={20} className="text-amber-600"  />}
          {isFullFailure && <XCircle      size={20} className="text-red-600"    />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`
            text-sm font-bold
            ${isFullSuccess ? "text-gray-900"  : ""}
            ${isPartial     ? "text-amber-900" : ""}
            ${isFullFailure ? "text-red-900"   : ""}
          `}>
            {isFullSuccess && "Import complete"}
            {isPartial     && "Import partially complete"}
            {isFullFailure && "Import failed"}
          </p>

          <p className={`
            text-xs mt-1 leading-relaxed
            ${isFullSuccess ? "text-gray-500"  : ""}
            ${isPartial     ? "text-amber-700" : ""}
            ${isFullFailure ? "text-red-600"   : ""}
          `}>
            {isFullSuccess &&
              `${totalWritten.toLocaleString()} records written to inventory.`}
            {isPartial &&
              `${totalWritten.toLocaleString()} records imported · ${result.errorRows.toLocaleString()} rows had errors and were skipped.`}
            {isFullFailure &&
              "No records were written. All rows contained errors."}
          </p>

          {fileName && (
            <p className="text-[11px] text-gray-400 mt-1 truncate">{fileName}</p>
          )}
        </div>
      </div>

      {/* ── Stat row ── */}
      {totalWritten > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              icon:  Package,
              value: result.importedRows || 0,
              label: "Created",
              show:  (result.importedRows || 0) > 0,
              color: "text-gray-900",
              iconCls: "text-gray-400",
            },
            {
              icon:  GitMerge,
              value: result.mergedRows || 0,
              label: "Merged",
              show:  (result.mergedRows || 0) > 0,
              color: "text-gray-900",
              iconCls: "text-gray-400",
            },
            {
              icon:  RefreshCw,
              value: result.replacedRows || 0,
              label: "Replaced",
              show:  (result.replacedRows || 0) > 0,
              color: "text-gray-900",
              iconCls: "text-gray-400",
            },
          ]
            .filter((s) => s.show)
            .map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center py-4 px-2 bg-white
                           border border-gray-200 rounded-xl"
              >
                <s.icon size={16} className={`${s.iconCls} mb-1.5`} />
                <p className={`text-xl font-extrabold tabular-nums ${s.color}`}>
                  {s.value.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
        </div>
      )}

      {/* Skipped + errors — secondary pills */}
      {((result.skippedRows || 0) > 0 || (result.errorRows || 0) > 0) && (
        <div className="flex gap-2">
          {result.skippedRows > 0 && (
            <div className="flex-1 flex items-center justify-between px-3 py-2
                            bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-1.5">
                <SkipForward size={12} className="text-gray-400" />
                <span className="text-xs text-gray-500">Skipped</span>
              </div>
              <span className="text-xs font-bold text-gray-600">
                {result.skippedRows.toLocaleString()}
              </span>
            </div>
          )}
          {result.errorRows > 0 && (
            <div className="flex-1 flex items-center justify-between px-3 py-2
                            bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-1.5">
                <AlertCircle size={12} className="text-red-400" />
                <span className="text-xs text-red-600">Errors</span>
              </div>
              <span className="text-xs font-bold text-red-700">
                {result.errorRows.toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── New medicines section ── */}
      {result.newMedicinesCreated > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center
                          justify-between">
            <p className="text-xs font-bold text-gray-700">
              {result.newMedicinesCreated} new medicines added
            </p>
            {needsAttention > 0 && (
              <button
                onClick={onDone}
                className="flex items-center gap-1 text-[11px] font-medium
                           text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Review <ExternalLink size={10} />
              </button>
            )}
          </div>

          <div className="p-3 space-y-2">
            <MedicineGroup
              title="Already in your shop"
              icon={CheckCircle}
              colorClass="text-gray-400"
              badgeClass="bg-gray-100 text-gray-600"
              items={groupedPlans.existing}
            />
            <MedicineGroup
              title="Linked to master catalog"
              icon={Link2}
              colorClass="text-gray-400"
              badgeClass="bg-gray-100 text-gray-600"
              items={groupedPlans.linked}
            />
            <MedicineGroup
              title="Suggested match — needs review"
              icon={HelpCircle}
              colorClass="text-amber-400"
              badgeClass="bg-amber-50 text-amber-700"
              items={groupedPlans.suggested}
            />
            <MedicineGroup
              title="No catalog match — link later"
              icon={XCircle}
              colorClass="text-gray-300"
              badgeClass="bg-gray-100 text-gray-500"
              items={groupedPlans.unlinked}
            />
          </div>

          {needsAttention > 0 && (
            <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
              <p className="text-[11px] text-amber-700">
                {needsAttention} medicines need catalog linking for full
                marketplace visibility.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Error details ── */}
      {result.errors?.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowErrors((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3
                       bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={13} className="text-red-400" />
              <span className="text-xs font-semibold text-gray-700">
                Error details
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-50
                               text-red-600 rounded-full">
                {result.errors.length}
              </span>
            </div>
            {showErrors
              ? <ChevronUp size={14} className="text-gray-400" />
              : <ChevronDown size={14} className="text-gray-400" />
            }
          </button>

          {showErrors && (
            <div className="border-t border-gray-100 max-h-44 overflow-y-auto
                            divide-y divide-gray-50">
              {result.errors.slice(0, 50).map((err, i) => (
                <div key={i} className="px-4 py-2 text-[11px] flex items-start
                                        gap-2">
                  <span className="text-gray-400 shrink-0 tabular-nums w-10">
                    Row {(err.rowIndex ?? 0) + 1}
                  </span>
                  <span className="font-medium text-gray-600 shrink-0 truncate
                                   max-w-[100px]">
                    {err.productName || "—"}
                  </span>
                  <span className="text-red-500 min-w-0">{err.message}</span>
                </div>
              ))}
              {result.errors.length > 50 && (
                <div className="px-4 py-2 text-[11px] text-gray-400 text-center">
                  +{result.errors.length - 50} more
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Download error report */}
      {importJobId && result.errors?.length > 0 && (
        <a
          href={inventoryImportAPI.downloadErrorReport(importJobId)}
          download
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                     text-xs font-medium text-gray-600 bg-white border
                     border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Download size={13} />
          Download error report (.xlsx)
        </a>
      )}

      {/* CTA */}
      <button
        onClick={onDone}
        className="w-full py-3.5 px-6 bg-[#000060] text-white font-bold
                   text-sm rounded-xl hover:bg-indigo-800 transition-colors
                   flex items-center justify-center gap-2"
      >
        View Inventory
        <ArrowRight size={16} />
      </button>

    </div>
  );
};

export default ImportResultStep;