// cadmin-web/src/pages/Communications/pages/Broadcast/InApp/comps/FileUploadAttachment.jsx (do not remove this comment)
// src/pages/Communications/pages/Broadcast/InApp/comps/FileUploadAttachment.jsx

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Image,
  Video,
  AlertCircle,
  CheckCircle,
  Loader2,
  FileImage,
  FileVideo,
  Trash2,
} from "lucide-react";
import * as broadcastAPI from "../../../../../../api/cadminBroadcast";

//  UPDATED: New URL format matching backend fileStorage service
const getFileUrl = (storageKey) => {
  if (!storageKey) return null;
  if (storageKey.startsWith("http")) return storageKey;

  const baseURL = import.meta.env.VITE_API_URL;
  // Backend serves files via /api/files/:folder/:filename
  // storage_key contains just the filename
  return `${baseURL}/api/files/broadcast_attachments/${storageKey}`;
};

/**
 * FileUploadAttachment Component
 *
 * Handles single file upload (image or video) with:
 * - Immediate upload on file selection
 * - Progress bar during upload
 * - Preview for images, icon for videos
 * - Delete functionality
 */
function FileUploadAttachment({ attachment, onChange, disabled }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Max file size: 50MB
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  // Accepted file types
  const ACCEPTED_TYPES = {
    image: "image/*",
    video: "video/*",
  };

  /**
   * Validate file before upload
   */
  const validateFile = (file) => {
    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
    }

    // Check type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return `Invalid file type: ${file.type}. Only images and videos are allowed.`;
    }

    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    async (file) => {
      if (!file || disabled) return;

      // Clear previous error
      setError(null);

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Start upload
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const response = await broadcastAPI.uploadBroadcastAttachment(
          file,
          (progress) => setUploadProgress(progress),
        );

        if (response.data.success) {
          const uploadedFile = response.data.data;

          //  UPDATED: Create attachment object with new URL format
          const newAttachment = {
            type: uploadedFile.type, // 'image' or 'video'
            url: getFileUrl(uploadedFile.filename), // Use helper function
            label: uploadedFile.original_name,
            filename: uploadedFile.filename, // Just the filename
            original_name: uploadedFile.original_name,
            size: uploadedFile.size,
            size_formatted: uploadedFile.size_formatted,
            mime_type: uploadedFile.mime_type,
          };

          onChange(newAttachment);
          setUploadProgress(100);
        } else {
          throw new Error(response.data.message || "Upload failed");
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to upload file. Please try again.",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, onChange],
  );

  /**
   * Handle file input change
   */
  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  /**
   * Handle drag & drop
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle remove attachment
   */
  const handleRemove = async () => {
    if (!attachment || disabled) return;

    // If we have a filename, delete from server
    if (attachment.filename) {
      try {
        await broadcastAPI.deleteBroadcastAttachment(attachment.filename);
      } catch (err) {
        console.error("Failed to delete file from server:", err);
        // Continue with UI removal even if server delete fails
      }
    }

    onChange(null);
    setError(null);
    setUploadProgress(0);
  };

  /**
   * Trigger file input click
   */
  const handleClick = () => {
    if (!disabled && !isUploading && !attachment) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Render upload area (when no attachment)
   */
  const renderUploadArea = () => (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
        transition-all duration-200
        ${
          isDragOver
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={`${ACCEPTED_TYPES.image},${ACCEPTED_TYPES.video}`}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-gray-400">
          <Image size={24} />
          <span className="text-gray-300">/</span>
          <Video size={24} />
        </div>

        <div className="mt-2">
          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Click to upload
          </span>
          <span className="text-sm text-gray-500"> or drag and drop</span>
        </div>

        <p className="text-xs text-gray-400">Images or videos up to 50MB</p>
      </div>
    </div>
  );

  /**
   * Render upload progress
   */
  const renderUploadProgress = () => (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-3">
        <Loader2 size={20} className="text-indigo-600 animate-spin" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              Uploading...
            </span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  /**
   * Render attachment preview
   */
  const renderAttachmentPreview = () => {
    if (!attachment) return null;

    const isImage = attachment.type === "image";
    const isVideo = attachment.type === "video";

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Preview area */}
        <div className="relative">
          {isImage ? (
            <div className="relative h-40 bg-gray-100">
              <img
                src={attachment.url}
                alt={attachment.original_name || "Attachment"}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div className="absolute inset-0 items-center justify-center bg-gray-100 hidden">
                <FileImage size={48} className="text-gray-400" />
              </div>
            </div>
          ) : isVideo ? (
            <div className="h-40 bg-gray-900 flex items-center justify-center">
              <div className="text-center">
                <FileVideo size={48} className="text-gray-400 mx-auto mb-2" />
                <span className="text-xs text-gray-400">Video File</span>
              </div>
            </div>
          ) : null}

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full 
                       hover:bg-red-600 transition-colors shadow-lg
                       disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>

        {/* File info */}
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            {isImage ? (
              <Image size={14} className="text-green-600 flex-shrink-0" />
            ) : (
              <Video size={14} className="text-purple-600 flex-shrink-0" />
            )}
            <span
              className="text-xs text-gray-700 truncate flex-1"
              title={attachment.original_name}
            >
              {attachment.original_name || "Attachment"}
            </span>
            {attachment.size_formatted && (
              <span className="text-xs text-gray-400 flex-shrink-0">
                {attachment.size_formatted}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render error message
   */
  const renderError = () => {
    if (!error) return null;

    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs text-red-600 hover:text-red-700 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Upload size={14} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-600">
          Media Attachment
        </span>
        <span className="text-xs text-gray-400">(Optional)</span>
      </div>

      {/* Error message */}
      {renderError()}

      {/* Upload area / Progress / Preview */}
      {isUploading
        ? renderUploadProgress()
        : attachment
          ? renderAttachmentPreview()
          : renderUploadArea()}

      {/* Success indicator after upload */}
      {attachment && !isUploading && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle size={12} />
          <span>File uploaded successfully</span>
        </div>
      )}
    </div>
  );
}

export default FileUploadAttachment;
