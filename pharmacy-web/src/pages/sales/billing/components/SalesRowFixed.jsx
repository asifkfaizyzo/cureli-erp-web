// pharmacy-web/src/pages/sales/billing/components/SalesRowFixed.jsx (do not remove this comment)
// pharmacy-web/src/pages/sales/billing/components/SalesRowFixed.jsx
// Changes from previous version:
// 1. Accept `marketplaceLocked` prop
// 2. Lock qty input when marketplaceLocked is true
// 3. Visual indicator on the qty cell when locked

import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { createPortal } from 'react-dom';
import { Package, AlertTriangle, Info, Lock } from 'lucide-react';

const FIELD_ORDER = ['name', 'batch', 'qty', 'rate', 'discountPercent'];

const SalesRowFixed = memo(
  forwardRef(
    (
      {
        index,
        item,
        onChange,
        onProductSelect,
        onBatchSelect,
        productMaster = [],
        rowNumber = 1,
        isEven = false,
        isLast = false,
        onRemoveRow,
        onNavigateToNextRow,
        onNavigateToPrevRow,
        onCreateNewRow,
        rowHeight = 36,
        getAvailableBatches,
        allRows = [],
        marketplaceLocked = false,   // ← NEW
      },
      ref,
    ) => {
      const [showProductDropdown, setShowProductDropdown] = useState(false);
      const [showBatchDropdown, setShowBatchDropdown]     = useState(false);
      const [productSearch, setProductSearch]             = useState('');
      const [highlightedIndex, setHighlightedIndex]       = useState(0);
      const [batches, setBatches]                         = useState(item.availableBatches || []);
      const [batchError, setBatchError]                   = useState(null);
      const [stockError, setStockError]                   = useState(null);
      const [dropdownPosition, setDropdownPosition]       = useState({ top: 0, left: 0 });

      const dropdownRef     = useRef(null);
      const batchDropdownRef = useRef(null);
      const rowRef          = useRef(null);
      const fieldRefs       = useRef({});
      const loadedMedicineIdRef = useRef(null);

      // In marketplace mode the FIELD_ORDER skips qty (locked) and name (locked)
      const activeFieldOrder = marketplaceLocked
        ? ['batch']          // only batch is interactive
        : FIELD_ORDER;

      const filteredProducts = productMaster
        .filter((p) => {
          const searchLower = productSearch.toLowerCase();
          return (
            p.name?.toLowerCase().includes(searchLower) ||
            p.generic_name?.toLowerCase().includes(searchLower) ||
            p.manufacturer?.toLowerCase().includes(searchLower)
          );
        })
        .slice(0, 10);

      useImperativeHandle(
        ref,
        () => ({
          focusFirstField: () => {
            const key = activeFieldOrder[0];
            const f   = fieldRefs.current[key];
            if (f) { f.focus(); f.select?.(); }
          },
          focusLastField: () => {
            const key = activeFieldOrder[activeFieldOrder.length - 1];
            const f   = fieldRefs.current[key];
            if (f) { f.focus(); f.select?.(); }
          },
          focusField: (fieldKey) => {
            const f = fieldRefs.current[fieldKey];
            if (f) { f.focus(); f.select?.(); }
          },
        }),
        [activeFieldOrder],
      );

      const registerFieldRef = useCallback((fieldKey, inputRef) => {
        if (inputRef) fieldRefs.current[fieldKey] = inputRef;
      }, []);

      const calculateUsedStock = useCallback(
        (inventoryId, excludeIndex = null) => {
          return allRows.reduce((total, row, idx) => {
            if (idx !== excludeIndex && row.inventory_id === inventoryId)
              return total + (parseFloat(row.qty) || 0);
            return total;
          }, 0);
        },
        [allRows],
      );

      const checkDuplicate = useCallback(
        (medicineId, inventoryId) => {
          return allRows.findIndex(
            (row, idx) =>
              idx !== index &&
              row.medicine_id === medicineId &&
              row.inventory_id === inventoryId,
          );
        },
        [allRows, index],
      );

      // Load batches when medicine_id changes
      useEffect(() => {
        if (
          item.medicine_id &&
          getAvailableBatches &&
          item.medicine_id !== loadedMedicineIdRef.current
        ) {
          loadedMedicineIdRef.current = item.medicine_id;

          getAvailableBatches(item.medicine_id).then((availableBatches) => {
            setBatches(availableBatches);
            // In marketplace mode only auto-open if no batch selected yet
            if (availableBatches.length > 1 && !item.inventory_id) {
              setShowBatchDropdown(true);
              setHighlightedIndex(0);
              setTimeout(() => fieldRefs.current['batch']?.focus(), 50);
            }
          });
        }

        if (!item.medicine_id) {
          loadedMedicineIdRef.current = null;
          setBatches([]);
        }
      }, [item.medicine_id]); // eslint-disable-line

      // Real-time stock validation
      useEffect(() => {
        if (item.inventory_id && item.qty) {
          const usedInOtherRows = calculateUsedStock(item.inventory_id, index);
          const totalStock      = parseFloat(item.stock) || 0;
          const requestedQty    = parseFloat(item.qty) || 0;
          const remainingStock  = totalStock - usedInOtherRows;

          if (requestedQty > remainingStock) {
            setStockError({
              message: `Only ${remainingStock} left`,
              details: usedInOtherRows > 0 ? `${usedInOtherRows} used in other rows` : null,
            });
          } else {
            setStockError(null);
          }
        } else {
          setStockError(null);
        }
      }, [item.qty, item.stock, item.inventory_id, calculateUsedStock, index, allRows]);

      // Dropdown position
      useEffect(() => {
        if (!showBatchDropdown && !showProductDropdown) return;

        const updatePosition = () => {
          const targetField = showBatchDropdown ? 'batch' : 'name';
          const rect = fieldRefs.current[targetField]?.getBoundingClientRect();
          if (rect) {
            setDropdownPosition({
              top:   rect.bottom + 4,
              left:  rect.left,
              width: targetField === 'batch' ? 320 : 400,
            });
          }
        };

        updatePosition();
        const scrollContainer = document.querySelector('.overflow-y-auto');
        if (scrollContainer) {
          scrollContainer.addEventListener('scroll', updatePosition);
          return () => scrollContainer.removeEventListener('scroll', updatePosition);
        }
      }, [showBatchDropdown, showProductDropdown]);

      const handleProductSelection = useCallback(
        async (product) => {
          if (marketplaceLocked) return; // hard guard
          try {
            const availableBatches = await getAvailableBatches(product.medicine_id);
            if (availableBatches.length === 0) {
              setBatchError('No stock available for this product');
              return;
            }
            setBatches(availableBatches);
            loadedMedicineIdRef.current = product.medicine_id;
            setBatchError(null);

            if (availableBatches.length === 1) {
              const batch = availableBatches[0];
              const dupIdx = checkDuplicate(product.medicine_id, batch.inventory_id);
              if (dupIdx !== -1) {
                setBatchError(`Already in Row ${dupIdx + 1}. Same batch cannot be added twice.`);
                onChange(index, 'medicine_id', null);
                onChange(index, 'name', '');
                return;
              }
              onProductSelect(index, product, batch);
              setShowBatchDropdown(false);
              setTimeout(() => fieldRefs.current['qty']?.focus(), 50);
            } else {
              onProductSelect(index, product, null);
              setShowBatchDropdown(true);
              setHighlightedIndex(0);
              setTimeout(() => fieldRefs.current['batch']?.focus(), 50);
            }

            setShowProductDropdown(false);
            setProductSearch('');
          } catch (error) {
            console.error('Error selecting product:', error);
            setBatchError('Failed to load product batches');
          }
        },
        [getAvailableBatches, checkDuplicate, index, onChange, onProductSelect, marketplaceLocked],
      );

      const handleBatchSelection = useCallback(
        (batch) => {
          const dupIdx = checkDuplicate(item.medicine_id, batch.inventory_id);
          if (dupIdx !== -1) {
            setBatchError(`Batch already in Row ${dupIdx + 1}`);
            return;
          }
          setBatchError(null);
          onBatchSelect(index, batch);
          setShowBatchDropdown(false);
          // In marketplace mode, after batch selected there's nothing else to tab to
          if (!marketplaceLocked) {
            setTimeout(() => fieldRefs.current['qty']?.focus(), 50);
          }
        },
        [checkDuplicate, item.medicine_id, index, onBatchSelect, marketplaceLocked],
      );

      const getCurrentFieldIndex = useCallback(() => {
        const activeElement = document.activeElement;
        for (let i = 0; i < activeFieldOrder.length; i++) {
          if (fieldRefs.current[activeFieldOrder[i]] === activeElement) return i;
        }
        return -1;
      }, [activeFieldOrder]);

      const focusNextFieldInRow = useCallback(() => {
        const currentIndex = getCurrentFieldIndex();
        if (currentIndex === -1) return false;
        const nextIndex = currentIndex + 1;
        if (nextIndex >= activeFieldOrder.length) return false;
        const nextField = fieldRefs.current[activeFieldOrder[nextIndex]];
        if (nextField) { nextField.focus(); nextField.select?.(); return true; }
        return false;
      }, [getCurrentFieldIndex, activeFieldOrder]);

      const handleKeyDown = useCallback(
        (e, fieldKey) => {
          if (e.key === 'Escape') {
            setShowProductDropdown(false);
            setShowBatchDropdown(false);
            return;
          }

          if (showProductDropdown && filteredProducts.length > 0) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex((p) => (p < filteredProducts.length - 1 ? p + 1 : 0)); return; }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightedIndex((p) => (p > 0 ? p - 1 : filteredProducts.length - 1)); return; }
            if (e.key === 'Enter' && fieldKey === 'name') {
              e.preventDefault();
              if (filteredProducts[highlightedIndex]) handleProductSelection(filteredProducts[highlightedIndex]);
              return;
            }
          }

          if (showBatchDropdown && batches.length > 0 && fieldKey === 'batch') {
            if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex((p) => (p < batches.length - 1 ? p + 1 : 0)); return; }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightedIndex((p) => (p > 0 ? p - 1 : batches.length - 1)); return; }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (batches[highlightedIndex]) handleBatchSelection(batches[highlightedIndex]);
              return;
            }
          }

          if (e.key === 'Enter') {
            e.preventDefault();
            const movedWithinRow = focusNextFieldInRow();
            if (!movedWithinRow) {
              if (isLast) onCreateNewRow?.();
              else onNavigateToNextRow?.(index);
            }
            return;
          }

          if (e.key === 'Tab') {
            if (e.shiftKey) { e.preventDefault(); if (index > 0) onNavigateToPrevRow?.(index); }
            return;
          }

          // Ctrl+Backspace to remove row — disabled in marketplace mode
          if (!marketplaceLocked && e.ctrlKey && e.key === 'Backspace' && onRemoveRow) {
            e.preventDefault();
            onRemoveRow(index);
          }
        },
        [
          showProductDropdown, showBatchDropdown, filteredProducts, batches,
          highlightedIndex, index, isLast, focusNextFieldInRow, onNavigateToNextRow,
          onNavigateToPrevRow, onCreateNewRow, onRemoveRow, handleProductSelection,
          handleBatchSelection, marketplaceLocked,
        ],
      );

      useEffect(() => {
        const handleClickOutside = (e) => {
          if (dropdownRef.current && !dropdownRef.current.contains(e.target))
            setShowProductDropdown(false);
          if (batchDropdownRef.current && !batchDropdownRef.current.contains(e.target))
            setShowBatchDropdown(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

      const handleChange = useCallback(
        (key, value) => {
          // In marketplace mode, qty is locked to ordered quantity
          if (marketplaceLocked && key === 'qty') return;
          onChange(index, key, value);
        },
        [index, onChange, marketplaceLocked],
      );

      const inputBase = `w-full h-full bg-transparent border-0 outline-none text-slate-800 text-[9px] 2xl:text-[10px] focus:bg-indigo-50 focus:ring-1 focus:ring-inset focus:ring-indigo-400 transition-all duration-100 placeholder:text-slate-300 truncate`;
      const cellBase  = 'border-b border-r border-slate-200 last:border-r-0 p-0 overflow-hidden';
      const hasData   = item.name || item.qty;
      const hasError  = batchError || stockError;

      // Whether this row needs a batch selected (marketplace mode)
      const needsBatchSelection = marketplaceLocked && item.medicine_id && !item.inventory_id;

      return (
        <tr
          ref={rowRef}
          style={{ height: `${rowHeight}px` }}
          className={`
            group transition-all duration-100
            ${isEven ? 'bg-white' : 'bg-slate-50/50'}
            hover:bg-indigo-50/40 focus-within:bg-indigo-50/60
            ${hasData ? 'border-l-2 border-l-indigo-400' : 'border-l-2 border-l-transparent'}
            ${stockError ? 'bg-red-50/30' : ''}
            ${batchError ? 'bg-amber-50/30' : ''}
            ${needsBatchSelection ? 'bg-amber-50/40 border-l-2 border-l-amber-400' : ''}
          `}
        >
          {/* SI NO */}
          <td className={`${cellBase} text-center bg-slate-50`}>
            <div className="flex items-center justify-center h-full">
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-bold
                  ${hasError
                    ? 'bg-red-500 text-white'
                    : needsBatchSelection
                      ? 'bg-amber-500 text-white'
                      : hasData
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
              >
                {rowNumber}
              </span>
            </div>
          </td>

          {/* ITEM NAME */}
          <td
            className={`${cellBase} relative ${marketplaceLocked ? 'bg-slate-50' : 'bg-blue-50/30'}`}
            ref={marketplaceLocked ? undefined : dropdownRef}
            style={{ overflow: 'visible' }}
          >
            <div className="relative w-full h-full flex flex-col">
              <input
                ref={(el) => registerFieldRef('name', el)}
                type="text"
                value={showProductDropdown ? productSearch : item.name || ''}
                onChange={(e) => {
                  if (marketplaceLocked) return;
                  const value = e.target.value;
                  setProductSearch(value);
                  setShowProductDropdown(value.length > 0);
                  handleChange('name', value);
                  setBatchError(null);
                  setStockError(null);
                  if (!value) {
                    handleChange('medicine_id', null);
                    handleChange('inventory_id', null);
                    handleChange('batch', '');
                    handleChange('exp', '');
                    handleChange('stock', '');
                    setBatches([]);
                    loadedMedicineIdRef.current = null;
                  }
                }}
                onFocus={() => {
                  if (marketplaceLocked) return;
                  setProductSearch(item.name || '');
                  if (productMaster.length > 0) setShowProductDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                onKeyDown={(e) => handleKeyDown(e, 'name')}
                readOnly={marketplaceLocked}
                className={`${inputBase} px-1.5 py-1 font-medium text-left flex-1
                  ${batchError ? 'text-red-600 bg-red-50' : ''}
                  ${marketplaceLocked ? 'text-slate-700 cursor-default' : ''}
                `}
                placeholder={marketplaceLocked ? '' : 'Search product...'}
              />

              {batchError && (
                <div
                  className="absolute left-0 right-0 bg-red-600 text-white text-[8px] font-semibold px-1.5 py-0.5 flex items-center gap-1 z-50 shadow-lg rounded-b"
                  style={{ top: '100%', whiteSpace: 'nowrap' }}
                >
                  <AlertTriangle size={8} className="shrink-0" />
                  <span className="truncate">{batchError}</span>
                </div>
              )}
            </div>

            {/* Product dropdown — only shown when not marketplace locked */}
            {!marketplaceLocked && showProductDropdown && filteredProducts.length > 0 &&
              createPortal(
                <div
                  className="fixed bg-white border border-slate-300 rounded-lg shadow-2xl max-h-64 overflow-auto z-[9999]"
                  style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: '400px' }}
                >
                  <div className="sticky top-0 bg-slate-50 px-3 py-1.5 border-b text-[9px] text-slate-600 font-medium">
                    {filteredProducts.length} products found
                  </div>
                  {filteredProducts.map((product, idx) => (
                    <div
                      key={product.medicine_id}
                      onMouseDown={(e) => { e.preventDefault(); handleProductSelection(product); }}
                      className={`px-3 py-2.5 cursor-pointer text-[9px] border-b border-slate-100 last:border-b-0 transition-all
                        ${idx === highlightedIndex ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}`}
                    >
                      <div className="font-semibold text-slate-800">{product.name}</div>
                      <div className="text-[8px] text-slate-400 flex gap-2 mt-0.5 items-center">
                        <span>{product.manufacturer || '-'}</span>
                        <span>•</span>
                        <span>HSN: {product.hsn_code || '-'}</span>
                        {product.total_available_stock !== undefined && (
                          <>
                            <span>•</span>
                            <span className={`font-medium ${
                              product.total_available_stock > 10  ? 'text-green-600' :
                              product.total_available_stock > 0   ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              Stock: {product.total_available_stock}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>,
                document.body,
              )
            }
          </td>

          {/* MANUFACTURER */}
          <td className={`${cellBase} bg-violet-50/20`}>
            <input className={`${inputBase} px-1 py-1 text-left`} value={item.manufacturer || ''} readOnly />
          </td>

          {/* BATCH */}
          <td
            className={`${cellBase} relative
              ${needsBatchSelection ? 'bg-amber-50 ring-1 ring-inset ring-amber-400' : 'bg-cyan-50/30'}
            `}
            ref={batchDropdownRef}
          >
            <div className="relative w-full h-full">
              <input
                ref={(el) => registerFieldRef('batch', el)}
                type="text"
                value={item.batch || ''}
                onFocus={() => {
                  if (item.medicine_id && batches.length > 0) {
                    setShowBatchDropdown(true);
                    setHighlightedIndex(0);
                  }
                }}
                onBlur={() => setTimeout(() => setShowBatchDropdown(false), 200)}
                onKeyDown={(e) => handleKeyDown(e, 'batch')}
                className={`${inputBase} px-1 py-1 text-center font-mono text-[8px] cursor-pointer
                  ${needsBatchSelection ? 'text-amber-700 placeholder:text-amber-400' : ''}
                `}
                placeholder={needsBatchSelection ? '← Select batch' : batches.length > 1 ? 'Select...' : ''}
                readOnly={true}
              />
              {(batches.length > 1 && !item.inventory_id) && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}
            </div>

            {/* Batch dropdown */}
            {showBatchDropdown && batches.length > 0 &&
              createPortal(
                <div
                  className="fixed bg-white border border-slate-300 rounded-lg shadow-2xl max-h-64 overflow-auto z-[9999]"
                  style={{ top: `${dropdownPosition.top}px`, left: `${dropdownPosition.left}px`, width: '320px' }}
                >
                  <div className="sticky top-0 bg-slate-50 px-3 py-1.5 border-b text-[9px] text-slate-600 font-medium flex items-center gap-2">
                    <Package size={10} />
                    <span>{batches.length} batch{batches.length > 1 ? 'es' : ''} available</span>
                    {batches.length > 1 && (
                      <span className="ml-auto text-amber-600 flex items-center gap-1">
                        <Info size={10} />
                        Select a batch
                      </span>
                    )}
                  </div>

                  {batches.map((batch, idx) => {
                    const usedInOtherRows = calculateUsedStock(batch.inventory_id, index);
                    const totalStock      = parseFloat(batch.available_stock) || 0;
                    const remainingStock  = totalStock - usedInOtherRows;
                    const isDuplicate     = checkDuplicate(item.medicine_id, batch.inventory_id) !== -1;
                    const isExpiringSoon  = batch.days_until_expiry && batch.days_until_expiry <= 30;
                    const isLowStock      = remainingStock <= 10;
                    const isOutOfStock    = remainingStock <= 0;

                    // In marketplace mode, also check if requested qty is available
                    const orderedQty       = marketplaceLocked ? (parseFloat(item._ordered_quantity) || 0) : 0;
                    const insufficientForOrder = marketplaceLocked && remainingStock < orderedQty;

                    return (
                      <div
                        key={batch.inventory_id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          if (!isDuplicate && !isOutOfStock) handleBatchSelection(batch);
                        }}
                        className={`px-3 py-2.5 cursor-pointer text-[9px] border-b border-slate-100 last:border-b-0 transition-all
                          ${idx === highlightedIndex ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}
                          ${isExpiringSoon ? 'bg-amber-50/50' : ''}
                          ${isDuplicate || isOutOfStock ? 'opacity-50 cursor-not-allowed bg-red-50/30' : ''}
                          ${insufficientForOrder && !isOutOfStock ? 'bg-amber-50/60' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold">{batch.batch_number}</span>
                            {isDuplicate && (
                              <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">DUPLICATE</span>
                            )}
                            {insufficientForOrder && !isOutOfStock && (
                              <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                Low for order
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
                              Stock: {totalStock}
                            </span>
                            {usedInOtherRows > 0 && (
                              <span className="text-[8px] text-gray-500">Available: {remainingStock}</span>
                            )}
                          </div>
                        </div>

                        <div className="text-[8px] text-slate-400 flex gap-2 mt-1">
                          <span className={isExpiringSoon ? 'text-amber-600 font-medium' : ''}>
                            Exp: {new Date(batch.expiry_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
                          </span>
                          <span>•</span>
                          <span>MRP: ₹{batch.mrp}</span>
                          {batch.rack_no && <><span>•</span><span>Rack: {batch.rack_no}</span></>}
                        </div>

                        {marketplaceLocked && orderedQty > 0 && (
                          <div className="text-[8px] text-indigo-600 mt-1">
                            Order needs: <strong>{orderedQty}</strong> units
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>,
                document.body,
              )
            }
          </td>

          {/* EXPIRY */}
          <td className={cellBase}>
            <input className={`${inputBase} px-1 py-1 text-center font-mono text-[8px]`} value={item.exp || ''} readOnly />
          </td>

          {/* QTY — locked in marketplace mode */}
          <td className={`${cellBase} ${marketplaceLocked ? 'bg-indigo-50/60' : 'bg-amber-50/60'}`}>
            <div className="relative w-full h-full">
              <input
                ref={(el) => registerFieldRef('qty', el)}
                type="number"
                value={item.qty || ''}
                onChange={(e) => handleChange('qty', e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'qty')}
                readOnly={marketplaceLocked}
                className={`${inputBase} px-1 py-1 text-center font-bold
                  ${stockError
                    ? 'text-red-700 bg-red-100 ring-1 ring-red-400 ring-inset'
                    : marketplaceLocked
                      ? 'text-indigo-700 cursor-default'
                      : 'text-amber-700'
                  }`}
                placeholder="0"
                min="1"
              />
              {/* Lock icon overlay for marketplace */}
              {marketplaceLocked && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock size={8} className="text-indigo-400" />
                </div>
              )}
            </div>
          </td>

          {/* MRP */}
          <td className={cellBase}>
            <input className={`${inputBase} px-1 py-1 text-right text-slate-600`} value={item.mrp || ''} readOnly />
          </td>

          {/* RATE */}
          <td className={`${cellBase} bg-blue-50/50`}>
            <input
              ref={(el) => registerFieldRef('rate', el)}
              type="number"
              value={item.rate || ''}
              onChange={(e) => handleChange('rate', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'rate')}
              readOnly={marketplaceLocked}
              className={`${inputBase} px-1 py-1 text-right font-semibold text-blue-700
                ${marketplaceLocked ? 'cursor-default' : ''}
              `}
              placeholder="0.00"
              step="0.01"
            />
          </td>

          {/* DISCOUNT */}
          <td className={`${cellBase} bg-rose-50/40`}>
            <input
              ref={(el) => registerFieldRef('discountPercent', el)}
              type="number"
              value={item.discountPercent || ''}
              onChange={(e) => handleChange('discountPercent', e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'discountPercent')}
              readOnly={marketplaceLocked}
              className={`${inputBase} px-1 py-1 text-center text-rose-600 font-semibold
                ${marketplaceLocked ? 'cursor-default' : ''}
              `}
              placeholder="0"
              min="0"
              max="100"
            />
          </td>

          {/* CGST */}
<td className={`${cellBase} bg-orange-50/40`}>
  <input
    className={`${inputBase} px-1 py-1 text-center text-orange-600`}
    value={item.cgstPercent !== undefined ? item.cgstPercent : '0'}
    readOnly
  />
</td>

{/* SGST */}
<td className={`${cellBase} bg-orange-50/40`}>
  <input
    className={`${inputBase} px-1 py-1 text-center text-orange-600`}
    value={item.sgstPercent !== undefined ? item.sgstPercent : '0'}
    readOnly
  />
</td>

          {/* RACK */}
          <td className={`${cellBase} bg-slate-50`}>
            <input className={`${inputBase} px-1 py-1 text-center font-mono`} value={item.rack || ''} readOnly />
          </td>

          {/* STOCK */}
          <td className={`border-b border-r border-slate-200 p-0 ${stockError ? 'bg-red-50' : ''}`}>
            <div className="px-1 h-full flex flex-col items-center justify-center gap-0">
              {item.inventory_id ? (
                <>
                  <span
                    className={`text-[9px] font-bold leading-none ${
                      stockError
                        ? 'text-red-600'
                        : parseFloat(item.stock) <= 10
                          ? 'text-amber-600'
                          : 'text-green-600'
                    }`}
                  >
                    {item.stock || '0'}
                  </span>

                  {stockError ? (
                    <span className="text-[7px] text-red-600 font-semibold text-center leading-tight mt-0.5">
                      {stockError.message}
                      {stockError.details && (
                        <span className="block text-red-500 font-normal">{stockError.details}</span>
                      )}
                    </span>
                  ) : (
                    allRows.some((r, i) => i !== index && r.inventory_id === item.inventory_id) && (
                      <span className="text-[7px] text-gray-500 leading-tight mt-0.5">
                        {(parseFloat(item.stock) || 0) - calculateUsedStock(item.inventory_id, index)} left
                      </span>
                    )
                  )}
                </>
              ) : (
                <span className="text-[9px] text-slate-400">-</span>
              )}
            </div>
          </td>

          {/* AMOUNT */}
          <td className={`${cellBase} bg-emerald-50/60`}>
            <div className="px-1 py-1 text-right h-full flex items-center justify-end">
              <span className={`font-bold text-[10px] ${Number(item.amount) > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                {Number(item.amount) > 0 ? Number(item.amount).toFixed(2) : '0.00'}
              </span>
            </div>
          </td>
        </tr>
      );
    },
  ),
  // Memo comparison
  (prevProps, nextProps) => {
    if (prevProps.item !== nextProps.item) return false;
    if (prevProps.index !== nextProps.index) return false;
    if (prevProps.marketplaceLocked !== nextProps.marketplaceLocked) return false;
    if (prevProps.productMaster.length !== nextProps.productMaster.length) return false;

    const inventoryId = prevProps.item.inventory_id;
    if (inventoryId) {
      const prevSum = prevProps.allRows
        .filter((r, i) => i !== prevProps.index && r.inventory_id === inventoryId)
        .reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
      const nextSum = nextProps.allRows
        .filter((r, i) => i !== nextProps.index && r.inventory_id === inventoryId)
        .reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
      if (prevSum !== nextSum) return false;

      const prevCount = prevProps.allRows.filter((r, i) => i !== prevProps.index && r.inventory_id === inventoryId).length;
      const nextCount = nextProps.allRows.filter((r, i) => i !== nextProps.index && r.inventory_id === inventoryId).length;
      if (prevCount !== nextCount) return false;
    }

    return true;
  },
);

SalesRowFixed.displayName = 'SalesRowFixed';
export default SalesRowFixed;