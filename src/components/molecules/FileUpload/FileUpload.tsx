import { useState } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { fileUploadMeta } from './FileUpload.meta';
import { useFileUpload, formatBytes } from './useFileUpload';
import type { FileRejection } from './useFileUpload';
import './FileUpload.css';

/** Layout preset — A: full dropzone · B: compact inline row. */
export type FileUploadType = 'A' | 'B';
export type FileUploadSize = 'sm' | 'md' | 'lg';
export type FileUploadTone = 'neutral' | 'brand';

export interface FileUploadProps {
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
  /** Layout preset. A: full dropzone · B: compact inline row. */
  type?: FileUploadType;
  size?: FileUploadSize;
  tone?: FileUploadTone;
  disabled?: boolean;
  status?: 'default' | 'error';
  /** Primary prompt text. */
  label?: string;
  /** Helper line under the prompt. */
  hint?: string;
  className?: string;
}

export function FileUpload({
  value,
  defaultValue,
  onFilesChange,
  onReject,
  multiple = false,
  accept,
  maxSize,
  maxFiles,
  type = 'A',
  size = 'md',
  tone = 'neutral',
  disabled = false,
  status = 'default',
  label = '파일을 끌어다 놓거나 클릭해 업로드',
  hint,
  className,
}: FileUploadProps) {
  const { files, inputRef, addFiles, removeFile, openPicker } = useFileUpload({
    value,
    defaultValue,
    onFilesChange,
    onReject,
    multiple,
    accept,
    maxSize,
    maxFiles,
  });
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={cx('tds-fileupload', className)}
      data-state={status === 'error' ? 'error' : undefined}
    >
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || undefined}
        className="tds-fileupload__zone"
        data-dragging={dragging || undefined}
        {...toDataAttrs(fileUploadMeta, { type, size, tone })}
        onClick={() => !disabled && openPicker()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
        }}
        onDrop={onDrop}
      >
        <Icon className="tds-fileupload__icon" name="upload" aria-hidden />
        <span className="tds-fileupload__text">
          <span className="tds-fileupload__label">{label}</span>
          {hint && <span className="tds-fileupload__hint">{hint}</span>}
        </span>
        <input
          ref={inputRef}
          type="file"
          className="tds-fileupload__input"
          multiple={multiple}
          accept={accept}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = ''; // allow re-selecting the same file
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="tds-fileupload__list">
          {files.map((file) => (
            <li
              key={`${file.name}:${file.size}:${file.lastModified}`}
              className="tds-fileupload__item"
            >
              <Icon name="file" size="sm" className="tds-fileupload__item-icon" aria-hidden />
              <span className="tds-fileupload__item-name">{file.name}</span>
              <span className="tds-fileupload__item-size">{formatBytes(file.size)}</span>
              <button
                type="button"
                className="tds-fileupload__remove"
                aria-label={`${file.name} 삭제`}
                disabled={disabled}
                onClick={() => removeFile(file)}
              >
                <Icon name="close" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
