// cadmin-web/src/pages/MasterMedicines/MasterMedicinesPage.jsx (do not remove this comment)
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Pill,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  LinkIcon,
  Package,
  ImageOff,
  Image,
  AlertTriangle,
  Loader2,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Components
import MasterMedicineDetailModal from "./comps/MasterMedicineDetailModal";
import VariantLinkedModal from "./comps/VariantLinkedModal";
import MasterCatalogTable from "./comps/MasterCatalogTable";
import UnmappedTable from "./comps/UnmappedTable";
import ReviewTable from "./comps/ReviewTable";
import RawImagesTable from "./comps/RawImagesTable";
import NoImagesTable from "./comps/NoImagesTable";
import MatchMedicineModal from "./comps/MatchMedicineModal";
import CreateMedicineModal from "./comps/CreateMedicineModal";
import UnmappedDetailModal from "./comps/UnmappedDetailModal";
import LinkedMedicinesModal from "./comps/LinkedMedicinesModal";
import ImageUploadModal from "./comps/ImageUploadModal";
import ReviewDetailModal from "./comps/ReviewDetailModal";
import MasterCatalogGrid from "./comps/MasterCatalogGrid";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import HistoryTable from "./comps/HistoryTable";

// API
import {
  getMasterMedicines,
  getMasterMedicineById,
  getMasterMedicineStats,
  getUnmappedMedicines,
  getNeedsReview,
  getLinkedMedicines as fetchLinkedMedicines,
  getLinkedByVariant,
  acceptReviewMatch,
  rejectReviewMatch,
  matchToVariant,
  ignoreUnmapped,
  unlinkMedicine as apiUnlinkMedicine,
  IMAGE_STATUS,
  createMasterMedicine,
  getMappingHistory, 
  unignoreMedicine,
} from "../../api/cadminMasterMedicines";

import { useToast } from "../../components/common/Toast";
import { useModalStack } from "../../hooks/useModalStack";

const MAIN_SECTIONS = [
  { id: "catalog", label: "Master Catalog", icon: Pill },
  { id: "mapping", label: "Mapping", icon: LinkIcon },
  { id: "images", label: "Images", icon: Image },
];

const MAPPING_TABS = [
  { id: "unmapped", label: "Unmapped", icon: LinkIcon },
  { id: "review", label: "Needs Review", icon: HelpCircle },
  { id: "history", label: "History", icon: Clock },
];

const IMAGE_TABS = [
  { id: "raw", label: "Raw Images", icon: AlertTriangle },
  { id: "none", label: "No Images", icon: ImageOff },
];

