// cadmin-web/src/pages/MasterMedicines/comps/CreateMedicineModal.jsx (do not remove this comment)
import { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Loader2,
  Pill,
  Building2,
  Package,
  FileText,
  AlertCircle,
  CheckCircle2,
  Info,
  Trash2,
  Beaker,
  Key,
  ChevronDown,
  ChevronUp,
  Upload,
  Image as ImageIcon,
  Star,
  ImageOff,
} from "lucide-react";
import StyledSelect from "../../../components/common/StyledSelect";

// ── Constants ──
const FORM_OPTIONS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Ointment",
  "Gel",
  "Drops",
  "Inhaler",
  "Powder",
  "Suspension",
  "Lotion",
  "Spray",
  "Patch",
  "Suppository",
  "Solution",
  "Sachet",
  "Other",
].map((f) => ({ value: f, label: f }));

const TYPE_OPTIONS = [
  { value: "DRUG", label: "Drug (Rx)" },
  { value: "OTC", label: "OTC (Over-the-Counter)" },
];

const SCHEDULE_OPTIONS = [
  { value: "", label: "None" },
  { value: "H", label: "Schedule H" },
  { value: "H1", label: "Schedule H1" },
  { value: "X", label: "Schedule X" },
  { value: "G", label: "Schedule G" },
];

const MAX_IMAGES = 8;
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const generateMasterKey = (genericName, form) => {
  if (!genericName) return "";
  let key = genericName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "_")
    .trim();
  if (form) key += `_${form.toLowerCase()}`;
  return key;
};

