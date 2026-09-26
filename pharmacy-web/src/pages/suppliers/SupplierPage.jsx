// pharmacy-web/src/pages/suppliers/SupplierPage.jsx (do not remove this comment)
// src/pages/suppliers/SupplierPage.jsx
import { useState, useMemo, useEffect } from "react";
import { useToast } from "../../components/common/Toast";
import {
  useAuthStore,
  selectBranchContext,
  selectIsSuperAdmin,
  selectIsGlobalMode,
} from "../../store/useAuthStore";
import SupplierHeader from "./components/SupplierHeader";
import SupplierTable from "./components/SupplierTable";
import SupplierModal from "./components/SupplierModal";
import ManageSupplierBranchesModal from "./components/ManageSupplierBranchesModal";
import AddExistingSupplierModal from "./components/AddExistingSupplierModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useSuppliers } from "../../hooks/useSuppliers";
import { Building2, AlertTriangle, Layers, Plus } from "lucide-react";

const SupplierPage = () => {
  const toast = useToast();

  // Branch Context
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);

  /* ---------------- FILTER STATE ---------------- */
  const [filters, setFilters] = useState({
    name: "",
    supplierId: "",
    contact: "",
  });

  /* ---------------- API HOOK ---------------- */
  const {
    suppliers,
    loading,
    error,
    mode,
    currentBranchId,
    currentBranchName,
    createSupplier,
    updateSupplier,
    refresh,
    getSupplierBranches,
    addSupplierToBranch,
    removeSupplierFromBranch,
    updateSupplierBranches,
    getAvailableForBranch,
    deactivateSupplier, //  Add
    reactivateSupplier, //  Add
    removeFromAllBranches, //  Add
  } = useSuppliers();

  /* ---------------- MODAL STATE ---------------- */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Manage Branches Modal (Super Admin only)
  const [manageBranchesModal, setManageBranchesModal] = useState({
    open: false,
    supplier: null,
  });

  // Add Existing Supplier Modal (Super Admin only, when in branch mode)
  const [addExistingModal, setAddExistingModal] = useState(false);

  /* ---------------- CONFIRMATION STATE ---------------- */
  const [confirmDelete, setConfirmDelete] = useState(null);

  /* ---------------- SAVING STATE ---------------- */
  const [saving, setSaving] = useState(false);

  /* ---------------- ERROR HANDLING ---------------- */
  useEffect(() => {
    if (error) {
      toast.error("Error", error);
    }
  }, [error]);

  const handleDeactivateSupplier = async (supplierId) => {
    const result = await deactivateSupplier(supplierId);
    if (result.success) {
      toast.success(
        "Supplier Deactivated",
        "Supplier has been deactivated from your shop.",
      );
    } else {
      toast.error("Failed", result.error || "Could not deactivate supplier");
    }
    return result;
  };

  const handleReactivateSupplier = async (supplierId, branchId) => {
    const result = await reactivateSupplier(supplierId, branchId);
    if (result.success) {
      toast.success(
        "Supplier Reactivated",
        `Supplier is now active and linked to ${result.data.linked_branch}`,
      );
    } else {
      toast.error("Failed", result.error || "Could not reactivate supplier");
    }
    return result;
  };

  const handleRemoveFromAllBranches = async (supplierId) => {
    const result = await removeFromAllBranches(supplierId);
    if (result.success) {
      toast.success(
        "Removed",
        `Supplier removed from ${result.data.removed_from} branch(es)`,
      );
    } else {
      toast.error("Failed", result.error || "Could not remove supplier");
    }
    return result;
  };

  /* ---------------- FILTER HANDLER ---------------- */
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({ name: "", supplierId: "", contact: "" });
    toast.info("Filters Reset", "All filters have been cleared.", 2000);
  };

  /* ---------------- FILTER LOGIC (Client-side) ---------------- */
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((item) => {
      const itemName = item.name?.toLowerCase() || "";
      const itemId = item.supplier_id?.toLowerCase() || "";
      const itemPhone =
        item.office_phone?.toString() || item.personal_phone?.toString() || "";

      return (
        itemName.includes(filters.name.toLowerCase()) &&
        itemId.includes(filters.supplierId.toLowerCase()) &&
        itemPhone.includes(filters.contact)
      );
    });
  }, [filters, suppliers]);

  /* ---------------- TABLE ACTIONS ---------------- */
  const handleRowAction = (action, supplier) => {
    if (action === "delete") {
      setConfirmDelete(supplier);
      return;
    }
    if (action === "manage-branches" && isSuperAdmin) {
      setManageBranchesModal({ open: true, supplier });
      return;
    }

    //  Map API fields to form fields before opening modal
    const mappedSupplier = {
      // IDs
      supplierId: supplier.supplier_id || supplier.id,
      supplier_id: supplier.supplier_id || supplier.id,

      // Basic Info
      name: supplier.name || "",
      gst: supplier.gst_number || supplier.gstNumber || supplier.gst || "",
      panNumber: supplier.pan_number || supplier.panNumber || "",
      drugLicense:
        supplier.drug_license_no ||
        supplier.drugLicenseNo ||
        supplier.drugLicense ||
        "",
      website: supplier.website || "",

      // Address
      address:
        supplier.address ||
        supplier.address_line_1 ||
        supplier.addressLine1 ||
        "",
      addressLine1:
        supplier.address_line_1 ||
        supplier.addressLine1 ||
        supplier.address ||
        "",
      addressLine2: supplier.address_line_2 || supplier.addressLine2 || "",
      city: supplier.city || "",
      state: supplier.state || "",
      pincode: supplier.pincode || "",

      // Contact
      officePhone:
        supplier.office_phone || supplier.officePhone || supplier.contact || "",
      personalPhone: supplier.personal_phone || supplier.personalPhone || "",
      email: supplier.email || "",
      contactPerson: supplier.contact_person || supplier.contactPerson || "",
      designation: supplier.designation || "",

      // Banking
      bankName: supplier.bank_name || supplier.bankName || "",
      branchName: supplier.branchName || "",
      accountNo:
        supplier.account_number ||
        supplier.accountNumber ||
        supplier.accountNo ||
        "",
      accountType: supplier.account_type || supplier.accountType || "",
      ifsc: supplier.ifsc_code || supplier.ifscCode || supplier.ifsc || "",

      // Payment
      creditDays: supplier.credit_days || supplier.creditDays || "",
      creditLimit: supplier.credit_limit || supplier.creditLimit || "",
      paymentMode: supplier.payment_mode || supplier.paymentMode || "",
    };

    

    setSelectedSupplier(mappedSupplier);
    setModalMode(action);
    setModalOpen(true);
  };

  /* ---------------- SAVE HANDLER ---------------- */
  const handleSave = async (formData) => {
    setSaving(true);

    try {
      const isNew = formData.supplierId === "NEW" || !formData.supplier_id;

      // Map form data to API format
      const apiData = {
        name: formData.name?.trim(),
        office_phone: (formData.officePhone || formData.contact)?.replace(
          /\D/g,
          "",
        ),
        personal_phone: formData.personalPhone?.replace(/\D/g, "") || null,
        email: formData.email?.toLowerCase().trim() || null,
        gst_number: formData.gst?.toUpperCase().trim() || null,
        pan_number: formData.panNumber?.toUpperCase().trim() || null,
        drug_license_no: formData.drugLicense?.toUpperCase().trim() || null,
        address_line_1:
          formData.addressLine1?.trim() || formData.address?.trim() || null,
        address_line_2: formData.addressLine2?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        pincode: formData.pincode?.replace(/\D/g, "") || null,
        contact_person: formData.contactPerson?.trim() || null,
        credit_days: parseInt(formData.creditDays) || 0,
        credit_limit: parseFloat(formData.creditLimit) || null,
        bank_name: formData.bankName?.trim() || null,
        account_number: formData.accountNo?.replace(/\D/g, "") || null,
        ifsc_code: formData.ifsc?.toUpperCase().trim() || null,
      };

      let result;
      if (isNew) {
        result = await createSupplier(apiData);
      } else {
        result = await updateSupplier(formData.supplier_id, apiData);
      }

      if (result.success) {
        const message = result.data?.linked_to_existing
          ? result.data.message
          : `Supplier ${formData.name} ${isNew ? "added" : "updated"} successfully.`;

        toast.success(isNew ? "Supplier Added" : "Supplier Updated", message);
        setModalOpen(false);
        setSelectedSupplier(null);
      } else {
        //  IMPROVED ERROR HANDLING
        const errorMessage = result.error || "Failed to save supplier.";

        // Parse specific error codes
        if (errorMessage.includes("GST")) {
          toast.error("Invalid GST", errorMessage);
        } else if (errorMessage.includes("PAN")) {
          toast.error("Invalid PAN", errorMessage);
        } else if (
          errorMessage.includes("phone") ||
          errorMessage.includes("Phone")
        ) {
          toast.error("Invalid Phone", errorMessage);
        } else if (
          errorMessage.includes("email") ||
          errorMessage.includes("Email")
        ) {
          toast.error("Invalid Email", errorMessage);
        } else if (errorMessage.includes("Drug License")) {
          toast.error("Invalid Drug License", errorMessage);
        } else if (errorMessage.includes("IFSC")) {
          toast.error("Invalid IFSC", errorMessage);
        } else if (
          errorMessage.includes("duplicate") ||
          errorMessage.includes("already exists")
        ) {
          toast.error("Duplicate Entry", errorMessage);
        } else {
          toast.error("Save Failed", errorMessage);
        }
      }
    } catch (err) {
      console.error("Save error:", err);

      //  Parse API error response
      const errorResponse = err.response?.data;
      let errorMessage = "An unexpected error occurred.";

      if (errorResponse?.message) {
        errorMessage = errorResponse.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Check for validation errors array
      if (errorResponse?.errors && Array.isArray(errorResponse.errors)) {
        const validationErrors = errorResponse.errors
          .map((e) => e.message)
          .join(", ");
        toast.error("Validation Failed", validationErrors);
      } else {
        toast.error("Save Failed", errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- ADD NEW ---------------- */
  const handleAdd = () => {
    if (isGlobalMode) {
      toast.warning(
        "Select a Branch",
        "Please select a specific branch to add suppliers.",
      );
      return;
    }

    setSelectedSupplier({
      supplierId: "NEW",
      name: "",
      contact: "",
      officePhone: "",
      personalPhone: "",
      email: "",
      gst: "",
      address: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      contactPerson: "",
      drugLicense: "",
      creditDays: "",
      creditLimit: "",
      bankName: "",
      accountNo: "",
      ifsc: "",
    });
    setModalMode("edit");
    setModalOpen(true);
  };

  /* ---------------- ADD EXISTING SUPPLIER TO BRANCH ---------------- */
  const handleAddExisting = () => {
    if (isGlobalMode) {
      toast.warning("Select a Branch", "Please select a branch first.");
      return;
    }
    setAddExistingModal(true);
  };

  const handleAddExistingSupplier = async (supplierId) => {
    const result = await addSupplierToBranch(supplierId, currentBranchId);
    if (result.success) {
      toast.success("Supplier Added", `Supplier added to ${currentBranchName}`);
      setAddExistingModal(false);
    } else {
      toast.error("Failed", result.error || "Could not add supplier to branch");
    }
  };

  /* ---------------- MANAGE BRANCHES HANDLER ---------------- */
  const handleBranchesUpdate = async (supplierId, branchIds) => {
    const result = await updateSupplierBranches(supplierId, branchIds);
    if (result.success) {
      toast.success(
        "Branches Updated",
        `Added to ${result.data.added} branch(es), removed from ${result.data.removed} branch(es)`,
      );
      setManageBranchesModal({ open: false, supplier: null });
    } else {
      toast.error("Update Failed", result.error);
    }
    return result;
  };

  /* ---------------- DELETE HANDLER ---------------- */
  const confirmDeleteAction = async () => {
    // For now, just remove from current branch if in branch mode
    if (confirmDelete && !isGlobalMode && currentBranchId) {
      const result = await removeSupplierFromBranch(
        confirmDelete.supplier_id,
        currentBranchId,
      );
      if (result.success) {
        toast.success(
          "Supplier Removed",
          `Supplier removed from ${currentBranchName}`,
        );
      } else {
        toast.error("Remove Failed", result.error);
      }
    }
    setConfirmDelete(null);
  };

  /* ---------------- RENDER: Global Mode Banner ---------------- */
  const renderGlobalModeBanner = () => {
    if (!isGlobalMode) return null;

    return (
      <div className="">
        {/* <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Layers size={20} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">All Branches View</h3>
            <p className="text-sm text-blue-700 mt-1">
              Viewing suppliers across all branches. Select a specific branch from the header to add or manage suppliers.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                <Building2 size={12} />
                {suppliers.length} total suppliers
              </span>
              {isSuperAdmin && (
                <span className="text-xs text-blue-600">
                  Click "Manage Branches" on any supplier to edit branch access
                </span>
              )}
            </div>
          </div>
        </div> */}
      </div>
    );
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="flex flex-col h-full w-full font-poppins overflow-hidden">
      {/* Global Mode Banner */}
      {renderGlobalModeBanner()}

      {/* FILTERS */}
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <SupplierHeader
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          onAdd={handleAdd}
          onAddExisting={
            isSuperAdmin && !isGlobalMode ? handleAddExisting : null
          }
          isGlobalMode={isGlobalMode}
          currentBranchName={currentBranchName}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      {/* TABLE */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3">
        <SupplierTable
          data={filteredSuppliers}
          loading={loading}
          onRowClick={handleRowAction}
          isGlobalMode={isGlobalMode}
          isSuperAdmin={isSuperAdmin}
        />
      </div>

      {/* SUPPLIER MODAL */}
      <SupplierModal
        open={modalOpen}
        mode={modalMode}
        supplier={selectedSupplier}
        onClose={() => {
          setModalOpen(false);
          setSelectedSupplier(null);
        }}
        onSave={handleSave}
        saving={saving}
        currentBranchName={currentBranchName}
      />

      {/* MANAGE BRANCHES MODAL (Super Admin Only) */}
      {isSuperAdmin && (
        <ManageSupplierBranchesModal
          open={manageBranchesModal.open}
          supplier={manageBranchesModal.supplier}
          onClose={() =>
            setManageBranchesModal({ open: false, supplier: null })
          }
          onSave={handleBranchesUpdate}
          onDeactivate={handleDeactivateSupplier}
          onReactivate={handleReactivateSupplier} //  Add this
          onRemoveFromAll={handleRemoveFromAllBranches}
          getSupplierBranches={getSupplierBranches}
        />
      )}

      {/* ADD EXISTING SUPPLIER MODAL (Super Admin Only, Branch Mode) */}
      {isSuperAdmin && !isGlobalMode && (
        <AddExistingSupplierModal
          open={addExistingModal}
          onClose={() => setAddExistingModal(false)}
          onAdd={handleAddExistingSupplier}
          branchId={currentBranchId}
          branchName={currentBranchName}
          getAvailableSuppliers={getAvailableForBranch}
        />
      )}

      {/* DELETE CONFIRMATION */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title={isGlobalMode ? "Cannot Remove" : "Remove Supplier from Branch"}
        message={
          isGlobalMode ? (
            <div className="space-y-2">
              <p>You cannot remove suppliers in "All Branches" view.</p>
              <p className="text-sm text-gray-500">
                Select a specific branch to manage supplier access.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p>
                Remove <strong>{confirmDelete?.name}</strong> from{" "}
                <strong>{currentBranchName}</strong>?
              </p>
              <p className="text-sm text-amber-600">
                The supplier will still exist in other branches if linked.
              </p>
            </div>
          )
        }
        confirmText={isGlobalMode ? "OK" : "Remove"}
        cancelText="Cancel"
        type={isGlobalMode ? "warning" : "danger"}
        hideConfirm={isGlobalMode}
      />
    </div>
  );
};

export default SupplierPage;
