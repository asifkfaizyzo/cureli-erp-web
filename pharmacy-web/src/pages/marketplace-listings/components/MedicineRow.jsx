// pharmacy-web/src/pages/marketplace-listings/components/MedicineRow.jsx (do not remove this comment)
// src/pages/marketplace-listings/components/MedicineRow.jsx

import { useState, useRef } from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import Toggle from "../../marketplace-storefront/components/primitives/Toggle";

const getRowClasses = (listing, isSelected, index) => {
  const base = "border-b border-white/[0.04] transition-all duration-150";
  const even = index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent";
  const selected = isSelected ? "bg-blue-500/[0.07] border-blue-500/10" : even;
  const hidden = !listing.is_visible ? "opacity-60" : "";
  const outOfStock =
    listing.stock_status === "OUT_OF_STOCK" && listing.is_visible
      ? "border-l-2 border-l-amber-500/40"
      : "";
  return [base, selected, hidden, outOfStock].filter(Boolean).join(" ");
};

const MedicineRow = ({
  listing,
  index,
  isSelected,
  onToggleSelect,
  onToggleVisibility,
  onSetStockStatus,
  onSetPrice,
  onView,
  globalEnabled,
  isUpdating,
}) => {
  const [priceEditing, setPriceEditing] = useState(false);
  const [priceInput, setPriceInput] = useState(
    String(listing.marketplace_price ?? ""),
  );
  const [moreOpen, setMoreOpen] = useState(false);

  const commitPrice = () => {
    const val = parseFloat(priceInput);
    if (!isNaN(val) && val > 0) {
      onSetPrice(val);
    } else {
      setPriceInput(String(listing.marketplace_price ?? ""));
    }
    setPriceEditing(false);
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className={getRowClasses(listing, isSelected, index)}
    >
      {/* Checkbox */}
      <td
        className="px-3 py-0 border-r border-white/[0.04]"
        style={{ height: "56px" }}
      >
        <div className="flex items-center justify-center h-full">
          <CheckboxCell checked={isSelected} onChange={onToggleSelect} />
        </div>
      </td>

      {/* Medicine Identity */}
      <td className="px-3 py-2 border-r border-white/[0.04]">
        <div className="flex items-center gap-2.5">
          <MedicineAvatar listing={listing} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-white/90 truncate leading-tight">
                {listing.catalog_name}
              </p>
              {listing.requires_prescription && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-[9px] font-bold text-violet-400 uppercase tracking-wide flex-shrink-0">
                  Rx
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/30 truncate mt-0.5">
              {listing.generic_name ? `${listing.generic_name} · ` : ""}
              {listing.manufacturer}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {listing.pack_size && (
                <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-full">
                  {listing.pack_size}
                </span>
              )}
              {listing.primary_category && (
                <span className="text-[9px] text-white/20 bg-white/[0.04] px-1.5 py-0.5 rounded-full">
                  {listing.primary_category}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* ERP Stock */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <div className="flex flex-col items-center gap-1">
          <span
            className={`text-sm font-bold ${
              listing.is_low_stock ? "text-red-400" : "text-white/70"
            }`}
          >
            {listing.erp_stock}
          </span>
          {listing.is_low_stock && (
            <span className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-medium">
              Low
            </span>
          )}
        </div>
      </td>

      {/* Visibility Toggle */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <div className="flex flex-col items-center gap-1.5">
          {isUpdating ? (
            <Loader2 size={14} className="text-white/30 animate-spin" />
          ) : (
            <Toggle
              enabled={listing.is_visible}
              onChange={onToggleVisibility}
              size="sm"
              disabled={!globalEnabled}
            />
          )}
          <span
            className={`text-[9px] font-medium ${
              listing.is_visible ? "text-emerald-400" : "text-white/25"
            }`}
          >
            {listing.is_visible ? "Visible" : "Hidden"}
          </span>
        </div>
      </td>

      {/* Stock Status */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <div className="flex justify-center">
          <StockStatusSelector
            value={listing.stock_status}
            onChange={onSetStockStatus}
            disabled={isUpdating}
          />
        </div>
      </td>

      {/* Marketplace Price */}
      <td className="px-3 py-2 border-r border-white/[0.04] text-center">
        <div className="flex flex-col items-center gap-1">
          {priceEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/40">₹</span>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitPrice();
                  if (e.key === "Escape") {
                    setPriceInput(String(listing.marketplace_price ?? ""));
                    setPriceEditing(false);
                  }
                }}
                autoFocus
                className="w-16 text-center text-sm font-bold text-white bg-white/[0.08] border border-white/20 rounded-lg px-1.5 py-0.5 focus:outline-none focus:border-blue-400"
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setPriceEditing(true);
                setPriceInput(String(listing.marketplace_price ?? ""));
              }}
              className="group text-sm font-bold text-white/80 hover:text-white flex items-center gap-1 transition-colors"
            >
              {listing.marketplace_price != null ? (
                `₹${listing.marketplace_price}`
              ) : (
                <span className="text-white/25 text-xs">Set price</span>
              )}
              <Pencil
                size={9}
                className="text-white/20 group-hover:text-white/50 transition-colors"
              />
            </button>
          )}
          {listing.erp_name && (
            <span
              className="text-[9px] text-white/15 truncate max-w-[90px]"
              title={listing.erp_name}
            >
              {listing.erp_name}
            </span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <ActionButton
            icon={ExternalLink}
            title="View Details"
            onClick={onView}
            colorClass="hover:text-blue-400 hover:bg-blue-500/10"
          />
          <div className="relative">
            <ActionButton
              icon={MoreHorizontal}
              title="More"
              onClick={() => setMoreOpen((v) => !v)}
              colorClass="hover:text-white/60 hover:bg-white/[0.06]"
            />
            {moreOpen && (
              <MoreMenu
                onClose={() => setMoreOpen(false)}
                onView={onView}
                visible={listing.is_visible}
                onToggleVisibility={onToggleVisibility}
              />
            )}
          </div>
        </div>
      </td>
    </motion.tr>
  );
};

// ── Medicine Avatar — uses CDN image, falls back to initial ──

const MedicineAvatar = ({ listing }) => {
  const [imgError, setImgError] = useState(false);

  // Guard against missing catalog_name
  const displayName = listing.catalog_name || listing.erp_name || "?";

  if (listing.image_url && !imgError) {
    return (
      <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/[0.08] flex-shrink-0 bg-white/[0.04]">
        <img
          src={listing.image_url}
          alt={displayName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  const colors = [
    "bg-blue-500/20 text-blue-400",
    "bg-purple-500/20 text-purple-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-amber-500/20 text-amber-400",
    "bg-cyan-500/20 text-cyan-400",
    "bg-rose-500/20 text-rose-400",
    "bg-indigo-500/20 text-indigo-400",
    "bg-teal-500/20 text-teal-400",
  ];
  const colorClass = colors[displayName.charCodeAt(0) % colors.length];

  return (
    <div
      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold border border-white/[0.08] ${colorClass}`}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
};

// ── StockStatusSelector ──

const StockStatusSelector = ({ value, onChange, disabled }) => (
  <div
    className={`flex rounded-lg overflow-hidden border border-white/[0.08] ${disabled ? "opacity-50" : ""}`}
  >
    <button
      onClick={() => !disabled && onChange("IN_STOCK")}
      className={`px-2.5 py-1 text-[10px] font-semibold transition-all ${
        value === "IN_STOCK"
          ? "bg-emerald-500/20 text-emerald-400 border-r border-emerald-500/20"
          : "text-white/25 hover:text-white/50 hover:bg-white/[0.04] border-r border-white/[0.06]"
      }`}
    >
      In Stock
    </button>
    <button
      onClick={() => !disabled && onChange("OUT_OF_STOCK")}
      className={`px-2.5 py-1 text-[10px] font-semibold transition-all ${
        value === "OUT_OF_STOCK"
          ? "bg-amber-500/20 text-amber-400"
          : "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"
      }`}
    >
      Out of Stock
    </button>
  </div>
);

// ── Action Button ──

const ActionButton = ({ icon: Icon, title, onClick, colorClass }) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-1.5 rounded-lg text-white/25 transition-all ${colorClass}`}
  >
    <Icon size={13} />
  </button>
);

// ── More Menu ──

const MoreMenu = ({ onClose, onView, visible, onToggleVisibility }) => (
  <>
    <div className="fixed inset-0 z-40" onClick={onClose} />
    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#0d0b2e] border border-white/[0.1] shadow-2xl shadow-black/60 z-50 overflow-hidden">
      <MenuOption
        icon={ExternalLink}
        label="View Details"
        onClick={() => {
          onView();
          onClose();
        }}
      />
      <MenuOption
        icon={visible ? EyeOff : Eye}
        label={visible ? "Hide from App" : "Show in App"}
        onClick={() => {
          onToggleVisibility();
          onClose();
        }}
      />
    </div>
  </>
);

const MenuOption = ({ icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-colors border-b border-white/[0.05] last:border-0"
  >
    <Icon size={12} />
    {label}
  </button>
);

// ── Checkbox ──

const CheckboxCell = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
      checked
        ? "bg-blue-500 border-blue-500"
        : "bg-white/[0.04] border-white/20 hover:border-white/40"
    }`}
  >
    {checked && (
      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
        <path
          d="M1 3.5L3.5 6L8 1"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </button>
);

export default MedicineRow;
