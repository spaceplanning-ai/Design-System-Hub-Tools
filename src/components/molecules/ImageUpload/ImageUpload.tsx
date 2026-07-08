import { useEffect, useMemo, useState } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Icon } from '../../atoms/Icon';
import { useFileUpload } from '../FileUpload/useFileUpload';
import type { FileRejection } from '../FileUpload/useFileUpload';
import { imageUploadMeta } from './ImageUpload.meta';
import './ImageUpload.css';

/** Layout preset — A: wrapping grid · B: single-row strip. */
export type ImageUploadType = 'A' | 'B';
export type ImageUploadSize = 'sm' | 'md' | 'lg';
export type ImageUploadShape = 'rounded' | 'square' | 'circle';

export interface ImageUploadProps {
  value?: File[];
  defaultValue?: File[];
  onFilesChange?: (files: File[]) => void;
  onReject?: (rejections: FileRejection[]) => void;
  multiple?: boolean;
  accept?: string;
  /** Max size per file in bytes. */
  maxSize?: number;
  maxFiles?: number;
  /** Layout preset. A: wrapping grid · B: single-row strip. */
  type?: ImageUploadType;
  size?: ImageUploadSize;
  shape?: ImageUploadShape;
  disabled?: boolean;
  status?: 'default' | 'error';
  /** Prompt shown inside the add tile. */
  label?: string;
  hint?: string;
  className?: string;
}

export function ImageUpload({
  value,
  defaultValue,
  onFilesChange,
  onReject,
  multiple = true,
  accept = 'image/*',
  maxSize,
  maxFiles,
  type = 'A',
  size = 'md',
  shape = 'rounded',
  disabled = false,
  status = 'default',
  label = '이미지 추가',
  hint,
  className,
}: ImageUploadProps) {
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

  // Object-URL previews, revoked when the file set changes / on unmount.
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const atLimit = !multiple && files.length >= 1;
  const showAddTile = !atLimit;

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={cx('tds-imageupload', className)}
      data-state={status === 'error' ? 'error' : undefined}
      {...toDataAttrs(imageUploadMeta, { type, size, shape })}
    >
      {previews.map(({ file, url }) => (
        <div
          key={`${file.name}:${file.size}:${file.lastModified}`}
          className="tds-imageupload__thumb"
        >
          <img src={url} alt={file.name} className="tds-imageupload__img" />
          <button
            type="button"
            className="tds-imageupload__remove"
            aria-label={`${file.name} 삭제`}
            disabled={disabled}
            onClick={() => removeFile(file)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}

      {showAddTile && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-disabled={disabled || undefined}
          className="tds-imageupload__add"
          data-dragging={dragging || undefined}
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
          <Icon name="image" className="tds-imageupload__add-icon" aria-hidden />
          <span className="tds-imageupload__add-label">{label}</span>
          {hint && <span className="tds-imageupload__add-hint">{hint}</span>}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className="tds-imageupload__input"
        multiple={multiple}
        accept={accept}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
