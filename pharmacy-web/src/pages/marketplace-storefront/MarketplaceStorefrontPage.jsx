// pharmacy-web/src/pages/marketplace-storefront/MarketplaceStorefrontPage.jsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion"; // ★ Imported motion
import { Landmark, Edit3 } from "lucide-react";

import { useStorefrontPage } from "../../hooks/marketplace/useStorefrontPage";
import { usePermission } from "../../hooks/usePermission";
import { useToast } from "../../components/common/Toast";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PERMISSIONS } from "../../config/permissions";
import EditBrandingModal from "./components/EditBrandingModal";
import EditBranchModal from "./components/EditBranchModal";
import EditBankingModal from "./components/EditBankingModal";
import { updateBankingDetails } from "../../api/marketplace";

// Layout components
import PageSkeleton from "./components/PageSkeleton";
import ErrorState from "./components/ErrorState";
import SuspendedBanner from "./components/SuspendedBanner";
import StorefrontHeader from "./components/StorefrontHeader";
import StorefrontMetrics from "./components/StorefrontMetrics";
import StorefrontIdentity from "./components/StorefrontIdentity";
import BranchOperations from "./components/BranchOperations";

// ── Local animation variants matching AppLayout ───────────────────
const localPageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const MarketplaceStorefrontPage = () => {
  const toast = useToast();
  const { isSuperAdmin, isStaff, hasPermission, branchId } = usePermission();

  const {
    storefront,
    branches,
    isLoading,
    storefrontError,
    branchesError,
    isSuspending,
    isResuming,
    togglingBranchId,
    isUploading,
    uploadProgress,
    enabledBranchCount,
    deliveryEnabledCount,
    pickupEnabledCount,
    isSuspended,
    isLive,
    totalBranchCount,
    load,
    refresh,
    toggleBranch,
    saveBranchConfig,
    saveStorefrontData,
    uploadAsset,
    suspend,
    resume,
  } = useStorefrontPage();

  const canManage = hasPermission(PERMISSIONS.MARKETPLACE_MANAGE);
  const canSuspend = hasPermission(PERMISSIONS.MARKETPLACE_SUSPEND);

  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });
  const [brandingModalOpen, setBrandingModalOpen] = useState(false);
  const [bankingModalOpen, setBankingModalOpen] = useState(false);
  const [branchModal, setBranchModal]             = useState({ open: false, branch: null });

  useEffect(() => {
    load({ isSuperAdmin, branchId });
  }, [load, isSuperAdmin, branchId]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleToggleBranch = async (branch_id, newValue) => {
    try {
      await toggleBranch(branch_id, newValue);
      toast.success(
        newValue ? "Branch enabled" : "Branch disabled",
        newValue
          ? "This branch is now visible in the marketplace."
          : "This branch has been removed from the marketplace.",
      );
    } catch {
      toast.error(
        "Toggle failed",
        "Could not update branch status. Please try again.",
      );
    }
  };

  const handleConfirmAction = async () => {
    const { type } = confirmDialog;
    setConfirmDialog({ open: false, type: null });

    if (type === "suspend") {
      const result = await suspend();
      result.success
        ? toast.warning("Marketplace suspended", "All branches are now offline.")
        : toast.error("Suspend failed", result.error);
    }

    if (type === "resume") {
      const result = await resume();
      result.success
        ? toast.success("Marketplace resumed", "Your marketplace is live again.")
        : toast.error("Resume failed", result.error);
    }
  };

  const handleBrandingSave = async (data) => {
    const result = await saveStorefrontData(data);
    if (result.success)
      toast.success("Branding updated", "Your storefront looks great.");
    return result;
  };

  const handleBranchSave = async (branch_id, payload) => {
    const result = await saveBranchConfig(branch_id, payload);
    if (result.success)
      toast.success("Branch updated", "Branch marketplace settings saved successfully.");
    return result;
  };

  const handleBankingSave = async (data) => {
    try {
      await updateBankingDetails(data);
      toast.success("Banking updated", "Settlement details have been updated.");
      await refresh();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to update banking details";
      toast.error("Save failed", message);
      return { success: false, error: message };
    }
  };

  // 1. Loading state (keeps skeleton safe from transition freezes)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#010015]">
        <PageSkeleton />
      </div>
    );
  }

  // 2. Explicit error from API
  if (storefrontError || branchesError) {
    return (
      <div className="min-h-screen bg-[#010015]">
        <ErrorState message={storefrontError || branchesError} onRetry={refresh} />
      </div>
    );
  }

  // 3. Unexpected missing storefront data
  if (!storefront) {
    return (
      <div className="min-h-screen bg-[#010015]">
        <ErrorState message="Could not load storefront." onRetry={refresh} />
      </div>
    );
  }

  // ★ Wrapped core container in motion.div to give it a local transition
  return (
    <motion.div 
      variants={localPageVariants}
      initial="initial"
      animate="animate"
      className="min-h-screen bg-[#010015]"
    >
      <div className="space-y-6">
        <AnimatePresence>
          {isSuspended && (
            <SuspendedBanner
              onResume={() => setConfirmDialog({ open: true, type: "resume" })}
              isResuming={isResuming}
              canSuspend={canSuspend}
            />
          )}
        </AnimatePresence>

        <StorefrontHeader
          storefront={storefront}
          isLive={isLive}
          isSuspending={isSuspending}
          canSuspend={canSuspend}
          onSuspendClick={() => setConfirmDialog({ open: true, type: "suspend" })}
        />

        <StorefrontMetrics
          storefront={storefront}
          isLive={isLive}
          isSuspended={isSuspended}
          enabledBranchCount={enabledBranchCount}
          totalBranchCount={totalBranchCount}
          deliveryEnabledCount={deliveryEnabledCount}
          pickupEnabledCount={pickupEnabledCount}
        />

        <StorefrontIdentity
          storefront={storefront}
          isSuperAdmin={isSuperAdmin}
          onEditBranding={() => setBrandingModalOpen(true)}
        />

        {/* ── SETTLEMENT ACCOUNT CARD ── */}
        {isSuperAdmin && (
          <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <Landmark size={15} className="text-white/50" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Settlement Account</h3>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    Manual payouts are routed to this account
                  </p>
                </div>
              </div>

              {canManage && (
                <button
                  onClick={() => setBankingModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10
                    text-white/50 text-xs font-medium hover:border-white/20 hover:text-white/70 transition-all"
                >
                  <Edit3 size={11} /> Edit Bank Account
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 text-xs">
              <div className="px-3.5 py-3 bg-white/[0.015] border border-white/[0.03] rounded-xl">
                <p className="text-white/20">Account Holder</p>
                <p className="text-white/70 font-medium mt-1">
                  {storefront.bank_account_holder || <span className="text-white/10">Not configured</span>}
                </p>
              </div>

              <div className="px-3.5 py-3 bg-white/[0.015] border border-white/[0.03] rounded-xl">
                <p className="text-white/20">Account Number</p>
                <p className="text-white/70 font-mono mt-1">
                  {storefront.bank_account_number ? (
                    `•••• •••• ${storefront.bank_account_number.slice(-4)}`
                  ) : (
                    <span className="text-white/10">Not configured</span>
                  )}
                </p>
              </div>

              <div className="px-3.5 py-3 bg-white/[0.015] border border-white/[0.03] rounded-xl">
                <p className="text-white/20">Bank Name</p>
                <p className="text-white/70 font-medium mt-1">
                  {storefront.bank_name || <span className="text-white/10">Not configured</span>}
                </p>
              </div>

              <div className="px-3.5 py-3 bg-white/[0.015] border border-white/[0.03] rounded-xl">
                <p className="text-white/20">IFSC & Branch</p>
                <p className="text-white/70 font-mono mt-1 uppercase">
                  {storefront.bank_ifsc ? (
                    `${storefront.bank_ifsc} (${storefront.bank_branch_name || "N/A"})`
                  ) : (
                    <span className="text-white/10">Not configured</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <BranchOperations
          branches={branches}
          branchesError={branchesError}
          totalBranchCount={totalBranchCount}
          enabledBranchCount={enabledBranchCount}
          canManage={canManage}
          togglingBranchId={togglingBranchId}
          isSuperAdmin={isSuperAdmin}
          isStaff={isStaff}
          onToggle={handleToggleBranch}
          onEdit={(branch) => setBranchModal({ open: true, branch })}
          onRetry={refresh}
        />

        <div className="h-6" />
      </div>

      {/* ── Modals & Dialogs ── */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === "suspend"
            ? "Suspend Marketplace?"
            : "Resume Marketplace?"
        }
        message={
          confirmDialog.type === "suspend"
            ? "This will immediately take all branches offline. Customers will not be able to place orders until you resume."
            : "This will restore your marketplace to live status. You will need to re-enable each branch individually."
        }
        confirmText={confirmDialog.type === "suspend" ? "Yes, Suspend" : "Yes, Resume"}
        cancelText="Cancel"
        type={confirmDialog.type === "suspend" ? "danger" : "warning"}
        loading={isSuspending || isResuming}
      />

      <EditBrandingModal
        isOpen={brandingModalOpen}
        onClose={() => setBrandingModalOpen(false)}
        storefront={storefront}
        onSave={handleBrandingSave}
        onUpload={uploadAsset}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      <EditBankingModal
        isOpen={bankingModalOpen}
        onClose={() => setBankingModalOpen(false)}
        banking={storefront}
        onSave={handleBankingSave}
      />

      <EditBranchModal
        isOpen={branchModal.open}
        onClose={() => setBranchModal({ open: false, branch: null })}
        branch={branchModal.branch}
        isSuperAdmin={isSuperAdmin}
        onSave={handleBranchSave}
      />
    </motion.div>
  );
};

export default MarketplaceStorefrontPage;