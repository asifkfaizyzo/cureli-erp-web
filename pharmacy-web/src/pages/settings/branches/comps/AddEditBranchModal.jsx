// pharmacy-web/src/pages/settings/branches/comps/AddEditBranchModal.jsx (do not remove this comment)
// src/pages/settings/components/AddEditBranchModal.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  Building2,
  MapPin,
  Phone,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import { createBranch, updateBranch } from "../../../../api/branches";

// Import address utilities
import {
  loadPincodeMap,
  getPincodeData,
} from "../../../../utils/address/loadPincodeMap";
import { loadCityList, searchCities } from "../../../../utils/address/loadCityList";
import { loadStateList, searchStates } from "../../../../utils/address/loadStateList";

/**
 * AddEditBranchModal
 * Modal for adding or editing a branch
 */
const AddEditBranchModal = ({
  branch,
  onClose,
  isSuperAdmin,
}) => {
  const isEditMode = !!branch;
  const nameInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    branch_name: branch?.branch_name || "",
    address_line_1: branch?.address_line_1 || "",
    address_line_2: branch?.address_line_2 || "",
    city: branch?.city || "",
    state: branch?.state || "",
    pincode: branch?.pincode || "",
    contact_number: branch?.contact_number || "",
    alternate_number: branch?.alternate_number || "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Data loading states
  const [dataLoaded, setDataLoaded] = useState({
    pincode: false,
    city: false,
    state: false,
  });

  // Dropdown states
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [stateSuggestions, setStateSuggestions] = useState([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Refs
  const cityInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Focus on name input
  useEffect(() => {
    setTimeout(() => nameInputRef.current?.focus(), 100);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target) &&
        !cityInputRef.current?.contains(e.target)
      ) {
        setShowCityDropdown(false);
      }
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(e.target) &&
        !stateInputRef.current?.contains(e.target)
      ) {
        setShowStateDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Load data lazily
  const ensurePincodeLoaded = useCallback(async () => {
    if (!dataLoaded.pincode) {
      await loadPincodeMap();
      setDataLoaded((prev) => ({ ...prev, pincode: true }));
    }
  }, [dataLoaded.pincode]);

  const ensureCityLoaded = useCallback(async () => {
    if (!dataLoaded.city) {
      await loadCityList();
      setDataLoaded((prev) => ({ ...prev, city: true }));
    }
  }, [dataLoaded.city]);

  const ensureStateLoaded = useCallback(async () => {
    if (!dataLoaded.state) {
      await loadStateList();
      setDataLoaded((prev) => ({ ...prev, state: true }));
    }
  }, [dataLoaded.state]);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitError(null);
  };

  // Handle Pincode Input with auto-fill
  const handlePincodeChange = async (value) => {
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    handleChange("pincode", sanitized);

    if (sanitized.length === 6) {
      await ensurePincodeLoaded();
      const result = getPincodeData(sanitized);
      if (result) {
        setFormData((prev) => ({
          ...prev,
          pincode: sanitized,
          city: result.city,
          state: result.state,
        }));
        setShowCityDropdown(false);
        setShowStateDropdown(false);
        setCitySuggestions([]);
        setStateSuggestions([]);
      }
    }
  };

  // Handle City Input with Debounce
  const handleCityChange = async (value) => {
    handleChange("city", value);
    setActiveIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length < 2) {
      setCitySuggestions([]);
      setShowCityDropdown(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      await ensureCityLoaded();
      const results = searchCities(value, 10);
      setCitySuggestions(results);
      setShowCityDropdown(results.length > 0);
    }, 100);
  };

  const handleCitySelect = (item) => {
    setFormData((prev) => ({
      ...prev,
      city: item.city,
      state: item.state,
    }));
    setShowCityDropdown(false);
    setCitySuggestions([]);
    setActiveIndex(-1);
  };

  const handleStateChange = async (value) => {
    handleChange("state", value);
    setActiveIndex(-1);

    await ensureStateLoaded();
    const results = searchStates(value);
    setStateSuggestions(results);
    setShowStateDropdown(results.length > 0);
  };

  const handleStateSelect = (state) => {
    handleChange("state", state);
    setShowStateDropdown(false);
    setStateSuggestions([]);
    setActiveIndex(-1);
  };

  const handleStateFocus = async () => {
    await ensureStateLoaded();
    const results = searchStates(formData.state);
    setStateSuggestions(results);
    setShowStateDropdown(true);
  };

  const handleKeyDown = (e, type) => {
    const suggestions = type === "city" ? citySuggestions : stateSuggestions;
    const setShow = type === "city" ? setShowCityDropdown : setShowStateDropdown;

    if (!suggestions.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (type === "city") {
        handleCitySelect(suggestions[activeIndex]);
      } else {
        handleStateSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setShow(false);
      setActiveIndex(-1);
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    // Branch name (required)
    if (!formData.branch_name.trim()) {
      newErrors.branch_name = "Branch name is required";
    } else if (formData.branch_name.trim().length < 2) {
      newErrors.branch_name = "Name must be at least 2 characters";
    }

    // Pincode (optional but must be valid)
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    // Contact number (optional but must be valid)
    if (formData.contact_number && !/^[0-9]{10}$/.test(formData.contact_number.replace(/\D/g, ""))) {
      newErrors.contact_number = "Phone must be 10 digits";
    }

    // Alternate number (optional but must be valid)
    if (formData.alternate_number && !/^[0-9]{10}$/.test(formData.alternate_number.replace(/\D/g, ""))) {
      newErrors.alternate_number = "Phone must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        branch_name: formData.branch_name.trim(),
        address_line_1: formData.address_line_1.trim() || null,
        address_line_2: formData.address_line_2.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode || null,
        contact_number: formData.contact_number.replace(/\D/g, "") || null,
        alternate_number: formData.alternate_number.replace(/\D/g, "") || null,
      };

      if (isEditMode) {
        await updateBranch(branch.branch_id, payload);
      } else {
        await createBranch(payload);
      }

      onClose(true); // Refresh list
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(
        err.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} branch`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onClose(false)}
        className="absolute inset-0 bg-black/50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#000060]/10 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-[#000060]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditMode ? "Edit Branch" : "Add New Branch"}
            </h2>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            {/* Branch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={formData.branch_name}
                onChange={(e) => handleChange("branch_name", e.target.value)}
                placeholder="e.g., Main Branch, Downtown Store"
                disabled={!isSuperAdmin && isEditMode && branch?.is_main}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.branch_name
                    ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                    : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                } ${!isSuperAdmin && isEditMode && branch?.is_main ? "bg-gray-100" : ""}`}
              />
              {errors.branch_name && (
                <p className="text-red-500 text-xs mt-1">{errors.branch_name}</p>
              )}
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={formData.address_line_1}
                  onChange={(e) => handleChange("address_line_1", e.target.value)}
                  placeholder="Street address, building name"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20 transition-all"
                />
              </div>
            </div>

            {/* Address Line 2 */}
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 2
              </label>
              <input
                type="text"
                value={formData.address_line_2}
                onChange={(e) => handleChange("address_line_2", e.target.value)}
                placeholder="Apartment, suite, floor (optional)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20 transition-all"
              />
            </div> */}

            {/* Pincode, City, State Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  onFocus={ensurePincodeLoaded}
                  placeholder="123456"
                  maxLength={6}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.pincode
                      ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                      : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                  }`}
                />
                {errors.pincode && (
                  <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
                )}
              </div>

              {/* City */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  ref={cityInputRef}
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  onFocus={ensureCityLoaded}
                  onKeyDown={(e) => handleKeyDown(e, "city")}
                  autoComplete="off"
                  placeholder="City"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20 transition-all"
                />
                {showCityDropdown && citySuggestions.length > 0 && (
                  <ul
                    ref={cityDropdownRef}
                    className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-32 overflow-y-auto"
                  >
                    {citySuggestions.map((item, index) => (
                      <li
                        key={`${item.city}-${item.state}-${index}`}
                        onClick={() => handleCitySelect(item)}
                        className={`px-3 py-2 cursor-pointer text-sm ${
                          activeIndex === index
                            ? "bg-[#000060] text-white"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {item.city}, {item.state}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* State */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <div className="relative">
                  <input
                    ref={stateInputRef}
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    onFocus={handleStateFocus}
                    onKeyDown={(e) => handleKeyDown(e, "state")}
                    autoComplete="off"
                    placeholder="State"
                    className="w-full px-3 py-2.5 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20 transition-all"
                  />
                  <ChevronDown
                    size={14}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${
                      showStateDropdown ? "rotate-180" : ""
                    }`}
                  />
                </div>
                {showStateDropdown && stateSuggestions.length > 0 && (
                  <ul
                    ref={stateDropdownRef}
                    className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-32 overflow-y-auto"
                  >
                    {stateSuggestions.map((state, index) => (
                      <li
                        key={state}
                        onClick={() => handleStateSelect(state)}
                        className={`px-3 py-2 cursor-pointer text-sm ${
                          activeIndex === index
                            ? "bg-[#000060] text-white"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {state}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Contact Numbers */}
            <div className="grid grid-cols-2 gap-4">
              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) =>
                      handleChange(
                        "contact_number",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.contact_number
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                  />
                </div>
                {errors.contact_number && (
                  <p className="text-red-500 text-xs mt-1">{errors.contact_number}</p>
                )}
              </div>

              {/* Alternate Number */}
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternate Number
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    value={formData.alternate_number}
                    onChange={(e) =>
                      handleChange(
                        "alternate_number",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="Optional"
                    maxLength={10}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.alternate_number
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                  />
                </div>
                {errors.alternate_number && (
                  <p className="text-red-500 text-xs mt-1">{errors.alternate_number}</p>
                )}
              </div> */}
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500">
              💡 Enter pincode to auto-fill city and state
            </p>

            {/* Submit Error */}
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                <AlertCircle size={16} />
                {submitError}
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => onClose(false)}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditMode ? "Update Branch" : "Create Branch"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddEditBranchModal;