// pharmacy-web/src/hooks/purchase/usePurchaseAPI.js (do not remove this comment)
// src/hooks/purchase/usePurchaseAPI.js
import { useState, useCallback, useRef } from "react";
import purchaseAPI from "../../api/purchase";
import medicinesAPI from "../../api/medicines";
import suppliersAPI from "../../api/suppliers";
import inventoryAPI from "../../api/inventory";
import { useToast } from "../../components/common/Toast";
import { useAuthStore, selectBranchContext } from "../../store/useAuthStore";

const safeParseFloat = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Convert date string to ISO datetime string
 * Handles: "2026-01-31" -> "2026-01-31T00:00:00.000Z"
 */
const toISODateTime = (dateStr) => {
  if (!dateStr) return null;

  // Already ISO datetime format
  if (dateStr.includes("T")) {
    return dateStr;
  }

  // Date only format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${dateStr}T00:00:00.000Z`;
  }

  // Try to parse and convert
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    console.warn("Failed to parse date:", dateStr);
  }

  return null;
};

//  Helper to parse Prisma Decimal values from response
const parseDecimalValue = (value) => {
  if (value === null || value === undefined) return null;
  // Prisma Decimal comes as string in JSON response
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "number") return value;
  // Handle Prisma Decimal object
  if (typeof value === "object" && value.toString) {
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// ============================================
//  PACK SIZE MULTIPLIER HELPER
// ============================================
/**
 * Parses a pack size string and returns the multiplier for quantity conversion.
 *
 * Rules:
 * - "30s"    → 30 (tablets/capsules per strip)
 * - "120s"   → 120 (tablets in bottle)
 * - "10"     → 10 (plain number, assumed strip count)
 * - "10ml"   → 1 (liquids treated as 1 bottle)
 * - "3ml"    → 1 (injections/drops treated as 1 vial)
 * - "20GM"   → 1 (creams/gels treated as 1 tube)
 * - "100mg"  → 1 (powders treated as 1 unit)
 * - null/""  → 1 (default)
 */
const parsePackSizeMultiplier = (packStr) => {
  if (!packStr) return 1;
  const str = String(packStr).trim().toLowerCase();

  // Liquids, creams, gels, injections, etc. → always 1 unit
  if (
    str.includes("ml") ||
    str.includes("gm") ||
    str.includes("mg") ||
    str.endsWith("g") ||
    str.includes("litre") ||
    str.includes("bottle") ||
    str.includes("tube") ||
    str.includes("vial") ||
    str.includes("ampoule") ||
    str.includes("drop") ||
    str.includes("spray") ||
    str.includes("inhaler") ||
    str.includes("cream") ||
    str.includes("gel") ||
    str.includes("ointment") ||
    str.includes("syrup") ||
    str.includes("susp")
  ) {
    return 1;
  }

  // Extract digits for tablets/capsules (e.g. "30s" → 30, "10" → 10)
  const match = str.match(/(\d+)/);
  if (match) {
    const val = parseInt(match[1], 10);
    return val > 0 ? val : 1;
  }

  return 1;
};

// ============================================
//  FULL EXPIRY DATE PARSER HELPER
// ============================================
/**
 * Parses multiple expiry formats into standard ISO string format for DB storage.
 *
 * Rules:
 * - "2028-03-01" / "2028/03/01" -> ISO String
 * - "01-03-2028" / "01/03/2028" -> ISO String
 * - "03/28" / "03/2028"          -> Default to 1st of the month (e.g. 2028-03-01 ISO String)
 */
const parseExpiryDate = (expString) => {
  if (!expString) {
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    return defaultDate.toISOString();
  }

  const str = String(expString).trim();

  // Full ISO date string check
  if (str.includes("T") && !isNaN(new Date(str).getTime())) {
    return new Date(str).toISOString();
  }

  // Format: YYYY-MM-DD or YYYY/MM/DD (e.g. "2028-03-01")
  if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(str)) {
    const [y, m, d] = str.split(/[-/]/);
    const date = new Date(
      Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)),
    );
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY (e.g. "01-03-2028" or "01/03/2028")
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
    const [d, m, y] = str.split(/[-/]/);
    const date = new Date(
      Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10)),
    );
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  // Format: MM/YY or MM/YYYY (e.g. "03/28" or "03/2028")
  if (/^\d{1,2}\/\d{2,4}$/.test(str)) {
    const [month, year] = str.split("/");
    const fullYear =
      year.length === 2
        ? parseInt(year, 10) > 50
          ? 1900 + parseInt(year, 10)
          : 2000 + parseInt(year, 10)
        : parseInt(year, 10);
    const monthNum = parseInt(month, 10);

    // Default to the first day of the month
    const date = new Date(Date.UTC(fullYear, monthNum - 1, 1));
    if (!isNaN(date.getTime())) return date.toISOString();
  }

  try {
    const fallback = new Date(str);
    if (!isNaN(fallback.getTime())) {
      return fallback.toISOString();
    }
  } catch (e) {
    console.warn("Failed to parse expiry date:", expString);
  }

  // Default fallback to 1 year from today
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() + 1);
  return defaultDate.toISOString();
};

export const usePurchaseAPI = () => {
  const toast = useToast();

  //  Get branch context
  const branchContext = useAuthStore(selectBranchContext);

  //  Track last branch for comparison
  const lastBranchIdRef = useRef(branchContext.branch_id);

  const [isLoading, setIsLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  // ============================================
  // LOAD MEDICINES
  // ============================================
  const loadMedicines = useCallback(
    async (filters = {}) => {
      try {
        setIsLoading(true);
        const response = await medicinesAPI.getAll({
          isActive: true,
          limit: 1000,
          ...filters,
        });

        const formattedMedicines = response.data.medicines.map((med) => ({
          id: med.medicine_id,
          medicine_id: med.medicine_id,
          name: med.name,
          genericName: med.generic_name,
          manufacturer: med.manufacturer,
          mfac: med.manufacturer,
          category: med.category,
          subCategory: med.sub_category,
          schedule: med.schedule,
          hsnCode: med.hsn_code,
          hsn: med.hsn_code,
          packSize: med.pack_size,
          pack: med.pack_size,
          unitOfMeasure: med.unit_of_measure,
          gst: med.gst_percentage?.toString(),
          cgstPercent: med.cgst_percentage?.toString(),
          sgstPercent: med.sgst_percentage?.toString(),
          rackNo: med.rack_no,
          rack: med.rack_no,
          isActive: med.is_active,
          isDiscontinued: med.is_discontinued,
        }));

        setMedicines(formattedMedicines);
        return formattedMedicines;
      } catch (error) {
        console.error("Load medicines error:", error);
        toast.error("Failed to load medicines", error.message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // ============================================
  //  LOAD SUPPLIERS - With branch tracking
  // ============================================
  const loadSuppliers = useCallback(
    async (forceRefresh = false) => {
      try {
        setIsLoading(true);

        const currentBranchId = branchContext.branch_id;
        const branchChanged = lastBranchIdRef.current !== currentBranchId;

        //  Build params with branch context
        const params = {
          isActive: true,
          limit: 500,
        };

        //  If in branch mode, pass branch_id to filter suppliers
        if (branchContext.mode === "BRANCH" && currentBranchId) {
          params.branch_id = currentBranchId;
        }

        //  Update tracking ref BEFORE the API call
        lastBranchIdRef.current = currentBranchId;

        const response = await suppliersAPI.getAll(params);

        //  Client-side filter for safety
        const activeSuppliers = (response.data.suppliers || []).filter(
          (sup) => {
            // Filter out inactive suppliers
            if (!sup.is_active) return false;

            // In branch mode, verify supplier is linked to current branch
            if (branchContext.mode === "BRANCH" && currentBranchId) {
              // Check linked_branches array
              if (sup.linked_branches && Array.isArray(sup.linked_branches)) {
                const isLinkedToCurrentBranch = sup.linked_branches.some(
                  (b) =>
                    b.branch_id === currentBranchId && b.is_active !== false,
                );
                return isLinkedToCurrentBranch;
              }

              // Check current_branch object
              if (sup.current_branch) {
                return sup.current_branch.branch_id === currentBranchId;
              }

              // If no branch info, exclude in branch mode (safety)
              console.warn("⚠️ Supplier has no branch info:", sup.name);
              return false;
            }

            return true;
          },
        );

        const formattedSuppliers = activeSuppliers.map((sup) => ({
          id: sup.supplier_id,
          supplier_id: sup.supplier_id,
          supplierId: sup.supplier_code || sup.supplier_id,
          name: sup.name,

          // Contact
          contactPerson: sup.contact_person,
          contact: sup.contact_person,
          officePhone: sup.office_phone,
          personalPhone: sup.personal_phone,
          email: sup.email,

          // Address
          addressLine1: sup.address_line_1,
          addressLine2: sup.address_line_2,
          address: [
            sup.address_line_1,
            sup.address_line_2,
            sup.city,
            sup.state,
            sup.pincode,
          ]
            .filter(Boolean)
            .join(", "),
          city: sup.city,
          state: sup.state,
          pincode: sup.pincode,

          // Tax
          gstNumber: sup.gst_number,
          gst: sup.gst_number,
          panNumber: sup.pan_number,
          drugLicenseNo: sup.drug_license_no,

          // Credit
          creditDays: sup.credit_days,
          creditLimit: sup.credit_limit,

          // Status
          isActive: sup.is_active,

          //  Branch info
          linkedBranches: sup.linked_branches || [],
          currentBranch: sup.current_branch || null,
          branchCount:
            sup.linked_branches?.length || (sup.current_branch ? 1 : 0),
        }));

        setSuppliers(formattedSuppliers);
        return formattedSuppliers;
      } catch (error) {
        console.error("Load suppliers error:", error);
        toast.error("Failed to load suppliers", error.message);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [toast, branchContext.mode, branchContext.branch_id],
  );

  // ============================================
  // SEARCH MEDICINES
  // ============================================
  const searchMedicines = useCallback(
    async (searchTerm) => {
      if (!searchTerm || searchTerm.length < 2) {
        return medicines;
      }

      try {
        const response = await medicinesAPI.search(searchTerm);
        return response.data.medicines.map((med) => ({
          id: med.medicine_id,
          medicine_id: med.medicine_id,
          name: med.name,
          manufacturer: med.manufacturer,
          mfac: med.manufacturer,
          hsnCode: med.hsn_code,
          hsn: med.hsn_code,
          rackNo: med.rack_no,
          rack: med.rack_no,
          gst: med.gst_percentage?.toString(),
          cgstPercent: med.cgst_percentage?.toString(),
          sgstPercent: med.sgst_percentage?.toString(),
          packSize: med.pack_size,
          pack: med.pack_size,
        }));
      } catch (error) {
        console.error("Search medicines error:", error);
        return [];
      }
    },
    [medicines],
  );

  // ============================================
  // GET EXISTING BATCHES FOR MEDICINE
  // ============================================
  const getExistingBatches = useCallback(
    async (medicineId, branchId = null) => {
      try {
        const response = await inventoryAPI.getByMedicine(medicineId, {
          branchId,
          includeExpired: false,
        });

        return response.data.map((inv) => ({
          batch_number: inv.batch_number,
          expiry_date: inv.expiry_date,
          mrp: inv.mrp,
          rack_no: inv.rack_no,
          current_stock: inv.current_stock,
          selling_rate: inv.selling_rate,
        }));
      } catch (error) {
        console.error("Get existing batches error:", error);
        return [];
      }
    },
    [],
  );

  // ============================================
  // CREATE NEW MEDICINE
  // ============================================
  const createMedicine = useCallback(
    async (medicineData) => {
      try {
        setIsLoading(true);

        // Helper: safely convert to number or null
        const toNumberOrNull = (val) => {
          if (val === null || val === undefined || val === "") return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        };

        const payload = {
          name: medicineData.name,
          generic_name:
            medicineData.genericName || medicineData.generic_name || null,
          manufacturer: medicineData.manufacturer,
          category: medicineData.category || null,
          sub_category:
            medicineData.subCategory || medicineData.sub_category || null,
          schedule: medicineData.schedule || null,
          hsn_code: medicineData.hsnCode || medicineData.hsn_code || null,
          pack_size: medicineData.packSize || medicineData.pack_size || null,
          unit_of_measure:
            medicineData.unitOfMeasure ||
            medicineData.unit_of_measure ||
            "UNIT",
          gst_percentage: toNumberOrNull(medicineData.gst) ?? 12,
          cgst_percentage: toNumberOrNull(medicineData.cgstPercent) ?? 6,
          sgst_percentage: toNumberOrNull(medicineData.sgstPercent) ?? 6,
          rack_no: medicineData.rackNo || medicineData.rack_no || null,

          // Stock levels
          min_stock_level: toNumberOrNull(
            medicineData.min_stock_level || medicineData.minLevel,
          ),
          max_stock_level: toNumberOrNull(
            medicineData.max_stock_level || medicineData.maxLevel,
          ),
          reorder_point: toNumberOrNull(
            medicineData.reorder_point || medicineData.reorderPoint,
          ),
        };

        const response = await medicinesAPI.create(payload);

        // Parse response
        const parseDecimal = (val) => {
          if (val === null || val === undefined) return null;
          const num = Number(val);
          return isNaN(num) ? null : num;
        };

        const newMedicine = {
          id: response.data.medicine_id,
          medicine_id: response.data.medicine_id,
          name: response.data.name,
          manufacturer: response.data.manufacturer,
          mfac: response.data.manufacturer,
          genericName: response.data.generic_name,
          category: response.data.category,
          subCategory: response.data.sub_category,
          schedule: response.data.schedule,
          hsnCode: response.data.hsn_code,
          hsn: response.data.hsn_code,
          packSize: response.data.pack_size,
          pack: response.data.pack_size,
          rackNo: response.data.rack_no,
          rack: response.data.rack_no,
          gst: parseDecimal(response.data.gst_percentage)?.toString() || "12",
          cgstPercent:
            parseDecimal(response.data.cgst_percentage)?.toString() || "6",
          sgstPercent:
            parseDecimal(response.data.sgst_percentage)?.toString() || "6",

          // Stock levels
          min_stock_level: parseDecimal(response.data.min_stock_level),
          max_stock_level: parseDecimal(response.data.max_stock_level),
          reorder_point: parseDecimal(response.data.reorder_point),
        };

        setMedicines((prev) => [newMedicine, ...prev]);
        toast.success(
          "Medicine Added",
          `${medicineData.name} has been added successfully.`,
        );

        return newMedicine;
      } catch (error) {
        console.error("Create medicine error:", error);
        toast.error(
          "Failed to create medicine",
          error.response?.data?.message || error.message,
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // ============================================
  // BULK CREATE MEDICINES
  // ============================================
  const bulkCreateMedicines = useCallback(
    async (medicinesData) => {
      try {
        setIsLoading(true);

        const payload = medicinesData.map((med) => ({
          name: med.name,
          generic_name: med.genericName || null,
          manufacturer: med.manufacturer,
          category: med.category || null,
          sub_category: med.subCategory || null,
          schedule: med.schedule || null,
          hsn_code: med.hsnCode || null,
          pack_size: med.packSize || null,
          unit_of_measure: med.unitOfMeasure || "UNIT",
          gst_percentage: safeParseFloat(med.gst) ?? 12,
          cgst_percentage:
            safeParseFloat(med.cgstPercent) ??
            (safeParseFloat(med.gst) ? safeParseFloat(med.gst) / 2 : 6),
          sgst_percentage:
            safeParseFloat(med.sgstPercent) ??
            (safeParseFloat(med.gst) ? safeParseFloat(med.gst) / 2 : 6),
          rack_no: med.rackNo || null,
          min_stock_level: safeParseFloat(med.minLevel),
          max_stock_level: safeParseFloat(med.maxLevel),
          reorder_point: safeParseFloat(med.reorderPoint),
        }));

        const response = await medicinesAPI.bulkCreate(payload);

        const createdMedicines = response.data.created.map((med) => ({
          id: med.medicine_id,
          medicine_id: med.medicine_id,
          name: med.name,
          manufacturer: med.manufacturer,
          mfac: med.manufacturer,
          genericName: med.generic_name,
          category: med.category,
          subCategory: med.sub_category,
          schedule: med.schedule,
          hsnCode: med.hsn_code,
          hsn: med.hsn_code,
          rackNo: med.rack_no,
          rack: med.rack_no,
          packSize: med.pack_size,
          pack: med.pack_size,
          gst: parseDecimalValue(med.gst_percentage)?.toString() || "12",
          cgstPercent:
            parseDecimalValue(med.cgst_percentage)?.toString() || "6",
          sgstPercent:
            parseDecimalValue(med.sgst_percentage)?.toString() || "6",
          minLevel: parseDecimalValue(med.min_stock_level),
          maxLevel: parseDecimalValue(med.max_stock_level),
          reorderPoint: parseDecimalValue(med.reorder_point),
        }));

        setMedicines((prev) => [...createdMedicines, ...prev]);

        toast.success(
          "Bulk Import Complete",
          `${response.data.created.length} medicines added. ${response.data.skipped.length} skipped. ${response.data.errors.length} errors.`,
        );

        return response.data;
      } catch (error) {
        console.error("Bulk create medicines error:", error);
        toast.error(
          "Bulk import failed",
          error.response?.data?.message || error.message,
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // ============================================
  // CREATE NEW SUPPLIER
  // ============================================
  const createSupplier = useCallback(
    async (supplierData) => {
      try {
        setIsLoading(true);

        const payload = {
          name: supplierData.name,
          supplier_code: supplierData.supplierCode || null,
          contact_person: supplierData.contactPerson || null,
          office_phone: supplierData.officePhone || null,
          personal_phone: supplierData.personalPhone || null,
          email: supplierData.email || null,
          address_line_1: supplierData.addressLine1 || null,
          address_line_2: supplierData.addressLine2 || null,
          city: supplierData.city || null,
          state: supplierData.state || null,
          pincode: supplierData.pincode || null,
          gst_number: supplierData.gstNumber || null,
          pan_number: supplierData.panNumber || null,
          drug_license_no: supplierData.drugLicenseNo || null,
          credit_days: supplierData.creditDays || 0,
          credit_limit: supplierData.creditLimit || null,
          bank_name: supplierData.bankName || null,
          account_number: supplierData.accountNumber || null,
          ifsc_code: supplierData.ifscCode || null,
        };

        const response = await suppliersAPI.create(
          payload,
          branchContext.branch_id,
        );

        const newSupplier = {
          id: response.data.supplier_id,
          supplier_id: response.data.supplier_id,
          supplierId: response.data.supplier_code || response.data.supplier_id,
          name: response.data.name,
          contactPerson: response.data.contact_person,
          contact: response.data.contact_person,
          officePhone: response.data.office_phone,
          personalPhone: response.data.personal_phone,
          email: response.data.email,
          gstNumber: response.data.gst_number,
          gst: response.data.gst_number,
          address: [
            response.data.address_line_1,
            response.data.address_line_2,
            response.data.city,
            response.data.state,
            response.data.pincode,
          ]
            .filter(Boolean)
            .join(", "),
        };

        setSuppliers((prev) => [newSupplier, ...prev]);
        toast.success(
          "Supplier Added",
          `${supplierData.name} has been added successfully.`,
        );

        return newSupplier;
      } catch (error) {
        console.error("Create supplier error:", error);
        toast.error(
          "Failed to create supplier",
          error.response?.data?.message || error.message,
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, branchContext.branch_id],
  );

  // ============================================
  // SAVE PURCHASE INVOICE
  //  UPDATED: Applies pack size multiplier before sending to backend
  //     - Quantities are MULTIPLIED by pack size (e.g. 2 packs of 30s → 60 tablets)
  //     - Rates (purchase_rate, mrp, selling_rate) are DIVIDED by pack size
  //       (e.g. ₹320.53 per pack of 30 → ₹10.68 per tablet)
  //     - Line totals remain mathematically identical (Q × R = (Q×N) × (R/N))
  //     - Selling rate (`sRate` / `selling_rate`) falls back to `mrp` if not set.
  // ============================================
  const savePurchaseInvoice = useCallback(
    async (invoiceData, rows, supplier) => {
      try {
        setIsLoading(true);

        const filledRows = rows.filter(
          (r) => r.name && r.qty && parseFloat(r.qty) > 0,
        );

        if (filledRows.length === 0) {
          toast.warning("No Items", "Please add at least one item to save.");
          return null;
        }

        // Validate supplier_id
        if (!supplier.supplier_id) {
          toast.error("Missing Supplier", "Please select a valid supplier");
          return null;
        }

        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(supplier.supplier_id)) {
          toast.error("Invalid Supplier", `Supplier ID must be a UUID.`);
          return null;
        }

        const billableRows = filledRows.filter((row) => !row.isFreeItem);
        const freeRows = filledRows.filter((row) => row.isFreeItem === true);

        // ═══════════════════════════════════════════════════════════════
        // FIX: Build a name→medicine_id map from rows that DO have medicine_id
        // Then apply that medicine_id to rows with same name but missing id
        // This handles: same medicine, different batch, second row missing id
        // ═══════════════════════════════════════════════════════════════
        const nameMedicineIdMap = new Map();

        // First pass: collect all resolved medicine_ids by name (case-insensitive)
        billableRows.forEach((row) => {
          if (row.medicine_id && uuidRegex.test(row.medicine_id)) {
            const nameKey = (row.name || "").toLowerCase().trim();
            if (!nameMedicineIdMap.has(nameKey)) {
              nameMedicineIdMap.set(nameKey, row.medicine_id);
            }
          }
        });

        // Second pass: fill in missing medicine_ids from the map
        const resolvedBillableRows = billableRows.map((row) => {
          if (!row.medicine_id || !uuidRegex.test(row.medicine_id)) {
            const nameKey = (row.name || "").toLowerCase().trim();
            const resolvedId = nameMedicineIdMap.get(nameKey);
            if (resolvedId) {
              return { ...row, medicine_id: resolvedId };
            }
          }
          return row;
        });

        // Now validate — only flag rows that STILL have no medicine_id
        const rowsWithoutMedicineId = resolvedBillableRows
          .map((row, idx) => ({ row, idx: idx + 1 }))
          .filter(
            ({ row }) => !row.medicine_id || !uuidRegex.test(row.medicine_id),
          );

        if (rowsWithoutMedicineId.length > 0) {
          const missingProducts = rowsWithoutMedicineId
            .slice(0, 5)
            .map(
              ({ row, idx }) =>
                `Row ${idx}: "${row.name}" (Batch: ${row.batch || "N/A"})`,
            )
            .join("\n");

          const moreCount =
            rowsWithoutMedicineId.length > 5
              ? `\n...and ${rowsWithoutMedicineId.length - 5} more`
              : "";

          toast.error(
            "Products Not in Master",
            `${rowsWithoutMedicineId.length} item(s) need to be added to product master first:\n${missingProducts}${moreCount}`,
          );

          return null;
        }

        // Validate all medicine_ids are valid UUIDs
        const invalidMedicineIds = resolvedBillableRows
          .map((row, idx) => ({ row, idx: idx + 1 }))
          .filter(({ row }) => !uuidRegex.test(row.medicine_id));

        if (invalidMedicineIds.length > 0) {
          toast.error(
            "Invalid Product IDs",
            `${invalidMedicineIds.length} item(s) have invalid product IDs. Please re-select these products.`,
          );
          return null;
        }

        // Build line items using RESOLVED rows (with filled medicine_ids)
        const allResolvedRows = filledRows.map((row) => {
          if (
            !row.isFreeItem &&
            (!row.medicine_id || !uuidRegex.test(row.medicine_id))
          ) {
            const nameKey = (row.name || "").toLowerCase().trim();
            const resolvedId = nameMedicineIdMap.get(nameKey);
            if (resolvedId) {
              return { ...row, medicine_id: resolvedId };
            }
          }
          return row;
        });

        // ═══════════════════════════════════════════════════════════════
        //  APPLY PACK SIZE MULTIPLIER & AUTO-SET SELLING RATE TO MRP
        //     Quantity   × N  (e.g. 2 packs × 30 = 60 tablets)
        //     Rate       ÷ N  (e.g. ₹320.53 / 30 = ₹10.68 per tablet)
        //     MRP        ÷ N  (e.g. ₹420.69 / 30 = ₹14.02 per tablet)
        //     SellRate   ÷ N  (defaults to MRP if null/empty)
        //     FreeQty    × N  (free tablets also scale up)
        // ═══════════════════════════════════════════════════════════════
        const lineItems = allResolvedRows.map((row, idx) => {
          const packMultiplier = parsePackSizeMultiplier(row.pack);

          const rowQty = parseFloat(row.qty) || 0;
          const rowPrice = parseFloat(row.price) || 0;
          const rowMrp = parseFloat(row.mrp) || 0;
          // Fallback to MRP if selling rate is empty, 0, or invalid
          const rowSRate = parseFloat(row.sRate) || rowMrp;
          const rowFreeQty = parseFloat(row.sch || row.pQty) || 0;

          return {
            medicine_id: row.medicine_id,
            batch_number: row.batch || `BATCH-${Date.now()}-${idx}`,
            expiry_date: parseExpiryDate(row.exp),
            manufacturing_date: null,

            //  Multiply quantities by pack size
            quantity: rowQty * packMultiplier,
            free_quantity: row.isFreeItem ? 0 : rowFreeQty * packMultiplier,

            pack_size: row.pack || null,
            unit_of_measure: "UNIT",

            //  Divide rates to get per-unit price
            purchase_rate: rowPrice / packMultiplier,
            mrp: rowMrp / packMultiplier,
            selling_rate: rowSRate ? rowSRate / packMultiplier : null,

            scheme_discount: parseFloat(row.schemePercent) || 0,
            trade_discount: parseFloat(row.discountPercent) || 0,
            cgst_percent: parseFloat(row.cgstPercent || row.sgstPercent) || 0,
            sgst_percent: parseFloat(row.sgstPercent) || 0,
            igst_percent: 0,
            margin_percent: null,
            rack_no: row.rack || null,
            is_free_item: row.isFreeItem === true,
          };
        });

        const paidAmount = parseFloat(supplier.amountPaid) || 0;

        const payload = {
          supplier_id: supplier.supplier_id,
          branch_id: invoiceData.branch_id || null,
          supplier_invoice_no: supplier.invoiceNo || null,
          invoice_date:
            toISODateTime(invoiceData.invoice_date) || new Date().toISOString(),
          due_date: toISODateTime(invoiceData.due_date),
          received_date: toISODateTime(invoiceData.received_date),
          payment_mode: paidAmount > 0 ? supplier.paymentMode || "CASH" : null,
          paid_amount: paidAmount,
          transport_charges: parseFloat(invoiceData.transport_charges) || null,
          other_charges: parseFloat(invoiceData.other_charges) || null,
          remarks: invoiceData.remarks || null,
          lineItems,
        };

        let response;
        if (currentInvoice?.invoice_id) {
          response = await purchaseAPI.update(
            currentInvoice.invoice_id,
            payload,
          );
          toast.success(
            "Invoice Updated",
            "Purchase invoice updated successfully.",
          );
        } else {
          response = await purchaseAPI.create(payload);
          toast.success(
            "Invoice Saved",
            `Invoice #${response.data.invoice_number} saved as draft.`,
          );
        }

        setCurrentInvoice(response.data);
        return response.data;
      } catch (error) {
        console.error("Save purchase invoice error:", error);

        let errorMessage = "Failed to save invoice";

        if (error.response?.data?.errors) {
          errorMessage = error.response.data.errors
            .map((e) => `${e.field}: ${e.message}`)
            .join(", ");
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast.error("Save Failed", errorMessage);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, currentInvoice],
  );

  // ============================================
  // CONFIRM PURCHASE INVOICE
  // ============================================
  const confirmPurchaseInvoice = useCallback(
    async (invoiceId) => {
      try {
        setIsLoading(true);

        const response = await purchaseAPI.confirm(invoiceId);

        toast.success(
          "Invoice Confirmed",
          `Invoice #${response.data.invoice_number} confirmed and stock updated.`,
        );

        setCurrentInvoice(response.data);
        return response.data;
      } catch (error) {
        console.error("Confirm purchase invoice error:", error);
        toast.error(
          "Failed to confirm invoice",
          error.response?.data?.message || error.message,
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // ============================================
  // LOAD INVOICE FOR EDITING
  // ============================================
  const loadInvoiceForEdit = useCallback(
    async (invoiceId) => {
      try {
        setIsLoading(true);
        const response = await purchaseAPI.getById(invoiceId);

        setCurrentInvoice(response.data);
        return response.data;
      } catch (error) {
        console.error("Load invoice error:", error);
        toast.error(
          "Failed to load invoice",
          error.response?.data?.message || error.message,
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // ============================================
  // RESET CURRENT INVOICE
  // ============================================
  const resetInvoice = useCallback(() => {
    setCurrentInvoice(null);
  }, []);

  return {
    isLoading,
    medicines,
    suppliers,
    currentInvoice,
    loadMedicines,
    loadSuppliers,
    searchMedicines,
    getExistingBatches,
    createMedicine,
    bulkCreateMedicines,
    createSupplier,
    savePurchaseInvoice,
    confirmPurchaseInvoice,
    loadInvoiceForEdit,
    resetInvoice,
    parsePackSizeMultiplier,
    parseExpiryDate,
  };
};

export { parsePackSizeMultiplier, parseExpiryDate };