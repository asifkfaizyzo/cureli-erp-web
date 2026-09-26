// pharmacy-web/src/pages/marketplace-listings/components/ListingDetailsDrawer.jsx (do not remove this comment)
// src/pages/marketplace-listings/components/ListingDetailsDrawer.jsx

import { useState, useEffect } from "react";
import {
  X, Smartphone, Tag, Info, Package,
  Loader2, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, CheckCircle2,
  Hash, Layers, Thermometer, Box,
  TrendingUp, Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Toggle from "../../marketplace-storefront/components/primitives/Toggle";

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const ListingDetailsDrawer = ({
  open,
  listing,        // summary from table (always available when open)
  detail,         // full detail from API (null until loaded)
  isDetailLoading,
  detailError,
  onClose,
  onToggleVisibility,
  onSetStockStatus,
  onSetPrice,
  onTogglePrescription,
  isUpdating,
}) => {
  const [localPrice, setLocalPrice] = useState("");
  const [priceEditing, setPriceEditing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState({});

  // Sync price input when listing changes
  useEffect(() => {
    if (listing) {
      setLocalPrice(String(listing.marketplace_price ?? ""));
      setPriceEditing(false);
    }
  }, [listing?.listing_id]);

  // Reset image index when detail loads
  useEffect(() => {
    if (detail) setSelectedImageIndex(0);
  }, [detail?.listing_id]);

  const commitPrice = () => {
    const val = parseFloat(localPrice);
    if (!isNaN(val) && val > 0) {
      onSetPrice(listing.listing_id, val);
    } else {
      setLocalPrice(String(listing.marketplace_price ?? ""));
    }
    setPriceEditing(false);
  };

  const handleImgError = (index) => {
    setImgErrors((prev) => ({ ...prev, [index]: true }));
  };

  // Use detail data if available, fall back to listing summary
  const images = detail?.images ?? [];
  const currentImage = images[selectedImageIndex];
  const hasImages = images.length > 0;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Drawer Panel */}
      <AnimatePresence>
        {open && listing && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[460px] z-50 flex flex-col bg-[#080720] border-l border-white/[0.08] shadow-2xl shadow-black/80"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Small avatar in header */}
                <HeaderAvatar
                  listing={listing}
                  detail={detail}
                  imgErrors={imgErrors}
                  onImgError={() => handleImgError("header")}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white leading-tight truncate">
                      {listing.catalog_name}
                    </p>
                    {listing.requires_prescription && (
                      <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-[9px] font-bold text-violet-400 uppercase tracking-wide">
                        Rx
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/30 mt-0.5 truncate">
                    {listing.manufacturer}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isUpdating && (
                  <Loader2 size={14} className="text-white/30 animate-spin" />
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Image Gallery ── */}
              {isDetailLoading ? (
                <ImageGallerySkeleton />
              ) : hasImages ? (
                <ImageGallery
                  images={images}
                  selectedIndex={selectedImageIndex}
                  onSelect={setSelectedImageIndex}
                  imgErrors={imgErrors}
                  onImgError={handleImgError}
                />
              ) : (
                <NoImagePlaceholder name={listing.catalog_name} />
              )}

              {/* ── Catalog Details ── */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Info} label="Catalog Details" />
                {isDetailLoading ? (
                  <DetailSkeleton rows={4} />
                ) : detail ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {detail.catalog.generic_name && (
                        <DetailField
                          label="Generic Name"
                          value={detail.catalog.generic_name}
                        />
                      )}
                      {detail.catalog.primary_category && (
                        <DetailField
                          label="Category"
                          value={detail.catalog.primary_category}
                        />
                      )}
                      {detail.catalog.form && (
                        <DetailField label="Form" value={detail.catalog.form} />
                      )}
                      {detail.catalog.pack_size && (
                        <DetailField
                          label="Pack Size"
                          value={detail.catalog.pack_size}
                        />
                      )}
                      {detail.catalog.strength && (
                        <DetailField
                          label="Strength"
                          value={detail.catalog.strength}
                        />
                      )}
                      {detail.catalog.manufacturer && (
                        <DetailField
                          label="Manufacturer"
                          value={detail.catalog.manufacturer}
                        />
                      )}
                      {detail.catalog.marketer && (
                        <DetailField
                          label="Marketer"
                          value={detail.catalog.marketer}
                        />
                      )}
                      {detail.catalog.catalog_mrp != null && (
                        <DetailField
                          label="Catalog MRP"
                          value={`₹${detail.catalog.catalog_mrp}`}
                        />
                      )}
                    </div>

                    {/* Composition */}
                    {detail.catalog.composition &&
                      Array.isArray(detail.catalog.composition) &&
                      detail.catalog.composition.length > 0 && (
                        <div className="mt-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <p className="text-[10px] text-white/20 font-medium mb-2">
                            Composition
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.catalog.composition.map((comp, i) => (
                              <span
                                key={i}
                                className="text-[10px] text-white/50 bg-white/[0.05] px-2 py-0.5 rounded-full"
                              >
                                {typeof comp === "object"
                                  ? `${comp.name}${comp.strength ? ` ${comp.strength}` : ""}`
                                  : comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* SKU reference */}
                    {detail.catalog.sku_id && (
                      <div className="mt-2 flex items-center gap-2">
                        <Hash size={10} className="text-white/15 flex-shrink-0" />
                        <span className="text-[10px] text-white/20 font-mono">
                          SKU: {detail.catalog.sku_id}
                        </span>
                      </div>
                    )}
                  </>
                ) : detailError ? (
                  <ErrorNote message={detailError} />
                ) : null}
              </div>

              {/* ── Marketplace Controls ── */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Smartphone} label="Marketplace Controls" />
                <div className="space-y-3 mt-3">

                  {/* Visibility */}
                  <ControlRow
                    label="Visible in App"
                    sublabel="Show this medicine to customers in the Cureli app"
                  >
                    <Toggle
                      enabled={listing.is_visible}
                      onChange={() => onToggleVisibility(listing.listing_id)}
                      size="md"
                      disabled={isUpdating}
                    />
                  </ControlRow>

                  {/* Prescription Required */}
                  <ControlRow
                    label="Requires Prescription"
                    sublabel="Customers must upload a valid prescription to order"
                  >
                    <div className="flex items-center gap-2">
                      {listing.requires_prescription && (
                        <span className="text-[9px] text-violet-400 font-bold uppercase tracking-wide">
                          Rx
                        </span>
                      )}
                      <Toggle
                        enabled={listing.requires_prescription}
                        onChange={() =>
                          onTogglePrescription(listing.listing_id)
                        }
                        size="md"
                        disabled={isUpdating}
                      />
                    </div>
                  </ControlRow>

                  {/* Stock Status */}
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <p className="text-[11px] text-white/40 font-medium mb-2.5">
                      Marketplace Stock Status
                    </p>
                    <div className="flex gap-2">
                      <StockButton
                        label="In Stock"
                        active={listing.stock_status === "IN_STOCK"}
                        onClick={() =>
                          onSetStockStatus(listing.listing_id, "IN_STOCK")
                        }
                        activeClass="bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        disabled={isUpdating}
                      />
                      <StockButton
                        label="Out of Stock"
                        active={listing.stock_status === "OUT_OF_STOCK"}
                        onClick={() =>
                          onSetStockStatus(listing.listing_id, "OUT_OF_STOCK")
                        }
                        activeClass="bg-amber-500/20 border-amber-500/30 text-amber-400"
                        disabled={isUpdating}
                      />
                    </div>
                    {listing.stock_status === "OUT_OF_STOCK" && (
                      <p className="text-[10px] text-amber-400/60 mt-2">
                        Medicine remains visible but shows "Out of Stock" to
                        customers
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Marketplace Pricing ── */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Tag} label="Marketplace Pricing" />
                <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] text-white/40 font-medium">
                        Marketplace Price
                      </p>
                      <p className="text-[10px] text-white/20 mt-0.5">
                        Independent from ERP pricing
                      </p>
                    </div>
                    <div>
                      {priceEditing ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-white/40">₹</span>
                          <input
                            type="number"
                            value={localPrice}
                            onChange={(e) => setLocalPrice(e.target.value)}
                            onBlur={commitPrice}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitPrice();
                              if (e.key === "Escape") {
                                setLocalPrice(
                                  String(listing.marketplace_price ?? "")
                                );
                                setPriceEditing(false);
                              }
                            }}
                            autoFocus
                            className="w-20 text-right text-lg font-bold text-white bg-white/[0.08] border border-white/20 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setPriceEditing(true)}
                          className="text-2xl font-bold text-white hover:text-white/80 transition-colors"
                        >
                          {listing.marketplace_price != null ? (
                            `₹${listing.marketplace_price}`
                          ) : (
                            <span className="text-base text-white/30">
                              Not set
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Catalog price reference */}
                  {detail?.catalog.catalog_mrp != null && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                      <span className="text-[11px] text-white/25">
                        Catalog MRP
                      </span>
                      <span className="text-sm text-white/30 font-medium">
                        ₹{detail.catalog.catalog_mrp}
                      </span>
                    </div>
                  )}

                  {listing.marketplace_price != null &&
                    detail?.catalog.catalog_mrp != null && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <TrendingUp size={10} className="text-blue-400" />
                        <span className="text-[10px] text-blue-400">
                          {listing.marketplace_price > detail.catalog.catalog_mrp
                            ? `+₹${(listing.marketplace_price - detail.catalog.catalog_mrp).toFixed(2)} above MRP`
                            : listing.marketplace_price < detail.catalog.catalog_mrp
                            ? `-₹${(detail.catalog.catalog_mrp - listing.marketplace_price).toFixed(2)} below MRP`
                            : "At MRP"}
                        </span>
                      </div>
                    )}
                </div>
              </div>

              {/* ── ERP Stock & Batches ── */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Box} label="ERP Stock" />
                {isDetailLoading ? (
                  <DetailSkeleton rows={2} />
                ) : detail ? (
                  <div className="mt-3 space-y-2">
                    {/* Total stock */}
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-[11px] text-white/40">
                        Total Available Stock
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          detail.is_low_stock
                            ? "text-red-400"
                            : detail.erp_stock === 0
                            ? "text-white/25"
                            : "text-white/70"
                        }`}
                      >
                        {detail.erp_stock} units
                        {detail.is_low_stock && (
                          <span className="ml-2 text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full font-medium">
                            Low
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Batch breakdown */}
                    {detail.inventory_batches.length > 0 && (
                      <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <p className="text-[10px] text-white/20 font-medium mb-2">
                          Active Batches
                        </p>
                        <div className="space-y-1.5">
                          {detail.inventory_batches.map((batch, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-[10px]"
                            >
                              <span className="text-white/40 font-mono">
                                {batch.batch_number}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-white/25">
                                  Exp:{" "}
                                  {new Date(
                                    batch.expiry_date
                                  ).toLocaleDateString("en-IN", {
                                    month: "short",
                                    year: "2-digit",
                                  })}
                                </span>
                                <span className="text-white/50 font-semibold">
                                  {batch.available_stock} units
                                </span>
                                {batch.selling_rate && (
                                  <span className="text-white/25">
                                    ₹{batch.selling_rate}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* ── ERP Medicine Details ── */}
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <SectionLabel icon={Link2} label="Linked ERP Medicine" />
                {isDetailLoading ? (
                  <DetailSkeleton rows={3} />
                ) : detail ? (
                  <div className="mt-3 space-y-2">
                    {/* ERP name */}
                    <div className="px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-[10px] text-white/20 font-medium mb-1">
                        ERP Medicine Name
                      </p>
                      <p className="text-xs text-white/50 font-mono">
                        {detail.erp.erp_name}
                      </p>
                    </div>

                    {/* ERP fields grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {detail.erp.manufacturer && (
                        <DetailField
                          label="Manufacturer"
                          value={detail.erp.manufacturer}
                        />
                      )}
                      {detail.erp.pack_size && (
                        <DetailField
                          label="Pack Size"
                          value={detail.erp.pack_size}
                        />
                      )}
                      {detail.erp.schedule && (
                        <DetailField
                          label="Schedule"
                          value={detail.erp.schedule}
                        />
                      )}
                      {detail.erp.hsn_code && (
                        <DetailField
                          label="HSN Code"
                          value={detail.erp.hsn_code}
                        />
                      )}
                      {detail.erp.rack_no && (
                        <DetailField
                          label="Rack No."
                          value={detail.erp.rack_no}
                        />
                      )}
                      {detail.erp.gst_percentage != null && (
                        <DetailField
                          label="GST"
                          value={`${detail.erp.gst_percentage}%`}
                        />
                      )}
                      {detail.erp.category && (
                        <DetailField
                          label="ERP Category"
                          value={detail.erp.category}
                        />
                      )}
                      {detail.erp.unit_of_measure && (
                        <DetailField
                          label="Unit"
                          value={detail.erp.unit_of_measure}
                        />
                      )}
                    </div>

                    {/* Link metadata */}
                    <div className="flex items-center gap-2 mt-1">
                      {detail.erp.link_status === "AUTO_LINKED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 size={9} />
                          Auto-linked
                        </span>
                      ) : detail.erp.link_status === "MANUAL_LINKED" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 size={9} />
                          Manually linked
                        </span>
                      ) : null}
                      {detail.erp.link_confidence_score != null && (
                        <span className="text-[10px] text-white/20">
                          {Math.round(detail.erp.link_confidence_score)}%
                          confidence
                        </span>
                      )}
                      {detail.erp.linked_by_type && (
                        <span className="text-[10px] text-white/15">
                          by {detail.erp.linked_by_type === "SYSTEM" ? "System" : detail.erp.linked_by_type === "CADMIN" ? "CAdmin" : "Shop"}
                        </span>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ── Cureli App Preview ── */}
              <div className="px-5 py-4">
                <SectionLabel icon={Smartphone} label="Cureli App Preview" />
                <AppPreviewCard
                  listing={listing}
                  detail={detail}
                  selectedImageIndex={selectedImageIndex}
                  imgErrors={imgErrors}
                  onImgError={handleImgError}
                />
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-white/[0.07] bg-white/[0.01]">
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-white/50 hover:text-white/70 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE GALLERY
// ─────────────────────────────────────────────────────────────────────────────

const ImageGallery = ({
  images,
  selectedIndex,
  onSelect,
  imgErrors,
  onImgError,
}) => {
  const current = images[selectedIndex];
  const hasError = imgErrors[selectedIndex];

  return (
    <div className="border-b border-white/[0.06]">
      {/* Main image */}
      <div className="relative bg-white/[0.02] flex items-center justify-center"
        style={{ height: "220px" }}>
        {current && !hasError ? (
          <img
            src={current.url}
            alt={`Medicine image ${selectedIndex + 1}`}
            className="max-h-full max-w-full object-contain p-4"
            onError={() => onImgError(selectedIndex)}
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Package size={40} className="text-white/10" />
            <span className="text-[11px] text-white/20">No image available</span>
          </div>
        )}

        {/* Image type badge */}
        {current && (
          <div className="absolute top-2 left-2">
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                current.type === "PRIMARY"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/[0.08] text-white/30 border border-white/[0.08]"
              }`}
            >
              {current.type === "PRIMARY" ? "Primary" : "Gallery"}
            </span>
          </div>
        )}

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => onSelect((i) => Math.max(0, i - 1))}
              disabled={selectedIndex === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() =>
                onSelect((i) => Math.min(images.length - 1, i + 1))
              }
              disabled={selectedIndex === images.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 text-[10px] text-white/30 bg-black/40 px-1.5 py-0.5 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.image_id}
              onClick={() => onSelect(i)}
              className={`w-12 h-12 rounded-lg overflow-hidden border flex-shrink-0 transition-all ${
                i === selectedIndex
                  ? "border-blue-400/50 opacity-100"
                  : "border-white/[0.08] opacity-40 hover:opacity-70"
              }`}
            >
              {imgErrors[i] ? (
                <div className="w-full h-full bg-white/[0.04] flex items-center justify-center">
                  <Package size={12} className="text-white/20" />
                </div>
              ) : (
                <img
                  src={img.url}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => onImgError(i)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ImageGallerySkeleton = () => (
  <div className="border-b border-white/[0.06]">
    <div
      className="bg-white/[0.02] animate-pulse flex items-center justify-center"
      style={{ height: "220px" }}
    >
      <Package size={40} className="text-white/5" />
    </div>
  </div>
);

const NoImagePlaceholder = ({ name }) => (
  <div className="border-b border-white/[0.06]">
    <div
      className="bg-white/[0.02] flex flex-col items-center justify-center gap-2"
      style={{ height: "160px" }}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
        <span className="text-2xl font-bold text-white/20">
          {name?.charAt(0).toUpperCase()}
        </span>
      </div>
      <p className="text-[11px] text-white/20">No images available</p>
    </div>
  </div>
);

const HeaderAvatar = ({ listing, detail, imgErrors, onImgError }) => {
  const primaryImage = detail?.images?.find((i) => i.type === "PRIMARY");
  const imageUrl = primaryImage?.url ?? listing.image_url;

  if (imageUrl && !imgErrors["header"]) {
    return (
      <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/[0.08] flex-shrink-0 bg-white/[0.04]">
        <img
          src={imageUrl}
          alt={listing.catalog_name}
          className="w-full h-full object-cover"
          onError={onImgError}
        />
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex-shrink-0 flex items-center justify-center">
      <span className="text-sm font-bold text-white/40">
        {listing.catalog_name?.charAt(0).toUpperCase() ?? "?"}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// APP PREVIEW CARD
// ─────────────────────────────────────────────────────────────────────────────

const AppPreviewCard = ({
  listing,
  detail,
  selectedImageIndex,
  imgErrors,
  onImgError,
}) => {
  const images = detail?.images ?? [];
  const displayImage = images[selectedImageIndex] ?? null;

  return (
    <div className="mt-3 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
      {/* Mock app bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] border-b border-white/[0.05]">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
        <span className="text-[10px] text-white/30 font-medium">
          Cureli App · Medicine Card
        </span>
      </div>

      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Image */}
          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/[0.08] flex-shrink-0 bg-white/[0.04] flex items-center justify-center">
            {displayImage && !imgErrors[selectedImageIndex] ? (
              <img
                src={displayImage.url}
                alt={listing.catalog_name}
                className="w-full h-full object-cover"
                onError={() => onImgError(selectedImageIndex)}
              />
            ) : listing.image_url && !imgErrors["preview"] ? (
              <img
                src={listing.image_url}
                alt={listing.catalog_name}
                className="w-full h-full object-cover"
                onError={() => onImgError("preview")}
              />
            ) : (
              <Package size={20} className="text-white/20" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-bold text-white/80 leading-tight">
                    {listing.catalog_name}
                  </p>
                  {listing.requires_prescription && (
                    <span className="text-[8px] font-bold text-violet-400 bg-violet-500/15 border border-violet-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0">
                      Rx
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {listing.manufacturer}
                </p>
                {listing.pack_size && (
                  <p className="text-[10px] text-white/20 mt-0.5">
                    {listing.pack_size}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-white/90">
                  {listing.marketplace_price != null
                    ? `₹${listing.marketplace_price}`
                    : "—"}
                </p>
                {listing.stock_status === "OUT_OF_STOCK" && (
                  <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                listing.is_visible
                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  : "text-white/20 bg-white/[0.04] border border-white/[0.07]"
              }`}
            >
              {listing.is_visible ? "Visible in App" : "Hidden from App"}
            </span>
            {listing.requires_prescription && listing.is_visible && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20">
                Prescription Required
              </span>
            )}
          </div>
          {listing.is_visible && listing.stock_status === "IN_STOCK" && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#05015A]/60 border border-white/[0.1]">
              <span className="text-[10px] text-white/60 font-medium">
                Add to Cart
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2">
    <Icon size={12} className="text-white/30" />
    <p className="text-[11px] text-white/30 font-semibold uppercase tracking-wider">
      {label}
    </p>
  </div>
);

const DetailField = ({ label, value, highlight }) => (
  <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
    <p className="text-[10px] text-white/25 font-medium">{label}</p>
    <p
      className={`text-xs font-semibold mt-0.5 truncate ${
        highlight === "warning" ? "text-amber-400" : "text-white/70"
      }`}
    >
      {value}
    </p>
  </div>
);

const ControlRow = ({ label, sublabel, children }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
    <div className="min-w-0 mr-3">
      <p className="text-sm font-medium text-white/70">{label}</p>
      {sublabel && (
        <p className="text-[10px] text-white/25 mt-0.5">{sublabel}</p>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const StockButton = ({ label, active, onClick, activeClass, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all disabled:opacity-50 ${
      active
        ? activeClass
        : "bg-white/[0.03] border-white/[0.07] text-white/30 hover:text-white/50 hover:bg-white/[0.06]"
    }`}
  >
    {label}
  </button>
);

const DetailSkeleton = ({ rows = 3 }) => (
  <div className="mt-3 space-y-2">
    {[...Array(rows)].map((_, i) => (
      <div
        key={i}
        className="h-10 rounded-lg bg-white/[0.03] animate-pulse"
      />
    ))}
  </div>
);

const ErrorNote = ({ message }) => (
  <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/15">
    <AlertTriangle size={12} className="text-red-400/70 flex-shrink-0" />
    <p className="text-[11px] text-red-400/70">{message}</p>
  </div>
);

export default ListingDetailsDrawer;