// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/AttachmentsPanel.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/InApp/comps/AttachmentsPanel.jsx

import { useState } from "react";
import { Link2, Image, Video, X, Plus, ExternalLink, Upload } from "lucide-react";
import FileUploadAttachment from "./FileUploadAttachment";

function AttachmentsPanel({ attachments = [], onChange, disabled }) {
  const [mode, setMode] = useState("upload");
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const currentAttachment = attachments.length > 0 ? attachments[0] : null;

  const handleFileChange = (attachment) => {
    onChange(attachment ? [attachment] : []);
  };

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    onChange([{ type: "link", url: newUrl.trim(), label: newLabel.trim() || null }]);
    setNewUrl("");
    setNewLabel("");
    setShowUrlForm(false);
  };

  const handleRemove = () => onChange([]);

  if (currentAttachment) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">Attachment</label>
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
          {currentAttachment.type === 'image' && <Image size={14} className="text-green-600" />}
          {currentAttachment.type === 'video' && <Video size={14} className="text-purple-600" />}
          {currentAttachment.type === 'link' && <Link2 size={14} className="text-blue-600" />}
          <span className="text-xs text-gray-700 truncate flex-1">
            {currentAttachment.label || currentAttachment.original_name || currentAttachment.url}
          </span>
          <button onClick={handleRemove} className="p-1 hover:bg-gray-200 rounded">
            <X size={12} className="text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">
        Attachment <span className="text-gray-400">(optional)</span>
      </label>
      
      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => { setMode("upload"); setShowUrlForm(false); }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === "upload" ? "bg-white text-[#05015A] shadow-sm" : "text-gray-500"
          }`}
        >
          <Upload size={12} />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mode === "url" ? "bg-white text-[#05015A] shadow-sm" : "text-gray-500"
          }`}
        >
          <Link2 size={12} />
          URL
        </button>
      </div>

      {/* Content */}
      {mode === "upload" ? (
        <FileUploadAttachment attachment={null} onChange={handleFileChange} disabled={disabled} />
      ) : showUrlForm ? (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (optional)"
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowUrlForm(false)}
              className="flex-1 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleAddUrl}
              disabled={!newUrl.trim()}
              className="flex-1 py-1.5 text-xs font-medium text-white bg-[#05015A] rounded disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowUrlForm(true)}
          className="w-full py-2 text-xs text-[#05015A] border border-dashed border-[#05015A]/30 rounded-lg hover:bg-[#05015A]/5"
        >
          <Plus size={14} className="inline mr-1" />
          Add URL
        </button>
      )}
    </div>
  );
}

export default AttachmentsPanel;