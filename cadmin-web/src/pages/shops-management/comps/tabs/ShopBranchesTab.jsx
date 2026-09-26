// cadmin-web/src/pages/shops-management/comps/tabs/ShopBranchesTab.jsx (do not remove this comment)
// src/components/Shops/tabs/ShopBranchesTab.jsx

import { GitBranch, CheckCircle, XCircle, MapPin, Phone, Users } from "lucide-react";

const ShopBranchesTab = ({ shop }) => {
  const branches = shop?.branches || [];

  if (branches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <GitBranch size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No branches found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <GitBranch size={16} />
          Shop Branches ({branches.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((branch) => (
          <div
            key={branch.branch_id}
            className={`
              bg-white rounded-xl border p-4 hover:shadow-md transition-all
              ${branch.branch_type === "main" ? "border-l-4 border-l-purple-500" : "border-l-4 border-l-blue-500"}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${branch.branch_type === "main" ? "bg-purple-100" : "bg-blue-100"}
                `}>
                  <GitBranch size={14} className={branch.branch_type === "main" ? "text-purple-600" : "text-blue-600"} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{branch.branch_name}</h4>
                  <span className={`
                    px-2 py-0.5 rounded-full text-[10px] font-medium
                    ${branch.branch_type === "main" 
                      ? "bg-purple-100 text-purple-700" 
                      : "bg-blue-100 text-blue-700"}
                  `}>
                    {branch.branch_type === "main" ? "Main Branch" : "Sub Branch"}
                  </span>
                </div>
              </div>
              
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  ${branch.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}
                `}
              >
                {branch.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                {branch.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                <span>{branch.city}, {branch.state} - {branch.pincode}</span>
              </div>
              
              {branch.contact_number && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{branch.contact_number}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-600">
                <Users size={14} className="text-gray-400" />
                <span>{branch._count?.users || 0} users</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopBranchesTab;