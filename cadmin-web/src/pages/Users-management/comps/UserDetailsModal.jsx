// cadmin-web/src/pages/Users-management/comps/UserDetailsModal.jsx (do not remove this comment)
import { useState, useEffect } from "react";
import {
  X,
  Pencil,
  Save,
  User,
  Store,
  FileText,
  KeyRound,
  Ban,
  CheckCircle,
  GitBranch,
  Users,
  History,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  ProfileDetails,
  ShopDetails,
  DocumentsTab,
  BranchesTab,
  UsersTab,
  ActivityTab,
} from "./UserDetailsTabs";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/Toast";
import {
  getCAdminUserById,
  toggleCAdminUserAccess,
  resetCAdminUserPassword,
  updateCAdminUser,
  deleteCAdminUser,
} from "../../../api/cadminUsers";
import { useCAdminPermission } from "../../../hooks/useCAdminPermission";

const UserDetailsModal = ({ user: basicUser, isOpen, onClose, mode }) => {
  const toast = useToast();

  // isSuperCAdmin gates the delete button — only the platform super admin
  // can permanently delete user accounts. Permission-based roles cannot.
  const { isSuperCAdmin } = useCAdminPermission();

  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  // Full user data fetched from API
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Form data for editing
  const [formData, setFormData] = useState({});
  const [originalFormData, setOriginalFormData] = useState({});

  // Confirm dialogs state
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);

  const [showResetPasswordConfirm, setShowResetPasswordConfirm] =
    useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  // ── DELETE STATE ──────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteReasonError, setDeleteReasonError] = useState("");
  // ─────────────────────────────────────────────────────────────────────────

  // Save loading state
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Fetch full user details when modal opens
  useEffect(() => {
    if (isOpen && basicUser?.id) {
      fetchUserDetails(basicUser.id);
    }
  }, [isOpen, basicUser?.id]);

  const fetchUserDetails = async (userId) => {
    setLoadingUser(true);
    setFetchError(null);
    setSaveError(null);
    try {
      const response = await getCAdminUserById(userId);
      const userData = response.data?.data || response.data;
      setUser(userData);

      const initialFormData = {
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        full_name:
          userData.full_name ||
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          "",
        username: userData.username || "",
        email: userData.email || "",
        phone_number: userData.phone_number || "",
        role:
          userData.raw_role ||
          userData.role?.toLowerCase().replace(" ", "_") ||
          "",
      };

      setFormData(initialFormData);
      setOriginalFormData(initialFormData);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to load user details";
      setFetchError(errorMessage);
      toast.error("Failed to Load Details", errorMessage);
    } finally {
      setLoadingUser(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("profile");
      setIsEditing(false);
      setUser(null);
      setFormData({});
      setOriginalFormData({});
      setFetchError(null);
      setSaveError(null);
      // Reset delete state too
      setShowDeleteConfirm(false);
      setDeleteReason("");
      setDeleteReasonError("");
    }
  }, [isOpen]);

  // Set editing mode based on mode prop
  useEffect(() => {
    setIsEditing(mode === "edit");
  }, [mode]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (isEditing && hasChanges()) {
          if (
            window.confirm(
              "You have unsaved changes. Are you sure you want to close?",
            )
          ) {
            onClose(false);
          }
        } else {
          onClose(false);
        }
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isEditing]);

  if (!isOpen) return null;

  // Determine user role
  const isOwner = user?.role === "Super Admin";
  const isBranchAdmin = user?.role === "Branch Admin";
  const isStaff = user?.role === "Staff";

  // Reset Password only for Super Admin users
  const canResetPassword = isOwner;

  // Delete button conditions:
  //   1. The logged-in cadmin must be isSuperCAdmin
  //   2. The target user must be loaded
  //   3. Cannot delete a Super Admin user (use Suspend instead)