const MasterMedicinesPage = () => {
  const toast = useToast();
  const { bringToFront, getZ } = useModalStack();

  // Navigation State
  const [activeSection, setActiveSection] = useState("catalog");
  const [activeMappingTab, setActiveMappingTab] = useState("unmapped");
  const [activeImageTab, setActiveImageTab] = useState("raw");

  const [loading, setLoading] = useState({
    stats: true,
    catalog: false,
    unmapped: false,
    review: false,
    history: false,
  });
   // History paginated state
  const [historyData, setHistoryData] = useState([]);
  const [historyMeta, setHistoryMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [historyFilters, setHistoryFilters] = useState({
    search: "",
    status: "",
    page: 1,
    limit: 10,
    sort: "actionDate",
    order: "desc",
    shopIds: "",
    selectedShops: [],
    dateFrom: "",
    dateTo: "",
  });

  const [confirmUnlinkDetail, setConfirmUnlinkDetail] = useState(null); 

  const [stats, setStats] = useState({
    totalMasters: 0,
    totalVariants: 0,
    verified: 0,
    raw: 0,
    none: 0,
    totalLinked: 0,
    unmapped: 0,
    needsReview: 0,
    drugs: 0,
    otc: 0,
  });

  // 1. Catalog Grid/Table State
  const [catalogData, setCatalogData] = useState([]);
  const [catalogMeta, setCatalogMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [catalogFilters, setCatalogFilters] = useState({
    search: "",
    type: "",
    form: "",
    category: "",
    page: 1,
    limit: 10,
    sort: "generic_name",
    order: "asc",
  });

  // 2. Unmapped Table Paginated State
  const [unmappedData, setUnmappedData] = useState([]);
  const [unmappedMeta, setUnmappedMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [unmappedFilters, setUnmappedFilters] = useState({
    search: "",
    type: "",
    page: 1,
    limit: 10,
    sort: "occurrence_count",
    order: "desc",
    shopIds: "",
    selectedShops: [],
    dateFrom: "",
    dateTo: "",
  });

  // 3. Review Table Paginated State
  const [reviewData, setReviewData] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [reviewFilters, setReviewFilters] = useState({
    search: "",
    confidenceFilter: "",
    page: 1,
    limit: 10,
    sort: "confidenceScore",
    order: "desc",
    shopIds: "",
    selectedShops: [],
    dateFrom: "",
    dateTo: "",
  });

  const [rawImageData, setRawImageData] = useState([]);
  const [noImageData, setNoImageData] = useState([]);
  const [catalogViewMode, setCatalogViewMode] = useState("table");

  const [selectedUnmapped, setSelectedUnmapped] = useState([]);
  const [selectedReview, setSelectedReview] = useState([]);
  const [selectedRaw, setSelectedRaw] = useState([]);
  const [selectedNone, setSelectedNone] = useState([]);

  // Modals state
  const [matchModal, setMatchModal] = useState({
    open: false,
    item: null,
    source: null,
  });
  const [createModal, setCreateModal] = useState({ open: false, item: null });
  const [detailModal, setDetailModal] = useState({ open: false, item: null });
  const [linkedModal, setLinkedModal] = useState({
    open: false,
    medicine: null,
    linkedData: [],
  });
  const [imageModal, setImageModal] = useState({ open: false, medicine: null });
  const [masterDetailModal, setMasterDetailModal] = useState({
    open: false,
    medicine: null,
    linkedData: [],
  });
  const [variantLinkedModal, setVariantLinkedModal] = useState({
    open: false,
    variant: null,
    linkedData: [],
  });
  const [reviewDetailModal, setReviewDetailModal] = useState({
    open: false,
    item: null,
  });
  const [confirmIgnore, setConfirmIgnore] = useState({
    open: false,
    item: null,
    bulk: false,
  });

  // ═══════════════════════════════════════════════════════════
  // FETCH ACTIONS
  // ═══════════════════════════════════════════════════════════

  const loadStats = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, stats: true }));
      const res = await getMasterMedicineStats();
      const data = res.data?.data;
      if (data) {
        setStats({
          totalMasters: data.overview?.totalMasters || 0,
          totalVariants: data.overview?.totalVariants || 0,
          verified: data.byImageStatus?.verified || 0,
          raw: data.byImageStatus?.raw || 0,
          none: data.byImageStatus?.none || 0,
          drugs: data.byType?.drug || 0,
          otc: data.byType?.otc || 0,
          unmapped: data.mapping?.unmapped || 0,
          needsReview: data.mapping?.needsReview || 0,
          totalLinked: data.mapping?.totalLinked || 0,
        });
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  }, []);


    const loadHistory = useCallback(
    async (filters = historyFilters) => {
      try {
        setLoading((prev) => ({ ...prev, history: true }));
        const { selectedShops, ...queryParams } = filters;
        const res = await getMappingHistory(queryParams);
        const data = res.data?.data;
        if (data) {
          setHistoryData(data.history || []);
          setHistoryMeta(data.meta || { total: 0, page: 1, limit: 10, totalPages: 0 });
        }
      } catch (error) {
        console.error("History load error:", error);
      } finally {
        setLoading((prev) => ({ ...prev, history: false }));
      }
    },
    [historyFilters],
  );

  const loadCatalog = useCallback(
    async (filters = catalogFilters) => {
      try {
        setLoading((prev) => ({ ...prev, catalog: true }));
        const res = await getMasterMedicines(filters);
        const data = res.data?.data;
        if (data) {
          setCatalogData(
            data.medicines.map((med) => ({
              id: med.id,
              masterKey: med.masterKey,
              name: med.genericName,
              genericName: med.genericName,
              normalizedName: med.masterKey,
              composition: Array.isArray(med.composition)
                ? med.composition.map((c) => c.name).join(" + ")
                : med.composition || "N/A",
              type: med.type,
              form: med.form,
              manufacturer: med.previewVariants?.[0]?.manufacturer || "N/A",
              variantCount: med.variantCount,
              priceRange: med.priceRange,
              imageStatus: med.imageStatus,
              primaryImage: med.primaryImage,
              previewVariants: med.previewVariants || [],
              createdAt: med.createdAt,
              updatedAt: med.updatedAt,
            })),
          );
          setCatalogMeta(data.meta);
        }
      } catch (error) {
        console.error("Catalog load error:", error);
        toast.error("Load Failed", "Failed to fetch master catalog");
      } finally {
        setLoading((prev) => ({ ...prev, catalog: false }));
      }
    },
    [catalogFilters, toast],
  );

  const loadUnmapped = useCallback(
    async (filters = unmappedFilters) => {
      try {
        setLoading((prev) => ({ ...prev, unmapped: true }));
        // Clean query params (omit UI-only fields)
        const { selectedShops, ...queryParams } = filters;
        const res = await getUnmappedMedicines(queryParams);
        const data = res.data?.data;
        if (data) {
          setUnmappedData(data.unmapped || []);
          setUnmappedMeta(
            data.meta || { total: 0, page: 1, limit: 10, totalPages: 0 },
          );

          // Auto-step back if current page is empty after item deletion
          if (data.unmapped?.length === 0 && (filters.page || 1) > 1) {
            setUnmappedFilters((prev) => ({ ...prev, page: prev.page - 1 }));
          }
        }
      } catch (error) {
        console.error("Unmapped load error:", error);
      } finally {
        setLoading((prev) => ({ ...prev, unmapped: false }));
      }
    },
    [unmappedFilters],
  );

  const loadReview = useCallback(
    async (filters = reviewFilters) => {
      try {
        setLoading((prev) => ({ ...prev, review: true }));
        // Clean query params (omit UI-only fields)
        const { selectedShops, ...queryParams } = filters;
        const res = await getNeedsReview(queryParams);
        const data = res.data?.data;
        if (data) {
          setReviewData(data.reviewItems || []);
          setReviewMeta(
            data.meta || { total: 0, page: 1, limit: 10, totalPages: 0 },
          );

          // Auto-step back if current page is empty after item action
          if (data.reviewItems?.length === 0 && (filters.page || 1) > 1) {
            setReviewFilters((prev) => ({ ...prev, page: prev.page - 1 }));
          }
        }
      } catch (error) {
        console.error("Review load error:", error);
      } finally {
        setLoading((prev) => ({ ...prev, review: false }));
      }
    },
    [reviewFilters],
  );

  const loadRawImages = useCallback(async () => {
    try {
      const res = await getMasterMedicines({
        imageStatus: IMAGE_STATUS.RAW,
        page: 1,
        limit: 50,
      });
      const data = res.data?.data;
      if (data) {
        setRawImageData(
          data.medicines.map((med) => ({
            id: med.id,
            masterKey: med.masterKey,
            name: med.genericName,
            genericName: med.genericName,
            type: med.type,
            form: med.form,
            variantCount: med.variantCount,
            imageStatus: med.imageStatus,
            primaryImage: med.primaryImage,
          })),
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadNoImages = useCallback(async () => {
    try {
      const res = await getMasterMedicines({
        imageStatus: IMAGE_STATUS.NONE,
        page: 1,
        limit: 50,
      });
      const data = res.data?.data;
      if (data) {
        setNoImageData(
          data.medicines.map((med) => ({
            id: med.id,
            masterKey: med.masterKey,
            name: med.genericName,
            genericName: med.genericName,
            type: med.type,
            form: med.form,
            variantCount: med.variantCount,
            imageStatus: med.imageStatus,
            primaryImage: med.primaryImage,
          })),
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // WATCH AND LAZY-LOAD SYNC
  // ═══════════════════════════════════════════════════════════

  // Load basic stats + Catalog on mount
  useEffect(() => {
    loadStats();
    loadCatalog();
  }, []);

   // Reset states & trigger load when section / tab switches
  useEffect(() => {
    if (activeSection === "mapping") {
      if (activeMappingTab === "unmapped") {
        loadUnmapped();
      } else if (activeMappingTab === "review") {
        loadReview();
      } else {
        loadHistory(); // <-- ADD THIS LINE HERE
      }
    } else if (activeSection === "images") {
      if (activeImageTab === "raw") {
        loadRawImages();
      } else {
        loadNoImages();
      }
    }
  }, [activeSection, activeMappingTab, activeImageTab]);

  // Handle unmapped filters execution
  useEffect(() => {
    if (activeSection === "mapping" && activeMappingTab === "unmapped") {
      loadUnmapped(unmappedFilters);
    }
  }, [unmappedFilters]);

  // Handle review filters execution
  useEffect(() => {
    if (activeSection === "mapping" && activeMappingTab === "review") {
      loadReview(reviewFilters);
    }
  }, [reviewFilters]);

  useEffect(() => {
    if (activeSection === "mapping" && activeMappingTab === "history") {
      loadHistory(historyFilters);
    }
  }, [historyFilters, activeSection, activeMappingTab]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════

  const handleMatchUnmapped = useCallback(
    (item) => {
      setMatchModal({ open: true, item, source: "unmapped" });
      bringToFront("match");
    },
    [bringToFront],
  );

  const handleCreateFromUnmapped = useCallback(
    (item) => {
      setCreateModal({ open: true, item });
      bringToFront("create");
    },
    [bringToFront],
  );

  const handleIgnoreUnmapped = useCallback((item) => {
    setConfirmIgnore({ open: true, item, bulk: false });
  }, []);

  const handleViewUnmappedDetail = useCallback(
    (item) => {
      setDetailModal({ open: true, item });
      bringToFront("unmappedDetail");
    },
    [bringToFront],
  );

  const handleAcceptMatch = useCallback(
    async (item) => {
      try {
        const res = await acceptReviewMatch(item.id);
        const linkedTo = res.data?.data?.linkedTo;
        toast.success(
          "Match Accepted",
          `Linked to variant "${linkedTo?.variant_name || item.suggestedMaster?.name}"`,
        );
        loadReview();
        loadStats();
      } catch (e) {
        toast.error("Failed", "Could not accept match");
      }
    },
    [toast, loadReview, loadStats],
  );

  const handleChangeMatch = useCallback(
    (item) => {
      setMatchModal({ open: true, item, source: "review" });
      bringToFront("match");
    },
    [bringToFront],
  );

  const handleRejectMatch = useCallback(
    async (item) => {
      try {
        await rejectReviewMatch(item.id);
        toast.info(
          "Match Rejected",
          `"${item.rawName}" moved back to Unmapped`,
        );
        loadReview();
        loadStats();
      } catch (e) {
        toast.error("Failed", "Could not reject match");
      }
    },
    [toast, loadReview, loadStats],
  );

  const handleViewReviewDetail = useCallback(
    (item) => {
      setReviewDetailModal({ open: true, item });
      bringToFront("reviewDetail");
    },
    [bringToFront],
  );

  const handleUploadImage = useCallback(
    (medicine) => {
      setImageModal({ open: true, medicine });
      bringToFront("imageUpload");
    },
    [bringToFront],
  );

  const handleImageUploaded = useCallback(() => {
    loadCatalog();
    loadStats();
    toast.success("Image Updated", "Medicine image updated successfully");
  }, [loadCatalog, loadStats, toast]);

  const handleViewLinked = useCallback(
    async (medicine) => {
      try {
        const res = await fetchLinkedMedicines(medicine.id);
        setLinkedModal({
          open: true,
          medicine,
          linkedData: res.data?.data || [],
        });
        bringToFront("linked");
      } catch (e) {
        toast.error("Failed", "Could not fetch linked medicines");
      }
    },
    [toast, bringToFront],
  );

  const handleUnlinkMedicine = useCallback(
    async (masterId, linkedId) => {
      try {
        await apiUnlinkMedicine(linkedId);
        setLinkedModal((prev) => ({
          ...prev,
          linkedData: prev.linkedData.filter((lm) => lm.id !== linkedId),
        }));
        loadStats();
        toast.success(
          "Medicine Unlinked",
          "Shop medicine unlinked successfully",
        );
      } catch (e) {
        toast.error("Failed", "Could not unlink medicine");
      }
    },
    [toast, loadStats],
  );

  const handleViewMasterDetail = useCallback(
    async (medicine) => {
      try {
        const res = await getMasterMedicineById(medicine.id);
        const linkedRes = await fetchLinkedMedicines(medicine.id);
        setMasterDetailModal({
          open: true,
          medicine: res.data?.data,
          linkedData: linkedRes.data?.data || [],
        });
        bringToFront("masterDetail");
      } catch (e) {
        toast.error("Failed", "Could not load medicine details");
      }
    },
    [toast, bringToFront],
  );

  const handleViewVariantLinked = useCallback(
    async (variant) => {
      try {
        const res = await getLinkedByVariant(variant.id);
        setVariantLinkedModal({
          open: true,
          variant: res.data?.data?.variant || variant,
          linkedData: res.data?.data?.linkedMedicines || [],
        });
        bringToFront("variantLinked");
      } catch (e) {
        toast.error("Failed", "Could not load variant links");
      }
    },
    [bringToFront, toast],
  );

    const handleConfirmMatch = useCallback(
    async (selection) => {
      const { item, source } = matchModal;
      try {
        // Resilient ID extraction: use medicineIds if present (unmapped group), else fallback to [item.id]
        const medicineIds =
          Array.isArray(item.medicineIds) && item.medicineIds.length > 0
            ? item.medicineIds
            : item.id
              ? [item.id]
              : [];

        if (medicineIds.length === 0) {
          toast.error("Error", "No valid medicine ID found to link.");
          return;
        }

        const variantId = selection.variantId || selection.variant?.id;
        if (!variantId) {
          toast.error("Error", "No variant selected.");
          return;
        }

        await matchToVariant(medicineIds, variantId);
        setMatchModal({ open: false, item: null, source: null });
        toast.success("Medicine Linked", "Matched successfully!");

        // Refresh all relevant tables
        if (source === "unmapped") {
          loadUnmapped();
        } else if (source === "review") {
          loadReview();
        }
        loadHistory();
        loadCatalog();
        loadStats();
      } catch (e) {
        console.error("Match error:", e);
        toast.error("Failed", e.response?.data?.message || "Could not complete match");
      }
    },
    [matchModal, toast, loadUnmapped, loadReview, loadHistory, loadCatalog, loadStats],
  );

  const handleConfirmCreate = useCallback(
    async (payload) => {
      try {
        const res = await createMasterMedicine(payload);
        const created = res.data?.data;

        if (payload.images?.length > 0 && created?.master?.id) {
          const { uploadImage } =
            await import("../../api/cadminMasterMedicines");
          for (const img of payload.images) {
            if (img.file) {
              await uploadImage(
                created.master.id,
                img.file,
                img.type || "GALLERY",
                created.variant?.skuId,
              );
            }
          }
        }

        if (createModal.item?.medicineIds?.length > 0) {
          await ignoreUnmapped(createModal.item.medicineIds);
        }

        setCreateModal({ open: false, item: null });
        loadCatalog();
        loadUnmapped();
        loadStats();
        toast.success(
          "Success",
          "Medicine created and added to master catalog",
        );
      } catch (e) {
        toast.error("Failed", "Failed to create master medicine");
      }
    },
    [createModal.item, loadCatalog, loadUnmapped, loadStats, toast],
  );

  const executeIgnore = useCallback(async () => {
    const { item, bulk } = confirmIgnore;
    try {
      if (bulk) {
        const allIds = unmappedData
          .filter((u) => selectedUnmapped.includes(u.id))
          .flatMap((u) => u.medicineIds || []);
        await ignoreUnmapped(allIds);
        setSelectedUnmapped([]);
        toast.success("Ignored", "Selected items have been ignored");
      } else if (item) {
        await ignoreUnmapped(item.medicineIds || []);
        toast.success("Ignored", "Group has been ignored");
      }
      setConfirmIgnore({ open: false, item: null, bulk: false });
      loadUnmapped();
      loadStats();
    } catch (e) {
      toast.error("Failed", "Failed to ignore items");
    }
  }, [
    confirmIgnore,
    unmappedData,
    selectedUnmapped,
    loadUnmapped,
    loadStats,
    toast,
  ]);

  const handleBulkIgnoreUnmapped = useCallback(() => {
    if (selectedUnmapped.length === 0) return;
    setConfirmIgnore({ open: true, item: null, bulk: true });
  }, [selectedUnmapped]);

  const handleBulkAcceptReview = useCallback(async () => {
    if (selectedReview.length === 0) return;
    try {
      for (const id of selectedReview) {
        await acceptReviewMatch(id);
      }
      setSelectedReview([]);
      toast.success("Success", "Accepted bulk suggestions");
      loadReview();
      loadStats();
    } catch (e) {
      toast.error("Failed", "Could not complete bulk accept");
    }
  }, [selectedReview, loadReview, loadStats, toast]);

  const handleBulkRejectReview = useCallback(async () => {
    if (selectedReview.length === 0) return;
    try {
      for (const id of selectedReview) {
        await rejectReviewMatch(id);
      }
      setSelectedReview([]);
      toast.success("Success", "Rejected bulk suggestions");
      loadReview();
      loadStats();
    } catch (e) {
      toast.error("Failed", "Could not complete bulk reject");
    }
  }, [selectedReview, loadReview, loadStats, toast]);

  const handleRefresh = useCallback(() => {
    loadStats();
    if (activeSection === "catalog") loadCatalog();
    if (activeSection === "mapping") {
      if (activeMappingTab === "unmapped") loadUnmapped();
      else loadReview();
    }
    if (activeSection === "images") {
      if (activeImageTab === "raw") loadRawImages();
      else loadNoImages();
    }
  }, [
    activeSection,
    activeMappingTab,
    activeImageTab,
    loadStats,
    loadCatalog,
    loadUnmapped,
    loadReview,
    loadHistory,
    loadRawImages,
    loadNoImages,
  ]);

  // ═══════════════════════════════════════════════════════════
  // RENDER INTERACTION
  // ═══════════════════════════════════════════════════════════

  const renderContent = () => {
    if (activeSection === "catalog") {
      if (catalogViewMode === "grid") {
        return (
          <MasterCatalogGrid
            medicines={catalogData}
            meta={catalogMeta}
            onUploadImage={handleUploadImage}
            loading={loading.catalog}
            onFiltersChange={(newFilters) => {
              const updated = { ...catalogFilters, ...newFilters };
              setCatalogFilters(updated);
              loadCatalog(updated);
            }}
            onRowClick={handleViewMasterDetail}
          />
        );
      }

      return (
        <MasterCatalogTable
          medicines={catalogData}
          meta={catalogMeta}
          onViewLinked={handleViewLinked}
          onUploadImage={handleUploadImage}
          loading={loading.catalog}
          onFiltersChange={(newFilters) => {
            const updated = { ...catalogFilters, ...newFilters };
            setCatalogFilters(updated);
            loadCatalog(updated);
          }}
          onRowClick={handleViewMasterDetail}
          viewMode={catalogViewMode}
          onViewModeChange={setCatalogViewMode}
        />
      );
    }

        if (activeSection === "mapping") {
      if (activeMappingTab === "unmapped") {
        return (
          <UnmappedTable
            data={unmappedData}
            meta={unmappedMeta}
            filters={unmappedFilters}
            onFiltersChange={(f) =>
              setUnmappedFilters((prev) => ({ ...prev, ...f }))
            }
            selectedIds={selectedUnmapped}
            onSelectionChange={setSelectedUnmapped}
            onMatch={handleMatchUnmapped}
            onCreate={handleCreateFromUnmapped}
            onIgnore={handleIgnoreUnmapped}
            onViewDetail={handleViewUnmappedDetail}
            onBulkIgnore={handleBulkIgnoreUnmapped}
            loading={loading.unmapped}
          />
        );
      } else if (activeMappingTab === "review") {
        return (
          <ReviewTable
            data={reviewData}
            meta={reviewMeta}
            filters={reviewFilters}
            onFiltersChange={(f) =>
              setReviewFilters((prev) => ({ ...prev, ...f }))
            }
            selectedIds={selectedReview}
            onSelectionChange={setSelectedReview}
            onAccept={handleAcceptMatch}
            onChange={handleChangeMatch}
            onReject={handleRejectMatch}
            onBulkAccept={handleBulkAcceptReview}
            onBulkReject={handleBulkRejectReview}
            onViewDetail={handleViewReviewDetail}
            loading={loading.review}
          />
        );
      } else {
        // ── MOUNT HISTORY TABLE HERE ──
         return (
          <HistoryTable
            data={historyData}
            meta={historyMeta}
            filters={historyFilters}
            onFiltersChange={(f) =>
              setHistoryFilters((prev) => ({ ...prev, ...f }))
            }
            onRelink={(item) => {
              // Open match modal with history context
              setMatchModal({ open: true, item, source: "history" });
              bringToFront("match");
            }}
            onUnlink={handleUnlinkHistoryAction}
            onUnignore={handleUnignoreAction}
            loading={loading.history}
          />
        );
      }
    }

    if (activeSection === "images") {
      if (activeImageTab === "raw") {
        return (
          <RawImagesTable
            medicines={rawImageData}
            selectedIds={selectedRaw}
            onSelectionChange={setSelectedRaw}
            onUploadImage={handleUploadImage}
            onViewLinked={handleViewLinked}
            onRowClick={handleViewMasterDetail}
          />
        );
      } else {
        return (
          <NoImagesTable
            medicines={noImageData}
            selectedIds={selectedNone}
            onSelectionChange={setSelectedNone}
            onUploadImage={handleUploadImage}
            onViewLinked={handleViewLinked}
            onRowClick={handleViewMasterDetail}
          />
        );
      }
    }
  };
    const handleUnignoreAction = useCallback(
    async (item) => {
      try {
        await unignoreMedicine(item.id);
        toast.success("Medicine Unignored", `"${item.rawName}" moved back to Unmapped queue.`);
        loadHistory();
        loadStats();
      } catch (e) {
        toast.error("Failed", e.message || "Could not unignore medicine");
      }
    },
    [toast, loadHistory, loadStats],
  );

  const handleUnlinkHistoryAction = useCallback((item) => {
    setConfirmUnlinkDetail(item);
  }, []);

  const confirmUnlinkHistory = async () => {
    if (!confirmUnlinkDetail) return;
    try {
      await apiUnlinkMedicine(confirmUnlinkDetail.id);
      toast.success("Medicine Unlinked", "Unlinked successfully and moved back to unmapped list");
      setConfirmUnlinkDetail(null);
      loadHistory();
      loadStats();
    } catch (e) {
      toast.error("Error", "Could not unlink medicine");
    }
  };

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* HEADER */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        {/* Title Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <Pill size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Master Medicine Catalog
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Global medicine database with image and mapping management
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={
              loading.stats ||
              loading.catalog ||
              loading.unmapped ||
              loading.review
            }
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                       hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                       disabled:opacity-50 text-sm font-semibold"
          >
            {loading.stats ||
            loading.catalog ||
            loading.unmapped ||
            loading.review ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatBadge
            icon={Package}
            label="Masters"
            value={stats.totalMasters}
            color="gray"
          />
          <StatBadge
            icon={CheckCircle2}
            label="Verified"
            value={stats.verified}
            color="green"
          />
          <StatBadge
            icon={AlertTriangle}
            label="Raw"
            value={stats.raw}
            color="amber"
          />
          <StatBadge
            icon={ImageOff}
            label="No Image"
            value={stats.none}
            color="red"
          />
          <div className="h-6 w-px bg-gray-300 hidden md:block" />
          <StatBadge
            icon={LinkIcon}
            label="Linked"
            value={stats.totalLinked}
            color="blue"
          />
          <StatBadge
            icon={LinkIcon}
            label="Unmapped"
            value={stats.unmapped}
            color="orange"
          />
          <StatBadge
            icon={HelpCircle}
            label="Review"
            value={stats.needsReview}
            color="yellow"
          />
        </div>

        {/* MAIN SECTION TABS */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          {MAIN_SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            let count = 0;
            if (section.id === "catalog") count = stats.totalMasters;
            if (section.id === "mapping")
              count = stats.unmapped + stats.needsReview;
            if (section.id === "images") count = stats.raw + stats.none;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                  transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#000060] shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                  }`}
              >
                <Icon size={16} />
                {section.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-[#000060] text-white" : "bg-gray-200 text-gray-600"}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SUB TABS */}
        {activeSection === "mapping" && (
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg w-fit border border-gray-200 animate-in fade-in slide-in-from-top-1 duration-150">
            {MAPPING_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeMappingTab === tab.id;
              
              // ── DYNAMICALLY MAP EACH TAB TO ITS RESPECTIVE METRIC ──
              const count =
                tab.id === "unmapped"
                  ? stats.unmapped
                  : tab.id === "review"
                    ? stats.needsReview
                    : stats.totalLinked; // "History" maps to total linked medicines (18)
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMappingTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeSection === "images" && (
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg w-fit border border-gray-200 animate-in fade-in slide-in-from-top-1 duration-150">
            {IMAGE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeImageTab === tab.id;
              const count = tab.id === "raw" ? stats.raw : stats.none;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveImageTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? "bg-white text-gray-900 shadow-sm font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${isActive ? "bg-indigo-100 text-indigo-700" : "bg-gray-200 text-gray-600"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeSection}-${activeMappingTab}-${activeImageTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* MODALS stack */}
      <MatchMedicineModal
        isOpen={matchModal.open}
        item={matchModal.item}
        source={matchModal.source}
        onClose={() => setMatchModal({ open: false, item: null, source: null })}
        onConfirm={handleConfirmMatch}
        zIndex={getZ("match")}
      />

      <CreateMedicineModal
        isOpen={createModal.open}
        item={createModal.item}
        onClose={() => setCreateModal({ open: false, item: null })}
        onConfirm={handleConfirmCreate}
        zIndex={getZ("create")}
      />

      <UnmappedDetailModal
        isOpen={detailModal.open}
        item={detailModal.item}
        onClose={() => setDetailModal({ open: false, item: null })}
        onMatch={() => {
          setDetailModal({ open: false, item: null });
          handleMatchUnmapped(detailModal.item);
        }}
        onCreate={() => {
          setDetailModal({ open: false, item: null });
          handleCreateFromUnmapped(detailModal.item);
        }}
        zIndex={getZ("unmappedDetail")}
      />

      <LinkedMedicinesModal
        isOpen={linkedModal.open}
        medicine={linkedModal.medicine}
        linkedData={linkedModal.linkedData}
        onClose={() =>
          setLinkedModal({ open: false, medicine: null, linkedData: [] })
        }
        onUnlink={handleUnlinkMedicine}
        zIndex={getZ("linked")}
      />

      <ImageUploadModal
        isOpen={imageModal.open}
        medicine={imageModal.medicine}
        onClose={() => setImageModal({ open: false, medicine: null })}
        onImageUploaded={handleImageUploaded}
        onViewMasterDetail={handleViewMasterDetail}
        zIndex={getZ("imageUpload")}
      />

      <MasterMedicineDetailModal
        isOpen={masterDetailModal.open}
        medicine={masterDetailModal.medicine}
        linkedData={masterDetailModal.linkedData}
        onClose={() =>
          setMasterDetailModal({ open: false, medicine: null, linkedData: [] })
        }
        onUploadImage={handleUploadImage}
        onViewVariantLinked={handleViewVariantLinked}
        onEdit={(med) => console.log("Edit:", med)}
        onDelete={(med) => console.log("Delete:", med)}
        zIndex={getZ("masterDetail")}
      />

      <VariantLinkedModal
        isOpen={variantLinkedModal.open}
        variant={variantLinkedModal.variant}
        linkedData={variantLinkedModal.linkedData}
        onClose={() =>
          setVariantLinkedModal({ open: false, variant: null, linkedData: [] })
        }
        zIndex={getZ("variantLinked")}
      />

      <ReviewDetailModal
        isOpen={reviewDetailModal.open}
        item={reviewDetailModal.item}
        onClose={() => setReviewDetailModal({ open: false, item: null })}
        onAccept={handleAcceptMatch}
        onChange={handleChangeMatch}
        onReject={handleRejectMatch}
        zIndex={getZ("reviewDetail")}
      />

      <ConfirmDialog
        isOpen={confirmIgnore.open}
        onClose={() =>
          setConfirmIgnore({ open: false, item: null, bulk: false })
        }
        onConfirm={executeIgnore}
        title={
          confirmIgnore.bulk
            ? "Ignore Selected Medicines?"
            : "Ignore Medicine Group?"
        }
        message={
          confirmIgnore.bulk ? (
            <p>
              Are you sure you want to ignore{" "}
              <strong>{selectedUnmapped.length}</strong> unmapped groups?
            </p>
          ) : (
            <p>
              Are you sure you want to ignore{" "}
              <strong>"{confirmIgnore.item?.normalizedName}"</strong>?
            </p>
          )
        }
        confirmText="Ignore"
        type="danger"
      />

         {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmUnlinkDetail}
        onClose={() => setConfirmUnlinkDetail(null)}
        onConfirm={confirmUnlinkHistory}
        title="Unlink Medicine from Catalog"
        message={
          confirmUnlinkDetail ? (
            <p>
              Are you sure you want to unlink{" "}
              <strong>"{confirmUnlinkDetail.rawName}"</strong> from its current variant? This will return it to the unmapped list.
            </p>
          ) : (
            ""
          )
        }
        confirmText="Unlink"
        type="danger"
      />

    </div>
  );
};

const StatBadge = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 border border-gray-200",
    green: "bg-green-100 text-green-700 border border-green-200",
    amber: "bg-amber-100 text-amber-700 border border-amber-200",
    red: "bg-red-100 text-red-700 border border-red-200",
    blue: "bg-blue-100 text-blue-700 border border-blue-200",
    orange: "bg-orange-100 text-orange-700 border border-orange-200",
    yellow: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  };

  return (
    <div
      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm ${colorClasses[color]}`}
    >
      <Icon size={14} />
      <span>{label}:</span>
      <span className="font-bold">{value}</span>
    </div>
  );
};

export default MasterMedicinesPage;
