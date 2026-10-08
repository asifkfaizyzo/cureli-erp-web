// cadmin-web/src/pages/AppConfig/shop-tags/ShopTagsPage.jsx (do not remove this comment)

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Tag,
} from "lucide-react";
import {
  listShopTags,
  deleteShopTag,
  reorderShopTags,
} from "../../../api/cadminMarketplaceShops";
import TagFormModal from "./comps/TagFormModal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

export default function ShopTagsPage() {
  const navigate = useNavigate();

  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reorder saving
  const [reordering, setReordering] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listShopTags();
      setTags(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // ── Handlers ──────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingTag(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (tag) => {
    setEditingTag(tag);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingTag(null);
  };

  const handleModalSaved = () => {
    handleModalClose();
    fetchTags();
  };

  const handleDeleteClick = (tag) => {
    setDeleteTarget(tag);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteShopTag(deleteTarget.tag_id);
      setDeleteTarget(null);
      fetchTags();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= tags.length) return;

    const reordered = [...tags];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setTags(reordered);

    try {
      setReordering(true);
      await reorderShopTags(reordered.map((t) => t.tag_id));
    } catch (err) {
      console.error("Reorder failed:", err);
      fetchTags(); // revert on failure
    } finally {
      setReordering(false);
    }
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="px-8 py-5 bg-white border-b border-gray-100 flex items-center gap-4">
        <button
          onClick={() => navigate("/marketplace/app-config")}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center
            hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} className="text-gray-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">Shop Tags</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage pharmacy classification tags shown on customer-facing shop cards.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#05015A] text-white
            rounded-xl text-sm font-semibold hover:bg-[#05015A]/90 transition-colors"
        >
          <Plus size={15} />
          Add Tag
        </button>
      </div>

      {/* Content */}
      <div className="px-8 py-6 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertTriangle size={16} />
            {error}
          </div>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Tag size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No tags created yet</p>
            <p className="text-xs mt-1">Click "Add Tag" to create your first pharmacy type tag.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_2fr_100px_80px_100px] gap-3 px-5 py-3
              bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span>Color</span>
              <span>Label</span>
              <span>Description</span>
              <span>Slug</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table rows */}
            {tags.map((tag, index) => (
              <div
                key={tag.tag_id}
                className={`grid grid-cols-[40px_1fr_2fr_100px_80px_100px] gap-3 px-5 py-3.5
                  items-center border-b border-gray-50 hover:bg-gray-50/50 transition-colors
                  ${!tag.is_active ? "opacity-50" : ""}`}
              >
                {/* Color swatch */}
                <div
                  className="w-7 h-7 rounded-lg border border-gray-200 shadow-sm"
                  style={{ backgroundColor: tag.color_hex }}
                  title={tag.color_hex}
                />

                {/* Label + reorder */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0 || reordering}
                      className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp size={12} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 1)}
                      disabled={index === tags.length - 1 || reordering}
                      className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown size={12} className="text-gray-500" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {tag.label}
                  </span>
                </div>

                {/* Description */}
                <span className="text-xs text-gray-500 truncate">
                  {tag.description || "—"}
                </span>

                {/* Slug */}
                <code className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md truncate">
                  {tag.slug}
                </code>

                {/* Status */}
                <span
                  className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit
                    ${tag.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                    }`}
                >
                  {tag.is_active ? "Active" : "Inactive"}
                </span>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleOpenEdit(tag)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={14} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(tag)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalOpen && (
        <TagFormModal
          tag={editingTag}
          onClose={handleModalClose}
          onSaved={handleModalSaved}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title={deleteTarget.is_active ? "Deactivate Tag?" : "Delete Tag?"}
          message={
            deleteTarget.is_active
              ? `"${deleteTarget.label}" is currently active. Deactivating it will hide it from pharmacies but keep it on shops that already selected it. You can reactivate it later.`
              : `Permanently delete "${deleteTarget.label}"? This cannot be undone.`
          }
          confirmText={deleteTarget.is_active ? "Deactivate" : "Delete"}
          type="danger"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}