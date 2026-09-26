// pharmacy-web/src/pages/setup/SetupBranchesPage.jsx (do not remove this comment)
// src/pages/setup/SetupBranchesPage.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Plus,
  Trash2,
  MapPin,
  Phone,
  ChevronRight,
  AlertCircle,
  Check,
  Loader2,
  Edit2,
  X,
  ChevronDown,
} from "lucide-react";

import { useSetupStore } from "../../store/useSetupStore";

// Import address loaders
import {
  loadPincodeMap,
  getPincodeData,
} from "../../utils/address/loadPincodeMap";
import { loadCityList, searchCities } from "../../utils/address/loadCityList";
import { loadStateList, searchStates } from "../../utils/address/loadStateList";

// Smooth spring animation config
const springConfig = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

const smoothTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

const SetupBranchesPage = () => {
  const navigate = useNavigate();

  const branches = useSetupStore((state) => state.branches);
  const planLimits = useSetupStore((state) => state.planLimits);
  const addBranch = useSetupStore((state) => state.addBranch);
  const updateBranch = useSetupStore((state) => state.updateBranch);
  const removeBranch = useSetupStore((state) => state.removeBranch);
  const setCurrentStep = useSetupStore((state) => state.setCurrentStep);
  const canAddBranchFn = useSetupStore((state) => state.canAddBranch);

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    branch_name: "",
    address_line_1: "",
    city: "",
    state: "",
    pincode: "",
    contact_number: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const nameInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const stateInputRef = useRef(null);
  const cityDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const maxBranches = planLimits.max_branches;
  const canAddMore = canAddBranchFn();
  const canContinue = branches.length >= 1;

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  useEffect(() => {
    if (showForm && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 150);
    }
  }, [showForm]);

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

  const resetForm = () => {
    setFormData({
      branch_name: "",
      address_line_1: "",
      city: "",
      state: "",
      pincode: "",
      contact_number: "",
    });
    setErrors({});
    setEditingBranch(null);
    setCitySuggestions([]);
    setStateSuggestions([]);
    setShowCityDropdown(false);
    setShowStateDropdown(false);
    setActiveIndex(-1);
  };

  const openAddForm = () => {
    if (!canAddMore) return;
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (branch) => {
    setFormData({
      branch_name: branch.branch_name,
      address_line_1: branch.address_line_1 || "",
      city: branch.city || "",
      state: branch.state || "",
      pincode: branch.pincode || "",
      contact_number: branch.contact_number || "",
    });
    setEditingBranch(branch);
    setCitySuggestions([]);
    setStateSuggestions([]);
    setShowCityDropdown(false);
    setShowStateDropdown(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setTimeout(resetForm, 300);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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

  const validate = () => {
    const newErrors = {};

    if (!formData.branch_name.trim()) {
      newErrors.branch_name = "Required";
    } else if (formData.branch_name.trim().length < 2) {
      newErrors.branch_name = "Min 2 chars";
    }

    const isDuplicate = branches.some(
      (b) =>
        b.branch_name.toLowerCase() === formData.branch_name.trim().toLowerCase() &&
        b.temp_id !== editingBranch?.temp_id
    );
    if (isDuplicate) {
      newErrors.branch_name = "Already exists";
    }

    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "6 digits";
    }

    if (formData.contact_number && !/^[0-9]{10}$/.test(formData.contact_number.replace(/\D/g, ""))) {
      newErrors.contact_number = "10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      if (editingBranch) {
        updateBranch(editingBranch.temp_id, {
          branch_name: formData.branch_name.trim(),
          address_line_1: formData.address_line_1.trim() || "",
          city: formData.city.trim() || "",
          state: formData.state.trim() || "",
          pincode: formData.pincode || "",
          contact_number: formData.contact_number.replace(/\D/g, "") || "",
        });
      } else {
        const result = addBranch({
          branch_name: formData.branch_name.trim(),
          address_line_1: formData.address_line_1.trim() || "",
          city: formData.city.trim() || "",
          state: formData.state.trim() || "",
          pincode: formData.pincode || "",
          contact_number: formData.contact_number.replace(/\D/g, "") || "",
        });

        if (!result.success) {
          setErrors({ submit: result.error });
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(false);
      closeForm();
    }, 300);
  };

  const handleDelete = (branch) => {
    if (window.confirm(`Remove "${branch.branch_name}"?`)) {
      removeBranch(branch.temp_id);
    }
  };

  const handleContinue = () => {
    if (!canContinue) return;
    navigate("/setup/users");
  };

  const formatAddress = (branch) => {
    const parts = [branch.address_line_1, branch.city, branch.state, branch.pincode].filter(Boolean);
    return parts.join(", ");
  };

  // Dropdown animation variants
  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      y: -8, 
      scale: 0.96,
      transition: { duration: 0.15, ease: "easeIn" }
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
  };

  // Card animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: springConfig
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: -10,
      transition: { duration: 0.2, ease: "easeIn" }
    },
  };

  // Form animation variants
  const formVariants = {
    hidden: { 
      opacity: 0, 
      y: -20, 
      height: 0,
      transition: { duration: 0.25, ease: [0.4, 0, 1, 1] }
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: "auto",
      transition: { 
        duration: 0.35, 
        ease: [0, 0, 0.2, 1],
        opacity: { duration: 0.25, delay: 0.1 }
      }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      height: 0,
      transition: { 
        duration: 0.25, 
        ease: [0.4, 0, 1, 1],
        height: { delay: 0.1 }
      }
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-6xl mx-auto"
    >
      {/* Header Row */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...smoothTransition, delay: 0.1 }}
        className="flex items-center justify-between gap-4 mb-4"
      >
        <div>
          <h1 className="text-xl font-bold text-[#000060]">Create Your Branches</h1>
          <p className="text-xs text-gray-500">
            Add at least one branch. Plan allows {maxBranches === -1 ? "unlimited" : maxBranches} branches.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {canAddMore && !showForm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={smoothTransition}
              onClick={openAddForm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000060] text-white rounded-lg text-sm font-medium hover:bg-[#000080] transition-colors shadow-md hover:shadow-lg"
            >
              <Plus size={14} />
              Add Branch
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Compact Form Panel - Appears at Top */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-4 overflow-hidden"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.2 }}
              className="bg-white border border-gray-200 rounded-xl p-3 "
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">
                  {editingBranch ? "Edit Branch" : "New Branch"}
                </h3>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={closeForm} 
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Form Grid - Horizontal */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {/* Branch Name */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <label className="block text-[10px] font-bold text-[#000060] mb-0.5">
                    Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.branch_name}
                    onChange={(e) => handleChange("branch_name", e.target.value)}
                    placeholder="Main Branch"
                    className={`w-full px-2 py-1.5 text-sm border rounded transition-all duration-200 focus:outline-none focus:ring-2 ${
                      errors.branch_name
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                  />
                  <AnimatePresence>
                    {errors.branch_name && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-red-500 text-[9px] mt-0.5"
                      >
                        {errors.branch_name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Address */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Address</label>
                  <input
                    type="text"
                    value={formData.address_line_1}
                    onChange={(e) => handleChange("address_line_1", e.target.value)}
                    placeholder="Street"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20"
                  />
                </motion.div>

                {/* Pincode */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    onFocus={ensurePincodeLoaded}
                    placeholder="123456"
                    maxLength={6}
                    className={`w-full px-2 py-1.5 text-sm border rounded transition-all duration-200 focus:outline-none focus:ring-2 ${
                      errors.pincode
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                  />
                  <AnimatePresence>
                    {errors.pincode && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-red-500 text-[9px] mt-0.5"
                      >
                        {errors.pincode}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* City */}
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">City</label>
                  <input
                    ref={cityInputRef}
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    onFocus={ensureCityLoaded}
                    onKeyDown={(e) => handleKeyDown(e, "city")}
                    autoComplete="off"
                    placeholder="City"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20"
                  />
                  <AnimatePresence>
                    {showCityDropdown && citySuggestions.length > 0 && (
                      <motion.ul
                        ref={cityDropdownRef}
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-28 overflow-y-auto"
                      >
                        {citySuggestions.map((item, index) => (
                          <motion.li
                            key={`${item.city}-${item.state}-${index}`}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            onClick={() => handleCitySelect(item)}
                            className={`px-2 py-1.5 cursor-pointer text-xs transition-colors duration-150 ${
                              activeIndex === index 
                                ? "bg-[#000060] text-white" 
                                : "hover:bg-[#000060]/10"
                            }`}
                          >
                            {item.city}, {item.state}
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* State */}
                <motion.div 
                  className="relative"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">State</label>
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
                      className="w-full px-2 py-1.5 pr-6 text-sm border border-gray-300 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#000060] focus:ring-[#000060]/20"
                    />
                    <motion.div
                      animate={{ rotate: showStateDropdown ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2"
                    >
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {showStateDropdown && stateSuggestions.length > 0 && (
                      <motion.ul
                        ref={stateDropdownRef}
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-28 overflow-y-auto"
                      >
                        {stateSuggestions.map((state, index) => (
                          <motion.li
                            key={state}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => handleStateSelect(state)}
                            className={`px-2 py-1.5 cursor-pointer text-xs transition-colors duration-150 ${
                              activeIndex === index 
                                ? "bg-[#000060] text-white" 
                                : "hover:bg-[#000060]/10"
                            }`}
                          >
                            {state}
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Phone */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => handleChange("contact_number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full px-2 py-1.5 text-sm border rounded transition-all duration-200 focus:outline-none focus:ring-2 ${
                      errors.contact_number
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                  />
                  <AnimatePresence>
                    {errors.contact_number && (
                      <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-red-500 text-[9px] mt-0.5"
                      >
                        {errors.contact_number}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Actions Row */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100"
              >
                <div className="text-[10px] text-gray-400">
                  <AnimatePresence mode="wait">
                    {errors.submit ? (
                      <motion.span 
                        key="error"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle size={10} /> {errors.submit}
                      </motion.span>
                    ) : (
                      <motion.span
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Only Name field is Mandatory • Enter pincode to auto-fill city & state
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeForm}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 px-3 py-1 bg-[#000060] text-white text-xs font-medium rounded hover:bg-[#000080] disabled:bg-gray-400 transition-colors shadow-md"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 size={10} />
                      </motion.div>
                    ) : (
                      <Check size={10} />
                    )}
                    {editingBranch ? "Update" : "Add"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Branch Cards Grid */}
      <motion.div 
        layout
        transition={springConfig}
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {branches.map((branch, index) => (
            <motion.div
              key={branch.temp_id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout
              layoutId={branch.temp_id}
              transition={{ ...springConfig, delay: index * 0.05 }}
              whileHover={{ 
                y: -2, 
                boxShadow: "0 8px 25px -5px rgba(0, 0, 96, 0.1), 0 4px 10px -5px rgba(0, 0, 96, 0.05)" 
              }}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-default"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-7 h-7 bg-[#000060]/10 rounded flex items-center justify-center flex-shrink-0"
                  >
                    <Building2 size={14} className="text-[#000060]" />
                  </motion.div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-800 text-sm truncate">
                      {branch.branch_name}
                    </h3>
                    {index === 0 && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[9px] text-emerald-600 font-medium"
                      >
                        Primary
                      </motion.span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openEditForm(branch)}
                    className="p-1 text-gray-400 hover:text-[#000060] rounded transition-colors"
                  >
                    <Edit2 size={12} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(branch)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                  >
                    <Trash2 size={12} />
                  </motion.button>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 space-y-0.5">
                {formatAddress(branch) && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-1"
                  >
                    <MapPin size={10} className="mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{formatAddress(branch)}</span>
                  </motion.div>
                )}
                {branch.contact_number && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1"
                  >
                    <Phone size={10} />
                    <span>{branch.contact_number}</span>
                  </motion.div>
                )}
                {!formatAddress(branch) && !branch.contact_number && (
                  <p className="text-gray-400 italic">No details</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        <AnimatePresence>
          {branches.length === 0 && !showForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={smoothTransition}
              className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center"
            >
              <motion.div
                animate={{ 
                  y: [0, -5, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <Building2 size={28} className="text-gray-400 mx-auto mb-2" />
              </motion.div>
              <p className="text-sm text-gray-600 mb-2">No branches yet</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openAddForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#000060] text-white rounded text-sm font-medium hover:bg-[#000080] shadow-md"
              >
                <Plus size={14} />
                Add First Branch
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add More Card (Mobile) */}
        <AnimatePresence>
          {branches.length > 0 && canAddMore && !showForm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ 
                scale: 1.02, 
                borderColor: "#000060",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.98 }}
              onClick={openAddForm}
              className="lg:hidden flex flex-col items-center justify-center gap-1 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-[#000060] transition-colors"
            >
              <Plus size={18} />
              <span className="text-xs font-medium">Add More</span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Limit Reached */}
      <AnimatePresence>
        {!canAddMore && branches.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={smoothTransition}
            className="mt-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs"
          >
            <AlertCircle size={12} />
            <span>Branch limit reached. Upgrade to add more.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...smoothTransition, delay: 0.2 }}
        className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200"
      >
        <AnimatePresence mode="wait">
          <motion.p 
            key={branches.length === 0 ? "warning" : "success"}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={smoothTransition}
            className="text-xs text-gray-500"
          >
            {branches.length === 0 ? (
              <span className="text-amber-600 flex items-center gap-1">
                <AlertCircle size={11} />
                Add at least one branch
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check size={11} />
                </motion.span>
                {branches.length} branch{branches.length !== 1 ? "es" : ""} added
              </span>
            )}
          </motion.p>
        </AnimatePresence>

        <motion.button
          whileHover={canContinue ? { scale: 1.02, x: 2 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          onClick={handleContinue}
          disabled={!canContinue}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
            canContinue
              ? "bg-[#000060] text-white hover:bg-[#000080] shadow-md hover:shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          Continue
          <motion.span
            animate={canContinue ? { x: [0, 3, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronRight size={14} />
          </motion.span>
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default SetupBranchesPage;