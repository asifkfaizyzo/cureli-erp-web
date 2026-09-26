// cadmin-web/src/pages/Users-management/comps/UserDetailsTabs.jsx (do not remove this comment)
// components/User/UserDetailsTabs.jsx

import { useState } from "react";
import {
  FileText,
  CloudDownload,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  MapPin,
  CreditCard,
  Users,
  GitBranch,
  LogIn,
  KeyRound,
  UserCog,
  AlertTriangle,
  Shield,
  Calendar,
  User,
} from "lucide-react";
import DetailRow from "../../../components/common/DetailRow";
import UserDocumentsTab from "./UserDocumentsTab";
// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const getRoleDisplayName = (role) => {
  switch (role) {
    case "Super Admin":
    case "super_admin":
      return "Super Admin";
    case "Branch Admin":
    case "branch_admin":
      return "Branch Admin";
    case "Staff":
    case "staff":
      return "Staff";
    default:
      return role;
  }
};

const getOnboardingStatusLabel = (status) => {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// ═══════════════════════════════════════════════════════════
// PROFILE DETAILS TAB
// ═══════════════════════════════════════════════════════════
export const ProfileDetails = ({ user, isEditing, formData, onFormChange }) => {
  const isOwner = user.role === "Super Admin";
  const isBranchAdmin = user.role === "Branch Admin";
  const isStaff = user.role === "Staff";

  // Determine if role is editable
  const isRoleEditable = !isOwner;

  // Get available role options based on current role
  const getRoleOptions = () => {
    if (isOwner) {
      return [{ value: "super_admin", label: "Super Admin" }];
    }
    return [
      { value: "branch_admin", label: "Branch Admin" },
      { value: "staff", label: "Staff" },
    ];
  };

  // Get the current full_name value (for editing or display)
  const getFullNameValue = () => {
    if (isEditing) {
      return formData.full_name ?? "";
    }
    return (
      user.full_name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      "Not set"
    );
  };

  return (
    <div className="space-y-6">
      {/* Personal Information - EDITABLE */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <User size={16} />
          Personal Information
          {isEditing && (
            <span className="text-xs text-indigo-500 font-normal ml-2">
              (Editing)
            </span>
          )}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {/* For Super Admin: Show First Name and Last Name separately */}
          {isOwner && (
            <>
              <DetailRow
                label="First Name"
                value={isEditing ? formData.first_name : user.first_name}
                isEditing={isEditing}
                fieldName="first_name"
                onChange={(val) => onFormChange?.("first_name", val)}
              />
              <DetailRow
                label="Last Name"
                value={isEditing ? formData.last_name : user.last_name}
                isEditing={isEditing}
                fieldName="last_name"
                onChange={(val) => onFormChange?.("last_name", val)}
              />
            </>
          )}

          {/* For Branch Admin & Staff: Show combined Full Name (NOW EDITABLE) */}
          {(isBranchAdmin || isStaff) && (
            <DetailRow
              label="Name"
              value={getFullNameValue()}
              isEditing={isEditing}
              fieldName="full_name"
              onChange={(val) => onFormChange?.("full_name", val)}
              placeholder="Enter full name"
            />
          )}

          <DetailRow
            label="Username"
            value={isEditing ? formData.username : user.username || "Not set"}
            isEditing={isEditing}
            fieldName="username"
            onChange={(val) => onFormChange?.("username", val)}
          />

          {/* Email - Only for Super Admin, editable */}
          {isOwner && (
            <DetailRow
              label="Email"
              value={isEditing ? formData.email : user.email || "Not provided"}
              isEditing={isEditing}
              fieldName="email"
              onChange={(val) => onFormChange?.("email", val)}
            />
          )}

          {/* Phone Number */}
          <DetailRow
            label="Phone Number"
            value={
              isEditing
                ? formData.phone_number
                : user.phone_number || "Not provided"
            }
            isEditing={isEditing}
            fieldName="phone_number"
            onChange={(val) => onFormChange?.("phone_number", val)}
          />

          <DetailRow
            label="Role"
            value={isEditing ? formData.role : getRoleDisplayName(user.role)}
            isEditing={isEditing}
            disabled={!isRoleEditable}
            fieldName="role"
            type="select"
            options={getRoleOptions()}
            onChange={(val) => onFormChange?.("role", val)}
            helperText={
              isOwner && isEditing
                ? "Super Admin role cannot be modified"
                : null
            }
          />
        </div>
      </div>

      {/* Account Information - NOT EDITABLE */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Shield size={16} />
          Account Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <DetailRow label="User ID" value={user.user_id} isEditing={false} />
          <DetailRow
            label="Account Status"
            value={user.is_active ? "Active" : "Inactive"}
            isEditing={false}
            type="status"
          />
          {isOwner && (
            <DetailRow
              label="Onboarding Status"
              value={getOnboardingStatusLabel(user.status)}
              isEditing={false}
              type="onboarding"
            />
          )}
          <DetailRow
            label="Login Method"
            value={
              user.login_provider === "google" ? "Google" : "Phone & Password"
            }
            isEditing={false}
          />
          {isOwner && (
            <DetailRow
              label="Onboarding Step"
              value={`${user.onboarding_step || 0}/4`}
              isEditing={false}
            />
          )}
          <DetailRow
            label="Created At"
            value={formatDate(user.created_at)}
            isEditing={false}
          />
          <DetailRow
            label="Last Login"
            value={formatDateTime(user.last_login_at)}
            isEditing={false}
          />
          <DetailRow
            label="Last Updated"
            value={formatDateTime(user.updated_at)}
            isEditing={false}
          />
        </div>
      </div>

      {/* Assignment Info - For Branch Admin & Staff (NOT EDITABLE) */}
      {(isBranchAdmin || isStaff) && (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 size={16} />
            Assignment
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">
            <DetailRow
              label="Assigned Shop:"
              value={user.shop?.business_name || "Not assigned"}
              isEditing={false}
            />
            <DetailRow
              label="Assigned Branch:"
              value={user.branch?.branch_name || "Not assigned"}
              isEditing={false}
            />
            <DetailRow
              label="Branch Type:"
              value={
                user.branch?.branch_type
                  ? user.branch.branch_type === "main"
                    ? "Main Branch"
                    : "Sub Branch"
                  : "N/A"
              }
              isEditing={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// SHOP DETAILS TAB
// ═══════════════════════════════════════════════════════════
export const ShopDetails = ({ user }) => {
  const isOwner = user.role === "Super Admin";
  const isBranchAdmin = user.role === "Branch Admin";
  const isStaff = user.role === "Staff";
  const shop = user.shop;
  const branch = user.branch;

  // Staff - Minimal view
  if (isStaff) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 size={16} />
          Workplace Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <DetailRow
            label="Shop"
            value={shop?.business_name || "N/A"}
            isEditing={false}
          />
          <DetailRow
            label="Branch"
            value={branch?.branch_name || "N/A"}
            isEditing={false}
          />
          {branch?.branch_type && (
            <DetailRow
              label="Branch Type"
              value={
                branch.branch_type === "main" ? "Main Branch" : "Sub Branch"
              }
              isEditing={false}
            />
          )}
        </div>
      </div>
    );
  }

  // Branch Admin - Branch Details
  if (isBranchAdmin && branch) {
    return (
      <div className="space-y-6">
        {/* Shop Reference */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 size={16} />
            Shop Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow
              label="Shop Name"
              value={shop?.business_name || "N/A"}
              isEditing={false}
            />
            <DetailRow
              label="Verification"
              value={shop?.verification_status}
              isEditing={false}
              type="verification"
            />
          </div>
        </div>

        {/* Branch Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <GitBranch size={16} />
            Branch Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow
              label="Branch ID"
              value={branch.branch_id?.slice(0, 8) + "..."}
              isEditing={false}
            />
            <DetailRow
              label="Branch Name"
              value={branch.branch_name}
              isEditing={false}
            />
            <DetailRow
              label="Branch Type"
              value={
                branch.branch_type === "main" ? "Main Branch" : "Sub Branch"
              }
              isEditing={false}
            />
            <DetailRow
              label="Contact Number"
              value={branch.contact_number}
              isEditing={false}
            />
          </div>
        </div>

        {/* Branch Address */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin size={16} />
            Branch Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow
              label="Address Line 1"
              value={branch.address_line_1}
              isEditing={false}
            />

            <DetailRow label="City" value={branch.city} isEditing={false} />
            <DetailRow label="State" value={branch.state} isEditing={false} />
            <DetailRow
              label="Pincode"
              value={branch.pincode}
              isEditing={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // Owner - Full Shop Details
  if (isOwner && shop) {
    const subscription = shop.currentSubscription;

    return (
      <div className="space-y-6">
        {/* Business Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building2 size={16} />
            Business Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow
              label="Shop ID"
              value={shop.shop_id}
              isEditing={false}
            />
            <DetailRow
              label="Business Name"
              value={shop.business_name}
              isEditing={false}
            />
            <DetailRow
              label="Legal Name"
              value={shop.legal_name || "N/A"}
              isEditing={false}
            />
            <DetailRow
              label="GST Number"
              value={shop.gst_number || "Not provided"}
              isEditing={false}
            />
            <DetailRow
              label="Business Type"
              value={shop.business_type || "N/A"}
              isEditing={false}
            />
            <DetailRow
              label="Verification"
              value={shop.verification_status}
              isEditing={false}
              type="verification"
            />
          </div>
          {shop.verification_notes && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-700">
                <strong>Note:</strong> {shop.verification_notes}
              </p>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MapPin size={16} />
            Business Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <DetailRow
              label="Address Line 1"
              value={shop.address_line_1}
              isEditing={false}
            />

            <DetailRow label="City" value={shop.city} isEditing={false} />
            <DetailRow label="State" value={shop.state} isEditing={false} />
            <DetailRow label="Pincode" value={shop.pincode} isEditing={false} />
          </div>
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <CreditCard size={16} />
            Subscription
          </h3>
          {subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <DetailRow
                label="Plan"
                value={subscription.plan?.name || "N/A"}
                isEditing={false}
              />
              <DetailRow
                label="Status"
                value={subscription.status}
                isEditing={false}
                type="status"
              />
              <DetailRow
                label="Billing Cycle"
                value={subscription.billing_cycle}
                isEditing={false}
              />
              <DetailRow
                label="Payment Status"
                value={subscription.payment_status}
                isEditing={false}
              />
              <DetailRow
                label="Start Date"
                value={formatDate(subscription.start_date)}
                isEditing={false}
              />
              <DetailRow
                label="End Date"
                value={formatDate(subscription.end_date)}
                isEditing={false}
              />
              <DetailRow
                label="Max Branches"
                value={subscription.branch_limit_snapshot}
                isEditing={false}
              />
              <DetailRow
                label="Max Users"
                value={subscription.user_limit_snapshot}
                isEditing={false}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard size={32} className="mx-auto text-gray-300 mb-2" />
              <p>No active subscription</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} />
            Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 text-center border border-indigo-100">
              <p className="text-2xl font-bold text-[#05015A]">
                {shop._count?.branches || 0}
              </p>
              <p className="text-sm text-gray-500">Branches</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 text-center border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">
                {shop._count?.users || 0}
              </p>
              <p className="text-sm text-gray-500">Users</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 text-center border border-amber-100">
              <p className="text-lg font-bold text-amber-700">
                {formatDate(shop.created_at)}
              </p>
              <p className="text-sm text-gray-500">Registered</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
      <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
      <p className="text-gray-500">No shop information available</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// DOCUMENTS TAB
// ═══════════════════════════════════════════════════════════
export const DocumentsTab = ({ user }) => {
  return <UserDocumentsTab user={user} />;
};

// ═══════════════════════════════════════════════════════════
// BRANCHES TAB (Owner Only)
// ═══════════════════════════════════════════════════════════
export const BranchesTab = ({ user }) => {
  const branches = user.shop?.branches || [];

  if (branches.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
        <GitBranch size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No branches found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Shop Branches ({branches.length})
        </h3>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-4 font-semibold text-gray-600">
                Branch Name
              </th>
              <th className="text-left p-4 font-semibold text-gray-600">
                Type
              </th>
              <th className="text-left p-4 font-semibold text-gray-600">
                City
              </th>
              <th className="text-center p-4 font-semibold text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch, index) => (
              <tr
                key={branch.branch_id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="p-4 font-medium text-gray-900">
                  {branch.branch_name}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      branch.branch_type === "main"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {branch.branch_type === "main" ? "Main" : "Sub"}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{branch.city}</td>
                <td className="p-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      branch.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {branch.is_active ? (
                      <>
                        <CheckCircle size={10} /> Active
                      </>
                    ) : (
                      <>
                        <XCircle size={10} /> Inactive
                      </>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// USERS TAB (Owner Only)
// ═══════════════════════════════════════════════════════════
export const UsersTab = ({ user }) => {
  const users = user.shop?.users || [];

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
        <Users size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No users found in this shop</p>
      </div>
    );
  }

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case "Branch Admin":
        return "bg-blue-100 text-blue-700";
      case "Staff":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Shop Users ({users.length})
        </h3>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left p-4 font-semibold text-gray-600">
                Name
              </th>
              <th className="text-left p-4 font-semibold text-gray-600">
                Email
              </th>
              <th className="text-center p-4 font-semibold text-gray-600">
                Role
              </th>
              <th className="text-center p-4 font-semibold text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, index) => (
              <tr
                key={u.user_id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="p-4 font-medium text-gray-900">{u.full_name}</td>
                <td className="p-4 text-gray-600">{u.email || "N/A"}</td>
                <td className="p-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle(
                      u.role
                    )}`}
                  >
                    {getRoleDisplayName(u.role)}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      u.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.status === "active" ? "Active" : u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// ACTIVITY TAB
// ═══════════════════════════════════════════════════════════
export const ActivityTab = ({ user }) => {
  const activities = user.activityLogs || [];

  const getActivityIcon = (action) => {
    switch (action) {
      case "login":
        return { icon: LogIn, color: "text-blue-500", bg: "bg-blue-50" };
      case "logout":
        return { icon: LogIn, color: "text-gray-500", bg: "bg-gray-50" };
      case "password_change":
        return { icon: KeyRound, color: "text-amber-500", bg: "bg-amber-50" };
      case "profile_update":
        return { icon: UserCog, color: "text-indigo-500", bg: "bg-indigo-50" };
      case "status_change":
        return { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" };
      case "role_change":
        return { icon: Shield, color: "text-purple-500", bg: "bg-purple-50" };
      default:
        return { icon: Calendar, color: "text-gray-500", bg: "bg-gray-50" };
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case "login":
        return "Login";
      case "logout":
        return "Logout";
      case "password_change":
        return "Password Changed";
      case "profile_update":
        return "Profile Updated";
      case "status_change":
        return "Status Changed";
      case "role_change":
        return "Role Changed";
      default:
        return action;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
        <Clock size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No activity recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Recent Activity ({activities.length})
        </h3>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const { icon: Icon, color, bg } = getActivityIcon(activity.action);
          return (
            <div
              key={activity.id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon size={20} className={color} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {getActionLabel(activity.action)}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {formatDateTime(activity.created_at)}
                    </span>
                  </div>
                  {(activity.ip_address || activity.user_agent) && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {activity.ip_address && (
                        <span>IP: {activity.ip_address}</span>
                      )}
                      {activity.ip_address && activity.user_agent && (
                        <span>•</span>
                      )}
                      {activity.user_agent && (
                        <span className="truncate max-w-[300px]">
                          {activity.user_agent}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
