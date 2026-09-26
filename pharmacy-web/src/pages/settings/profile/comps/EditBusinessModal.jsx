// pharmacy-web/src/pages/settings/profile/comps/EditBusinessModal.jsx (do not remove this comment)
// Q:\YourZeroesAndOnes\cureli\curely_erp\pharmacy-web\src\pages\settings\profile\comps\EditBusinessModal.jsx

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Building2,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import { updateBusiness } from "../../../../api/profile";

// Import your existing address utilities if you have them
// import { loadStateList } from "../../../utils/address/loadStateList";
// import { loadCityList } from "../../../utils/address/loadCityList";

/**
 * EditBusinessModal
 * Modal for editing business/shop information
 */
const EditBusinessModal = ({ shop, onClose }) => {
  const [formData, setFormData] = useState({
    business_name: shop.business_name || "",
    address_line_1: shop.address_line_1 || "",
    address_line_2: shop.address_line_2 || "",
    city: shop.city || "",
    state: shop.state || "",
    pincode: shop.pincode || "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Indian states list (you can import from your existing utils)
  const states = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Puducherry",
    "Chandigarh",
  ];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitError(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.business_name.trim()) {
      newErrors.business_name = "Business name is required";
    } else if (formData.business_name.trim().length < 2) {
      newErrors.business_name = "Business name must be at least 2 characters";
    }

    if (!formData.address_line_1.trim()) {
      newErrors.address_line_1 = "Address is required";
    } else if (formData.address_line_1.trim().length < 5) {
      newErrors.address_line_1 = "Address must be at least 5 characters";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state) {
      newErrors.state = "State is required";
    }

    if (!formData.pincode) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasChanges = () => {
    return (
      formData.business_name !== shop.business_name ||
      formData.address_line_1 !== shop.address_line_1 ||
      formData.address_line_2 !== (shop.address_line_2 || "") ||
      formData.city !== shop.city ||
      formData.state !== shop.state ||
      formData.pincode !== shop.pincode
    );
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!hasChanges()) {
      onClose(false);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateBusiness(formData);
      setSuccess(true);

      // Auto close after success
      setTimeout(() => {
        onClose(true);
      }, 1500);
    } catch (err) {
      console.error("Update business error:", err);
      setSubmitError(
        err.response?.data?.message || "Failed to update business information",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success State
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/50"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Updated!</h3>
          <p className="text-gray-500">
            Business information updated successfully.
          </p>
        </motion.div>
      </div>
    );
  }

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
          <h2 className="text-lg font-bold text-gray-900">
            Edit Business Information
          </h2>
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
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) =>
                    handleChange("business_name", e.target.value)
                  }
                  placeholder="Your Business Name"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.business_name
                      ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                      : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                  }`}
                />
              </div>
              {errors.business_name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.business_name}
                </p>
              )}
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={formData.address_line_1}
                  onChange={(e) =>
                    handleChange("address_line_1", e.target.value)
                  }
                  placeholder="Street address, building name"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.address_line_1
                      ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                      : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                  }`}
                />
              </div>
              {errors.address_line_1 && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.address_line_1}
                </p>
              )}
            </div>

            {/* City & State Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="City"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.city
                      ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                      : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                  }`}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className={`w-full px-4 py-2.5 pr-8 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 appearance-none cursor-pointer transition-all ${
                      errors.state
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                  >
                    <option value="">Select state</option>
                    {states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                )}
              </div>
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) =>
                  handleChange(
                    "pincode",
                    e.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                placeholder="6-digit pincode"
                maxLength={6}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                  errors.pincode
                    ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                    : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                }`}
              />
              {errors.pincode && (
                <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
              )}
            </div>

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
            disabled={isSubmitting || !hasChanges()}
            className="flex items-center gap-2 px-6 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditBusinessModal;
