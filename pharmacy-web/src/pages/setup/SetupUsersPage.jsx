// pharmacy-web/src/pages/setup/SetupUsersPage.jsx (do not remove this comment)
// src/pages/setup/SetupUsersPage.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  AlertCircle,
  Check,
  Loader2,
  Info,
  Edit2,
  X,
  User,
  Shield,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";

import { useSetupStore } from "../../store/useSetupStore";
import {
  checkUsernameAvailability,
  checkPhoneAvailability,
} from "../../api/setup";

// Role options
const ROLES = [
  {
    value: "branch_admin",
    label: "Branch Admin",
    description: "Manage branch & staff",
    icon: Shield,
  },
  {
    value: "staff",
    label: "Staff",
    description: "Day-to-day operations",
    icon: User,
  },
];

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

const SetupUsersPage = () => {
  const navigate = useNavigate();

  // Store selectors
  const users = useSetupStore((state) => state.users);
  const branches = useSetupStore((state) => state.branches);
  const planLimits = useSetupStore((state) => state.planLimits);
  const addUser = useSetupStore((state) => state.addUser);
  const updateUser = useSetupStore((state) => state.updateUser);
  const removeUser = useSetupStore((state) => state.removeUser);
  const setCurrentStep = useSetupStore((state) => state.setCurrentStep);
  const branchHasAdmin = useSetupStore((state) => state.branchHasAdmin);
  const getBranchesWithoutAdmin = useSetupStore(
    (state) => state.getBranchesWithoutAdmin,
  );

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "",
    branch_temp_id: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Availability checks
  const [usernameCheckStatus, setUsernameCheckStatus] = useState(null);
  const [phoneCheckStatus, setPhoneCheckStatus] = useState(null);
  const debouncedUsername = useDebounce(formData.username, 500);
  const debouncedPhone = useDebounce(formData.phone_number, 500);

  // Dropdown states
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [roleDropdownPosition, setRoleDropdownPosition] = useState(null);
  const [branchDropdownPosition, setBranchDropdownPosition] = useState(null);

  // Refs
  const nameInputRef = useRef(null);
  const roleButtonRef = useRef(null);
  const branchButtonRef = useRef(null);
  const roleDropdownRef = useRef(null);
  const branchDropdownRef = useRef(null);

  const maxUsers = planLimits.max_users;
  const canAddMore = maxUsers === -1 || users.length < maxUsers;

  //  Get available branches for branch admin role
  const getAvailableBranchesForRole = useCallback(
    (role) => {
      if (role === "branch_admin") {
        return getBranchesWithoutAdmin(editingUser?.temp_id);
      }
      return branches;
    },
    [branches, editingUser, getBranchesWithoutAdmin],
  );

  // Available branches based on selected role
  const availableBranches = getAvailableBranchesForRole(formData.role);

  // Check if all branches have admins (for branch_admin role)
  const allBranchesHaveAdmins =
    formData.role === "branch_admin" && availableBranches.length === 0;

  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  useEffect(() => {
    if (showForm && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showForm]);

  // Username check
  useEffect(() => {
    const checkUsername = async () => {
      const username = debouncedUsername.toLowerCase().trim();

      if (!username || username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
        setUsernameCheckStatus(null);
        return;
      }

      const existsLocally = users.some(
        (u) =>
          u.username.toLowerCase() === username &&
          u.temp_id !== editingUser?.temp_id,
      );
      if (existsLocally) {
        setUsernameCheckStatus("taken");
        return;
      }

      setUsernameCheckStatus("checking");
      try {
        const res = await checkUsernameAvailability(username);
        setUsernameCheckStatus(
          res.data?.data?.available ? "available" : "taken",
        );
      } catch {
        setUsernameCheckStatus(null);
      }
    };
    checkUsername();
  }, [debouncedUsername, users, editingUser]);

  // Phone check
  useEffect(() => {
    const checkPhone = async () => {
      const phone = debouncedPhone.replace(/\D/g, "");

      if (!phone || phone.length !== 10) {
        setPhoneCheckStatus(null);
        return;
      }

      const existsLocally = users.some(
        (u) => u.phone_number === phone && u.temp_id !== editingUser?.temp_id,
      );
      if (existsLocally) {
        setPhoneCheckStatus("taken");
        return;
      }

      setPhoneCheckStatus("checking");
      try {
        const res = await checkPhoneAvailability(phone);
        setPhoneCheckStatus(res.data?.data?.available ? "available" : "taken");
      } catch {
        setPhoneCheckStatus(null);
      }
    };
    checkPhone();
  }, [debouncedPhone, users, editingUser]);

  //  When role changes, clear branch if it's no longer available
  useEffect(() => {
    if (formData.role === "branch_admin" && formData.branch_temp_id) {
      const branchStillAvailable = availableBranches.some(
        (b) => b.temp_id === formData.branch_temp_id,
      );
      if (!branchStillAvailable) {
        setFormData((prev) => ({ ...prev, branch_temp_id: "" }));
      }
    }
  }, [formData.role, formData.branch_temp_id, availableBranches]);

  // Dropdown position handlers
  const updateRoleDropdownPosition = useCallback(() => {
    if (roleButtonRef.current) {
      const rect = roleButtonRef.current.getBoundingClientRect();
      setRoleDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const updateBranchDropdownPosition = useCallback(() => {
    if (branchButtonRef.current) {
      const rect = branchButtonRef.current.getBoundingClientRect();
      setBranchDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const handleRoleDropdownToggle = () => {
    if (!roleDropdownOpen) {
      updateRoleDropdownPosition();
      setBranchDropdownOpen(false);
    }
    setRoleDropdownOpen(!roleDropdownOpen);
  };

  const handleBranchDropdownToggle = () => {
    if (!branchDropdownOpen) {
      updateBranchDropdownPosition();
      setRoleDropdownOpen(false);
    }
    setBranchDropdownOpen(!branchDropdownOpen);
  };

  const selectRole = (value) => {
    setFormData((prev) => ({ ...prev, role: value }));
    setErrors((prev) => ({ ...prev, role: "" }));
    setRoleDropdownOpen(false);

    //  Clear branch selection when changing role to branch_admin
    // if currently selected branch already has an admin
    if (value === "branch_admin" && formData.branch_temp_id) {
      const hasAdmin = branchHasAdmin(
        formData.branch_temp_id,
        editingUser?.temp_id,
      );
      if (hasAdmin) {
        setFormData((prev) => ({ ...prev, branch_temp_id: "" }));
      }
    }
  };

  const selectBranch = (temp_id) => {
    setFormData((prev) => ({ ...prev, branch_temp_id: temp_id }));
    setErrors((prev) => ({ ...prev, branch_temp_id: "" }));
    setBranchDropdownOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        roleDropdownOpen &&
        roleButtonRef.current &&
        !roleButtonRef.current.contains(e.target) &&
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(e.target)
      ) {
        setRoleDropdownOpen(false);
      }
      if (
        branchDropdownOpen &&
        branchButtonRef.current &&
        !branchButtonRef.current.contains(e.target) &&
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(e.target)
      ) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [roleDropdownOpen, branchDropdownOpen]);

  // Close dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      setRoleDropdownOpen(false);
      setBranchDropdownOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone_number: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "",
      branch_temp_id: branches.length === 1 ? branches[0].temp_id : "",
    });
    setErrors({});
    setEditingUser(null);
    setUsernameCheckStatus(null);
    setPhoneCheckStatus(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openAddForm = () => {
    if (!canAddMore) return;
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setFormData({
      full_name: user.full_name,
      phone_number: user.phone_number,
      username: user.username,
      password: "",
      confirmPassword: "",
      role: user.role,
      branch_temp_id: user.branch_temp_id,
    });
    setEditingUser(user);
    setUsernameCheckStatus(null);
    setPhoneCheckStatus(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setRoleDropdownOpen(false);
    setBranchDropdownOpen(false);
    resetForm();
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const generateUsername = (name) => {
    if (!name) return "";
    return (
      name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "") +
      "_" +
      Date.now().toString().slice(-4)
    );
  };

  const handleNameChange = (value) => {
    handleChange("full_name", value);
    if (!formData.username && value.length > 2) {
      setFormData((prev) => ({ ...prev, username: generateUsername(value) }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) newErrors.full_name = "Required";
    else if (formData.full_name.trim().length < 2)
      newErrors.full_name = "Min 2 chars";

    if (!formData.phone_number) newErrors.phone_number = "Required";
    else if (!/^[0-9]{10}$/.test(formData.phone_number.replace(/\D/g, "")))
      newErrors.phone_number = "10 digits";
    else if (phoneCheckStatus === "taken")
      newErrors.phone_number = "Already registered";

    if (!formData.username) newErrors.username = "Required";
    else if (formData.username.length < 3) newErrors.username = "Min 3 chars";
    else if (!/^[a-z0-9_]+$/.test(formData.username.toLowerCase()))
      newErrors.username = "Invalid format";
    else if (usernameCheckStatus === "taken") newErrors.username = "Taken";

    if (!editingUser) {
      if (!formData.password) newErrors.password = "Required";
      else if (formData.password.length < 8) newErrors.password = "Min 8 chars";
      if (!formData.confirmPassword) newErrors.confirmPassword = "Required";
      else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Mismatch";
    } else if (formData.password) {
      if (formData.password.length < 8) newErrors.password = "Min 8 chars";
      if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Mismatch";
    }

    if (!formData.role) newErrors.role = "Required";
    if (!formData.branch_temp_id) newErrors.branch_temp_id = "Required";

    //  Validate branch admin uniqueness
    if (formData.role === "branch_admin" && formData.branch_temp_id) {
      const hasAdmin = branchHasAdmin(
        formData.branch_temp_id,
        editingUser?.temp_id,
      );
      if (hasAdmin) {
        newErrors.branch_temp_id = "Branch already has an admin";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (usernameCheckStatus === "checking" || phoneCheckStatus === "checking") {
      setErrors({ submit: "Please wait for validation" });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const username = formData.username.toLowerCase().trim();

      if (editingUser) {
        const updates = {
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.replace(/\D/g, ""),
          username,
          role: formData.role,
          branch_temp_id: formData.branch_temp_id,
        };
        if (formData.password) updates.password = formData.password;

        const result = updateUser(editingUser.temp_id, updates);

        if (!result.success) {
          setErrors({ submit: result.error });
          setIsSubmitting(false);
          return;
        }
      } else {
        const result = addUser({
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.replace(/\D/g, ""),
          username,
          password: formData.password,
          role: formData.role,
          branch_temp_id: formData.branch_temp_id,
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

  const handleDelete = (user) => {
    if (window.confirm(`Remove "${user.full_name}"?`)) {
      removeUser(user.temp_id);
    }
  };

  const getBranchName = (temp_id) =>
    branches.find((b) => b.temp_id === temp_id)?.branch_name || "Unknown";
  const getRoleLabel = (value) =>
    ROLES.find((r) => r.value === value)?.label || value;

  const selectedRole = ROLES.find((r) => r.value === formData.role);
  const selectedBranch = branches.find(
    (b) => b.temp_id === formData.branch_temp_id,
  );

  // Availability status indicator
  const StatusIndicator = ({ status }) => {
    if (status === "checking")
      return <Loader2 size={10} className="animate-spin text-gray-400" />;
    if (status === "available")
      return <CheckCircle2 size={10} className="text-emerald-500" />;
    if (status === "taken")
      return <XCircle size={10} className="text-red-500" />;
    return null;
  };

  //  Render Role dropdown via portal with branch admin restriction
  const renderRoleDropdown = () => {
    if (!roleDropdownOpen || !roleDropdownPosition) return null;

    // Check if branch admin option should be disabled
    const branchesWithoutAdmin = getBranchesWithoutAdmin(editingUser?.temp_id);

    return createPortal(
      <div
        ref={roleDropdownRef}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1"
        style={{
          top: roleDropdownPosition.top,
          left: roleDropdownPosition.left,
          width: roleDropdownPosition.width,
        }}
      >
        {ROLES.map((role) => {
          const RoleIcon = role.icon;
          const isDisabled =
            role.value === "branch_admin" && branchesWithoutAdmin.length === 0;

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => !isDisabled && selectRole(role.value)}
              disabled={isDisabled}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors
                ${
                  formData.role === role.value
                    ? "bg-[#000060]/10 text-[#000060]"
                    : isDisabled
                      ? "opacity-50 cursor-not-allowed bg-gray-50"
                      : "hover:bg-gray-50"
                }`}
            >
              <RoleIcon
                size={14}
                className={
                  formData.role === role.value
                    ? "text-[#000060]"
                    : "text-gray-400"
                }
              />
              <div className="flex-1">
                <p className="font-medium text-xs">{role.label}</p>
                <p className="text-[10px] text-gray-500">
                  {isDisabled ? "All branches have admins" : role.description}
                </p>
              </div>
              {formData.role === role.value && (
                <Check size={12} className="text-[#000060]" />
              )}
              {isDisabled && <Lock size={10} className="text-gray-400" />}
            </button>
          );
        })}
      </div>,
      document.body,
    );
  };

  //  Render Branch dropdown via portal with admin indicator
  const renderBranchDropdown = () => {
    if (!branchDropdownOpen || !branchDropdownPosition) return null;

    // Use filtered branches based on role
    const branchesToShow =
      formData.role === "branch_admin" ? availableBranches : branches;

    return createPortal(
      <div
        ref={branchDropdownRef}
        className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 max-h-40 overflow-y-auto"
        style={{
          top: branchDropdownPosition.top,
          left: branchDropdownPosition.left,
          width: branchDropdownPosition.width,
        }}
      >
        {branchesToShow.length === 0 ? (
          <div className="px-3 py-2 text-xs text-gray-500 text-center">
            {formData.role === "branch_admin"
              ? "All branches have admins"
              : "No branches available"}
          </div>
        ) : (
          branchesToShow.map((branch) => {
            const hasAdmin = branchHasAdmin(
              branch.temp_id,
              editingUser?.temp_id,
            );

            return (
              <button
                key={branch.temp_id}
                type="button"
                onClick={() => selectBranch(branch.temp_id)}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors
                  ${formData.branch_temp_id === branch.temp_id ? "bg-[#000060]/10 text-[#000060]" : "hover:bg-gray-50"}`}
              >
                <Building2
                  size={14}
                  className={
                    formData.branch_temp_id === branch.temp_id
                      ? "text-[#000060]"
                      : "text-gray-400"
                  }
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium truncate block">
                    {branch.branch_name}
                  </span>
                  {formData.role === "staff" && hasAdmin && (
                    <span className="text-[9px] text-purple-600">
                      Has admin
                    </span>
                  )}
                </div>
                {formData.branch_temp_id === branch.temp_id && (
                  <Check size={12} className="text-[#000060]" />
                )}
              </button>
            );
          })
        )}
      </div>,
      document.body,
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#000060]">Add Your Team</h1>
          <p className="text-xs text-gray-500">
            Optional: Add staff members now or later. Plan allows{" "}
            {maxUsers === -1 ? "unlimited" : maxUsers} users.
          </p>
        </div>
        {canAddMore && !showForm && users.length > 0 && (
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000060] text-white rounded-lg text-sm font-medium hover:bg-[#000080] transition-colors"
          >
            <Plus size={14} />
            Add User
          </button>
        )}
      </div>

      {/* Compact Form Panel */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">
                  {editingUser ? "Edit User" : "New User"}
                </h3>
                <button
                  onClick={closeForm}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>

              {/*  Warning banner if all branches have admins */}
              {allBranchesHaveAdmins && (
                <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <AlertCircle
                    size={12}
                    className="text-amber-600 flex-shrink-0"
                  />
                  <p className="text-[10px] text-amber-700">
                    All branches already have a Branch Admin. Change role to
                    Staff or create a new branch first.
                  </p>
                </div>
              )}

              {/* Row 1: Name, Phone, Username */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-[#000060] mb-0.5">
                    Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="John Doe"
                    className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1
                      ${errors.full_name ? "border-red-400" : "border-gray-300 focus:border-[#000060]"}`}
                  />
                  {errors.full_name && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      {errors.full_name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-[#000060] mb-0.5">
                    Phone *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) =>
                        handleChange(
                          "phone_number",
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      placeholder="9876543210"
                      maxLength={10}
                      className={`w-full px-2 py-1.5 pr-6 text-sm border rounded focus:outline-none focus:ring-1
                        ${
                          errors.phone_number || phoneCheckStatus === "taken"
                            ? "border-red-400"
                            : phoneCheckStatus === "available"
                              ? "border-emerald-400"
                              : "border-gray-300 focus:border-[#000060]"
                        }`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <StatusIndicator status={phoneCheckStatus} />
                    </div>
                  </div>
                  {errors.phone_number && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      {errors.phone_number}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-[10px] font-bold text-[#000060] mb-0.5">
                    Username *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        handleChange(
                          "username",
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9_]/g, ""),
                        )
                      }
                      placeholder="john_doe"
                      className={`w-full px-2 py-1.5 pr-6 text-sm border rounded focus:outline-none focus:ring-1
                        ${
                          errors.username || usernameCheckStatus === "taken"
                            ? "border-red-400"
                            : usernameCheckStatus === "available"
                              ? "border-emerald-400"
                              : "border-gray-300 focus:border-[#000060]"
                        }`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <StatusIndicator status={usernameCheckStatus} />
                    </div>
                  </div>
                  {errors.username && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Password, Confirm, Role, Branch */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                {/* Password */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                    Password {!editingUser && "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      placeholder="Min 8 chars"
                      className={`w-full px-2 py-1.5 pr-7 text-sm border rounded focus:outline-none focus:ring-1
                        ${errors.password ? "border-red-400" : "border-gray-300 focus:border-[#000060]"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                    Confirm {!editingUser && "*"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleChange("confirmPassword", e.target.value)
                      }
                      placeholder="Re-enter"
                      className={`w-full px-2 py-1.5 pr-7 text-sm border rounded focus:outline-none focus:ring-1
                        ${
                          errors.confirmPassword
                            ? "border-red-400"
                            : formData.confirmPassword &&
                                formData.password === formData.confirmPassword
                              ? "border-emerald-400"
                              : "border-gray-300 focus:border-[#000060]"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={12} />
                      ) : (
                        <Eye size={12} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Role Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-[#000060] mb-0.5">
                    Role *
                  </label>
                  <button
                    ref={roleButtonRef}
                    type="button"
                    onClick={handleRoleDropdownToggle}
                    className={`w-full px-2 py-1.5 text-sm border rounded text-left flex items-center justify-between
                      ${errors.role ? "border-red-400" : roleDropdownOpen ? "border-[#000060]" : "border-gray-300"}`}
                  >
                    {selectedRole ? (
                      <span className="flex items-center gap-1.5 text-gray-800">
                        <selectedRole.icon
                          size={12}
                          className="text-[#000060]"
                        />
                        {selectedRole.label}
                      </span>
                    ) : (
                      <span className="text-gray-400">Select</span>
                    )}
                    <ChevronDown
                      size={12}
                      className={`text-gray-400 transition-transform ${roleDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {renderRoleDropdown()}
                  {errors.role && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      {errors.role}
                    </p>
                  )}
                </div>

                {/* Branch Dropdown */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-[#000060] mb-0.5">
                    Branch *
                  </label>
                  <button
                    ref={branchButtonRef}
                    type="button"
                    onClick={handleBranchDropdownToggle}
                    disabled={allBranchesHaveAdmins}
                    className={`w-full px-2 py-1.5 text-sm border rounded text-left flex items-center justify-between
                      ${allBranchesHaveAdmins ? "bg-gray-100 cursor-not-allowed" : ""}
                      ${errors.branch_temp_id ? "border-red-400" : branchDropdownOpen ? "border-[#000060]" : "border-gray-300"}`}
                  >
                    {selectedBranch ? (
                      <span className="flex items-center gap-1.5 text-gray-800 truncate">
                        <Building2
                          size={12}
                          className="text-[#000060] flex-shrink-0"
                        />
                        <span className="truncate">
                          {selectedBranch.branch_name}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        {allBranchesHaveAdmins
                          ? "No branches available"
                          : "Select"}
                      </span>
                    )}
                    <ChevronDown
                      size={12}
                      className={`text-gray-400 flex-shrink-0 transition-transform ${branchDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {renderBranchDropdown()}
                  {errors.branch_temp_id && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      {errors.branch_temp_id}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-[10px] text-gray-400">
                  {errors.submit ? (
                    <span className="text-red-500 flex items-center gap-1">
                      <AlertCircle size={10} /> {errors.submit}
                    </span>
                  ) : (
                    <span>
                      You set the password • Each branch can have only 1 admin
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={closeForm}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      usernameCheckStatus === "checking" ||
                      phoneCheckStatus === "checking" ||
                      allBranchesHaveAdmins
                    }
                    className="flex items-center gap-1 px-3 py-1 bg-[#000060] text-white text-xs font-medium rounded hover:bg-[#000080] disabled:bg-gray-400 transition"
                  >
                    {isSubmitting ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <Check size={10} />
                    )}
                    {editingUser ? "Update" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner - Compact */}
      {!showForm && users.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3 flex items-center gap-2">
          <Info size={14} className="text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            You create passwords for your team. Each branch can have only one
            Branch Admin.
          </p>
        </div>
      )}

      {/* User Cards Grid */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {users.map((user) => {
            const RoleIcon = user.role === "branch_admin" ? Shield : User;
            return (
              <motion.div
                key={user.temp_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-semibold text-sm">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-800 text-sm truncate">
                        {user.full_name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full
                        ${user.role === "branch_admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        <RoleIcon size={8} />
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => openEditForm(user)}
                      className="p-1 text-gray-400 hover:text-[#000060] rounded transition"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded transition"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Phone size={9} />
                    <span>{user.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Building2 size={9} />
                    <span className="truncate">
                      {getBranchName(user.branch_temp_id)}
                    </span>
                  </div>
                  <p className="text-gray-400">@{user.username}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {users.length === 0 && !showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center"
          >
            <Users size={28} className="text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">No team members yet</p>
            {canAddMore && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#000060] text-white rounded text-sm font-medium hover:bg-[#000080]"
              >
                <Plus size={14} />
                Add First User
              </button>
            )}
          </motion.div>
        )}

        {/* Add More Card (Mobile) */}
        {users.length > 0 && canAddMore && !showForm && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={openAddForm}
            className="lg:hidden flex flex-col items-center justify-center gap-1 p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-[#000060] hover:text-[#000060] transition-all"
          >
            <Plus size={18} />
            <span className="text-xs font-medium">Add More</span>
          </motion.button>
        )}
      </div>

      {/* Limit Reached */}
      {!canAddMore && !showForm && (
        <div className="mt-3 flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
          <AlertCircle size={12} />
          <span>User limit reached. Upgrade to add more.</span>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={() => navigate("/setup/branches")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500 hidden sm:block">
            {users.length === 0 ? (
              <span className="text-gray-400">No users (optional)</span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <Check size={11} />
                {users.length} user{users.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>

          <button
            onClick={() => navigate("/setup/review")}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#000060] text-white rounded-lg font-semibold text-sm hover:bg-[#000080] transition shadow-md"
          >
            {users.length === 0 ? "Skip" : "Continue"}
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupUsersPage;
