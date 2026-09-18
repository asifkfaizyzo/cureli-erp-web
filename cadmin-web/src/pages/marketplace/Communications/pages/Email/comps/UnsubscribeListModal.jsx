// src/pages/Communications/pages/Broadcast/Email/comps/UnsubscribeListModal.jsx

import { useState, useEffect } from "react";
import {
  X,
  Search,
  Download,
  Plus,
  Trash2,
  Loader2,
  Mail,
  AlertCircle,
  CheckCircle,
  Users,
} from "lucide-react";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";

function UnsubscribeListModal({ onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);

  // Delete state
  const [deletingEmail, setDeletingEmail] = useState(null);

  useEffect(() => {
    loadRecords();
  }, [page, search]);

  const loadRecords = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await emailBroadcastAPI.getUnsubscribeList(
        page,
        20,
        search,
      );

     

      //  FIXED: Handle both response formats
      let recordsData = [];
      let pagination = { page: 1, limit: 20, total: 0, total_pages: 1 };

      if (response && response.success) {
        recordsData = response.data?.records || [];
        pagination = response.data?.pagination || pagination;
      } else if (response && response.records) {
        recordsData = response.records || [];
        pagination = response.pagination || pagination;
      }

      setRecords(recordsData);
      setTotalPages(pagination.total_pages || 1);
      setTotalItems(pagination.total || 0);
    } catch (err) {
      console.error("[UnsubscribeListModal] Load error:", err);
      setError(
        err.response?.data?.message || "Failed to load unsubscribe list",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const response = await emailBroadcastAPI.addToSuppressionList(
        newEmail.trim(),
        newReason.trim(),
      );

      

      //  FIXED: Handle response
      if (response && (response.success || response.message)) {
        setAddSuccess(`${newEmail} added to suppression list`);
        setNewEmail("");
        setNewReason("");
        setShowAddForm(false);
        loadRecords();
      } else {
        throw new Error(response?.message || "Failed to add email");
      }
    } catch (err) {
      setAddError(
        err.response?.data?.message || err.message || "Failed to add email",
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (email) => {
    if (
      !window.confirm(
        `Remove ${email} from suppression list? They will receive broadcast emails again.`,
      )
    ) {
      return;
    }

    setDeletingEmail(email);
    try {
      await emailBroadcastAPI.removeFromSuppressionList(email);
      loadRecords();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove email");
    } finally {
      setDeletingEmail(null);
    }
  };

  const handleExport = async () => {
    try {
      const response = await emailBroadcastAPI.exportUnsubscribeList();
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unsubscribe-list-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to export list");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        dateStyle: "medium",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Users size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Unsubscribe List
              </h3>
              <p className="text-xs text-gray-500">
                {totalItems} email{totalItems !== 1 ? "s" : ""} excluded from
                broadcasts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="relative flex-1 max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search emails..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 transition-colors"
            >
              <Plus size={14} />
              Add Email
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="px-5 py-4 bg-blue-50 border-b border-blue-200">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
                />
                <input
                  type="text"
                  placeholder="Reason (optional)"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#05015A]/10 focus:border-[#05015A]"
                />
              </div>
              <div className="flex items-center justify-between">
                {addError && (
                  <div className="flex items-center gap-1.5 text-red-600 text-sm">
                    <AlertCircle size={14} />
                    {addError}
                  </div>
                )}
                {addSuccess && (
                  <div className="flex items-center gap-1.5 text-green-600 text-sm">
                    <CheckCircle size={14} />
                    {addSuccess}
                  </div>
                )}
                {!addError && !addSuccess && <div />}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#05015A] rounded-lg hover:bg-[#05015A]/90 disabled:opacity-50 transition-colors"
                  >
                    {addLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#05015A] mb-3" />
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail size={48} className="text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                No unsubscribed emails
              </p>
              <p className="text-sm text-gray-400">
                {search ? "No results found" : "Everyone is still subscribed!"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr
                    key={record.id || record.unsubscribe_id || index}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {record.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-gray-600 line-clamp-1">
                        {record.reason || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-gray-500">
                        {formatDate(record.unsubscribed_at)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button
                        onClick={() => handleRemove(record.email)}
                        disabled={deletingEmail === record.email}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Remove from suppression list"
                      >
                        {deletingEmail === record.email ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsubscribeListModal;
