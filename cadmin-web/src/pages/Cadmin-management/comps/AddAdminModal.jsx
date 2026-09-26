// cadmin-web/src/pages/Cadmin-management/comps/AddAdminModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Cadmin-management/comps/AddAdminModal.jsx

import { useEffect, useState, useRef } from "react";
import {
  X,
  Save,
  Loader2,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  Star,
  Crown,
  Lock,
  User,
  Mail,
  Phone,
  AtSign,
  Activity,
} from "lucide-react";
import {
  createAdmin,
  createSuperAdmin,
  getRoles,
} from "../../../api/cadminAdmins";
import { getRoleBadgeStyle } from "../../../config/tableConfig";
import { useCAdminPermission } from "../../../hooks/useCAdminPermission";
import StyledSelect from "../../../components/common/StyledSelect";

// ─────────────────────────────────────────────────────────────────────────────
// FORM INPUT
// ─────────────────────────────────────────────────────────────────────────────

function FormInput({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required,
  maxLength,
  disabled,
  icon: Icon,
}) {
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
        {Icon && <Icon size={12} className="text-gray-400" />}
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative group">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={`w-full h-11 px-4 ${isPassword ? "pr-11" : ""} border-2 rounded-xl text-sm
                     font-medium placeholder:font-normal placeholder:text-gray-300
                     focus:outline-none transition-all duration-200
                     disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-100
                     ${
                       error
                         ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]"
                         : focused
                           ? "border-indigo-400 bg-white shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                           : "border-gray-200 bg-white hover:border-gray-300"
                     }`}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw((p) => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300
                       hover:text-gray-500 transition-colors p-0.5"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          error ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-xs text-red-500 flex items-center gap-1 pt-0.5">
          <AlertCircle size={11} className="flex-shrink-0" />
          {error}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD STRENGTH — compact horizontal
// ─────────────────────────────────────────────────────────────────────────────

function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ chars", pass: password.length >= 8 },
    { label: "Uppercase", pass: /[A-Z]/.test(password) },
    { label: "Lowercase", pass: /[a-z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;

  const config = [
    { label: "Very Weak", bar: "bg-red-400", text: "text-red-600" },
    { label: "Weak", bar: "bg-orange-400", text: "text-orange-600" },
    { label: "Fair", bar: "bg-yellow-400", text: "text-yellow-600" },
    { label: "Good", bar: "bg-blue-400", text: "text-blue-600" },
    { label: "Strong", bar: "bg-emerald-400", text: "text-emerald-600" },
  ];
  const level = config[score - 1] ?? config[0];

  return (
    <div className="flex items-center gap-4 bg-gray-50/80 rounded-xl px-4 py-3 border border-gray-100">
      {/* Bar + label */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex gap-1 w-24 flex-shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300
                          ${i <= score ? level.bar : "bg-gray-200"}`}
            />
          ))}
        </div>
        <span className={`text-xs font-bold whitespace-nowrap ${level.text}`}>
          {level.label}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

      {/* Criteria chips */}
      <div className="flex flex-wrap gap-1.5">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5
                        rounded-md border transition-all duration-200
                        ${
                          c.pass
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-white text-gray-400 border-gray-150"
                        }`}
          >
            <span
              className={`w-1 h-1 rounded-full ${
                c.pass ? "bg-emerald-500" : "bg-gray-300"
              }`}
            />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE PICKER — compact grid
// ─────────────────────────────────────────────────────────────────────────────

function RolePicker({
  roles,
  loading,
  error,
  selectedIds,
  primaryId,
  onToggle,
  onSetPrimary,
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 justify-center">
        <Loader2 size={18} className="animate-spin text-indigo-400" />
        <p className="text-sm text-gray-400">Loading roles…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
        <AlertCircle size={15} className="flex-shrink-0" /> {error}
      </div>
    );
  }
  if (roles.length === 0) {
    return (
      <div className="text-center py-6">
        <Shield size={22} className="mx-auto text-gray-200 mb-1.5" />
        <p className="text-sm text-gray-400">No roles available yet.</p>
        <p className="text-xs text-gray-300 mt-0.5">Create roles first.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {roles.map((role) => {
        const isSelected = selectedIds.includes(role.id);
        const isPrimary = primaryId === role.id;

        return (
          <div
            key={role.id}
            onClick={() => onToggle(role.id)}
            className={`flex flex-col gap-2 p-3 rounded-xl border-2 cursor-pointer
                        transition-all duration-200
                        ${
                          isSelected
                            ? "border-indigo-300 bg-indigo-50/70 shadow-sm"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                        }`}
          >
            {/* Top row: checkbox + role name */}
            <div className="flex items-center gap-2.5">
              <div
                className={`rounded-md border-2 flex items-center justify-center flex-shrink-0
                            transition-all duration-200
                            ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-gray-300 bg-white hover:border-gray-400"
                            }`}
                style={{ width: 18, height: 18 }}
              >
                {isSelected && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 12 12"
                  >
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className={getRoleBadgeStyle(role.name)}>{role.name}</span>
            </div>

            {/* Bottom row: primary button — only renders when selected, pushes layout naturally */}
            <div
              className={`overflow-hidden transition-all duration-200
                          ${isSelected ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetPrimary(role.id);
                }}
                className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1
                            rounded-lg border transition-all duration-200 w-full justify-center
                            ${
                              isPrimary
                                ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                                : "bg-white text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/50"
                            }`}
              >
                <Star
                  size={9}
                  fill={isPrimary ? "currentColor" : "none"}
                  className="flex-shrink-0"
                />
                {isPrimary ? "Primary Role" : "Set as Primary"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN WARNING BANNER — purple theme
// ─────────────────────────────────────────────────────────────────────────────

function SuperAdminWarning() {
  return (
    <div
      className="bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-200
                    rounded-xl px-4 py-3.5 flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Crown size={16} className="text-purple-600" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-bold text-purple-900">
          Full unrestricted access
        </p>
        <p className="text-xs text-purple-700/80 leading-relaxed">
          Super Admins bypass all permission checks. This cannot be changed from
          the UI once set - only through a database operation.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MODAL
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const EMPTY_FORM = {
  name: "",
  username: "",
  phone: "",
  email: "",
  status: "Active",
  password: "",
  confirmPassword: "",
};

const AddAdminModal = ({ isOpen, onClose, onCreate }) => {
  const { isSuperCAdmin } = useCAdminPermission();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [grantSuperAdmin, setGrantSuperAdmin] = useState(false);

  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [primaryRoleId, setPrimaryRoleId] = useState(null);

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData(EMPTY_FORM);
      setErrors({});
      setTouched({});
      setSaving(false);
      setSuccess(false);
      setApiError(null);
      setSelectedRoleIds([]);
      setPrimaryRoleId(null);
      setGrantSuperAdmin(false);
      return;
    }

    setTimeout(
      () => firstInputRef.current?.querySelector("input")?.focus(),
      100,
    );

    if (!grantSuperAdmin) {
      setRolesLoading(true);
      setRolesError(null);
      getRoles()
        .then((res) => setAvailableRoles(res.data.data.roles ?? []))
        .catch((err) =>
          setRolesError(err.response?.data?.message || "Failed to load roles"),
        )
        .finally(() => setRolesLoading(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (grantSuperAdmin) {
      setSelectedRoleIds([]);
      setPrimaryRoleId(null);
    }
  }, [grantSuperAdmin]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape" && !saving) onClose(false);
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, saving, onClose]);

  if (!isOpen) return null;

  const handleRoleToggle = (roleId) => {
    const isCurrentlySelected = selectedRoleIds.includes(roleId);
    if (isCurrentlySelected) {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
      if (primaryRoleId === roleId) setPrimaryRoleId(null);
    } else {
      setSelectedRoleIds((prev) => [...prev, roleId]);
      if (!primaryRoleId) setPrimaryRoleId(roleId);
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateField = (field, value) => {
    switch (field) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.length < 2) return "At least 2 characters";
        if (value.length > 100) return "Max 100 characters";
        break;
      case "username":
        if (!value.trim()) return "Username is required";
        if (value.length < 3) return "At least 3 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(value))
          return "Letters, numbers, underscores only";
        break;
      case "phone":
        if (!value) return "Phone is required";
        if (!/^\d{10}$/.test(value)) return "Exactly 10 digits";
        break;
      case "email":
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email";
        break;
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Minimum 8 characters";
        if (value.length > 50) return "Maximum 50 characters";
        break;
      case "confirmPassword":
        if (!value) return "Please confirm password";
        if (value !== formData.password) return "Passwords do not match";
        break;
      default:
        return "";
    }
    return "";
  };

  const validate = () => {
    const fields = [
      "name",
      "username",
      "phone",
      "email",
      "password",
      "confirmPassword",
    ];
    const e = {};
    fields.forEach((f) => {
      const err = validateField(f, formData[f]);
      if (err) e[f] = err;
    });
    setErrors(e);
    setTouched(fields.reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    return Object.keys(e).length === 0;
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors((p) => ({
      ...p,
      [field]: validateField(field, formData[field]),
    }));
  };

  const setField = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    if (touched[field]) {
      setErrors((p) => ({ ...p, [field]: validateField(field, value) }));
    }
    if (apiError) setApiError(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);

    try {
      const basePayload = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
        password: formData.password,
        status: formData.status,
      };

      let res;

      if (grantSuperAdmin) {
        res = await createSuperAdmin(basePayload);
      } else {
        const payload = {
          ...basePayload,
          ...(selectedRoleIds.length > 0 && {
            role_ids: selectedRoleIds,
            primary_role_id: primaryRoleId ?? selectedRoleIds[0],
          }),
        };
        res = await createAdmin(payload);
      }

      const newAdmin = res.data.data;
      onCreate?.(newAdmin);
      setSuccess(true);
      setTimeout(() => {
        setSaving(false);
        onClose(true);
      }, 800);
    } catch (err) {
      if (err.response?.data?.data?.errors) {
        const apiErrors = {};
        err.response.data.data.errors.forEach((e) => {
          apiErrors[e.field] = e.message;
        });
        setErrors((p) => ({ ...p, ...apiErrors }));
      } else {
        setApiError(err.response?.data?.message || "Failed to create admin");
      }
      setSaving(false);
    }
  };

  // ── Theme colors ───────────────────────────────────────────────────────────
  const isSA = grantSuperAdmin;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => !saving && onClose(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col
                   overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className={`px-6 py-4 flex-shrink-0 transition-all duration-300
            ${
              isSA
                ? "bg-gradient-to-r from-purple-800 via-purple-700 to-violet-600"
                : "bg-gradient-to-r from-[#05015A] to-[#0a0280]"
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${isSA ? "bg-purple-900/40" : "bg-white/10"}`}
              >
                {isSA ? <Crown size={20} /> : <UserPlus size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  {isSA ? "Add Super Admin" : "Add New Admin"}
                </h2>
                <p className="text-white/50 text-xs mt-0.5">
                  {isSA
                    ? "This account will have unrestricted platform access"
                    : "Create a new admin account with role-based permissions"}
                </p>
              </div>
            </div>
            <button
              onClick={() => !saving && onClose(false)}
              disabled={saving}
              className="p-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/20
                         hover:text-white disabled:opacity-50 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-5">
          {/* API Error */}
          {apiError && (
            <div
              className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3
                            rounded-xl flex items-start gap-3 text-sm"
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={16} />
              </div>
              <div>
                <p className="font-semibold text-red-800">
                  Something went wrong
                </p>
                <p className="text-red-600 text-xs mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          {/* ── Two-column layout: Left = Details + Password, Right = Access + Roles ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* ──────── LEFT COLUMN (3/5) ──────── */}
            <div className="lg:col-span-3 space-y-5">
              {/* Admin Details */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Admin Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div ref={firstInputRef}>
                    <FormInput
                      label="Full Name"
                      icon={User}
                      value={formData.name}
                      onChange={(v) => setField("name", v)}
                      onBlur={() => handleBlur("name")}
                      error={touched.name ? errors.name : ""}
                      placeholder="Enter full name"
                      required
                      maxLength={100}
                    />
                  </div>
                  <FormInput
                    label="Username"
                    icon={AtSign}
                    value={formData.username}
                    onChange={(v) => setField("username", v.toLowerCase())}
                    onBlur={() => handleBlur("username")}
                    error={touched.username ? errors.username : ""}
                    placeholder="Enter username"
                    required
                    maxLength={50}
                  />
                  <FormInput
                    label="Phone Number"
                    icon={Phone}
                    type="tel"
                    value={formData.phone}
                    onChange={(v) => setField("phone", v.replace(/\D/g, ""))}
                    onBlur={() => handleBlur("phone")}
                    error={touched.phone ? errors.phone : ""}
                    placeholder="10-digit number"
                    required
                    maxLength={10}
                  />
                  <FormInput
                    label="Email Address"
                    icon={Mail}
                    type="email"
                    value={formData.email}
                    onChange={(v) => setField("email", v)}
                    onBlur={() => handleBlur("email")}
                    error={touched.email ? errors.email : ""}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Lock size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">Password</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="Password"
                      icon={Lock}
                      type="password"
                      value={formData.password}
                      onChange={(v) => setField("password", v)}
                      onBlur={() => handleBlur("password")}
                      error={touched.password ? errors.password : ""}
                      placeholder="Min 8 characters"
                      required
                      maxLength={50}
                    />
                    <FormInput
                      label="Confirm Password"
                      icon={Lock}
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(v) => setField("confirmPassword", v)}
                      onBlur={() => handleBlur("confirmPassword")}
                      error={
                        touched.confirmPassword ? errors.confirmPassword : ""
                      }
                      placeholder="Re-enter password"
                      required
                      maxLength={50}
                    />
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300
                      ${formData.password ? "max-h-24 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <PasswordStrength password={formData.password} />
                  </div>
                </div>
              </div>
            </div>

            {/* ──────── RIGHT COLUMN (2/5) ──────── */}
            <div className="lg:col-span-2 space-y-5">
              {/* Status */}
              <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Activity size={14} className="text-gray-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">Status</h3>
                </div>
                <StyledSelect
                  value={formData.status}
                  onChange={(v) => setField("status", v)}
                  options={STATUS_OPTIONS}
                  placeholder="Select status"
                />
              </div>

              {/* Super Admin Toggle — purple theme */}
              {isSuperCAdmin && (
                <div
                  className={`bg-white rounded-xl border-2 p-5 shadow-sm transition-all duration-300
                    ${
                      isSA
                        ? "border-purple-300 bg-gradient-to-br from-purple-50/60 to-violet-50/40"
                        : "border-gray-200/80"
                    }`}
                >
                  <div
                    onClick={() => setGrantSuperAdmin((p) => !p)}
                    className="flex items-center gap-3.5 cursor-pointer select-none"
                  >
                    {/* Toggle Track */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-14 h-8 rounded-full transition-all duration-300 ease-in-out
                          ${
                            isSA
                              ? "bg-gradient-to-r from-purple-600 to-violet-500 shadow-inner"
                              : "bg-gray-200"
                          }`}
                      >
                        <div
                          className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md
                                      flex items-center justify-center
                                      transition-all duration-300 ease-in-out
                                      ${isSA ? "left-7" : "left-1"}`}
                        >
                          <Crown
                            size={12}
                            className={`transition-all duration-200
                              ${
                                isSA
                                  ? "text-purple-500 scale-100"
                                  : "text-gray-300 scale-75"
                              }`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold transition-colors
                            ${isSA ? "text-purple-800" : "text-gray-700"}`}
                        >
                          Super Admin
                        </span>
                        {isSA && (
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5
                                           bg-purple-100 text-purple-700 rounded-md border border-purple-200"
                          >
                            On
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                        Full unrestricted access
                      </p>
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out
                      ${isSA ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"}`}
                  >
                    <SuperAdminWarning />
                  </div>
                </div>
              )}

              {/* Role Assignment */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden
                  ${isSA ? "max-h-0 opacity-0" : "max-h-[1000px] opacity-100"}`}
              >
                <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Shield size={14} className="text-gray-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-700">
                          Roles
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Optional - assign later
                        </p>
                      </div>
                    </div>
                    {selectedRoleIds.length > 0 && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {selectedRoleIds.length} selected
                      </span>
                    )}
                  </div>
                  <RolePicker
                    roles={availableRoles}
                    loading={rolesLoading}
                    error={rolesError}
                    selectedIds={selectedRoleIds}
                    primaryId={primaryRoleId}
                    onToggle={handleRoleToggle}
                    onSetPrimary={setPrimaryRoleId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center flex-shrink-0">
          <p className="text-xs text-gray-400">
            <span className="text-red-400">*</span> Required fields
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onClose(false)}
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800
                         hover:bg-gray-100 rounded-xl border border-gray-200
                         disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={saving || success}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white
                         flex items-center gap-2 shadow-lg
                         disabled:opacity-50 disabled:cursor-not-allowed
                         disabled:shadow-none transition-all duration-200
                         ${
                           isSA
                             ? "bg-gradient-to-r from-purple-700 to-violet-600 hover:from-purple-800 hover:to-violet-700 shadow-purple-500/25"
                             : "bg-gradient-to-r from-[#05015A] to-[#0a0280] hover:from-[#06027a] hover:to-[#0c03a0] shadow-indigo-500/25"
                         }`}
            >
              {success ? (
                <>
                  <CheckCircle2 size={16} className="text-green-300" />
                  Created!
                </>
              ) : saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating…
                </>
              ) : isSA ? (
                <>
                  <Crown size={16} />
                  Create Super Admin
                </>
              ) : (
                <>
                  <Save size={16} />
                  Create Admin
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAdminModal;