const showDeleteButton = isSuperCAdmin && !!user;

  // Check if there are unsaved changes
  const hasChanges = () => {
    return Object.keys(formData).some(
      (key) => formData[key] !== originalFormData[key],
    );
  };

  // Dynamic tabs based on role
  const getTabs = () => {
    const baseTabs = [{ id: "profile", label: "Profile", icon: User }];

    if (!user) return baseTabs;

    if (isOwner) {
      return [
        ...baseTabs,
        { id: "shop", label: "Shop Details", icon: Store },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "branches", label: "Branches", icon: GitBranch },
        { id: "users", label: "Users", icon: Users },
        { id: "activity", label: "Activity", icon: History },
      ];
    }

    if (isBranchAdmin) {
      return [
        ...baseTabs,
        { id: "shop", label: "Branch Details", icon: Store },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "activity", label: "Activity", icon: History },
      ];
    }

    // Staff
    return [
      ...baseTabs,
      { id: "shop", label: "Workplace", icon: Store },
      { id: "activity", label: "Activity", icon: History },
    ];
  };

  const tabs = getTabs();

  const getActiveStatusLabel = (is_active) => {
    return is_active ? "Active" : "Inactive";
  };

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleFormChange = (field, value) => {
    setSaveError(null);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancelEdit = () => {
    if (hasChanges()) {
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to cancel?",
        )
      ) {
        return;
      }
    }
    setFormData(originalFormData);
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSuspendConfirm = async () => {
    if (!user) return;
    setSuspendLoading(true);
    try {
      const newIsActive = !user.is_active;
      await toggleCAdminUserAccess(user.user_id, newIsActive);

      setShowSuspendConfirm(false);

      if (newIsActive) {
        toast.success(
          "User Activated",
          `${user.full_name || user.username} has been activated successfully.`,
        );
      } else {
        toast.success(
          "User Suspended",
          `${user.full_name || user.username} has been suspended successfully.`,
        );
      }

      onClose(true);
    } catch (error) {
      console.error("Suspend/Activate failed:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update user status";
      toast.error("Action Failed", errorMessage);
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!user) return;
    setResetPasswordLoading(true);
    try {
      await resetCAdminUserPassword(user.user_id);

      setShowResetPasswordConfirm(false);

      toast.success(
        "Reset Link Sent",
        `Password reset link has been sent to ${user.email}`,
      );

      onClose(true);
    } catch (error) {
      console.error("Reset password failed:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send reset link";
      toast.error("Reset Failed", errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // ── DELETE HANDLER ────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!user) return;

    if (!deleteReason.trim()) {
      setDeleteReasonError("Please provide a reason for deletion.");
      return;
    }
    if (deleteReason.trim().length < 10) {
      setDeleteReasonError("Reason must be at least 10 characters.");
      return;
    }

    setDeleteLoading(true);
    setDeleteReasonError("");

    try {
      await deleteCAdminUser(user.user_id, deleteReason.trim());
      setShowDeleteConfirm(false);
      toast.success(
        "User Deleted",
        `${user.full_name || user.username}'s account has been permanently deleted.`,
      );
      onClose(true); // triggers onRefresh in UserTable → fetchUsers in UserPage
    } catch (error) {
      console.error("Delete user failed:", error);
      const msg = error.response?.data?.message || "Failed to delete user.";
      toast.error("Delete Failed", msg);
      // Keep dialog open so admin sees the error
    } finally {
      setDeleteLoading(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleSaveChanges = async () => {
    if (!user) return;

    if (!hasChanges()) {
      setIsEditing(false);
      return;
    }

    const validationErrors = validateForm();
    if (validationErrors) {
      setSaveError(validationErrors);
      toast.error("Validation Error", validationErrors);
      return;
    }

    setSaveLoading(true);
    setSaveError(null);

    try {
      const payload = {};

      if (isOwner) {
        if (formData.first_name !== originalFormData.first_name) {
          payload.first_name = formData.first_name.trim();
        }
        if (formData.last_name !== originalFormData.last_name) {
          payload.last_name = formData.last_name.trim();
        }
        if (formData.email !== originalFormData.email) {
          payload.email = formData.email.trim();
        }
      } else {
        if (formData.full_name !== originalFormData.full_name) {
          payload.full_name = formData.full_name.trim();
        }
      }

      if (formData.username !== originalFormData.username) {
        payload.username = formData.username.trim().toLowerCase();
      }
      if (formData.phone_number !== originalFormData.phone_number) {
        payload.phone_number = formData.phone_number.replace(/\D/g, "");
      }

      if (!isOwner && formData.role !== originalFormData.role) {
        payload.role = formData.role;
      }

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        return;
      }

      const response = await updateCAdminUser(user.user_id, payload);

      if (response.status === 200 || response.data?.success) {
        const updatedUser = response.data?.data || response.data?.user;
        if (updatedUser) {
          setUser((prev) => ({ ...prev, ...updatedUser }));
          setOriginalFormData(formData);
        }

        setIsEditing(false);
        toast.success("Changes Saved", `User details updated successfully.`);
        onClose(true);
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (error) {
      console.error("Save failed:", error);

      let errorMessage = "Failed to save changes. Please try again.";

      if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || "Invalid data provided";
      } else if (error.response?.status === 409) {
        errorMessage = "Username or phone number already exists";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to edit this user";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setSaveError(errorMessage);
      toast.error("Save Failed", errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const validateForm = () => {
    if (isOwner) {
      if (!formData.first_name?.trim()) {
        return "First name is required";
      }
    } else if (isBranchAdmin || isStaff) {
      if (!formData.full_name?.trim()) {
        return "Name is required";
      }
      if (formData.full_name.trim().length < 2) {
        return "Name must be at least 2 characters";
      }
    }

    if (formData.username && formData.username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (
      formData.username &&
      !/^[a-z0-9_]+$/.test(formData.username.toLowerCase())
    ) {
      return "Username can only contain lowercase letters, numbers, and underscores";
    }

    if (formData.phone_number) {
      const cleanPhone = formData.phone_number.replace(/\D/g, "");
      if (cleanPhone && !/^[0-9]{10}$/.test(cleanPhone)) {
        return "Invalid phone number (must be 10 digits)";
      }
    }

    if (isOwner && formData.email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return "Invalid email address";
      }
    }

    return null;
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER CONTENT
  // ═══════════════════════════════════════════════════════════
  const renderTabContent = () => {
    if (loadingUser) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="ml-3 text-gray-500">Loading user details...</span>
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-red-500">
          <p className="text-lg font-medium">Error loading user</p>
          <p className="text-sm mt-1">{fetchError}</p>
          <button
            onClick={() => fetchUserDetails(basicUser?.id)}
            className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!user) return null;

    switch (activeTab) {
      case "profile":
        return (
          <ProfileDetails
            user={user}
            isEditing={isEditing}
            formData={formData}
            onFormChange={handleFormChange}
          />
        );
      case "shop":
        return <ShopDetails user={user} isEditing={false} />;
      case "documents":
        return <DocumentsTab user={user} />;
      case "branches":
        return isOwner ? <BranchesTab user={user} /> : null;
      case "users":
        return isOwner ? <UsersTab user={user} /> : null;
      case "activity":
        return <ActivityTab user={user} />;
      default:
        return null;
    }
  };

  const displayName = user?.full_name || basicUser?.name || "User";
  const displayUsername = user?.username || basicUser?.username || "";
  const displayRole = user?.role || basicUser?.role || "";
  const displayIsActive = user?.is_active ?? basicUser?.is_active ?? true;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => {
          if (isEditing && hasChanges()) {
            if (
              window.confirm(
                "You have unsaved changes. Are you sure you want to close?",
              )
            ) {
              onClose(false);
            }
          } else {
            onClose(false);
          }
        }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal Container */}
        <div
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══════════════════════════════════════════════════════
              HEADER
          ═══════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4">
            <div className="flex items-center justify-between">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {displayName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white text-lg font-semibold">
                      {displayName}
                    </h2>
                    {/* Role Badge */}
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                      {displayRole}
                    </span>
                    {/* Active/Inactive Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        displayIsActive
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-red-500/20 text-red-200"
                      }`}
                    >
                      {getActiveStatusLabel(displayIsActive)}
                    </span>
                    {/* Unsaved Changes Indicator */}
                    {isEditing && hasChanges() && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-200 flex items-center gap-1">
                        <AlertCircle size={10} />
                        Unsaved
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm">@{displayUsername}</p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                {activeTab === "profile" && !loadingUser && user && (
                  <>
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleCancelEdit}
                          disabled={saveLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                     bg-white/20 text-white hover:bg-white/30 transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveChanges}
                          disabled={saveLoading || !hasChanges()}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                     bg-emerald-500 text-white hover:bg-emerald-600 transition-all
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saveLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          {saveLoading ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                                   bg-white/20 text-white hover:bg-white/30 transition-all"
                      >
                        <Pencil size={16} />
                        Edit Details
                      </button>
                    )}
                  </>
                )}

                {/* Close */}
                <button
                  onClick={() => {
                    if (isEditing && hasChanges()) {
                      if (
                        window.confirm(
                          "You have unsaved changes. Are you sure you want to close?",
                        )
                      ) {
                        onClose(false);
                      }
                    } else {
                      onClose(false);
                    }
                  }}
                  className="p-2 rounded-lg bg-white/20 text-white hover:bg-red-500/30 transition-all"
                >
                  <X size={20} className="text-red-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Save Error Banner */}
          {saveError && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle size={16} />
              {saveError}
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TABS
          ═══════════════════════════════════════════════════════ */}
          <div className="flex gap-1 px-6 pt-4 bg-white border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (isEditing && hasChanges() && tab.id !== "profile") {
                      if (
                        !window.confirm(
                          "You have unsaved changes. Switch tab anyway?",
                        )
                      ) {
                        return;
                      }
                      setIsEditing(false);
                      setFormData(originalFormData);
                    }
                    setActiveTab(tab.id);
                    if (tab.id !== "profile") {
                      setIsEditing(false);
                    }
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-md transition-all whitespace-nowrap
                    ${
                      isActive
                        ? "text-[#05015A] border-b-2 border-[#05015A] bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════
              CONTENT
          ═══════════════════════════════════════════════════════ */}
          <div className="p-4 h-[60vh] overflow-auto bg-gray-50">
            {renderTabContent()}
          </div>

          {/* ═══════════════════════════════════════════════════════
              FOOTER - Admin Actions
          ═══════════════════════════════════════════════════════ */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              {/* Left: User Meta Info */}
              <p className="text-xs text-gray-400">
                User ID: {user?.user_id || basicUser?.id} • Last login:{" "}
                {user?.last_login_at
                  ? new Date(user.last_login_at).toLocaleDateString()
                  : basicUser?.lastLogin || "Never"}
              </p>

              {/* Right: Admin Actions */}
              <div className="flex items-center gap-2">
                {/* Reset Password Button - Only for Super Admin users */}
                {canResetPassword && (
                  <button
                    onClick={() => setShowResetPasswordConfirm(true)}
                    disabled={loadingUser || !user}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                               bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeyRound size={16} />
                    Reset Password
                  </button>
                )}

                

                {/* Suspend / Activate Button */}
                <button
                  onClick={() => setShowSuspendConfirm(true)}
                  disabled={loadingUser || !user}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      displayIsActive
                        ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }
                  `}
                >
                  {displayIsActive ? (
                    <>
                      <Ban size={16} />
                      Suspend Account
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Activate Account
                    </>
                  )}
                </button>

                {/* ── DELETE BUTTON ──────────────────────────────────────────
                    Only visible to isSuperCAdmin.
                    Hidden for Super Admin users (use Suspend instead).
                    Backend also enforces this — double protection.
                ─────────────────────────────────────────────────────────── */}
                {showDeleteButton && (
                  <button
                    onClick={() => {
                      setDeleteReason("");
                      setDeleteReasonError("");
                      setShowDeleteConfirm(true);
                    }}
                    disabled={loadingUser || !user}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                               bg-red-50 text-red-600 hover:bg-red-100 transition-all
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CONFIRMATION DIALOGS
      ═══════════════════════════════════════════════════════ */}

      {/* Suspend/Activate Confirmation */}
      <ConfirmDialog
        isOpen={showSuspendConfirm}
        onClose={() => setShowSuspendConfirm(false)}
        onConfirm={handleSuspendConfirm}
        title={displayIsActive ? "Suspend User?" : "Activate User?"}
        message={
          displayIsActive
            ? `Are you sure you want to suspend "${displayName}"? They will not be able to log in until reactivated.`
            : `Are you sure you want to activate "${displayName}"? They will regain access to their account.`
        }
        confirmText={displayIsActive ? "Suspend" : "Activate"}
        cancelText="Cancel"
        type={displayIsActive ? "warning" : "success"}
        loading={suspendLoading}
      />

      {/* Reset Password Confirmation - Only rendered for Super Admin users */}
      {canResetPassword && (
        <ConfirmDialog
          isOpen={showResetPasswordConfirm}
          onClose={() => setShowResetPasswordConfirm(false)}
          onConfirm={handleResetPasswordConfirm}
          title="Reset Password?"
          message={
            <span>
              Send a password reset link to{" "}
              <strong>{user?.email || basicUser?.email}</strong>?
              <br />
              <span className="text-gray-400 text-sm mt-1 block">
                The user will receive an email with instructions to create a new
                password.
              </span>
            </span>
          }
          confirmText="Send Reset Link"
          cancelText="Cancel"
          type="info"
          loading={resetPasswordLoading}
        />
      )}

      {/* ── DELETE CONFIRM DIALOG ─────────────────────────────────────────────
          Custom dialog with reason textarea.
          Only rendered when showDeleteButton is true (isSuperCAdmin only).
      ─────────────────────────────────────────────────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!deleteLoading) setShowDeleteConfirm(false);
            }}
          />
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900">
                  Delete User Account
                </h3>
                <p className="text-sm text-red-700 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* What happens info box */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 space-y-1">
                <p className="font-semibold">
                  What happens when you delete this account:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                  <li>Name, email, phone and username are permanently wiped</li>
                  <li>
                    Email and username are freed for reuse by new accounts
                  </li>
                  <li>
                    All purchase, sales and inventory records remain intact
                  </li>
                  <li>Deletion is recorded in the audit log with your name</li>
                </ul>
              </div>

              {/* Who is being deleted */}
              <p className="text-sm text-gray-700">
                Deleting:{" "}
                <span className="font-bold text-gray-900">{displayName}</span>
                {displayUsername && (
                  <span className="text-gray-500 font-normal">
                    {" "}
                    (@{displayUsername})
                  </span>
                )}
              </p>

              {/* Reason input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for deletion <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => {
                    setDeleteReason(e.target.value);
                    if (deleteReasonError) setDeleteReasonError("");
                  }}
                  placeholder="e.g. User requested account deletion, duplicate account, fraud investigation..."
                  rows={3}
                  disabled={deleteLoading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm resize-none transition-all
                    focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${
                      deleteReasonError
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300 bg-white"
                    }`}
                />
                {deleteReasonError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {deleteReasonError}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Minimum 10 characters. Stored permanently in the audit log.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                           rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading || !deleteReason.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white
                           bg-red-600 rounded-lg hover:bg-red-700 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDetailsModal;
