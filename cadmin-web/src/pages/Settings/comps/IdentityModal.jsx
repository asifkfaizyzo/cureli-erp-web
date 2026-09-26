// cadmin-web/src/pages/Settings/comps/IdentityModal.jsx (do not remove this comment)
// pharmacy-web/src/pages/Settings/comps/IdentityModal.jsx

import { useState } from "react";
import {
  X,
  User,
  AtSign,
  Loader2,
  AlertCircle,
  Save,
  Crown,
} from "lucide-react";
import { updateIdentity } from "../../../api/cadminProfile";

const IdentityModal = ({ currentName, currentUsername, onClose }) => {
  const [name, setName] = useState(currentName || "");
  const [username, setUsername] = useState(currentUsername || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const trimName = name.trim();
    const lowerUser = username.trim().toLowerCase();
    const nameChanged = trimName !== (currentName || "");
    const userChanged = lowerUser !== (currentUsername || "");

    if (!nameChanged && !userChanged) {
      errs.general = "No changes detected";
      return errs;
    }

    if (nameChanged) {
      if (!trimName) errs.name = "Full name is required";
      else if (trimName.length < 2)
        errs.name = "Name must be at least 2 characters";
    }
    if (userChanged) {
      if (!lowerUser) errs.username = "Username is required";
      else if (lowerUser.length < 3)
        errs.username = "Must be at least 3 characters";
      else if (!/^[a-z0-9_]+$/.test(lowerUser))
        errs.username = "Only lowercase letters, numbers, underscores";
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const payload = {};
    const trimName = name.trim();
    const lowerUser = username.trim().toLowerCase();
    if (trimName !== currentName) payload.name = trimName;
    if (lowerUser !== currentUsername) payload.username = lowerUser;

    setSaving(true);
    try {
      await updateIdentity(payload);
      const parts = [
        payload.name && "name",
        payload.username && "username",
      ].filter(Boolean);
      onClose(
        `${parts.map((p) => p[0].toUpperCase() + p.slice(1)).join(" and ")} updated successfully`,
      );
    } catch (err) {
      setErrors({
        general: err.response?.data?.message || "Failed to update identity",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={() => !saving && onClose(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md
                   animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="bg-gradient-to-r from-[#05015A] to-[#0a0280] px-6 py-4
                        flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-white">
            <Crown size={18} />
            <h3 className="text-base font-semibold">Edit Identity</h3>
          </div>
          <button
            onClick={() => !saving && onClose(false)}
            disabled={saving}
            className="p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25
                       disabled:opacity-50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 block">
              Full Name
            </label>
            <div className="relative">
              <User
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((p) => ({
                    ...p,
                    name: undefined,
                    general: undefined,
                  }));
                }}
                placeholder="Enter full name"
                autoFocus
                className={`w-full pl-9 pr-3 h-10 border rounded-xl text-sm outline-none
                            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                            transition-all
                            ${errors.name ? "border-red-300 bg-red-50/50" : "border-gray-200"}`}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.name}
              </p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 block">
              Username
            </label>
            <div className="relative">
              <AtSign
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase());
                  setErrors((p) => ({
                    ...p,
                    username: undefined,
                    general: undefined,
                  }));
                }}
                placeholder="Enter username"
                className={`w-full pl-9 pr-3 h-10 border rounded-xl text-sm outline-none
                            focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                            transition-all
                            ${errors.username ? "border-red-300 bg-red-50/50" : "border-gray-200"}`}
              />
            </div>
            <p className="text-[11px] text-gray-400">
              Lowercase letters, numbers, underscores only
            </p>
            {errors.username && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.username}
              </p>
            )}
          </div>

          {/* General error */}
          {errors.general && (
            <div
              className="flex items-center gap-2 text-red-600 text-xs
                            bg-red-50 border border-red-200 rounded-xl px-3 py-2.5"
            >
              <AlertCircle size={14} className="flex-shrink-0" />{" "}
              {errors.general}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => !saving && onClose(false)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-600
                         hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-[#05015A]
                         hover:bg-[#06027a] rounded-xl transition-colors
                         disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IdentityModal;
