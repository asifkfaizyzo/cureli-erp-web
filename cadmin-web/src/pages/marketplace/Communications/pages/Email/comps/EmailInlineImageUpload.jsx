// cadmin-web/src/pages/marketplace/Communications/pages/Email/comps/EmailInlineImageUpload.jsx (do not remove this comment)
// cadmin-web/src/pages/Communications/pages/Broadcast/Email/comps/EmailInlineImageUpload.jsx

import { useState, useRef, useCallback } from "react";
import {
  Image,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import * as emailBroadcastAPI from "../../../../../../api/cadminEmailBroadcast";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ◄ FIXED: Resolves filenames, absolute paths, and relative paths properly against the VITE_API_URL
const getFileUrl = (urlOrFilename) => {
  if (!urlOrFilename) return null;
  if (urlOrFilename.startsWith("http")) return urlOrFilename;

  const filename = urlOrFilename.startsWith("/")
    ? urlOrFilename.substring(urlOrFilename.lastIndexOf("/") + 1)
    : urlOrFilename;

  const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${baseURL}/api/files/email_attachments/${filename}`;
};

function EmailInlineImageUpload({ image, onChange, disabled }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `Image too large. Maximum size is 5MB.`;
    }
    if (!file.type.startsWith("image/")) {
      return `Only image files are allowed.`;
    }
    return null;
  };

  const handleFileSelect = useCallback(
    async (file) => {
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
        const response = await emailBroadcastAPI.uploadInlineImage(
          file,
          (progress) => setUploadProgress(progress),
        );

        const payload = response.data; // ◄ FIXED: Unwraps Axios response object body

        if (payload && payload.success) {
          const uploadedFile = payload.data;

          onChange({
            url: uploadedFile.url || getFileUrl(uploadedFile.filename),
            filename: uploadedFile.filename,
            original_name: uploadedFile.original_name,
            size: uploadedFile.size,
          });
          setUploadProgress(100);
        } else if (payload && payload.filename) {
          // Direct data format (without success wrapper)
          onChange({
            url: payload.url || getFileUrl(payload.filename),
            filename: payload.filename,
            original_name: payload.original_name,
            size: payload.size,
          });
          setUploadProgress(100);
        } else {
          throw new Error(payload?.message || "Upload failed");
        }
      } catch (err) {
        console.error("[EmailInlineImageUpload] Upload error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to upload image",
        );
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, onChange],
  );

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = "";
  };

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

  const handleRemove = async () => {
    if (!image || disabled) return;

    if (image.filename) {
      try {
        await emailBroadcastAPI.deleteUploadedFile(image.filename);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }

    onChange(null);
    setError(null);
    setUploadProgress(0);
  };

  const handleClick = () => {
    if (!disabled && !isUploading && !image) {
      fileInputRef.current?.click();
    }
  };

  const renderUploadArea = () => (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
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
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-2">
        <Image size={24} className="text-gray-400" />
        <div>
          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            Click to upload
          </span>
          <span className="text-sm text-gray-500"> or drag and drop</span>
        </div>
        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
      </div>
    </div>
  );

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

  const renderImagePreview = () => {
    if (!image) return null;

    // ◄ FIXED: Always resolve dynamic URL using getFileUrl to handle relative paths
    const imageUrl = getFileUrl(image.url || image.filename);

    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="relative h-32 bg-gray-100">
          <img
            src={imageUrl}
            alt={image.original_name || "Inline image"}
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error("Image failed to load:", imageUrl);
              e.target.style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="Remove image"
          >
            <X size={14} />
          </button>
        </div>
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Image size={14} className="text-green-600 flex-shrink-0" />
            <span className="text-xs text-gray-700 truncate flex-1">
              {image.original_name || "Image"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
        <Image size={12} />
        Inline Image
        <span className="text-gray-400 font-normal">
          (appears in email body)
        </span>
      </label>

      {error && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle
            size={14}
            className="text-red-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {isUploading
        ? renderUploadProgress()
        : image
          ? renderImagePreview()
          : renderUploadArea()}

      {image && !isUploading && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle size={12} />
          <span>Image will be embedded in email</span>
        </div>
      )}
    </div>
  );
}

export default EmailInlineImageUpload;