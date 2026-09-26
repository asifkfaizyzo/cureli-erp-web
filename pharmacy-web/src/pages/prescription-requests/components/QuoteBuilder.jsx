// pharmacy-web/src/pages/prescription-requests/components/QuoteBuilder.jsx (do not remove this comment)
// pharmacy-web/src/pages/prescription-requests/components/QuoteBuilder.jsx

import { useState, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import API from "../../../api/axios";
import { useDebounce } from "../../../hooks/useDebounce";

// ── Medicine search ───────────────────────────────────────────────────────────

function useMedicineSearch(branchId) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounced = useDebounce(query, 350);

  const search = useCallback(
    async (q, bId) => {
      if (!q || q.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        // Reuses existing branch medicines endpoint
        const res = await API.get(
          `/mobile/shops/${bId}/branch/${branchId}/medicines`,
          { params: { search: q.trim(), limit: 10 } },
        );
        setResults(res.data?.data?.medicines ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    [branchId],
  );

  // Trigger search when debounced query changes
  useState(() => {
    search(debounced, branchId);
  });

  // Use useEffect pattern correctly
  const prevDebounced = useRef("");

  // We need a proper effect — inline this via a small hook pattern
  return { query, setQuery, results, setResults, searching, debounced, search };
}

// ── Quote item row ────────────────────────────────────────────────────────────

function QuoteItemRow({
  item,
  onQuantityChange,
  onRemove,
  onToggleAvailable,
  onToggleSubstitute,
  onSubstituteNoteChange,
}) {
  const [showNote, setShowNote] = useState(!!item.substitute_note);

  return (
    <div
      className={`
        rounded-xl border p-3 space-y-2 transition-colors
        ${
          item.is_available
            ? "bg-white/[0.03] border-white/[0.08]"
            : "bg-white/[0.015] border-white/[0.04] opacity-60"
        }
      `}
    >
      {/* Top row: name + remove */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium leading-tight ${item.is_available ? "text-white/80" : "text-white/30 line-through"}`}
          >
            {item.medicine_name}
          </p>
          <p className="text-[11px] text-white/35 mt-0.5">
            {[item.brand, item.pack_size].filter(Boolean).join(" · ")}
            {item.unit_price > 0 && (
              <span className="ml-2 text-white/50">
                ₹{item.unit_price.toFixed(2)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => onRemove(item.listing_id)}
          className="p-1 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Quantity stepper — only shown when available */}
        {item.is_available && (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onQuantityChange(
                  item.listing_id,
                  Math.max(1, item.quantity - 1),
                )
              }
              className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.10] transition-colors flex items-center justify-center text-sm"
            >
              −
            </button>
            <span className="text-sm font-semibold text-white w-6 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                onQuantityChange(item.listing_id, item.quantity + 1)
              }
              className="w-6 h-6 rounded-md bg-white/[0.06] border border-white/[0.08] text-white/60 hover:bg-white/[0.10] transition-colors flex items-center justify-center text-sm"
            >
              +
            </button>
          </div>
        )}

        {/* Unavailable toggle */}
        <button
          onClick={() => onToggleAvailable(item.listing_id)}
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
            border transition-colors
            ${
              item.is_available
                ? "bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-white/[0.04] hover:border-white/[0.08] hover:text-white/40"
            }
          `}
        >
          {item.is_available ? (
            <>
              <CheckCircle size={10} /> Available
            </>
          ) : (
            <>
              <AlertCircle size={10} /> Unavailable
            </>
          )}
        </button>

        {/* Substitute toggle — only when available */}
        {item.is_available && (
          <button
            onClick={() => {
              onToggleSubstitute(item.listing_id);
              setShowNote(!item.is_substitute);
            }}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium
              border transition-colors
              ${
                item.is_substitute
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400"
              }
            `}
          >
            Substitute
          </button>
        )}
      </div>

      {/* Substitute note */}
      {item.is_substitute && item.is_available && (
        <textarea
          placeholder="Describe the substitute (e.g. 'Offering Calpol 500mg instead of Paracetamol IP')"
          value={item.substitute_note ?? ""}
          onChange={(e) =>
            onSubstituteNoteChange(item.listing_id, e.target.value)
          }
          rows={2}
          maxLength={300}
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white/70 placeholder-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
        />
      )}
    </div>
  );
}

// ── Main QuoteBuilder ─────────────────────────────────────────────────────────

const QuoteBuilder = ({
  detail,
  onSubmitQuote,
  onOpenDecline,
  actionLoading,
  actionError,
}) => {
  // ── Quote items state ─────────────────────────────────────────────────────
  // Initialize from existing quote items if status is QUOTE_SENT
  const [quoteItems, setQuoteItems] = useState(() => {
    if (!detail?.quote_items?.length) return [];
    return detail.quote_items.map((item) => ({
      listing_id: item.listing_id ?? "",
      medicine_name: item.medicine_name,
      brand: item.brand,
      pack_size: item.pack_size,
      unit_price: item.unit_price,
      quantity: item.quantity,
      is_available: item.is_available,
      is_substitute: item.is_substitute,
      substitute_note: item.substitute_note,
    }));
  });

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchDebounce = useRef(null);

  const handleSearchChange = useCallback(
    (e) => {
      const q = e.target.value;
      // console.log("[QuoteBuilder] detail keys:", Object.keys(detail));
      // console.log(
      //   "[QuoteBuilder] full detail:",
      //   JSON.stringify(detail, null, 2),
      // );

      setSearchQuery(q);
      setShowResults(true);

      if (searchDebounce.current) clearTimeout(searchDebounce.current);

      if (q.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      searchDebounce.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          // Use the existing branch medicines endpoint
          const shopId = detail.shop_id ?? "";
          const branchId = detail.branch_id ?? "";

          // We call the mobile shops endpoint which accepts search param
          // This reuses existing backend infrastructure
          const res = await API.get("/marketplace-listing/search", {
            params: {
              branch_id: detail.branch_id,
              search: q.trim(),
              limit: 10,
            },
          });
          setSearchResults(res.data?.data?.listings ?? []);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 350);
    },
    [detail],
  );

  // ── Add medicine to quote ─────────────────────────────────────────────────
  const handleAddMedicine = useCallback((listing) => {
    setQuoteItems((prev) => {
      // Prevent duplicates
      if (prev.some((i) => i.listing_id === listing.listing_id)) return prev;
      return [
        ...prev,
        {
          listing_id: listing.listing_id,
          medicine_name: listing.medicine_name ?? listing.name,
          brand: listing.brand ?? null,
          pack_size: listing.pack_size ?? null,
          unit_price: listing.marketplace_price ?? listing.listingPrice ?? 0,
          quantity: 1,
          is_available: true,
          is_substitute: false,
          substitute_note: null,
        },
      ];
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  }, []);

  // ── Quote item mutations ──────────────────────────────────────────────────
  const handleQuantityChange = useCallback((listingId, qty) => {
    setQuoteItems((prev) =>
      prev.map((i) =>
        i.listing_id === listingId ? { ...i, quantity: qty } : i,
      ),
    );
  }, []);

  const handleRemove = useCallback((listingId) => {
    setQuoteItems((prev) => prev.filter((i) => i.listing_id !== listingId));
  }, []);

  const handleToggleAvailable = useCallback((listingId) => {
    setQuoteItems((prev) =>
      prev.map((i) =>
        i.listing_id === listingId
          ? {
              ...i,
              is_available: !i.is_available,
              is_substitute: false,
              substitute_note: null,
            }
          : i,
      ),
    );
  }, []);

  const handleToggleSubstitute = useCallback((listingId) => {
    setQuoteItems((prev) =>
      prev.map((i) =>
        i.listing_id === listingId
          ? { ...i, is_substitute: !i.is_substitute }
          : i,
      ),
    );
  }, []);

  const handleSubstituteNote = useCallback((listingId, note) => {
    setQuoteItems((prev) =>
      prev.map((i) =>
        i.listing_id === listingId ? { ...i, substitute_note: note } : i,
      ),
    );
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (quoteItems.length === 0) return;

    const payload = quoteItems.map((item) => ({
      listing_id: item.listing_id,
      quantity: item.is_available ? item.quantity : item.quantity,
      is_available: item.is_available,
      is_substitute: item.is_substitute,
      substitute_note: item.substitute_note ?? null,
    }));

    await onSubmitQuote(detail.recipient_id, payload);
  }, [quoteItems, detail.recipient_id, onSubmitQuote]);

  // ── Computed totals ───────────────────────────────────────────────────────
  const availableItems = quoteItems.filter((i) => i.is_available);
  const quoteTotal = availableItems.reduce(
    (sum, i) => sum + i.unit_price * i.quantity,
    0,
  );

  const canSubmit = quoteItems.length > 0 && !actionLoading;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Medicine search */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          Search Medicines
        </label>

        <div className="relative">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 focus-within:border-white/20 transition-colors">
            <Search size={14} className="text-white/30 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              placeholder="Type medicine name to search your listings..."
              className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 focus:outline-none"
            />
            {isSearching && (
              <RefreshCw
                size={12}
                className="animate-spin text-white/30 flex-shrink-0"
              />
            )}
          </div>

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a0825] border border-white/[0.10] rounded-xl shadow-2xl z-20 overflow-hidden max-h-64 overflow-y-auto">
              {searchResults.map((listing) => {
                const alreadyAdded = quoteItems.some(
                  (i) => i.listing_id === listing.listing_id,
                );
                return (
                  <button
                    key={listing.listing_id}
                    onClick={() => !alreadyAdded && handleAddMedicine(listing)}
                    disabled={alreadyAdded}
                    className={`
                      w-full text-left px-4 py-3 flex items-center justify-between gap-3
                      border-b border-white/[0.04] last:border-0 transition-colors
                      ${
                        alreadyAdded
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-white/[0.06] cursor-pointer"
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 font-medium truncate">
                        {listing.medicine_name ?? listing.name}
                      </p>
                      <p className="text-[11px] text-white/35 mt-0.5">
                        {[listing.brand, listing.pack_size]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {listing.marketplace_price != null && (
                        <span className="text-xs text-white/60 font-medium">
                          ₹{Number(listing.marketplace_price).toFixed(2)}
                        </span>
                      )}
                      {alreadyAdded ? (
                        <span className="text-[10px] text-white/30">Added</span>
                      ) : (
                        <Plus size={13} className="text-white/40" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Click outside to close */}
          {showResults && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowResults(false)}
            />
          )}
        </div>
      </div>

      {/* Quote items list */}
      {quoteItems.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Quote Items ({quoteItems.length})
            </label>
            {availableItems.length > 0 && (
              <span className="text-xs text-white/50 font-semibold">
                Total: ₹{quoteTotal.toFixed(2)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {quoteItems.map((item) => (
              <QuoteItemRow
                key={item.listing_id}
                item={item}
                onQuantityChange={handleQuantityChange}
                onRemove={handleRemove}
                onToggleAvailable={handleToggleAvailable}
                onToggleSubstitute={handleToggleSubstitute}
                onSubstituteNoteChange={handleSubstituteNote}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-white/[0.08]">
          <Search size={20} className="text-white/20 mb-2" />
          <p className="text-xs text-white/30 text-center">
            Search for medicines above to build your quote
          </p>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">{actionError}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {actionLoading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <CheckCircle size={14} />
          )}
          {detail?.status === "QUOTE_SENT" ? "Update Quote" : "Send Quote"}
        </button>

        <button
          onClick={() => onOpenDecline(detail.recipient_id)}
          disabled={actionLoading}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default QuoteBuilder;
