// pharmacy-web/src/pages/purchase/billing/components/PurchaseRowFixed.jsx (do not remove this comment)
// pharmacy-web/src/pages/purchase/billing/components/PurchaseRowFixed.jsx

import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { X, Plus, AlertCircle, CheckCircle2, Gift } from "lucide-react";

const FIELD_ORDER = [
  "name",
  "mfac",
  "batch",
  "hsn",
  "exp",
  "pack",
  "pQty",
  "qty",
  "price",
  "discountPercent",
  "netRate",
  "sgstPercent",
  "mrp",
  "rack",
  "sRate",
  "sch",
];

// ─────────────────────────────────────────────────────────────────────────────
// ProductDropdown — renders via Portal
// ─────────────────────────────────────────────────────────────────────────────
const ProductDropdown = ({
  isOpen,
  anchorRef,
  products,
  highlightedIndex,
  onSelect,
  onAddNew,
  searchTerm,
  onClose,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 320 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280;
      const spaceBelow = viewportHeight - rect.bottom;
      const showAbove =
        spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setPosition({
        top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 2,
        left: rect.left,
        width: Math.max(320, rect.width),
      });
    }
  }, [isOpen, anchorRef]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (anchorRef.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, anchorRef, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => onClose();
    let scrollParent = anchorRef.current?.parentElement;
    while (scrollParent) {
      if (scrollParent.scrollHeight > scrollParent.clientHeight) {
        scrollParent.addEventListener("scroll", handleScroll);
        break;
      }
      scrollParent = scrollParent.parentElement;
    }
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      if (scrollParent)
        scrollParent.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen, anchorRef, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed bg-white border border-slate-300 rounded-lg shadow-2xl max-h-72 overflow-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 9999,
      }}
      // Prevent mousedown from triggering input blur before click fires on children
      onMouseDown={(e) => e.preventDefault()}
    >
      {products.length > 0 ? (
        <>
          <div className="sticky top-0 bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-1.5 border-b border-slate-200 text-[9px] text-slate-600 font-medium">
            {products.length} product{products.length > 1 ? "s" : ""} found
          </div>
          {products.map((product, idx) => (
            <div
              key={product.id || product.medicine_id || idx}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(product);
              }}
              className={`
                px-3 py-2.5 cursor-pointer text-[10px] border-b border-slate-100 last:border-b-0
                transition-all duration-150
                ${
                  idx === highlightedIndex
                    ? "bg-indigo-50 border-l-2 border-l-indigo-500"
                    : "hover:bg-slate-50 border-l-2 border-l-transparent"
                }
              `}
            >
              <div className="font-semibold text-slate-800 truncate">
                {product.name}
              </div>
              {product.genericName && (
                <div className="text-[9px] text-slate-500 mt-0.5 italic">
                  {product.genericName}
                </div>
              )}
              <div className="text-[8px] text-slate-400 flex gap-2 mt-1">
                <span>HSN: {product.hsnCode || product.hsn || "-"}</span>
                <span>•</span>
                <span>{product.manufacturer || product.mfac || "-"}</span>
              </div>
            </div>
          ))}
        </>
      ) : searchTerm.trim().length >= 2 ? (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            onAddNew();
          }}
          className="px-4 py-4 cursor-pointer text-[10px] hover:bg-blue-50 border-l-2 border-l-blue-500 bg-blue-25"
        >
          <div className="font-semibold text-blue-600 flex items-center gap-1.5 mb-1">
            <Plus size={12} />
            Add "{searchTerm}" as new product
          </div>
          <div className="text-[8px] text-blue-500">
            This product will be added to the master list
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 text-[9px] text-slate-400 text-center">
          Type at least 2 characters to search products...
        </div>
      )}
    </div>,
    document.body,
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PurchaseRowFixed
// ─────────────────────────────────────────────────────────────────────────────
const PurchaseRowFixed = memo(
  forwardRef(
    (
      {
        index,
        item,
        onChange,
        onProductSelect,
        productMaster = [],
        rowNumber = 1,
        isEven = false,
        isLast = false,
        onRemoveRow,
        rowsLength,
        onNavigateToNextRow,
        onNavigateToPrevRow,
        onCreateNewRow,
        rowHeight = 36,
        onAddNewProduct,
        onCreateFreeRow,
        onRemoveFreeRow,
      },
      ref,
    ) => {
      const [showProductDropdown, setShowProductDropdown] = useState(false);
      const [productSearch, setProductSearch] = useState("");
      const [highlightedIndex, setHighlightedIndex] = useState(0);
      const rowRef = useRef(null);
      const fieldRefs = useRef({});
      const nameInputRef = useRef(null);
      const schBlurTimeoutRef = useRef(null);

      const isFreeItem = item.isFreeItem === true;

      const filteredProducts = productMaster
        .filter((p) => {
          const searchLower = productSearch.toLowerCase();
          return (
            p.name?.toLowerCase().includes(searchLower) ||
            p.genericName?.toLowerCase().includes(searchLower) ||
            p.hsn?.toLowerCase().includes(searchLower) ||
            p.hsnCode?.toLowerCase().includes(searchLower) ||
            p.manufacturer?.toLowerCase().includes(searchLower) ||
            p.mfac?.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 10);

      useImperativeHandle(
        ref,
        () => ({
          focusFirstField: () => {
            const firstField = fieldRefs.current[FIELD_ORDER[0]];
            if (firstField) {
              firstField.focus();
              firstField.select?.();
            }
          },
          focusLastField: () => {
            const lastField =
              fieldRefs.current[FIELD_ORDER[FIELD_ORDER.length - 1]];
            if (lastField) {
              lastField.focus();
              lastField.select?.();
            }
          },
          focusField: (fieldKey) => {
            const field = fieldRefs.current[fieldKey];
            if (field) {
              field.focus();
              field.select?.();
            }
          },
          scrollIntoView: () => {
            rowRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          },
          closeDropdown: () => {
            setShowProductDropdown(false);
          },
        }),
        [],
      );

      const registerFieldRef = useCallback((fieldKey, inputRef) => {
        if (inputRef) {
          fieldRefs.current[fieldKey] = inputRef;
          if (fieldKey === "name") {
            nameInputRef.current = inputRef;
          }
        }
      }, []);

      const checkProductExists = useCallback(
        (productName) => {
          if (!productName || productName.trim().length < 2) return true;
          const searchLower = productName.toLowerCase().trim();
          return productMaster.some((product) => {
            const nameLower = product.name?.toLowerCase() || "";
            return (
              nameLower === searchLower ||
              nameLower.includes(searchLower) ||
              searchLower.includes(nameLower)
            );
          });
        },
        [productMaster],
      );

      const handleProductNameBlur = useCallback(
        (productName) => {
          if (!productName || productName.trim().length < 2) return;
          const exists = checkProductExists(productName);
          if (!exists && onAddNewProduct) {
            setShowProductDropdown(false);
            onAddNewProduct({
              rowIndex: index,
              productName: productName.trim(),
              name: productName.trim(),
              manufacturer: item.mfac || "",
              mfac: item.mfac || "",
              hsn: item.hsn || "",
              hsnCode: item.hsn || "",
              rack: item.rack || "",
              rackNo: item.rack || "",
              pack: item.pack || "",
              packSize: item.pack || "",
              cgstPercent: item.cgstPercent || "6",
              sgstPercent: item.sgstPercent || "6",
            });
          }
        },
        [checkProductExists, onAddNewProduct, index, item],
      );

      const handleSchChange = useCallback(
        (value) => {
          if (isFreeItem) return;
          onChange(index, "sch", value);
        },
        [index, onChange, isFreeItem],
      );

      const handleSchBlur = useCallback(
        (value) => {
          if (isFreeItem) return;
          if (schBlurTimeoutRef.current)
            clearTimeout(schBlurTimeoutRef.current);
          schBlurTimeoutRef.current = setTimeout(() => {
            const trimmedValue = value?.toString().trim();
            if (trimmedValue && trimmedValue !== "" && trimmedValue !== "0") {
              onCreateFreeRow?.(index);
            } else {
              onRemoveFreeRow?.(index);
            }
          }, 150);
        },
        [index, isFreeItem, onCreateFreeRow, onRemoveFreeRow],
      );

      useEffect(() => {
        return () => {
          if (schBlurTimeoutRef.current)
            clearTimeout(schBlurTimeoutRef.current);
        };
      }, []);

      const getCurrentFieldIndex = useCallback(() => {
        const activeElement = document.activeElement;
        for (let i = 0; i < FIELD_ORDER.length; i++) {
          if (fieldRefs.current[FIELD_ORDER[i]] === activeElement) return i;
        }
        return -1;
      }, []);

      const focusNextFieldInRow = useCallback(() => {
        const currentIndex = getCurrentFieldIndex();
        if (currentIndex === -1) return false;
        const nextIndex = currentIndex + 1;
        if (nextIndex >= FIELD_ORDER.length) return false;
        const nextField = fieldRefs.current[FIELD_ORDER[nextIndex]];
        if (nextField) {
          nextField.focus();
          nextField.select?.();
          return true;
        }
        return false;
      }, [getCurrentFieldIndex]);

      const focusPrevFieldInRow = useCallback(() => {
        const currentIndex = getCurrentFieldIndex();
        if (currentIndex === -1) return false;
        const prevIndex = currentIndex - 1;
        if (prevIndex < 0) return false;
        const prevField = fieldRefs.current[FIELD_ORDER[prevIndex]];
        if (prevField) {
          prevField.focus();
          prevField.select?.();
          return true;
        }
        return false;
      }, [getCurrentFieldIndex]);

      const handleKeyDown = useCallback(
        (e, fieldKey) => {
          if (e.key === "Escape") {
            setShowProductDropdown(false);
            return;
          }

          if (showProductDropdown && filteredProducts.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev < filteredProducts.length - 1 ? prev + 1 : 0,
              );
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredProducts.length - 1,
              );
              return;
            }
            if (e.key === "Enter" && fieldKey === "name") {
              e.preventDefault();
              if (filteredProducts[highlightedIndex]) {
                onProductSelect(index, filteredProducts[highlightedIndex]);
                setShowProductDropdown(false);
                setTimeout(() => {
                  const nextField = fieldRefs.current["batch"];
                  if (nextField) {
                    nextField.focus();
                    nextField.select?.();
                  }
                }, 50);
              }
              return;
            }
          }

          if (e.key === "Enter") {
            e.preventDefault();
            if (fieldKey === "name" && item.name && !showProductDropdown) {
              setShowProductDropdown(false);
              handleProductNameBlur(item.name);
            }
            const movedWithinRow = focusNextFieldInRow();
            if (!movedWithinRow) {
              if (isLast) {
                onCreateNewRow?.();
              } else {
                onNavigateToNextRow?.(index);
              }
            }
            return;
          }

          if (e.key === "Tab") {
            if (fieldKey === "name") {
              setShowProductDropdown(false);
              if (item.name && item.name.trim().length >= 2) {
                const exists = checkProductExists(item.name);
                if (!exists && onAddNewProduct) {
                  onAddNewProduct({
                    rowIndex: index,
                    productName: item.name.trim(),
                    name: item.name.trim(),
                    manufacturer: item.mfac || "",
                    mfac: item.mfac || "",
                    hsn: item.hsn || "",
                    hsnCode: item.hsn || "",
                    rack: item.rack || "",
                    rackNo: item.rack || "",
                    pack: item.pack || "",
                    packSize: item.pack || "",
                    cgstPercent: item.cgstPercent || "6",
                    sgstPercent: item.sgstPercent || "6",
                  });
                }
              }
            }

            if (e.shiftKey) {
              e.preventDefault();
              const movedWithinRow = focusPrevFieldInRow();
              if (!movedWithinRow && index > 0) {
                onNavigateToPrevRow?.(index);
              }
            } else {
              e.preventDefault();
              const movedWithinRow = focusNextFieldInRow();
              if (!movedWithinRow) {
                if (isLast) {
                  onCreateNewRow?.();
                } else {
                  onNavigateToNextRow?.(index);
                }
              }
            }
            return;
          }

          if (e.ctrlKey && e.key === "Backspace" && onRemoveRow) {
            e.preventDefault();
            if (!isFreeItem) onRemoveRow(index);
            return;
          }

          if (e.key === "ArrowUp" && e.altKey) {
            e.preventDefault();
            if (index > 0) onNavigateToPrevRow?.(index, fieldKey);
            return;
          }

          if (e.key === "ArrowDown" && e.altKey) {
            e.preventDefault();
            if (!isLast) onNavigateToNextRow?.(index, fieldKey);
            return;
          }
        },
        [
          showProductDropdown,
          filteredProducts,
          highlightedIndex,
          index,
          isLast,
          focusNextFieldInRow,
          focusPrevFieldInRow,
          onNavigateToNextRow,
          onNavigateToPrevRow,
          onCreateNewRow,
          onRemoveRow,
          onProductSelect,
          handleProductNameBlur,
          item.name,
          isFreeItem,
          checkProductExists,
          onAddNewProduct,
          item,
        ],
      );

      useEffect(() => {
        setHighlightedIndex(0);
      }, [productSearch]);

      const formatNumber = (value, decimals = 2) =>
        Number(value || 0).toFixed(decimals);

      const handleChange = useCallback(
        (key, value) => {
          if (isFreeItem) return;
          onChange(index, key, value);
        },
        [index, onChange, isFreeItem],
      );

      const handleDropdownProductSelect = useCallback(
        (product) => {
          onProductSelect(index, product);
          setShowProductDropdown(false);
          setTimeout(() => {
            const nextField = fieldRefs.current["batch"];
            if (nextField) {
              nextField.focus();
              nextField.select?.();
            }
          }, 50);
        },
        [index, onProductSelect],
      );

      const handleDropdownAddNew = useCallback(() => {
        setShowProductDropdown(false);
        const trimmedSearch = productSearch.trim();
        if (!trimmedSearch || trimmedSearch.length < 2) return;
        if (onAddNewProduct) {
          setTimeout(() => {
            onAddNewProduct({
              rowIndex: index,
              productName: trimmedSearch,
              name: trimmedSearch,
              manufacturer: item.mfac || "",
              mfac: item.mfac || "",
              hsn: item.hsn || "",
              hsnCode: item.hsn || "",
              rack: item.rack || "",
              rackNo: item.rack || "",
              pack: item.pack || "",
              packSize: item.pack || "",
              cgstPercent: item.cgstPercent || "6",
              sgstPercent: item.sgstPercent || "6",
            });
          }, 50);
        }
      }, [productSearch, onAddNewProduct, index, item]);

      const handleCloseDropdown = useCallback(() => {
        setShowProductDropdown(false);
      }, []);

      // ─────────────────────────────────────────────────────────────────────
      // EXPIRY AUTO-FORMAT  ── NEW
      // Formats raw digit input into MM/YY automatically:
      //   "1"   → "1"       (waiting for 2nd month digit)
      //   "11"  → "11/"     (month complete, slash auto-inserted)
      //   "112" → "11/2"    (year starts)
      //   "1127"→ "11/27"   (done)
      // Clamps month to 01–12.
      // Smart backspace: if cursor sits right after the slash, removes it too.
      // ─────────────────────────────────────────────────────────────────────
      const handleExpInput = useCallback(
        (e) => {
          if (isFreeItem) return;

          const input = e.target;
          const raw = input.value;

          // Allow full clear
          if (raw === "") {
            handleChange("exp", "");
            return;
          }

          // Strip everything that is not a digit
          const digits = raw.replace(/\D/g, "");

          let formatted = "";

          if (digits.length === 0) {
            formatted = "";
          } else if (digits.length <= 2) {
            // Still typing the month — auto-append slash once 2 digits entered
            if (digits.length === 2) {
              const month = parseInt(digits, 10);
              const clampedMonth =
                month < 1 ? "01" : month > 12 ? "12" : digits;
              formatted = clampedMonth + "/"; // slash appended → cursor jumps past it
            } else {
              formatted = digits; // single digit, keep as-is
            }
          } else {
            // 3+ digits → split into month (2) + year (up to 2)
            const monthDigits = digits.slice(0, 2);
            const yearDigits = digits.slice(2, 4); // max 2 year digits (YY)
            const month = parseInt(monthDigits, 10);
            const clampedMonth =
              month < 1 ? "01" : month > 12 ? "12" : monthDigits;
            formatted = `${clampedMonth}/${yearDigits}`;
          }

          handleChange("exp", formatted);

          // Keep cursor at the end after React re-renders
          requestAnimationFrame(() => {
            if (input) {
              input.setSelectionRange(formatted.length, formatted.length);
            }
          });
        },
        [isFreeItem, handleChange],
      );

      const handleExpKeyDown = useCallback(
        (e) => {
          // Smart backspace: when cursor is right after "MM/", delete the slash too
          if (e.key === "Backspace") {
            const input = e.target;
            const val = input.value;
            const pos = input.selectionStart;

            // pos === 3 means cursor is right after "MM/" (e.g. "11/|")
            if (pos === 3 && val[2] === "/") {
              e.preventDefault();
              const newVal = val.slice(0, 2); // keep "MM" only
              handleChange("exp", newVal);
              requestAnimationFrame(() => {
                input.setSelectionRange(2, 2);
              });
              return;
            }
          }

          // All other keys fall through to the shared row keydown handler
          handleKeyDown(e, "exp");
        },
        [handleKeyDown, handleChange],
      );

      const inputBase = `
        w-full h-full bg-transparent border-0 outline-none
        text-slate-800 text-[9px] 2xl:text-[10px]
        focus:bg-indigo-50 focus:ring-1 focus:ring-inset focus:ring-indigo-400
        transition-all duration-100
        placeholder:text-slate-300
        truncate
        ${isFreeItem ? "cursor-not-allowed opacity-75" : ""}
      `;

      const cellBase =
        "border-b border-r border-slate-200 last:border-r-0 p-0 overflow-hidden";
      const hasData = item.name || item.qty || item.price;
      const isNewProduct =
        item.name &&
        item.name.trim().length >= 2 &&
        !checkProductExists(item.name);
      const productExists = item.name && checkProductExists(item.name);

      const rowClassName = `
        group transition-all duration-100
        ${
          isFreeItem
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500"
            : isEven
              ? "bg-white"
              : "bg-slate-50/50"
        }
        ${!isFreeItem && "hover:bg-indigo-50/40 focus-within:bg-indigo-50/60"}
        ${hasData && !isFreeItem ? "border-l-2 border-l-indigo-400" : !isFreeItem ? "border-l-2 border-l-transparent" : ""}
        ${isNewProduct && !isFreeItem ? "bg-yellow-50/30" : ""}
      `;

      return (
        <tr
          ref={rowRef}
          style={{ height: `${rowHeight}px` }}
          className={rowClassName}
        >
          {/* 1. ROW NUMBER */}
          <td
            className={`${cellBase} text-center ${isFreeItem ? "bg-green-100" : "bg-slate-50"}`}
          >
            <div className="flex items-center justify-center h-full relative">
              {isFreeItem ? (
                <div className="flex items-center gap-0.5">
                  <Gift size={10} className="text-green-600" />
                  <span className="text-[7px] font-bold text-green-700">
                    FREE
                  </span>
                </div>
              ) : (
                <span
                  className={`
                    inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold
                    ${hasData ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500"}
                  `}
                >
                  {rowNumber}
                </span>
              )}
              {isNewProduct && !isFreeItem && (
                <div
                  className="absolute -top-0.5 -right-0.5"
                  title="New product - will be added to master"
                >
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                </div>
              )}
              {productExists && item.name && !isFreeItem && (
                <div
                  className="absolute -bottom-0.5 -right-0.5"
                  title="Product found in master"
                >
                  <CheckCircle2 size={8} className="text-green-500" />
                </div>
              )}
            </div>
          </td>

          {/* 2. ITEM DESCRIPTION */}
          <td
            className={`${cellBase} relative ${
              isFreeItem
                ? "bg-green-50"
                : isNewProduct
                  ? "bg-yellow-50/50"
                  : productExists
                    ? "bg-green-50/30"
                    : "bg-blue-50/30"
            }`}
          >
            <div className="relative h-full">
              <input
                ref={(el) => registerFieldRef("name", el)}
                type="text"
                value={showProductDropdown ? productSearch : item.name || ""}
                onChange={(e) => {
                  if (isFreeItem) return;
                  const value = e.target.value;
                  setProductSearch(value);
                  setShowProductDropdown(value.length > 0);
                  handleChange("name", value);
                }}
                onFocus={() => {
                  if (isFreeItem) return;
                  setProductSearch(item.name || "");
                  if (
                    productMaster.length > 0 &&
                    (item.name || "").length > 0
                  ) {
                    setShowProductDropdown(true);
                  }
                }}
                onBlur={() => {
                  // intentionally minimal — Tab & keyboard handlers manage
                  // modal triggering; blur alone does nothing to avoid race conditions
                }}
                onKeyDown={(e) => handleKeyDown(e, "name")}
                readOnly={isFreeItem}
                tabIndex={isFreeItem ? -1 : 0}
                className={`${inputBase} px-1.5 py-1 font-medium text-left ${
                  isFreeItem
                    ? "bg-green-50 text-green-800"
                    : isNewProduct
                      ? "bg-yellow-50 text-yellow-900 font-semibold"
                      : productExists
                        ? "text-green-900"
                        : ""
                }`}
                placeholder={isFreeItem ? "" : "Search item..."}
              />

              {/* Indicators */}
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                {isFreeItem && (
                  <span className="text-[7px] font-bold text-green-600 bg-green-100 px-1 rounded">
                    FREE ITEM
                  </span>
                )}
                {!isFreeItem && isNewProduct && (
                  <div
                    className="flex items-center"
                    title="New product - press Enter to add"
                  >
                    <AlertCircle size={10} className="text-yellow-600" />
                  </div>
                )}
                {!isFreeItem && productExists && (
                  <div className="flex items-center" title="Product found">
                    <CheckCircle2 size={10} className="text-green-600" />
                  </div>
                )}
                {!isFreeItem && item.name && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      handleChange("name", "");
                      setProductSearch("");
                      setShowProductDropdown(false);
                    }}
                    className="p-0.5 hover:bg-slate-200 rounded-full"
                    title="Clear"
                  >
                    <X size={8} className="text-slate-400" />
                  </button>
                )}
              </div>

              {/* Product dropdown via Portal */}
              <ProductDropdown
                isOpen={showProductDropdown && !isFreeItem}
                anchorRef={nameInputRef}
                products={filteredProducts}
                highlightedIndex={highlightedIndex}
                onSelect={handleDropdownProductSelect}
                onAddNew={handleDropdownAddNew}
                searchTerm={productSearch}
                onClose={handleCloseDropdown}
              />
            </div>
          </td>

          {/* 3. MFAC */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-violet-50/20"}`}
          >
            <input
              ref={(el) => registerFieldRef("mfac", el)}
              type="text"
              value={item.mfac || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("mfac", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "mfac")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-left`}
              placeholder={isFreeItem ? "" : "Mfac"}
            />
          </td>

          {/* 4. BATCH */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-violet-50/20"}`}
          >
            <input
              ref={(el) => registerFieldRef("batch", el)}
              type="text"
              value={item.batch || ""}
              onChange={(e) =>
                !isFreeItem &&
                handleChange("batch", e.target.value.toUpperCase())
              }
              onKeyDown={(e) => handleKeyDown(e, "batch")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center font-mono text-[8px]`}
              placeholder={isFreeItem ? "" : "Batch"}
            />
          </td>

          {/* 5. HSN */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-cyan-50/30"}`}
          >
            <input
              ref={(el) => registerFieldRef("hsn", el)}
              type="text"
              value={item.hsn || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("hsn", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "hsn")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center font-mono text-[8px]`}
              placeholder={isFreeItem ? "" : "HSN"}
            />
          </td>

          {/* 6. EXPIRY ── updated with auto-format handlers */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-cyan-50/30"}`}
          >
            <input
              ref={(el) => registerFieldRef("exp", el)}
              type="text"
              value={item.exp || ""}
              onChange={handleExpInput}       
              onKeyDown={handleExpKeyDown}    
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              maxLength={5}                   
              className={`${inputBase} px-1 py-1 text-center font-mono text-[8px]`}
              placeholder={isFreeItem ? "" : "MM/YY"}
            />
          </td>

          {/* 7. PACK */}
          <td className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : ""}`}>
            <input
              ref={(el) => registerFieldRef("pack", el)}
              type="text"
              value={item.pack || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("pack", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "pack")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center`}
              placeholder={isFreeItem ? "" : "Pk"}
            />
          </td>

          {/* 8. P.QTY */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-slate-100/50"}`}
          >
            <input
              ref={(el) => registerFieldRef("pQty", el)}
              type="number"
              value={item.pQty || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("pQty", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "pQty")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center text-slate-500`}
              placeholder="0"
              min="0"
            />
          </td>

          {/* 9. QTY */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-100" : "bg-amber-50/60"}`}
          >
            <input
              ref={(el) => registerFieldRef("qty", el)}
              type="number"
              value={item.qty || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("qty", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "qty")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center font-bold ${
                isFreeItem ? "text-green-700" : "text-amber-700"
              }`}
              placeholder="0"
              min="0"
            />
          </td>

          {/* 10. RATE */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-blue-50/50"}`}
          >
            <input
              ref={(el) => registerFieldRef("price", el)}
              type="number"
              value={item.price || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("price", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "price")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-right font-semibold ${
                isFreeItem ? "text-green-600" : "text-blue-700"
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </td>

          {/* 11. DIS% */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-rose-50/40"}`}
          >
            <input
              ref={(el) => registerFieldRef("discountPercent", el)}
              type="number"
              value={item.discountPercent || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("discountPercent", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "discountPercent")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center ${
                isFreeItem ? "text-green-600" : "text-rose-600"
              } font-semibold`}
              placeholder="0"
              min="0"
              max="100"
            />
          </td>

          {/* 12. NET RATE */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-teal-50/50"}`}
          >
            <input
              ref={(el) => registerFieldRef("netRate", el)}
              type="number"
              value={isFreeItem ? "0" : item.netRate || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("netRate", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "netRate")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-right font-semibold ${
                isFreeItem ? "text-green-600" : "text-teal-700"
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </td>

          {/* 13. AMOUNT */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-100" : "bg-emerald-50/60"}`}
          >
            <div className="px-1 py-1 text-right h-full flex items-center justify-end">
              {isFreeItem ? (
                <span className="text-[9px] font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded">
                  FREE
                </span>
              ) : (
                <span
                  className={`font-bold text-[10px] ${
                    Number(item.amount) > 0
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                >
                  {Number(item.amount) > 0
                    ? formatNumber(item.amount)
                    : "0.00"}
                </span>
              )}
            </div>
          </td>

          {/* 14. SGST% */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-orange-50/40"}`}
          >
            <input
              ref={(el) => registerFieldRef("sgstPercent", el)}
              type="number"
              value={item.sgstPercent || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("sgstPercent", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "sgstPercent")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center ${
                isFreeItem ? "text-green-600" : "text-orange-600"
              } font-medium`}
              placeholder="0"
              min="0"
              max="100"
            />
          </td>

          {/* 15. MRP */}
          <td className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : ""}`}>
            <input
              ref={(el) => registerFieldRef("mrp", el)}
              type="number"
              value={item.mrp || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("mrp", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "mrp")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-right text-slate-600`}
              placeholder="0"
              min="0"
            />
          </td>

          {/* 16. RACK */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-slate-50"}`}
          >
            <input
              ref={(el) => registerFieldRef("rack", el)}
              type="text"
              value={item.rack || ""}
              onChange={(e) =>
                !isFreeItem &&
                handleChange("rack", e.target.value.toUpperCase())
              }
              onKeyDown={(e) => handleKeyDown(e, "rack")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center font-mono`}
              placeholder={isFreeItem ? "" : "Rk"}
            />
          </td>

          {/* 17. S-RATE */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-50/50" : "bg-purple-50/50"}`}
          >
            <input
              ref={(el) => registerFieldRef("sRate", el)}
              type="number"
              value={item.sRate || ""}
              onChange={(e) =>
                !isFreeItem && handleChange("sRate", e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(e, "sRate")}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-right font-bold ${
                isFreeItem ? "text-green-600" : "text-purple-700"
              }`}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </td>

          {/* 18. FREE/SCH */}
          <td
            className={`${cellBase} ${isFreeItem ? "bg-green-100" : "bg-green-50/50"}`}
          >
            <input
              ref={(el) => registerFieldRef("sch", el)}
              type="text"
              value={item.sch || ""}
              onChange={(e) => {
                if (!isFreeItem) handleSchChange(e.target.value);
              }}
              onBlur={(e) => {
                if (!isFreeItem) handleSchBlur(e.target.value);
              }}
              onKeyDown={(e) => handleKeyDown(e, "sch")}
              disabled={isFreeItem}
              readOnly={isFreeItem}
              tabIndex={isFreeItem ? -1 : 0}
              className={`${inputBase} px-1 py-1 text-center font-bold ${
                isFreeItem
                  ? "text-green-500 cursor-not-allowed bg-green-100"
                  : item.sch
                    ? "text-green-700 bg-green-100"
                    : "text-green-600"
              }`}
              placeholder={isFreeItem ? "-" : "F"}
              title={
                isFreeItem
                  ? "This is a free item row"
                  : "Enter F or quantity for free goods"
              }
            />
          </td>
        </tr>
      );
    },
  ),
);

PurchaseRowFixed.displayName = "PurchaseRowFixed";
export default PurchaseRowFixed;