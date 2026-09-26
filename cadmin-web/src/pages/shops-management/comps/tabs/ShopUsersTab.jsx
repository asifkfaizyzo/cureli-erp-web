// cadmin-web/src/pages/shops-management/comps/tabs/ShopUsersTab.jsx (do not remove this comment)
// src/components/Shops/tabs/ShopUsersTab.jsx

import { Users, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShopUsersTab = ({ shop }) => {
  const navigate = useNavigate();
  const users = shop?.users || [];

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format role from snake_case to Display Name
  const formatRole = (role) => {
    switch (role) {
      case "super_admin":
      case "Super Admin":
        return "Super Admin";
      case "branch_admin":
      case "Branch Admin":
        return "Branch Admin";
      case "staff":
      case "Staff":
        return "Staff";
      default:
        return role
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()) || "Unknown";
    }
  };

  // Get role priority for sorting (lower number = higher priority)
  const getRolePriority = (role) => {
    const normalizedRole = role?.toLowerCase().replace(/\s+/g, "_");
    switch (normalizedRole) {
      case "super_admin":
        return 1;
      case "branch_admin":
        return 2;
      case "staff":
        return 3;
      default:
        return 4;
    }
  };

  // Get badge style based on role (handles both formats)
  const getRoleBadgeStyle = (role) => {
    const normalizedRole = role?.toLowerCase().replace(/\s+/g, "_");
    switch (normalizedRole) {
      case "super_admin":
        return "bg-purple-100 text-purple-700";
      case "branch_admin":
        return "bg-blue-100 text-blue-700";
      case "staff":
        return "bg-slate-100 text-slate-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Sort users by role priority: Super Admin > Branch Admin > Staff
  const sortedUsers = [...users].sort((a, b) => {
    return getRolePriority(a.role) - getRolePriority(b.role);
  });

  const handleUserClick = (username) => {
    // Navigate to users page with username as search
    navigate(`/users?search=${encodeURIComponent(username)}`);
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <Users size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No users found in this shop</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Users size={16} />
          Shop Users ({users.length})
        </h3>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left p-4 font-semibold text-gray-600">Name</th>
                <th className="text-left p-4 font-semibold text-gray-600">Email</th>
                <th className="text-left p-4 font-semibold text-gray-600">Username</th>
                <th className="text-center p-4 font-semibold text-gray-600">Role</th>
                <th className="text-left p-4 font-semibold text-gray-600">Branch</th>
                <th className="text-center p-4 font-semibold text-gray-600">Status</th>
                <th className="text-left p-4 font-semibold text-gray-600">Last Login</th>
                <th className="text-center p-4 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user, index) => (
                <tr
                  key={user.user_id}
                  className={`border-b border-gray-50 hover:bg-indigo-50 transition-colors cursor-pointer ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  }`}
                  onClick={() => handleUserClick(user.username)}
                >
                  <td className="p-4 font-medium text-gray-900">{user.full_name}</td>
                  <td className="p-4 text-gray-600">{user.email || "N/A"}</td>
                  <td className="p-4 text-gray-600">@{user.username || "N/A"}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle(user.role)}`}>
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">{user.branch?.branch_name || "N/A"}</td>
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">{formatDate(user.last_login_at)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUserClick(user.username);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="View User"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ShopUsersTab;