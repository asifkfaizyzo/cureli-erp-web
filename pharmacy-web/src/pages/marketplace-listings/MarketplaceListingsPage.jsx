// pharmacy-web/src/pages/marketplace-listings/MarketplaceListingsPage.jsx (do not remove this comment)
// src/pages/marketplace-listings/MarketplaceListingsPage.jsx

import { RefreshCw, Download, RotateCcw, Pill } from "lucide-react";

import { useListingsPage } from "../../hooks/marketplace/useListingsPage";
import BranchSelectorCard from "./components/BranchSelectorCard";
import MarketplaceToolbar from "./components/MarketplaceToolbar";
import ListingsSearchBar from "./components/ListingsSearchBar";
import ListingsTable from "./components/ListingsTable";
import ListingDetailsDrawer from "./components/ListingDetailsDrawer";
import BulkActionBar from "./components/BulkActionBar";
import StatusPill from "../marketplace-storefront/components/primitives/StatusPill";

const MarketplaceListingsPage = () => {
  const page = useListingsPage();

  return (
    <div className="h-full flex flex-col bg-[#010015] overflow-hidden">
      {/* ── Top Header ── */}
      <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Pill size={18} className="text-white/60" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Marketplace Listings
                </h1>
                <StatusPill status="LIVE" />
              </div>
              <p className="text-[12px] text-white/35 mt-0.5">
                Manage which medicines appear in the Cureli marketplace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <HeaderButton
              icon={RotateCcw}
              label="Refresh"
              onClick={page.onRefresh}
              disabled={page.isListingsLoading}
            />
            
            <button
              onClick={page.onSyncInventory}
              disabled={page.isSyncing || !page.selectedBranch}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#05015A] hover:bg-[#0a0280] border border-white/[0.1] text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={13}
                className={page.isSyncing ? "animate-spin" : ""}
              />
              {page.isSyncing ? "Syncing..." : "Sync Inventory"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-15">
        {/* Branch Selector */}
        <BranchSelectorCard
          branches={page.branchSummaries}
          selectedBranch={page.selectedBranch}
          onBranchChange={page.onBranchChange}
          isLoading={page.isSummaryLoading}
          isSuperAdmin={page.isSuperAdmin}
        />

        {/* Controls Toolbar */}
        <MarketplaceToolbar
          globalEnabled={page.globalEnabled}
          categories={page.categories}
          categoryToggles={page.categoryToggles}
          onCategoryToggle={page.onCategoryToggle}
          selectedCount={page.selectedIds.size}
          onBulkHide={page.onBulkHide}
          onBulkShow={page.onBulkShow}
          onBulkOutOfStock={page.onBulkOutOfStock}
          onBulkRestoreStock={page.onBulkRestoreStock}
          isCategoriesLoading={page.isCategoriesLoading}
        />

        {/* Search + Filters */}
        <ListingsSearchBar
          searchQuery={page.searchQuery}
          onSearchChange={page.onSearchChange}
          filterCategory={page.filterCategory}
          onCategoryChange={page.onCategoryChange}
          filterVisibility={page.filterVisibility}
          onVisibilityChange={page.onVisibilityChange}
          filterStock={page.filterStock}
          onStockChange={page.onStockChange}
          sortBy={page.sortBy}
          onSortChange={page.onSortChange}
          categories={page.categories}
          activeTab={page.activeTab}
          onTabChange={page.onTabChange}
          resultCount={page.totalResults}
          hasActiveFilters={page.hasActiveFilters}
          onClearFilters={page.onClearFilters}
        />

        {/* Medicine Table */}
        <ListingsTable
          listings={page.listings}
          selectedIds={page.selectedIds}
          allSelected={page.allSelected}
          someSelected={page.someSelected}
          onToggleSelectAll={page.onToggleSelectAll}
          onToggleSelectOne={page.onToggleSelectOne}
          onToggleVisibility={page.onToggleVisibility}
          onSetStockStatus={page.onSetStockStatus}
          onSetPrice={page.onSetPrice}
          onOpenDrawer={page.onOpenDrawer}
          globalEnabled={page.globalEnabled}
          isLoading={page.isListingsLoading}
          updatingIds={page.updatingIds}
          activeTab={page.activeTab}
          currentPage={page.currentPage}
          totalPages={page.totalPages}
          totalResults={page.totalResults}
          onPageChange={page.onPageChange}
          pageSize={page.PAGE_SIZE}
        />
      </div>

      {/* ── Drawer ── */}
      <ListingDetailsDrawer
        open={page.drawerOpen}
        listing={page.drawerListing}
        detail={page.drawerDetail}
        isDetailLoading={page.isDrawerDetailLoading}
        detailError={page.drawerDetailError}
        onClose={page.onCloseDrawer}
        onToggleVisibility={page.onToggleVisibility}
        onSetStockStatus={page.onSetStockStatus}
        onSetPrice={page.onSetPrice}
        onTogglePrescription={page.onTogglePrescription}
        isUpdating={
          page.drawerListing
            ? page.updatingIds.has(page.drawerListing.listing_id)
            : false
        }
      />

      {/* ── Bulk Action Bar ── */}
      <BulkActionBar
        selectedCount={page.selectedIds.size}
        onHide={page.onBulkHide}
        onShow={page.onBulkShow}
        onOutOfStock={page.onBulkOutOfStock}
        onRestoreStock={page.onBulkRestoreStock}
        onClear={page.onClearSelection}
        isLoading={page.isBulkUpdating}
      />
    </div>
  );
};

const HeaderButton = ({ icon: Icon, label, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] text-white/50 hover:text-white/70 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
  >
    <Icon size={13} />
    {label}
  </button>
);

export default MarketplaceListingsPage;
