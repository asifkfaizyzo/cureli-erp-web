// pharmacy-web/src/pages/prescription-requests/components/QuoteBuilder.jsx (do not remove this comment)

import { useState, useCallback, useRef } from "react";
import {
  Search,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import API from "../../../api/axios";

function QuoteItemRow({
  item,
  onQuantityChange,
  onRemove,
  onToggleAvailable,
  onToggleSubstitute,
  onSubstituteNoteChange,
}) {
  return (
    <div
      className={`rounded-xl border p-2.5 space-y-2 transition-colors ${
        item.is_available
          ? "bg-white/[0.02] border-white/[0.06]"
          : "bg-white/[0.01] border-white/[0.03] opacity-60"
      }`}
    >
      {/* Name and actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-semibold leading-tight truncate ${item.is_available ? "text-white/90" : "text-white/30 line-through"}`}
          >
            {item.medicine_name}
          </p>
          <p className="text-[10px] text-white/40 mt-0.5 font-medium">
            {[item.brand, item.pack_size].filter(Boolean).join(" · ")}
            {item.unit_price > 0 && (
              <span className="ml-1.5 text-white/50">
                ₹{item.unit_price.toFixed(2)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => onRemove(item.listing_id)}
          className="p-1 rounded hover:bg-red-500/15 text-white/30 hover:text-red-400 transition-colors"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Item Controls */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {item.is_available && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                onQuantityChange(
                  item.listing_id,
                  Math.max(1, item.quantity - 1),
                )
              }
              className="w-5 h-5 rounded bg-white/[0.05] border border-white/[0.08] text-white/60 hover:bg-white/[0.10] flex items-center justify-center text-xs"
            >
              −
            </button>
            <span className="text-xs font-bold text-white w-5 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() =>
                onQuantityChange(item.listing_id, item.quantity + 1)
              }
              className="w-5 h-5 rounded bg-white/[0.05] border border-white/[0.08] text-white/60 hover:bg-white/[0.10] flex items-center justify-center text-xs"
            >
              +
            </button>
          </div>
        )}

        <button
          onClick={() => onToggleAvailable(item.listing_id)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
            item.is_available
              ? "bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-red-500/10 hover:text-red-400"
              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-white/[0.03]"
          }`}
        >
          {item.is_available ? (
            <CheckCircle size={9} />
          ) : (
            <AlertCircle size={9} />
          )}
          {item.is_available ? "Available" : "Unavailable"}
        </button>

        {item.is_available && (
          <button
            onClick={() => onToggleSubstitute(item.listing_id)}
            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
              item.is_substitute
                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:bg-blue-500/10 hover:text-blue-400"
            }`}
          >
            Substitute
          </button>
        )}
      </div>

      {item.is_substitute && item.is_available && (
        <textarea
          placeholder="Describe the substitute (e.g. 'Calpol instead of Paracetamol')"
          value={item.substitute_note ?? ""}
          onChange={(e) =>
            onSubstituteNoteChange(item.listing_id, e.target.value)
          }
          rows={2}
          maxLength={300}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-md px-2.5 py-1.5 text-xs text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-white/20"
        />
      )}
    </div>
  );
}

const QuoteBuilder = ({ detail, quoteItems, setQuoteItems }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchDebounce = useRef(null);

  const handleSearchChange = useCallback(
    (e) => {
      const q = e.target.value;
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

  const handleAddMedicine = useCallback(
    (listing) => {
      setQuoteItems((prev) => {
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
    },
    [setQuoteItems],
  );

  const handleQuantityChange = useCallback(
    (listingId, qty) => {
      setQuoteItems((prev) =>
        prev.map((i) =>
          i.listing_id === listingId ? { ...i, quantity: qty } : i,
        ),
      );
    },
    [setQuoteItems],
  );

  const handleRemove = useCallback(
    (listingId) => {
      setQuoteItems((prev) => prev.filter((i) => i.listing_id !== listingId));
    },
    [setQuoteItems],
  );

  const handleToggleAvailable = useCallback(
    (listingId) => {
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
    },
    [setQuoteItems],
  );

  const handleToggleSubstitute = useCallback(
    (listingId) => {
      setQuoteItems((prev) =>
        prev.map((i) =>
          i.listing_id === listingId
            ? { ...i, is_substitute: !i.is_substitute }
            : i,
        ),
      );
    },
    [setQuoteItems],
  );

  const handleSubstituteNote = useCallback(
    (listingId, note) => {
      setQuoteItems((prev) =>
        prev.map((i) =>
          i.listing_id === listingId ? { ...i, substitute_note: note } : i,
        ),
      );
    },
    [setQuoteItems],
  );

  return (
    <div className="space-y-3">
      {/* Search component */}
      <div className="space-y-1.5">
        <div className="relative">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-2.5 py-2 rounded-lg focus-within:border-white/20 transition-all">
            <Search size={12} className="text-white/30 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowResults(true)}
              placeholder="Search Listings..."
              className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/20 focus:outline-none"
            />
            {isSearching && (
              <RefreshCw size={11} className="animate-spin text-white/30" />
            )}
          </div>

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
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.06] ${alreadyAdded ? "opacity-40" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 font-medium truncate">
                        {listing.medicine_name ?? listing.name}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {[listing.brand, listing.pack_size]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    {listing.marketplace_price != null && (
                      <span className="text-xs text-white/50 font-semibold flex-shrink-0">
                        ₹{Number(listing.marketplace_price).toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {showResults && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowResults(false)}
            />
          )}
        </div>
      </div>

      {/* Render configurator layout */}
      {quoteItems.length > 0 ? (
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-0.5 scrollbar-thin">
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
      ) : (
        <div className="flex flex-col items-center justify-center py-6 px-4 rounded-lg border border-dashed border-white/[0.06]">
          <Search size={16} className="text-white/20 mb-1.5" />
          <p className="text-[11px] text-white/30 text-center">
            Add medicines to build quote
          </p>
        </div>
      )}
    </div>
  );
};

export default QuoteBuilder;
