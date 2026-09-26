// cadmin-web/src/pages/MasterMedicines/comps/ImageUploadModal.jsx (do not remove this comment)
// cadmin/src/pages/MasterMedicines/comps/ImageUploadModal.jsx

import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  ImageOff,
  ExternalLink,
  Download,
  ArrowUp,
} from "lucide-react";
import {
  getImageStatusInfo,
  uploadImage,
  deleteImage,
  getImageUrl,
  getMasterMedicineById,
  computeImageStatus,
} from "../../../api/cadminMasterMedicines";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ── Header color options — pick one you like ──
// Option A: Deep Indigo/Purple gradient (current default below)
// Option B: Teal/Emerald
// Option C: Slate Blue
// Option D: Rose/Pink
// Option E: Amber/Orange

const HEADER_STYLE = "bg-gradient-to-r from-[#05015A] to-[#0a0280]"; // A — Indigo/Purple
// const HEADER_STYLE = "bg-gradient-to-r from-teal-600 to-emerald-700";       // B — Teal/Emerald
// const HEADER_STYLE = "bg-gradient-to-r from-slate-600 to-blue-800";         // C — Slate Blue
// const HEADER_STYLE = "bg-gradient-to-r from-rose-500 to-pink-700";          // D — Rose/Pink
// const HEADER_STYLE = "bg-gradient-to-r from-amber-500 to-orange-600";       // E — Amber/Orange

