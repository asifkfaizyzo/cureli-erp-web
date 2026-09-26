// pharmacy-web/src/pages/marketplace-storefront/components/BranchOperations.jsx (do not remove this comment)
//Q:\YourZeroesAndOnes\cureli\curely_erp\pharmacy-web\src\pages\marketplace-storefront\components\BranchOperations.jsx
import { Building2, AlertCircle } from "lucide-react";
import SectionCard from "./primitives/SectionCard";
import SectionHeader from "./primitives/SectionHeader";
import BranchCard from "./BranchCard";

const BranchOperations = ({
  branches,
  branchesError,
  totalBranchCount,
  enabledBranchCount,
  canManage,
  togglingBranchId,
  isSuperAdmin,
  isStaff,
  onToggle,
  onEdit,
  onRetry,
}) => (
  <SectionCard>
    <SectionHeader
      icon={Building2}
      title="Branch Marketplace Operations"
      subtitle={
        totalBranchCount === 0
          ? "No branches found"
          : `${enabledBranchCount} of ${totalBranchCount} branch${totalBranchCount > 1 ? "es" : ""} active in marketplace`
      }
    />

    <div className="p-5">

      {/* Partial Error */}
      {branchesError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 mb-4">
          <AlertCircle size={14} className="text-red-400/60 flex-shrink-0" />
          <p className="text-xs text-red-400/70 flex-1">{branchesError}</p>
          <button
            onClick={onRetry}
            className="text-xs text-red-400/50 hover:text-red-400 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!branchesError && branches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-3">
            <Building2 size={20} className="text-white/15" />
          </div>
          <p className="text-sm text-white/30 font-medium">No branches found</p>
          <p className="text-xs text-white/15 mt-1">
            {isSuperAdmin
              ? "Add branches in Settings → Branches first."
              : "Contact your admin to configure branch settings."
            }
          </p>
        </div>
      )}

      {/* Branch Grid */}
      {branches.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <BranchCard
              key={branch.branch_id}
              branch={branch}
              canManage={canManage}
              isToggling={togglingBranchId === branch.branch_id}
              onToggle={onToggle}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}

      {/* Staff Read-only Note */}
      {isStaff && branches.length > 0 && (
        <p className="text-[11px] text-white/20 text-center mt-4">
          You have read-only access to marketplace settings.
        </p>
      )}
    </div>
  </SectionCard>
);

export default BranchOperations;