const CreateMedicineModal = ({ isOpen, item, onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    type: "DRUG",
    form: "",
    composition: [],
    manufacturer: "",
    marketer: "",
    packSize: "",
    prescriptionRequired: false,
    hsn_code: "",
    schedule: "",
    category: "",
    subCategory: "",
  });

  // Image state
  const [images, setImages] = useState([]);
  const [imageErrors, setImageErrors] = useState([]);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen && item) {
      const initialName = item.sampleNames?.[0] || item.normalizedName || "";
      setFormData({
        name: initialName,
        genericName: item.genericNames?.[0] || initialName,
        type: item.type || "DRUG",
        form: "",
        composition: [],
        manufacturer: item.manufacturers?.[0] || "",
        marketer: "",
        packSize: item.packSizes?.[0] || "",
        prescriptionRequired:
          item.type === "DRUG" || item.schedules?.length > 0,
        hsn_code: item.hsnCodes?.[0] || "",
        schedule: item.schedules?.[0] || "",
        category: item.categories?.[0] || "",
        subCategory: item.subCategories?.[0] || "",
      });
      setImages([]);
      setImageErrors([]);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
      setShowAdvanced(
        !!(
          item.schedules?.length ||
          item.categories?.length ||
          item.subCategories?.length ||
          item.hsnCodes?.length
        ),
      );
    }
  }, [isOpen, item]);

  // Cleanup previews
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  // ESC
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

  if (!isOpen || !item) return null;

  const autoFilledFields = {
    manufacturer: item.manufacturers?.length > 0,
    packSize: item.packSizes?.length > 0,
    hsn_code: item.hsnCodes?.length > 0,
    schedule: item.schedules?.length > 0,
    category: item.categories?.length > 0,
    subCategory: item.subCategories?.length > 0,
    genericName: item.genericNames?.length > 0,
  };
  const autoFilledCount =
    Object.values(autoFilledFields).filter(Boolean).length;
  const masterKeyPreview = generateMasterKey(
    formData.genericName,
    formData.form,
  );
  const primaryImage = images.find((img) => img.type === "PRIMARY");

  // ── Image handlers ──
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const errs = [];
    const remaining = MAX_IMAGES - images.length;

    if (files.length > remaining) {
      errs.push(`Max ${MAX_IMAGES} images. You can add ${remaining} more.`);
    }

    const valid = files.slice(0, remaining).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        errs.push(`"${f.name}": only JPG, PNG, WebP allowed`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errs.push(`"${f.name}": max ${MAX_FILE_SIZE_MB}MB`);
        return false;
      }
      return true;
    });

    setImageErrors(errs);

    const newImgs = valid.map((file, i) => ({
      id: `${Date.now()}_${i}`,
      file,
      preview: URL.createObjectURL(file),
      type: images.length === 0 && i === 0 ? "PRIMARY" : "GALLERY",
    }));

    setImages((prev) => [...prev, ...newImgs]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      const updated = prev.filter((img) => img.id !== id);
      if (removed?.type === "PRIMARY" && updated.length > 0) {
        updated[0] = { ...updated[0], type: "PRIMARY" };
      }
      return updated;
    });
  };

  const setPrimary = (id) => {
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        type: img.id === id ? "PRIMARY" : "GALLERY",
      })),
    );
  };

  // ── Validation ──
  const validateField = (field, value) => {
    if (field === "name") {
      if (!value.trim()) return "Name is required";
      if (value.length < 3) return "Min 3 characters";
      if (value.length > 200) return "Max 200 characters";
    }
    if (field === "genericName") {
      if (!value.trim()) return "Generic name is required";
      if (value.length < 2) return "Too short";
    }
    if (field === "manufacturer" && !value.trim())
      return "Manufacturer is required";
    if (field === "form" && !value) return "Form is required";
    return "";
  };

  const validate = () => {
    const errs = {};
    ["name", "genericName", "manufacturer", "form"].forEach((f) => {
      const e = validateField(f, formData[f]);
      if (e) errs[f] = e;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({
      ...e,
      [field]: validateField(field, formData[field]),
    }));
  };

  const handleChange = (field, value) => {
    setFormData((f) => ({ ...f, [field]: value }));
    if (touched[field]) {
      setErrors((e) => ({ ...e, [field]: validateField(field, value) }));
    }
  };

  // Composition
  const addComp = () =>
    setFormData((f) => ({
      ...f,
      composition: [...f.composition, { name: "", strength: "" }],
    }));

  const updateComp = (idx, field, value) => {
    const updated = [...formData.composition];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData((f) => ({ ...f, composition: updated }));
  };

  const removeComp = (idx) =>
    setFormData((f) => ({
      ...f,
      composition: f.composition.filter((_, i) => i !== idx),
    }));

  const handleSubmit = async () => {
    setTouched({
      name: true,
      genericName: true,
      manufacturer: true,
      form: true,
    });
    if (!validate()) return;
    setIsSubmitting(true);

    const payload = {
      ...formData,
      masterKey: masterKeyPreview,
      composition: formData.composition.filter((c) => c.name.trim()),
      images: images.map((img) => ({ file: img.file, type: img.type })),
    };

    // Let the parent handle the actual API call
    try {
      await onConfirm(payload);
    } catch (err) {
      // If parent throws, keep modal open
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden
                   animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ══ Header ══ */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Plus size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">
                  Create New Master Medicine
                </h2>
                <p className="text-white/70 text-sm">
                  Add a new medicine to the global catalog
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ══ Source Info ══ */}
        <div className="px-6 py-2.5 bg-green-50 border-b border-green-100 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-green-600 font-medium">
                Source:
              </span>
              <span className="px-2.5 py-0.5 bg-white rounded-md text-sm font-semibold text-gray-800 shadow-sm">
                {item.normalizedName}
              </span>
              <span className="text-xs text-green-500">
                {item.occurrenceCount}× across {item.shopCount} shops
              </span>
            </div>
            <div className="flex items-center gap-2">
              {autoFilledCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <Info size={10} />
                  {autoFilledCount} auto-filled
                </span>
              )}
              {images.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                  <ImageIcon size={10} />
                  {images.length} image{images.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          {item.sampleNames?.length > 1 && (
            <div className="flex flex-wrap gap-1 mt-2 items-center">
              <span className="text-[11px] text-green-600">Pick a name:</span>
              {item.sampleNames.slice(0, 6).map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChange("name", name)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    formData.name === name
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-600 hover:bg-green-100"
                  }`}
                >
                  {name}
                </button>
              ))}
              {item.sampleNames.length > 6 && (
                <span className="text-[11px] text-green-400">
                  +{item.sampleNames.length - 6}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ══ FORM BODY — two-column layout ══ */}
        {/* 
          KEY LAYOUT CHANGE:
          - Outer wrapper: flex row, fixed height (fills remaining space)
          - Left col: fixed width, does NOT scroll (sticky image panel)
          - Right col: fills rest, scrolls independently
        */}
        <div className="flex flex-1 min-h-0">
          {/* ── LEFT COLUMN: Image Upload — sticky, no scroll ── */}
          <div className="w-64 flex-shrink-0 border-r border-gray-100 p-5 flex flex-col gap-4 bg-gray-50/30 overflow-y-auto">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <ImageIcon size={15} />
                Images
              </h3>
              <p className="text-[11px] text-gray-400">
                First image = Primary. Hover to set/remove.
              </p>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Primary image preview */}
            <div
              className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 bg-gray-50
                         overflow-hidden flex items-center justify-center cursor-pointer
                         hover:border-green-400 transition-colors relative group"
              onClick={() => !primaryImage && fileInputRef.current?.click()}
            >
              {primaryImage ? (
                <>
                  <img
                    src={primaryImage.preview}
                    alt="Primary"
                    className="w-full h-full object-contain p-2"
                  />
                  {/* Overlay */}
                  <div
                    className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors
                                  flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(primaryImage.id);
                      }}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {/* Primary badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                    <Star size={9} fill="white" />
                    PRIMARY
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 p-4 text-center">
                  <Upload size={28} />
                  <span className="text-sm font-medium">
                    Upload Primary Image
                  </span>
                  <span className="text-xs">
                    JPG, PNG, WebP · Max {MAX_FILE_SIZE_MB}MB
                  </span>
                </div>
              )}
            </div>

            {/* Gallery thumbnails */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img) => {
                  const isPrimary = img.type === "PRIMARY";
                  return (
                    <div
                      key={img.id}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-white group ${
                        isPrimary ? "border-green-400" : "border-gray-200"
                      }`}
                    >
                      <img
                        src={img.preview}
                        alt=""
                        className="w-full h-full object-contain p-0.5"
                      />
                      {/* Hover overlay */}
                      <div
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors
                                      flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100"
                      >
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => setPrimary(img.id)}
                            className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                            title="Set as primary"
                          >
                            <Star size={11} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Remove"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      {isPrimary && (
                        <div className="absolute bottom-0 inset-x-0 bg-green-600 text-white text-[8px] font-bold text-center py-0.5">
                          PRIMARY
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add more */}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300
                               flex flex-col items-center justify-center gap-1
                               text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
                  >
                    <Plus size={18} />
                    <span className="text-[9px]">Add</span>
                  </button>
                )}
              </div>
            )}

            {images.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400
                           hover:border-green-400 hover:text-green-600 transition-colors
                           flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Add gallery images
              </button>
            )}

            {/* Image errors */}
            {imageErrors.length > 0 && (
              <div className="space-y-1">
                {imageErrors.map((err, i) => (
                  <p
                    key={i}
                    className="text-xs text-red-600 flex items-start gap-1"
                  >
                    <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
                    {err}
                  </p>
                ))}
              </div>
            )}

            <p className="text-[10px] text-gray-400 mt-auto">
              {images.length}/{MAX_IMAGES} images · Hover thumbnails to star or
              remove
            </p>
          </div>

          {/* ── RIGHT COLUMN: Form Fields — scrollable ── */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            {/* Section 1: Identity */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Pill size={15} />
                Identity
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FormField
                    label="Medicine Name (Variant)"
                    required
                    value={formData.name}
                    onChange={(v) => handleChange("name", v)}
                    onBlur={() => handleBlur("name")}
                    error={errors.name}
                    touched={touched.name}
                    placeholder='e.g., "Dolo 650 Tablet"'
                    hint="The specific product name as sold"
                  />
                </div>

                <div>
                  <FormField
                    label="Generic Name"
                    required
                    autoFilled={autoFilledFields.genericName}
                    value={formData.genericName}
                    onChange={(v) => handleChange("genericName", v)}
                    onBlur={() => handleBlur("genericName")}
                    error={errors.genericName}
                    touched={touched.genericName}
                    placeholder='e.g., "Paracetamol Tablet"'
                    hint="Canonical group name"
                    alternatives={item.genericNames?.filter(
                      (n) => n !== formData.genericName,
                    )}
                    onPickAlternative={(v) => handleChange("genericName", v)}
                  />
                </div>

                {/* Form — StyledSelect */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form <span className="text-red-500">*</span>
                  </label>
                  <StyledSelect
                    value={formData.form}
                    onChange={(v) => {
                      handleChange("form", v);
                      if (touched.form) {
                        setErrors((e) => ({
                          ...e,
                          form: validateField("form", v),
                        }));
                      }
                    }}
                    options={FORM_OPTIONS}
                    placeholder="Select form..."
                    error={
                      errors.form && touched.form ? errors.form : undefined
                    }
                  />
                  {errors.form && touched.form && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.form}
                    </p>
                  )}
                </div>

                {/* Type — StyledSelect */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <StyledSelect
                    value={formData.type}
                    onChange={(v) => handleChange("type", v)}
                    options={TYPE_OPTIONS}
                    placeholder="Select type..."
                  />
                </div>

                {/* Rx checkbox */}
                <div className="flex items-center col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.prescriptionRequired}
                      onChange={(e) =>
                        handleChange("prescriptionRequired", e.target.checked)
                      }
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">
                      Prescription Required
                    </span>
                  </label>
                </div>
              </div>

              {/* Master key preview */}
              {masterKeyPreview && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                  <Key size={13} className="text-gray-400" />
                  <span className="text-xs text-gray-400">Master Key:</span>
                  <code className="text-xs text-indigo-600 font-mono font-medium">
                    {masterKeyPreview}
                  </code>
                </div>
              )}
            </div>

            {/* Section 2: Composition */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Beaker size={15} />
                  Composition
                </h3>
                <button
                  type="button"
                  onClick={addComp}
                  className="text-xs text-green-600 font-medium hover:text-green-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-green-50 transition-colors"
                >
                  <Plus size={12} />
                  Add
                </button>
              </div>

              {formData.composition.length === 0 ? (
                <button
                  type="button"
                  onClick={addComp}
                  className="w-full py-5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-400
                             hover:border-green-400 hover:text-green-600 transition-colors
                             flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add composition (name + strength)
                </button>
              ) : (
                <div className="space-y-2">
                  {formData.composition.map((comp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) =>
                          updateComp(idx, "name", e.target.value)
                        }
                        placeholder="e.g., Paracetamol"
                        className="flex-1 h-9 px-3 border border-gray-300 rounded-lg text-sm
                                   focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                      <input
                        type="text"
                        value={comp.strength}
                        onChange={(e) =>
                          updateComp(idx, "strength", e.target.value)
                        }
                        placeholder="e.g., 500mg"
                        className="w-24 h-9 px-3 border border-gray-300 rounded-lg text-sm
                                   focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeComp(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Manufacturer */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Building2 size={15} />
                Manufacturer / Marketer
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Manufacturer"
                  required
                  autoFilled={autoFilledFields.manufacturer}
                  value={formData.manufacturer}
                  onChange={(v) => handleChange("manufacturer", v)}
                  onBlur={() => handleBlur("manufacturer")}
                  error={errors.manufacturer}
                  touched={touched.manufacturer}
                  placeholder="e.g., Cipla Ltd"
                  alternatives={item.manufacturers?.filter(
                    (m) => m !== formData.manufacturer,
                  )}
                  onPickAlternative={(v) => handleChange("manufacturer", v)}
                />
                <FormField
                  label="Marketer"
                  value={formData.marketer}
                  onChange={(v) => handleChange("marketer", v)}
                  placeholder="Leave empty if same"
                />
              </div>
            </div>

            {/* Section 4: Pack Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Package size={15} />
                Pack Information
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Pack Size"
                  autoFilled={autoFilledFields.packSize}
                  value={formData.packSize}
                  onChange={(v) => handleChange("packSize", v)}
                  placeholder="e.g., 10 tablets"
                  alternatives={item.packSizes?.filter(
                    (p) => p !== formData.packSize,
                  )}
                  onPickAlternative={(v) => handleChange("packSize", v)}
                />
                <FormField
                  label="HSN Code"
                  autoFilled={autoFilledFields.hsn_code}
                  value={formData.hsn_code}
                  onChange={(v) => handleChange("hsn_code", v)}
                  placeholder="e.g., 30049099"
                  mono
                />
              </div>
            </div>

            {/* Section 5: Classification (collapsible) */}
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText size={15} />
                  Classification
                  {(autoFilledFields.schedule || autoFilledFields.category) && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] rounded font-medium">
                      HAS DATA
                    </span>
                  )}
                </span>
                {showAdvanced ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </button>

              {showAdvanced && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3">
                    {/* Schedule — StyledSelect */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Schedule
                      </label>
                      <StyledSelect
                        value={formData.schedule}
                        onChange={(v) => handleChange("schedule", v)}
                        options={SCHEDULE_OPTIONS}
                        placeholder="None"
                      />
                    </div>
                    <FormField
                      label="Category"
                      value={formData.category}
                      onChange={(v) => handleChange("category", v)}
                      placeholder="e.g., Analgesics"
                    />
                    <FormField
                      label="Sub-Category"
                      value={formData.subCategory}
                      onChange={(v) => handleChange("subCategory", v)}
                      placeholder="e.g., Antipyretics"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom spacer so last section isn't glued to footer */}
            <div className="h-2" />
          </div>
        </div>

        {/* ══ Footer ══ */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <p className="text-xs text-gray-400">
                <span className="text-red-500">*</span> Required
              </p>
              {images.length > 0 && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <ImageIcon size={11} />
                  {images.length} image{images.length !== 1 ? "s" : ""} ready
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold
                           flex items-center gap-2 hover:bg-green-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Create Medicine
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

// ═══════════════════════════════════════════════════════════════
// REUSABLE FORM FIELD
// ═══════════════════════════════════════════════════════════════

const FormField = ({
  label,
  required = false,
  autoFilled = false,
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  hint,
  mono = false,
  alternatives = [],
  onPickAlternative,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {autoFilled && (
        <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[10px] rounded font-medium">
          AUTO
        </span>
      )}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={`w-full h-10 px-3 border rounded-lg text-sm
                  focus:ring-2 focus:ring-green-500/20 focus:border-green-500
                  ${mono ? "font-mono" : ""}
                  ${error && touched ? "border-red-300 bg-red-50" : "border-gray-300"}`}
    />
    {error && touched && (
      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
        <AlertCircle size={12} />
        {error}
      </p>
    )}
    {hint && !error && (
      <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>
    )}
    {alternatives?.length > 0 && onPickAlternative && (
      <div className="mt-1 flex flex-wrap gap-1">
        <span className="text-[10px] text-gray-400">Also:</span>
        {alternatives.slice(0, 3).map((alt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onPickAlternative(alt)}
            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            {alt}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default CreateMedicineModal;
