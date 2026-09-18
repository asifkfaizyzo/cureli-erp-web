// src/pages/Communications/pages/Broadcast/Email/comps/EmailAttachmentsPanel.jsx

import { useState, useRef } from "react";
import {
  Paperclip,
  Upload,
  X,
  Loader2,
  File,
  FileText,
  Image,
  AlertCircle,
} from "lucide-react";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB total

// Helper function to get file URL
const getFileUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;

  const baseURL = import.meta.env.VITE_API_URL;
  return `${baseURL}/api/files/email_attachments/${filename}`;
};

function EmailAttachmentsPanel({ attachments = [], onChange, disabled }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const getTotalSize = () => {
    return attachments.reduce((sum, att) => sum + (att.size || 0), 0);
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith("image/")) return Image;
    if (mimeType?.includes("pdf")) return FileText;
    return File;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${formatFileSize(file.size)}). Maximum is 10MB.`;
    }
    if (getTotalSize() + file.size > MAX_TOTAL_SIZE) {
      return `Total attachment size would exceed 25MB limit.`;
    }
    if (attachments.length >= MAX_ATTACHMENTS) {
      return `Maximum ${MAX_ATTACHMENTS} attachments allowed.`;
    }
    return null;
  };

  const handleFileSelect = async (file) => {
    if (!file || disabled) return;

    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await emailBroadcastAPI.uploadAttachment(
        file,
        (progress) => setUploadProgress(progress),
      );

    

      //  FIXED: Check response.success, not response.data.success
      // API returns response.data, so response is already the data object
      if (response && response.success) {
        const uploadedFile = response.data;

        onChange([
          ...attachments,
          {
            url: uploadedFile.url || getFileUrl(uploadedFile.filename),
            filename: uploadedFile.filename,
            original_name: uploadedFile.original_name,
            size: uploadedFile.size,
            mime_type: uploadedFile.mime_type,
          },
        ]);
      } else if (response && response.filename) {
        // Direct data format (without success wrapper)
        onChange([
          ...attachments,
          {
            url: response.url || getFileUrl(response.filename),
            filename: response.filename,
            original_name: response.original_name,
            size: response.size,
            mime_type: response.mime_type,
          },
        ]);
      } else {
        throw new Error(response?.message || "Upload failed");
      }
    } catch (err) {
      console.error("[EmailAttachmentsPanel] Upload error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to upload file",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = "";
  };

  const handleRemove = async (index) => {
    if (disabled) return;

    const attachment = attachments[index];
    if (attachment.filename) {
      try {
        await emailBroadcastAPI.deleteUploadedFile(attachment.filename);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }

    const newAttachments = attachments.filter((_, i) => i !== index);
    onChange(newAttachments);
  };

  const handleClick = () => {
    if (!disabled && !isUploading && attachments.length < MAX_ATTACHMENTS) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <Paperclip size={12} />
          File Attachments
          <span className="text-gray-400 font-normal">
            ({attachments.length}/{MAX_ATTACHMENTS})
          </span>
        </label>
        <span className="text-[10px] text-gray-400">
          {formatFileSize(getTotalSize())} / 25MB
        </span>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle
            size={14}
            className="text-red-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {/* Existing Attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((att, index) => {
            const FileIcon = getFileIcon(att.mime_type);
            return (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <FileIcon size={16} className="text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-700 truncate flex-1">
                  {att.original_name || att.filename}
                </span>
                <span className="text-[10px] text-gray-400">
                  {formatFileSize(att.size)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex items-center gap-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
          <Loader2 size={16} className="text-indigo-600 animate-spin" />
          <div className="flex-1">
            <div className="w-full bg-indigo-200 rounded-full h-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-indigo-600">{uploadProgress}%</span>
        </div>
      )}

      {/* Add Button */}
      {attachments.length < MAX_ATTACHMENTS && !isUploading && (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="w-full py-2 text-xs text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          <Upload size={14} className="inline mr-1" />
          Add Attachment
        </button>
      )}

      <p className="text-[10px] text-gray-400">
        PDF, Word, Excel, CSV, images • Max 10MB per file
      </p>
    </div>
  );
}

export default EmailAttachmentsPanel;