const ImageUploadModal = ({
  isOpen,
  medicine,
  onClose,
  onImageUploaded,
  onViewMasterDetail,
  zIndex = 50,          
}) => {
  const [fullMedicine, setFullMedicine] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newPrimary, setNewPrimary] = useState(null);
  const [newGallery, setNewGallery] = useState([]);
  const [deletedIds, setDeletedIds] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [dragTarget, setDragTarget] = useState(null);
  const [error, setError] = useState("");
  const [selectedPreview, setSelectedPreview] = useState(null);

  const primaryInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && medicine?.id) {
      loadFullMedicine(medicine.id);
      setNewPrimary(null);
      setNewGallery([]);
      setDeletedIds(new Set());
      setError("");
      setSelectedPreview(null);
    } else {
      setFullMedicine(null);
      setExistingImages([]);
    }
  }, [isOpen, medicine?.id]);

  const loadFullMedicine = async (id) => {
    try {
      setLoadingDetails(true);
      const res = await getMasterMedicineById(id);
      const data = res.data?.data;
      if (data) {
        setFullMedicine(data);
        const imgs = (data.images || []).map((img) => ({
          id: img.id,
          url: img.url,
          resolvedUrl: getImageUrl(img.url),
          type: img.type,
          source: img.source,
          skuId: img.skuId,
          uploadedBy: img.uploadedBy,
        }));
        setExistingImages(imgs);
        if (imgs.length > 0)
          setSelectedPreview({ ...imgs[0], isExisting: true });
      }
    } catch (err) {
      console.error("Failed to load:", err);
      setError("Failed to load medicine details");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (newPrimary?.preview) URL.revokeObjectURL(newPrimary.preview);
      newGallery.forEach((img) => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, [newPrimary, newGallery]);

  if (!isOpen || !medicine) return null;

  const activeExisting = existingImages.filter(
    (img) => !deletedIds.has(img.id),
  );
  const existingPrimary =
    activeExisting.find((img) => img.type === "PRIMARY") || null;
  const existingGallery = activeExisting.filter(
    (img) => img.type !== "PRIMARY",
  );
  const rawCount = activeExisting.filter(
    (img) => img.source === "SCRAPED",
  ).length;
  const medicineName =
    fullMedicine?.genericName ||
    medicine.genericName ||
    medicine.name ||
    "Medicine";

  const allImagesForStatus = [
    ...activeExisting.map((img) => ({ source: img.source })),
    ...(newPrimary ? [{ source: "UPLOADED" }] : []),
    ...newGallery.map(() => ({ source: "UPLOADED" })),
  ];
  const currentStatus = computeImageStatus(allImagesForStatus);
  const statusInfo = getImageStatusInfo(currentStatus);
  const hasChanges =
    newPrimary !== null || newGallery.length > 0 || deletedIds.size > 0;

  const validateFile = (file, errs) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errs.push(`"${file.name}": JPG, PNG, WebP only`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      errs.push(`"${file.name}": max 5MB`);
      return false;
    }
    return true;
  };

  // ── Primary handlers ──
  const handlePrimaryFile = (file) => {
    const errs = [];
    if (!validateFile(file, errs)) {
      setError(errs.join(". "));
      return;
    }
    setError("");
    if (newPrimary?.preview) URL.revokeObjectURL(newPrimary.preview);
    setNewPrimary({
      id: `new_primary_${Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const handlePrimaryDrop = (e) => {
    e.preventDefault();
    setDragTarget(null);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePrimaryFile(file);
  };

  const handlePrimaryInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handlePrimaryFile(file);
    if (primaryInputRef.current) primaryInputRef.current.value = "";
  };

  const removePrimary = () => {
    if (newPrimary?.preview) URL.revokeObjectURL(newPrimary.preview);
    setNewPrimary(null);
  };

  // ── Gallery handlers ──
  const handleGalleryFiles = (files) => {
    const errs = [];
    const valid = Array.from(files).filter((f) => validateFile(f, errs));
    if (errs.length) setError(errs.join(". "));
    else setError("");
    const imgs = valid.map((file, i) => ({
      id: `new_gallery_${Date.now()}_${i}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewGallery((prev) => [...prev, ...imgs]);
  };

  const handleGalleryDrop = (e) => {
    e.preventDefault();
    setDragTarget(null);
    if (e.dataTransfer.files?.length) handleGalleryFiles(e.dataTransfer.files);
  };

  const handleGalleryInput = (e) => {
    if (e.target.files?.length) handleGalleryFiles(e.target.files);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGalleryNew = (imgId) => {
    const img = newGallery.find((i) => i.id === imgId);
    if (img?.preview) URL.revokeObjectURL(img.preview);
    setNewGallery((prev) => prev.filter((i) => i.id !== imgId));
    if (selectedPreview?.id === imgId) setSelectedPreview(null);
  };

  // ── Existing image actions ──
  const handleDeleteExisting = (imgId) => {
    setDeletedIds((prev) => new Set([...prev, imgId]));
    if (selectedPreview?.id === imgId && selectedPreview?.isExisting)
      setSelectedPreview(null);
  };

  // ── FIX: Promote existing gallery to primary — demoted primary goes to GALLERY ──
  const promoteExistingToPrimary = (imgId) => {
    setExistingImages((prev) =>
      prev.map((img) => {
        if (img.id === imgId) return { ...img, type: "PRIMARY" };
        if (img.type === "PRIMARY") return { ...img, type: "GALLERY" };
        return img;
      }),
    );
  };

  // ── FIX: Promote new gallery to primary — old newPrimary goes back to newGallery with its preview intact ──
  const promoteGalleryToPrimary = (imgId) => {
    const promoted = newGallery.find((i) => i.id === imgId);
    if (!promoted) return;

    const remainingGallery = newGallery.filter((i) => i.id !== imgId);

    if (newPrimary) {
      // Demote old primary back into gallery — keep its file + preview
      const demoted = {
        ...newPrimary,
        id: `demoted_${Date.now()}`,
      };
      setNewGallery([demoted, ...remainingGallery]);
    } else {
      setNewGallery(remainingGallery);
    }

    setNewPrimary({ ...promoted });

    // Update selected preview to reflect the newly promoted primary
    if (selectedPreview?.id === imgId) {
      setSelectedPreview({ ...promoted, isNew: true });
    }
  };

  // ── FIX: Download via fetch blob so it actually downloads instead of opening ──
  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "medicine-image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      // Fallback: open in new tab if CORS blocks the fetch
      console.warn("Download via fetch failed, falling back to new tab:", err);
      window.open(url, "_blank");
    }
  };

  // ── Save ──
  const handleSave = async () => {
    setIsUploading(true);
    setError("");
    try {
      const skuId =
        fullMedicine?.variants?.[0]?.skuId ||
        medicine.previewVariants?.[0]?.skuId ||
        null;
      if (newPrimary)
        await uploadImage(medicine.id, newPrimary.file, "PRIMARY", skuId);
      for (const img of newGallery)
        await uploadImage(medicine.id, img.file, "GALLERY", skuId);
      for (const imgId of deletedIds) {
        try {
          await deleteImage(imgId);
        } catch (err) {
          console.warn("Failed to delete:", err);
        }
      }
      onImageUploaded();
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (zone) => (e) => {
    e.preventDefault();
    setDragTarget(zone);
  };
  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragTarget(null);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ HEADER ══ */}
        <div className={`${HEADER_STYLE} px-6 py-4 flex-shrink-0`}>
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                <ImageIcon size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-white text-lg font-semibold">
                  Manage Images
                </h2>
                <p className="text-white/70 text-sm truncate max-w-[320px] mt-0.5">
                  {medicineName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {onViewMasterDetail && (
                <button
                  onClick={() => onViewMasterDetail(medicine)}
                  className="px-3 py-1.5 rounded-lg bg-white/15 text-white/80 hover:text-white hover:bg-white/25
                             text-xs font-medium transition-colors"
                >
                  View Details
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div
          className={`px-6 py-2 border-b flex items-center justify-between flex-shrink-0 ${statusInfo.bgClass} ${statusInfo.borderClass}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusInfo.textClass}`}
            >
              {statusInfo.label}
            </span>
            <span className="text-xs text-gray-600">
              {activeExisting.length} existing
              {newPrimary ? " · 1 new primary" : ""}
              {newGallery.length > 0
                ? ` · ${newGallery.length} new gallery`
                : ""}
              {deletedIds.size > 0 ? ` · ${deletedIds.size} to delete` : ""}
            </span>
          </div>
          {rawCount > 0 && (
            <span className="flex items-center gap-1 text-amber-700 text-xs">
              <AlertTriangle size={13} />
              {rawCount} scraped — replace with verified
            </span>
          )}
        </div>

        {/* ══ BODY ══ */}
        <div className="flex-1 min-h-0 overflow-hidden flex">
          {loadingDetails ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <Loader2 size={28} className="animate-spin mr-3 text-gray-500" />
              Loading images...
            </div>
          ) : (
            <>
              {/* ── LEFT: Current images ── */}
              <div className="w-[300px] flex-shrink-0 border-r border-gray-200 flex flex-col overflow-auto bg-gray-50">
                <div className="px-4 py-2.5 border-b border-gray-200 flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Current Images ({activeExisting.length})
                  </p>
                </div>

                {/* Selected preview */}
                {selectedPreview && (
                  <div className="p-3 border-b border-gray-200 flex-shrink-0 bg-white">
                    <div className="w-full aspect-square rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                      <img
                        src={
                          selectedPreview.isNew
                            ? selectedPreview.preview
                            : selectedPreview.resolvedUrl
                        }
                        alt=""
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          e.target.style.opacity = "0.3";
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {selectedPreview.type === "PRIMARY" && (
                        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold flex items-center gap-0.5">
                          <Star size={8} fill="currentColor" /> PRIMARY
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          selectedPreview.isNew ||
                          selectedPreview.source === "UPLOADED"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {selectedPreview.isNew
                          ? "NEW"
                          : selectedPreview.source === "UPLOADED"
                            ? "VERIFIED"
                            : "RAW"}
                      </span>
                    </div>
                    {/* Actions row */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {selectedPreview.isExisting &&
                        selectedPreview.resolvedUrl && (
                          <>
                            <button
                              onClick={() =>
                                window.open(
                                  selectedPreview.resolvedUrl,
                                  "_blank",
                                )
                              }
                              className="flex-1 h-7 border border-gray-200 rounded-lg text-[11px] text-gray-500 hover:bg-gray-100 flex items-center justify-center gap-1"
                            >
                              <ExternalLink size={10} /> Open
                            </button>
                            <button
                              onClick={() =>
                                handleDownload(
                                  selectedPreview.resolvedUrl,
                                  `${medicineName}-image`,
                                )
                              }
                              className="flex-1 h-7 border border-gray-200 rounded-lg text-[11px] text-gray-500 hover:bg-gray-100 flex items-center justify-center gap-1"
                            >
                              <Download size={10} /> Download
                            </button>
                          </>
                        )}
                    </div>
                    {/* Thumbnail list */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                      {activeExisting.length === 0 &&
                        newPrimary === null &&
                        newGallery.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                            <ImageOff size={28} className="mb-2 opacity-40" />
                            <p className="text-xs">No images yet</p>
                          </div>
                        )}

                      {existingPrimary && (
                        <ImageRow
                          img={existingPrimary}
                          isSelected={
                            selectedPreview?.id === existingPrimary.id &&
                            selectedPreview?.isExisting
                          }
                          isPrimary
                          isRaw={existingPrimary.source === "SCRAPED"}
                          onClick={() =>
                            setSelectedPreview({
                              ...existingPrimary,
                              isExisting: true,
                            })
                          }
                          onDelete={() =>
                            handleDeleteExisting(existingPrimary.id)
                          }
                          onDownload={() =>
                            handleDownload(
                              existingPrimary.resolvedUrl,
                              `${medicineName}-primary`,
                            )
                          }
                        />
                      )}

                      {existingGallery.length > 0 && existingPrimary && (
                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider pt-1.5 px-1">
                          Gallery
                        </p>
                      )}
                      {existingGallery.map((img) => (
                        <ImageRow
                          key={img.id}
                          img={img}
                          isSelected={
                            selectedPreview?.id === img.id &&
                            selectedPreview?.isExisting
                          }
                          isRaw={img.source === "SCRAPED"}
                          onClick={() =>
                            setSelectedPreview({ ...img, isExisting: true })
                          }
                          onDelete={() => handleDeleteExisting(img.id)}
                          onSetPrimary={() => promoteExistingToPrimary(img.id)}
                          onDownload={() =>
                            handleDownload(
                              img.resolvedUrl,
                              `${medicineName}-gallery`,
                            )
                          }
                        />
                      ))}

                      {/* New pending */}
                      {(newPrimary || newGallery.length > 0) && (
                        <p className="text-[9px] font-semibold text-green-600 uppercase tracking-wider pt-1.5 px-1">
                          Pending Upload
                        </p>
                      )}
                      {newPrimary && (
                        <ImageRow
                          img={{
                            ...newPrimary,
                            resolvedUrl: newPrimary.preview,
                            source: "UPLOADED",
                          }}
                          isSelected={
                            selectedPreview?.id === newPrimary.id &&
                            !selectedPreview?.isExisting
                          }
                          isPrimary
                          isNew
                          onClick={() =>
                            setSelectedPreview({ ...newPrimary, isNew: true })
                          }
                          onDelete={removePrimary}
                          onSetPrimary={undefined}
                        />
                      )}
                      {newGallery.map((img) => (
                        <ImageRow
                          key={img.id}
                          img={{
                            ...img,
                            resolvedUrl: img.preview,
                            source: "UPLOADED",
                          }}
                          isSelected={
                            selectedPreview?.id === img.id &&
                            !selectedPreview?.isExisting
                          }
                          isNew
                          onClick={() =>
                            setSelectedPreview({ ...img, isNew: true })
                          }
                          onDelete={() => removeGalleryNew(img.id)}
                          onSetPrimary={() => promoteGalleryToPrimary(img.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT: Upload zones ── */}
              <div className="flex-1 flex flex-col overflow-y-auto p-5 gap-5">
                {/* PRIMARY */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <Star
                          size={14}
                          className="text-indigo-500"
                          fill="currentColor"
                        />
                        Primary Image
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Main display image · Click or drag to{" "}
                        {existingPrimary ? "replace" : "set"}
                      </p>
                    </div>
                    {newPrimary && (
                      <button
                        onClick={removePrimary}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={primaryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePrimaryInput}
                    className="hidden"
                  />

                  {newPrimary ? (
                    <div
                      className="relative w-full aspect-video max-h-[200px] rounded-xl border-2 border-indigo-400
                                 bg-white overflow-hidden flex items-center justify-center cursor-pointer group"
                      onClick={() => primaryInputRef.current?.click()}
                    >
                      <img
                        src={newPrimary.preview}
                        alt=""
                        className="w-full h-full object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow">
                          <Upload size={13} /> Replace
                        </span>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded flex items-center gap-1">
                        <Star size={9} fill="white" /> NEW PRIMARY
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragEnter={handleDragEnter("primary")}
                      onDragLeave={handleDragLeave}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handlePrimaryDrop}
                      onClick={() => primaryInputRef.current?.click()}
                      className={`w-full aspect-video max-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center
                                 justify-center gap-2 cursor-pointer transition-all ${
                                   dragTarget === "primary"
                                     ? "border-indigo-500 bg-indigo-50"
                                     : "border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                                 }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Star size={20} className="text-indigo-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {dragTarget === "primary"
                          ? "Drop to set as primary"
                          : "Click or drag primary image here"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {existingPrimary
                          ? "This will replace the current primary"
                          : "JPG, PNG, WebP · max 5MB"}
                      </p>
                    </div>
                  )}
                </div>

                {/* GALLERY */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-gray-500" />
                        Gallery Images
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Additional images · Hover to ★ promote or remove
                      </p>
                    </div>
                    {newGallery.length > 0 && (
                      <span className="text-xs text-green-600 font-medium">
                        {newGallery.length} pending
                      </span>
                    )}
                  </div>

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleGalleryInput}
                    className="hidden"
                  />

                  {newGallery.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {newGallery.map((img) => (
                        <div
                          key={img.id}
                          className="relative aspect-square group"
                        >
                          <div className="w-full h-full rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                            <img
                              src={img.preview}
                              alt=""
                              className="w-full h-full object-contain p-0.5"
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => promoteGalleryToPrimary(img.id)}
                              className="p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                              title="Set as primary"
                            >
                              <Star size={11} />
                            </button>
                            <button
                              onClick={() => removeGalleryNew(img.id)}
                              className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                              title="Remove"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => galleryInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center
                                   justify-center gap-1 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <Plus size={18} />
                        <span className="text-[9px]">Add</span>
                      </button>
                    </div>
                  )}

                  <div
                    onDragEnter={handleDragEnter("gallery")}
                    onDragLeave={handleDragLeave}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleGalleryDrop}
                    onClick={() => galleryInputRef.current?.click()}
                    className={`w-full py-5 border-2 border-dashed rounded-xl flex flex-col items-center
                               justify-center gap-2 cursor-pointer transition-all ${
                                 dragTarget === "gallery"
                                   ? "border-gray-500 bg-gray-100"
                                   : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                               }`}
                  >
                    <Upload size={20} className="text-gray-400" />
                    <p className="text-sm font-medium text-gray-600">
                      {dragTarget === "gallery"
                        ? "Drop gallery images here"
                        : "Click or drag gallery images"}
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG, PNG, WebP · max 5MB each
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />{" "}
                    {error}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ══ FOOTER ══ */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {hasChanges ? (
                <span className="text-amber-600 font-medium">
                  Unsaved changes
                </span>
              ) : (
                "No changes"
              )}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUploading || !hasChanges}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold
                           flex items-center gap-2 hover:bg-gray-800 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Unified image row component ──
const ImageRow = ({
  img,
  isSelected,
  isPrimary,
  isRaw,
  isNew,
  onClick,
  onDelete,
  onSetPrimary,
  onDownload,
}) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all group ${
      isSelected
        ? "bg-white ring-1 ring-gray-300 shadow-sm"
        : "hover:bg-white/80"
    }`}
  >
    <div
      className={`w-10 h-10 rounded-lg border overflow-hidden flex-shrink-0 bg-white flex items-center justify-center ${
        isPrimary
          ? "border-indigo-400 ring-1 ring-indigo-100"
          : isNew
            ? "border-green-300"
            : "border-gray-200"
      }`}
    >
      {img.resolvedUrl || img.preview ? (
        <img
          src={img.resolvedUrl || img.preview}
          alt=""
          className="w-full h-full object-contain p-0.5"
          onError={(e) => {
            e.target.style.opacity = "0.3";
          }}
        />
      ) : (
        <ImageOff size={14} className="text-gray-300" />
      )}
    </div>
    <div className="flex-1 min-w-0 flex items-center gap-1 flex-wrap">
      {isPrimary && (
        <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-bold flex items-center gap-0.5">
          <Star size={7} fill="currentColor" /> PRIMARY
        </span>
      )}
      {isNew && (
        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold">
          NEW
        </span>
      )}
      {isRaw && (
        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-bold">
          RAW
        </span>
      )}
      {!isNew && !isRaw && img.source === "UPLOADED" && (
        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold">
          VERIFIED
        </span>
      )}
    </div>
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
      {onSetPrimary && !isPrimary && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetPrimary();
          }}
          className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
          title="Set as primary"
        >
          <ArrowUp size={12} />
        </button>
      )}
      {onDownload && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload();
          }}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title="Download"
        >
          <Download size={12} />
        </button>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50"
        title="Remove"
      >
        <Trash2 size={12} />
      </button>
    </div>
  </div>
);

export default ImageUploadModal;
