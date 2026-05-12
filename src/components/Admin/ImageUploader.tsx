"use client";
import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle, ImagePlus } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

interface ImageUploaderProps {
  folder: "cars" | "parts";
  onUpload: (url: string) => void;
  onRemove: (url: string) => void;
  existingImages?: string[];
  maxImages?: number;
  multiple?: boolean;
}

export default function ImageUploader({
  folder,
  onUpload,
  onRemove,
  existingImages = [],
  maxImages = 1,
  multiple = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUploadMore = existingImages.length + uploading.length < maxImages;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a supported image type. Use JPEG, PNG, WebP, or AVIF.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" exceeds 10 MB limit.`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const fileId = crypto.randomUUID();
      setUploading((prev) => [
        ...prev,
        { id: fileId, name: file.name, progress: 0 },
      ]);
      setError("");

      try {
        // 1. Get presigned URL. (#14) We declare contentLength now so the
        // server can both pre-check and bind it into the signed URL — S3
        // will reject the PUT if the actual upload doesn't match.
        const presignRes = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            folder,
            contentLength: file.size,
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error || "Failed to get upload URL");
        }

        const { uploadUrl, publicUrl } = await presignRes.json();

        // 2. Upload directly to S3
        setUploading((prev) =>
          prev.map((u) => (u.id === fileId ? { ...u, progress: 30 } : u))
        );

        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round(30 + (e.loaded / e.total) * 60);
              setUploading((prev) =>
                prev.map((u) => (u.id === fileId ? { ...u, progress: pct } : u))
              );
            }
          });
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Upload to storage failed"));
            }
          });
          xhr.addEventListener("error", () =>
            reject(new Error("Network error during upload"))
          );
          xhr.open("PUT", uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        setUploading((prev) =>
          prev.map((u) => (u.id === fileId ? { ...u, progress: 100 } : u))
        );

        // Small delay so the user sees 100%
        await new Promise((r) => setTimeout(r, 300));

        onUpload(publicUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg);
      } finally {
        setUploading((prev) => prev.filter((u) => u.id !== fileId));
      }
    },
    [folder, onUpload]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const slots = maxImages - existingImages.length - uploading.length;
      const batch = fileArray.slice(0, Math.max(0, slots));

      for (const file of batch) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      for (const file of batch) {
        uploadFile(file);
      }
    },
    [maxImages, existingImages.length, uploading.length, uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0 && canUploadMore) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [canUploadMore, handleFiles]
  );

  const handleRemove = useCallback(
    async (url: string) => {
      // Extract key from URL for S3 deletion
      // URL format: https://domain/cars/uuid-filename.ext
      try {
        const urlObj = new URL(url);
        const key = urlObj.pathname.startsWith("/")
          ? urlObj.pathname.slice(1)
          : urlObj.pathname;

        if (key.startsWith("cars/") || key.startsWith("parts/")) {
          await fetch("/api/admin/upload/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key }),
          });
        }
      } catch {
        // If URL parsing fails, still remove from UI
      }
      onRemove(url);
    },
    [onRemove]
  );

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canUploadMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
            dragActive
              ? "border-red-500 bg-red-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
          }`}
          aria-label="Upload images"
        >
          {dragActive ? (
            <ImagePlus className="mb-2 h-8 w-8 text-red-500" />
          ) : (
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {dragActive ? "Drop to upload" : "Click or drag images here"}
          </span>
          <span className="mt-1 text-xs text-gray-500">
            JPEG, PNG, WebP, AVIF — max 10 MB
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Uploading progress */}
      {uploading.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-md border border-gray-200 px-3 py-2"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-red-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-gray-700">{file.name}</p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-red-600 transition-[width] duration-300"
                style={{ width: `${file.progress}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-gray-500">{file.progress}%</span>
        </div>
      ))}

      {/* Image previews */}
      {existingImages.length > 0 && (
        <div
          className={
            multiple
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              : "flex"
          }
        >
          {existingImages.map((url, i) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-lg border border-gray-200"
            >
              <Image
                src={url}
                alt={`Upload ${i + 1}`}
                width={200}
                height={150}
                className="h-32 w-full object-cover"
                unoptimized
              />
              {multiple && i === 0 && existingImages.length > 1 && (
                <span className="absolute bottom-1 left-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Main
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
                aria-label={`Remove image ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
