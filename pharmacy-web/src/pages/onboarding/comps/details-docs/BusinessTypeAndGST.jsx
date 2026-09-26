// pharmacy-web/src/pages/onboarding/comps/details-docs/BusinessTypeAndGST.jsx (do not remove this comment)
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { updateShopGst } from "../../../../api/shop";
import { useNavigate } from "react-router-dom";
import { Loader2, ChevronDown, Check } from "lucide-react";

const BusinessTypeAndGST = ({ onContinue }) => {
  const [form, setForm] = useState({
    type: "",
    gst: "",
  });

  const [errors, setErrors] = useState({});
  const [gstValid, setGstValid] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);

  const gstRef = useRef(null);
  const typeRef = useRef(null);
  const dropdownRef = useRef(null);

  const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  const businessTypes = [
    { value: "Sole Proprietorship", label: "Sole Proprietorship" },
    { value: "Partnership", label: "Partnership" },
    { value: "Private Limited", label: "Private Limited" },
    { value: "LLP", label: "LLP" },
  ];

  const navigate = useNavigate();
  const shop_id = localStorage.getItem("shop_id");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (!shop_id) {
      navigate("/signup");
      return;
    }
  }, [shop_id, navigate]);

  // Calculate dropdown position before opening
  const updateDropdownPosition = useCallback(() => {
    if (typeRef.current) {
      const rect = typeRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleDropdownToggle = () => {
    if (!isDropdownOpen) {
      updateDropdownPosition();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSelectOption = (value) => {
    setForm((prev) => ({ ...prev, type: value }));
    setErrors((prev) => ({ ...prev, type: "" }));
    setIsDropdownOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e) => {
      if (
        typeRef.current &&
        !typeRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Close on scroll and update position on resize
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleScroll = () => setIsDropdownOpen(false);
    const handleResize = () => updateDropdownPosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isDropdownOpen, updateDropdownPosition]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    let newErrors = {};

    if (!form.type.trim()) newErrors.type = "Please select a business type";
    if (!form.gst.trim()) newErrors.gst = "GST number is required";
    else if (!GST_REGEX.test(form.gst)) newErrors.gst = "Invalid GST format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      await updateShopGst({
        shop_id,
        business_type: form.type,
        gst_number: form.gst,
      });

      onContinue();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to save GST information");
    }

    setLoading(false);
  };

  // Get selected option label
  const selectedLabel = businessTypes.find((t) => t.value === form.type)?.label;

  // Render dropdown via portal
  const renderDropdown = () => {
    if (!isDropdownOpen || !dropdownPosition) return null;

    return createPortal(
      <div
        ref={dropdownRef}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 overflow-hidden"
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
        }}
      >
        {businessTypes.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelectOption(option.value)}
            className={`
                            w-full px-4 py-3 text-sm text-left flex items-center justify-between
                            transition-colors duration-150
                            ${
                              form.type === option.value
                                ? "bg-[#000060]/10 text-[#000060]"
                                : "text-gray-700 hover:bg-gray-50"
                            }
                        `}
          >
            <span className="font-medium">{option.label}</span>
            {form.type === option.value && (
              <Check size={16} className="text-[#000060] flex-shrink-0" />
            )}
          </button>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div
      className="w-full max-w-xl font-poppins"
      style={{ marginLeft: "-10%", marginTop: "30px" }}
    >
      <h2 className="text-[30px] font-semibold text-[#000006] mb-6">
        Add Your Business Type & GST Number
      </h2>

      {/* BUSINESS TYPE - Custom Dropdown */}
      <div className="mb-4">
        <label className="text-xs font-bold text-[#000060] block mb-1">
          Business Type *
        </label>
        <button
          ref={typeRef}
          type="button"
          onClick={handleDropdownToggle}
          className={`
                        w-full px-3 py-2.5 bg-white border rounded-lg text-left
                        flex items-center justify-between
                        transition-all duration-200
                        ${
                          errors.type
                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : isDropdownOpen
                            ? "border-[#000060] ring-2 ring-[#000060]/20"
                            : "border-gray-300 hover:border-gray-400 focus:ring-2 focus:ring-[#000060]/20"
                        }
                    `}
        >
          <span className={selectedLabel ? "text-gray-900" : "text-gray-400"}>
            {selectedLabel || "Select business type"}
          </span>
          <ChevronDown
            size={18}
            className={`
                            text-gray-400 transition-transform duration-200
                            ${isDropdownOpen ? "rotate-180 text-[#000060]" : ""}
                        `}
          />
        </button>
        {renderDropdown()}
        {errors.type && (
          <p className="text-red-500 text-xs mt-1">{errors.type}</p>
        )}
      </div>

      {/* GST NUMBER */}
      <div className="mb-4">
        <label className="text-xs font-bold text-[#000060] block mb-1">
          GST Number *
        </label>
        <input
          ref={gstRef}
          type="text"
          maxLength={15}
          value={form.gst}
          placeholder="Enter GST number"
          onChange={(e) => {
            const value = e.target.value.toUpperCase();
            handleChange("gst", value);
            setGstValid(value === "" ? null : GST_REGEX.test(value));
          }}
          className={`
                        w-full px-3 py-2.5 bg-white border rounded-lg transition-all duration-200
                        focus:outline-none focus:ring-2
                        ${
                          errors.gst
                            ? "border-red-500 focus:ring-red-500/20"
                            : gstValid === null
                            ? "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                            : gstValid
                            ? "border-green-500 focus:ring-green-500/20"
                            : "border-red-500 focus:ring-red-500/20"
                        }
                    `}
        />
        {gstValid === false && (
          <p className="text-red-500 text-xs mt-1">Invalid GST number</p>
        )}
        {gstValid === true && (
          <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
            <Check size={12} />
            Valid GST number
          </p>
        )}
        {errors.gst && !gstValid && (
          <p className="text-red-500 text-xs mt-1">{errors.gst}</p>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#000060] text-white py-3 rounded-xl mt-2
                           font-medium hover:bg-[#000060]/90 transition-all duration-200
                           disabled:bg-gray-400 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-[#000060]/50 focus:ring-offset-2"
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Saving...
          </div>
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );
};

export default BusinessTypeAndGST;
