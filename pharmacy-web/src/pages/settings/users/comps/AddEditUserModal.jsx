// pharmacy-web/src/pages/settings/users/comps/AddEditUserModal.jsx (do not remove this comment)
// src/pages/settings/components/AddEditUserModal.jsx

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Phone,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

import {
  createUser,
  updateUser,
  checkUsernameAvailability,
  checkPhoneAvailability,
} from "../../../../api/users";
import { fetchBranchesDropdown } from "../../../../api/branches";
import StyledSelect from "../../../../components/common/StyledSelect";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Role options for StyledSelect
const ROLE_OPTIONS = [
  { value: "branch_admin", label: "Branch Admin" },
  { value: "staff", label: "Staff" },
];

/**
 * AddEditUserModal
 * Modal for adding or editing a user
 */
const AddEditUserModal = ({
  user,
  branches: initialBranches,
  onClose,
  isSuperAdmin,
  currentBranchId,
}) => {
  const isEditMode = !!user;
  const nameInputRef = useRef(null);

  // Branches state
  const [branches, setBranches] = useState(initialBranches || []);

  // Form state
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    phone_number: user?.phone_number || "",
    username: user?.username || "",
    password: "",
    confirmPassword: "",
    role: user?.role || (isSuperAdmin ? "" : "staff"),
    branch_id: user?.branch_id || (isSuperAdmin ? "" : currentBranchId),
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Availability checks
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [phoneStatus, setPhoneStatus] = useState(null);

  const debouncedUsername = useDebounce(formData.username, 500);
  const debouncedPhone = useDebounce(formData.phone_number, 500);

  // Load branches if not provided
  useEffect(() => {
    if (isSuperAdmin && branches.length === 0) {
      fetchBranchesDropdown()
        .then((res) => {
          if (res.success) {
            setBranches(res.data.branches || []);
          }
        })
        .catch(console.error);
    }
  }, [isSuperAdmin, branches.length]);

  // Focus on name input
  useEffect(() => {
    setTimeout(() => nameInputRef.current?.focus(), 100);
  }, []);

  // Check username availability
  useEffect(() => {
    const checkUsername = async () => {
      const username = debouncedUsername.toLowerCase().trim();

      if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
        setUsernameStatus(null);
        return;
      }

      // Skip check if username hasn't changed in edit mode
      if (isEditMode && username === user.username.toLowerCase()) {
        setUsernameStatus("available");
        return;
      }

      setUsernameStatus("checking");

      try {
        const res = await checkUsernameAvailability(
          username,
          isEditMode ? user.user_id : null
        );
        setUsernameStatus(res.data?.available ? "available" : "taken");
      } catch {
        setUsernameStatus(null);
      }
    };

    checkUsername();
  }, [debouncedUsername, isEditMode, user]);

  // Check phone availability
  useEffect(() => {
    const checkPhone = async () => {
      const phone = debouncedPhone.replace(/\D/g, "");

      if (!phone || phone.length !== 10) {
        setPhoneStatus(null);
        return;
      }

      // Skip check if phone hasn't changed in edit mode
      if (isEditMode && phone === user.phone_number) {
        setPhoneStatus("available");
        return;
      }

      setPhoneStatus("checking");

      try {
        const res = await checkPhoneAvailability(
          phone,
          isEditMode ? user.user_id : null
        );
        setPhoneStatus(res.data?.available ? "available" : "taken");
      } catch {
        setPhoneStatus(null);
      }
    };

    checkPhone();
  }, [debouncedPhone, isEditMode, user]);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    setSubmitError(null);
  };

  // Auto-generate username from name
  const handleNameChange = (value) => {
    handleChange("full_name", value);

    // Auto-generate username only if creating and username is empty
    if (!isEditMode && !formData.username && value.length > 2) {
      const username =
        value
          .toLowerCase()
          .trim()
          .replace(/\s+/g, "_")
          .replace(/[^a-z0-9_]/g, "") +
        "_" +
        Date.now().toString().slice(-4);
      setFormData((prev) => ({ ...prev, username }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    // Full name
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Name is required";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Name must be at least 2 characters";
    }

    // Phone
    if (!formData.phone_number) {
      newErrors.phone_number = "Phone is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone_number.replace(/\D/g, ""))) {
      newErrors.phone_number = "Phone must be 10 digits";
    } else if (phoneStatus === "taken") {
      newErrors.phone_number = "Phone already registered";
    }

    // Username
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-z0-9_]+$/.test(formData.username.toLowerCase())) {
      newErrors.username = "Only lowercase letters, numbers, and underscores";
    } else if (usernameStatus === "taken") {
      newErrors.username = "Username is taken";
    }

    // Password (required for create, optional for edit)
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    // Role
    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    // Branch
    if (!formData.branch_id) {
      newErrors.branch_id = "Branch is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    // Wait for availability checks
    if (usernameStatus === "checking" || phoneStatus === "checking") {
      setSubmitError("Please wait for validation to complete");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditMode) {
        // Build update payload (only changed fields)
        const updates = {};

        if (formData.full_name !== user.full_name) {
          updates.full_name = formData.full_name.trim();
        }
        if (formData.phone_number !== user.phone_number) {
          updates.phone_number = formData.phone_number.replace(/\D/g, "");
        }
        if (formData.username.toLowerCase() !== user.username.toLowerCase()) {
          updates.username = formData.username.toLowerCase();
        }

        // SA only fields
        if (isSuperAdmin) {
          if (formData.role !== user.role) {
            updates.role = formData.role;
          }
          if (formData.branch_id !== user.branch_id) {
            updates.branch_id = formData.branch_id;
          }
        }

        if (Object.keys(updates).length === 0) {
          onClose(false);
          return;
        }

        await updateUser(user.user_id, updates);
      } else {
        // Create new user
        await createUser({
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.replace(/\D/g, ""),
          username: formData.username.toLowerCase(),
          password: formData.password,
          role: formData.role,
          branch_id: formData.branch_id,
        });
      }

      onClose(true); // Refresh list
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(
        err.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} user`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status indicator component
  const StatusIndicator = ({ status }) => {
    if (status === "checking") {
      return <Loader2 size={14} className="animate-spin text-gray-400" />;
    }
    if (status === "available") {
      return <CheckCircle2 size={14} className="text-emerald-500" />;
    }
    if (status === "taken") {
      return <XCircle size={14} className="text-red-500" />;
    }
    return null;
  };

  // Get available roles based on current user role
  const availableRoleOptions = isSuperAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((r) => r.value === "staff");

  // Convert branches to options for StyledSelect
  const branchOptions = branches.map((branch) => ({
    value: branch.branch_id,
    label: branch.is_main ? `${branch.branch_name} (Main)` : branch.branch_name,
  }));

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
            {isEditMode ? "Edit User" : "Add New User"}
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
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={nameInputRef}
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                    errors.full_name
                      ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                      : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                  }`}
                />
              </div>
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Phone & Username Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) =>
                      handleChange(
                        "phone_number",
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.phone_number || phoneStatus === "taken"
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : phoneStatus === "available"
                        ? "border-emerald-400 focus:ring-emerald-400/30 focus:border-emerald-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <StatusIndicator status={phoneStatus} />
                  </div>
                </div>
                {errors.phone_number && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone_number}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <AtSign
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      handleChange(
                        "username",
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    placeholder="john_doe"
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                      errors.username || usernameStatus === "taken"
                        ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                        : usernameStatus === "available"
                        ? "border-emerald-400 focus:ring-emerald-400/30 focus:border-emerald-400"
                        : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <StatusIndicator status={usernameStatus} />
                  </div>
                </div>
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>
            </div>

            {/* Password Fields (Create mode only) */}
            {!isEditMode && (
              <div className="grid grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Min 8 characters"
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.password
                          ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleChange("confirmPassword", e.target.value)
                      }
                      placeholder="Re-enter password"
                      className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                        errors.confirmPassword
                          ? "border-red-400 focus:ring-red-400/30 focus:border-red-400"
                          : formData.confirmPassword &&
                            formData.password === formData.confirmPassword
                          ? "border-emerald-400 focus:ring-emerald-400/30 focus:border-emerald-400"
                          : "border-gray-300 focus:border-[#000060] focus:ring-[#000060]/20"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Role & Branch Row - Using StyledSelect */}
            <div className="grid grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <StyledSelect
                  label={
                    <span>
                      Role <span className="text-red-500">*</span>
                    </span>
                  }
                  value={formData.role}
                  onChange={(value) => handleChange("role", value)}
                  options={availableRoleOptions}
                  placeholder="Select role"
                  error={errors.role}
                  disabled={!isSuperAdmin && isEditMode}
                />
                {!isSuperAdmin && (
                  <p className="text-gray-500 text-xs mt-1">
                    You can only create staff members
                  </p>
                )}
              </div>

              {/* Branch */}
              <div>
                <StyledSelect
                  label={
                    <span>
                      Branch <span className="text-red-500">*</span>
                    </span>
                  }
                  value={formData.branch_id}
                  onChange={(value) => handleChange("branch_id", value)}
                  options={branchOptions}
                  placeholder="Select branch"
                  error={errors.branch_id}
                  disabled={!isSuperAdmin}
                />
                {!isSuperAdmin && (
                  <p className="text-gray-500 text-xs mt-1">
                    Users will be added to your branch
                  </p>
                )}
              </div>
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
            disabled={
              isSubmitting ||
              usernameStatus === "checking" ||
              phoneStatus === "checking"
            }
            className="flex items-center gap-2 px-6 py-2 bg-[#000060] text-white font-medium rounded-lg hover:bg-[#000080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update User"
            ) : (
              "Create User"
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default AddEditUserModal;