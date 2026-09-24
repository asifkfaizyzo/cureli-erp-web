// pharmacy-web/src/components/common/ImportResultModal.jsx (do not remove this comment)
// src/components/common/ImportResultModal.jsx

import React, { useState, useMemo } from "react";
import {
  X,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Link2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  Info,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// STATUS BADGE COMPONENT — UNCHANGED
// ══════════════════════════════════════════════════════════════

const StatusBadge = ({ status, confidence }) => {
  const config = {
    AUTO_LINKED: {
      label: "Linked",
      icon: CheckCircle,
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-700",
      iconColor: "text-emerald-500",
    },
    PENDING: {
      label: "Pending Review",
      icon: Clock,
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-700",
      iconColor: "text-amber-500",
    },
    NO_MATCH: {
      label: "Not in Catalog",
      icon: AlertCircle,
      bg: "bg-slate-50",
      border: "border-slate-200",
      text: "text-slate-600",
      iconColor: "text-slate-400",
    },
    SKIP: {
      label: "Skipped",
      icon: AlertCircle,
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-500",
      iconColor: "text-gray-400",
    },
    ERROR: {
      label: "Error",
      icon: AlertCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-600",
      iconColor: "text-red-400",
    },
  };

  const c = config[status] || config.NO_MATCH;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.border} ${c.text}`}
    >
      <Icon size={12} className={c.iconColor} />
      {c.label}
      {confidence > 0 && (
        <span className="text-[10px] opacity-70">({confidence}%)</span>
      )}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════
// STATS CARD COMPONENT — UNCHANGED
// ══════════════════════════════════════════════════════════════

const StatCard = ({ icon: Icon, label, count, total, color }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-xl border ${color.bg} ${color.border}`}
  >
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.iconBg}`}
    >
      <Icon size={18} className={color.iconColor} />
    </div>
    <div>
      <p className={`text-lg font-bold ${color.text}`}>{count}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

const ImportResultModal = ({
  open,
  onClose,
  newProducts = [],
  catalogResults = null,
  onProceedWithUnmatched,
  onSkipUnmatched,
}) => {
  const [expandedSection, setExpandedSection] = useState("linked");
  const [isProcessing, setIsProcessing] = useState(false);

  // ═══════════════════════════════════════════════════════
  // Categorize products by catalog match status — UNCHANGED
  // ═══════════════════════════════════════════════════════

  const categorized = useMemo(() => {
    const linked = [];
    const pending = [];
    const unmatched = [];

    newProducts.forEach((product, index) => {
      const match = product.catalogMatch;

      if (!match) {
        unmatched.push({ ...product, index });
        return;
      }

      switch (match.status) {
        case "AUTO_LINKED":
          linked.push({ ...product, index, match });
          break;
        case "PENDING":
          pending.push({ ...product, index, match });
          break;
        case "NO_MATCH":
        case "ERROR":
        case "SKIP":
        default:
          unmatched.push({ ...product, index, match });
          break;
      }
    });

    return { linked, pending, unmatched };
  }, [newProducts]);

  const stats = catalogResults?.stats || {
    total: newProducts.length,
    autoLinked: categorized.linked.length,
    pending: categorized.pending.length,
    noMatch: categorized.unmatched.length,
  };

  // ═══════════════════════════════════════════════════════
  //  FIX: Proceed sends ALL new products to BatchProductModal
  // Catalog linking is separate from shop medicine creation.
  // ALL products here are "new" = not in shop's medicine list.
  // They ALL need to be created regardless of catalog link status.
  // ═══════════════════════════════════════════════════════

  const handleProceed = async () => {
    setIsProcessing(true);
    try {
      if (newProducts.length > 0 && onProceedWithUnmatched) {
        // Pass ALL new products — they all need to be created in shop
        onProceedWithUnmatched(newProducts);
      } else {
        onClose();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipAll = () => {
    if (onSkipUnmatched) {
      onSkipUnmatched();
    }
    onClose();
  };

  // ═══════════════════════════════════════════════════════
  // Toggle sections — UNCHANGED
  // ═══════════════════════════════════════════════════════

  const toggleSection = (section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══════════ HEADER — UNCHANGED ═══════════ */}
        <div className="shrink-0 bg-gradient-to-r from-[#000060] to-indigo-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Link2 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">
                  Import Catalog Check
                </h2>
                <p className="text-white/70 text-sm">
                  {stats.total} new products checked against master catalog
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ═══════════ STATS BAR — UNCHANGED ═══════════ */}
        <div className="shrink-0 grid grid-cols-3 gap-3 px-6 py-4 bg-slate-50 border-b">
          <StatCard
            icon={CheckCircle}
            label="Auto-Linked"
            count={stats.autoLinked}
            total={stats.total}
            color={{
              bg: "bg-emerald-50",
              border: "border-emerald-200",
              iconBg: "bg-emerald-100",
              iconColor: "text-emerald-600",
              text: "text-emerald-700",
            }}
          />
          <StatCard
            icon={Clock}
            label="Pending Review"
            count={stats.pending}
            total={stats.total}
            color={{
              bg: "bg-amber-50",
              border: "border-amber-200",
              iconBg: "bg-amber-100",
              iconColor: "text-amber-600",
              text: "text-amber-700",
            }}
          />
          <StatCard
            icon={AlertCircle}
            label="Not in Catalog"
            count={stats.noMatch}
            total={stats.total}
            color={{
              bg: "bg-slate-50",
              border: "border-slate-200",
              iconBg: "bg-slate-100",
              iconColor: "text-slate-500",
              text: "text-slate-700",
            }}
          />
        </div>

        {/* ═══════════ CONTENT — UNCHANGED ═══════════ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/*  UPDATED: Info banner reflects that ALL products need creation */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium">How this works:</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>
                  <strong>Linked</strong> — Auto-matched to master catalog. Will
                  appear in mobile app.
                </li>
                <li>
                  <strong>Pending Review</strong> — Sent to admin for
                  verification. Usable in ERP now.
                </li>
                <li>
                  <strong>Not in Catalog</strong> — No match found in master
                  catalog.
                </li>
              </ul>
              <p className="mt-2 font-medium text-blue-800">
                All {newProducts.length} products still need to be added to your
                shop's medicine list in the next step.
              </p>
            </div>
          </div>

          {/* ═══ LINKED SECTION — UNCHANGED ═══ */}
          {categorized.linked.length > 0 && (
            <div className="border border-emerald-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("linked")}
                className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">
                    Auto-Linked ({categorized.linked.length})
                  </span>
                </div>
                {expandedSection === "linked" ? (
                  <ChevronUp size={16} className="text-emerald-600" />
                ) : (
                  <ChevronDown size={16} className="text-emerald-600" />
                )}
              </button>

              {expandedSection === "linked" && (
                <div className="divide-y divide-emerald-100">
                  {categorized.linked.map((product, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-emerald-50/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {product.manufacturer || "Unknown manufacturer"}
                          {product.match?.reason && (
                            <span className="ml-2 text-emerald-600">
                              • {product.match.reason}
                            </span>
                          )}
                        </p>
                      </div>
                      <StatusBadge
                        status="AUTO_LINKED"
                        confidence={product.match?.confidence || 0}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ PENDING SECTION — UNCHANGED ═══ */}
          {categorized.pending.length > 0 && (
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("pending")}
                className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">
                    Pending Admin Review ({categorized.pending.length})
                  </span>
                </div>
                {expandedSection === "pending" ? (
                  <ChevronUp size={16} className="text-amber-600" />
                ) : (
                  <ChevronDown size={16} className="text-amber-600" />
                )}
              </button>

              {expandedSection === "pending" && (
                <div className="divide-y divide-amber-100">
                  {categorized.pending.map((product, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-amber-50/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {product.manufacturer || "Unknown manufacturer"}
                          {product.match?.reason && (
                            <span className="ml-2 text-amber-600">
                              • {product.match.reason}
                            </span>
                          )}
                        </p>
                      </div>
                      <StatusBadge
                        status="PENDING"
                        confidence={product.match?.confidence || 0}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ UNMATCHED SECTION — UNCHANGED ═══ */}
          {categorized.unmatched.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection("unmatched")}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">
                    Not in Catalog ({categorized.unmatched.length})
                  </span>
                </div>
                {expandedSection === "unmatched" ? (
                  <ChevronUp size={16} className="text-slate-500" />
                ) : (
                  <ChevronDown size={16} className="text-slate-500" />
                )}
              </button>

              {expandedSection === "unmatched" && (
                <div className="divide-y divide-slate-100">
                  {categorized.unmatched.map((product, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {product.manufacturer || "Unknown manufacturer"}
                        </p>
                      </div>
                      <StatusBadge status="NO_MATCH" confidence={0} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════ FOOTER —  FIXED ═══════════ */}
        <div className="shrink-0 px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Info */}
            <div className="text-xs text-slate-400">
              <span className="text-emerald-600 font-medium">
                {stats.autoLinked}
              </span>{" "}
              linked
              <span className="mx-1">•</span>
              <span className="text-amber-600 font-medium">
                {stats.pending}
              </span>{" "}
              pending
              <span className="mx-1">•</span>
              <span className="text-slate-600 font-medium">
                {stats.noMatch}
              </span>{" "}
              not in catalog
            </div>

            {/*  FIX: Always show "Create Products" button since ALL products
                need to be created in the shop's medicine list */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipAll}
                disabled={isProcessing}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Skip All
              </button>
              <button
                onClick={handleProceed}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#000060] rounded-lg hover:bg-indigo-800 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Add {newProducts.length} to Shop
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes zoom-in-95 {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-in {
          animation: zoom-in-95 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ImportResultModal;
