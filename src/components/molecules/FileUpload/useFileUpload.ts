import { useCallback, useRef } from 'react';
import { useControllableState } from '@/hooks';

export interface FileRejection {
  file: File;
  reason: 'type' | 'size' | 'count';
}

export interface UseFileUploadOptions {
  value?: File[];
  defaultValue?: File[];
  onFilesChange?: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  multiple?: boolean;
  /** Comma-separated accept string, e.g. `image/*,.pdf`. */
  accept?: string;
  /** Max size per file in bytes. */
  maxSize?: number;
  /** Max number of files (multiple only). */
  maxFiles?: number;
}

/** Human-readable byte size, e.g. `1.4 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const n = bytes / Math.pow(k, i);
  return `${i === 0 ? n : n.toFixed(1)} ${units[i]}`;
}

/** Does `file` satisfy an `accept` token list (`image/*`, `.pdf`, `text/csv`)? */
function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const tokens = accept.split(',').map((t) => t.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((t) => {
    if (!t) return false;
    if (t.startsWith('.')) return name.endsWith(t);
    if (t.endsWith('/*')) return type.startsWith(t.slice(0, -1)); // `image/` prefix
    return type === t;
  });
}

const fileKey = (f: File) => `${f.name}:${f.size}:${f.lastModified}`;

/**
 * Shared file-input state machine for FileUpload / ImageUpload: controllable
 * file list, accept/size/count validation, dedupe, and add/remove/clear.
 */
export function useFileUpload({
  value,
  defaultValue = [],
  onFilesChange,
  onReject,
  multiple = false,
  accept,
  maxSize,
  maxFiles,
}: UseFileUploadOptions) {
  const [files, setFiles] = useControllableState<File[]>({
    value,
    defaultValue,
    onChange: onFilesChange,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      const accepted: File[] = [];
      const rejections: FileRejection[] = [];

      for (const file of list) {
        if (!matchesAccept(file, accept)) {
          rejections.push({ file, reason: 'type' });
          continue;
        }
        if (maxSize != null && file.size > maxSize) {
          rejections.push({ file, reason: 'size' });
          continue;
        }
        accepted.push(file);
      }

      const base = multiple ? files : [];
      const existing = new Set(base.map(fileKey));
      let merged = [...base];
      for (const f of accepted) {
        if (multiple && existing.has(fileKey(f))) continue;
        merged = multiple ? [...merged, f] : [f];
        existing.add(fileKey(f));
      }

      if (multiple && maxFiles != null && merged.length > maxFiles) {
        for (const f of merged.slice(maxFiles)) rejections.push({ file: f, reason: 'count' });
        merged = merged.slice(0, maxFiles);
      }

      if (rejections.length) onReject?.(rejections);
      setFiles(merged);
    },
    [files, multiple, accept, maxSize, maxFiles, onReject, setFiles],
  );

  const removeFile = useCallback(
    (file: File) => setFiles(files.filter((f) => fileKey(f) !== fileKey(file))),
    [files, setFiles],
  );

  const clear = useCallback(() => setFiles([]), [setFiles]);

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  return { files, inputRef, addFiles, removeFile, clear, openPicker };
}
