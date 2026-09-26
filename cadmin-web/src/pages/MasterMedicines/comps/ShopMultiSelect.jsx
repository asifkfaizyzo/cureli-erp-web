// cadmin-web/src/pages/MasterMedicines/comps/ShopMultiSelect.jsx (do not remove this comment)
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X, Loader2 } from "lucide-react";
import { getDistinctShops } from "../../../api/cadminMasterMedicines";

const ShopMultiSelect = ({ context = "unmapped", value = [], onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  
  // Data State
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Selection state
  const [tempSelection, setTempSelection] = useState(value);

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const listRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Sync state when open state changes
  useEffect(() => {
    if (isOpen) {
      setTempSelection(value);
      setPage(1);
      setShops([]);
      fetchShops(1, searchTerm, true);
    }
  }, [isOpen]);

  const fetchShops = async (targetPage, searchVal, isReset = false) => {
    try {
      if (isReset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const res = await getDistinctShops({
        context,
        search: searchVal,
        page: targetPage,
        limit: 10,
      });

      const data = res.data?.data;
      if (data) {
        setShops((prev) => (isReset ? data.shops : [...prev, ...data.shops]));
        setHasMore(data.meta.hasMore);
      }
    } catch (err) {
      console.error("Failed to load shops:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Debounced search
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setPage(1);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchShops(1, val, true);
    }, 400); // 400ms debounce
  };

  // Scroll logic for infinite loading
  const handleScroll = () => {
    if (!listRef.current || loading || loadingMore || !hasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 15) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchShops(nextPage, searchTerm, false);
    }
  };

  // Layout calculations
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropdownHeight = 320;

    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setDropdownPosition({
      width: Math.max(rect.width, 240),
      left: Math.min(rect.left, window.innerWidth - 250),
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 6, top: "auto", openUpward: true }
        : { top: rect.bottom + 6, bottom: "auto", openUpward: false }),
    });
  }, []);

  const handleToggle = () => {
    if (!isOpen) updatePosition();
    setIsOpen(!isOpen);
  };

  // Selection toggle
  const toggleSelection = (shop) => {
    setTempSelection((prev) =>
      prev.some((item) => item.id === shop.id)
        ? prev.filter((item) => item.id !== shop.id)
        : [...prev, shop]
    );
  };

  const handleApply = () => {
    onChange(tempSelection);
    setIsOpen(false);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    setTempSelection([]);
    onChange([]);
  };

  // Close listeners
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => updatePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, updatePosition]);

  const activeCount = value.length;

  const dropdownPortal = isOpen && dropdownPosition
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            top: dropdownPosition.openUpward ? "auto" : dropdownPosition.top,
            bottom: dropdownPosition.openUpward ? dropdownPosition.bottom : "auto",
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            height: "300px",
          }}
        >
          {/* Header Search */}
          <div className="p-2.5 border-b border-gray-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search shops..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full h-8 pl-8 pr-6 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {searchTerm && (
                <button onClick={() => { setSearchTerm(""); fetchShops(1, "", true); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* List Wrapper */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto py-1 divide-y divide-gray-50"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
                <Loader2 className="animate-spin text-indigo-500" size={18} />
                <span className="text-[11px]">Loading shops...</span>
              </div>
            ) : shops.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                No shops found
              </div>
            ) : (
              shops.map((shop) => {
                const isChecked = tempSelection.some((item) => item.id === shop.id);
                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => toggleSelection(shop)}
                    className="w-full px-3 py-2 text-xs text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isChecked ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300"
                    }`}>
                      {isChecked && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="font-medium text-gray-700 truncate">{shop.name}</span>
                  </button>
                );
              })
            )}
            {loadingMore && (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="animate-spin text-gray-400" size={14} />
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="p-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-medium">
              {tempSelection.length} selected
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-md text-[11px] font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[11px] font-medium hover:bg-indigo-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-gray-500 font-medium">{label}</label>}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={`w-full h-10 px-3 border rounded-lg text-sm text-left flex items-center justify-between gap-2 shadow-sm focus:outline-none transition-all duration-200 ${
          activeCount > 0
            ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span className="truncate flex-1">
          {activeCount > 0 ? `${activeCount} Shops Selected` : "All Shops"}
        </span>
        {activeCount > 0 ? (
          <span
            onClick={handleClearAll}
            className="p-0.5 rounded-full hover:bg-indigo-200 text-indigo-500 transition-colors cursor-pointer"
          >
            <X size={14} strokeWidth={2.5} />
          </span>
        ) : (
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>
      {dropdownPortal}
    </div>
  );
};

export default ShopMultiSelect;