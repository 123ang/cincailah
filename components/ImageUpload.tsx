'use client';

import { useRef, useState } from 'react';
import { MAX_FILE_SIZE } from '@/lib/upload-constants';

type UploadType = 'restaurant' | 'avatar' | 'group_cover';

interface ImageUploadProps {
  type: UploadType;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Preview size — e.g. 'h-32 w-full' for restaurant, 'w-20 h-20 rounded-full' for avatar */
  previewClassName?: string;
  label?: string;
  helpText?: string;
  /** Called when user clears the image — gives parent a chance to delete the old file */
  onClear?: () => void;
}

export default function ImageUpload({
  type,
  value,
  onChange,
  previewClassName = 'h-40 w-full',
  label = 'Photo',
  helpText,
  onClear,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`);
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);

      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clear = () => {
    onChange(null);
    if (onClear) onClear();
  };

  const isCircle = previewClassName.includes('rounded-full');

  return (
    <div>
      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
        className="hidden"
        aria-label={`Upload ${label}`}
      />

      {value ? (
        <div className="relative inline-block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className={`${previewClassName} object-cover border border-gray-200 dark:border-gray-700 ${isCircle ? '' : 'rounded-xl'}`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = '0.3';
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex-1 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-lg transition disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Replace'}
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={uploading}
              className="text-xs font-bold text-sambal bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-2 rounded-lg transition disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`${previewClassName} flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 ${isCircle ? 'rounded-full' : ''}`}
          aria-label={`Upload ${label}`}
        >
          {uploading ? (
            <>
              <div className="w-6 h-6 border-2 border-sambal border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Uploading…</span>
            </>
          ) : (
            <>
              <span className="text-2xl">📸</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {isCircle ? 'Upload' : 'Click to upload'}
              </span>
            </>
          )}
        </button>
      )}

      {helpText && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{helpText}</p>
      )}

      {error && (
        <p className="text-xs text-sambal font-semibold mt-2" role="alert">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
