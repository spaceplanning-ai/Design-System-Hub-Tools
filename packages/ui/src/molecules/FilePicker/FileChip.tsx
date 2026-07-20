// FileChip — 지금 걸려 있는 파일 한 건 (molecule · contracts/FileChip.contract.json@1.0.0)
//
// Props 타입은 계약에서 생성된 generated/types/FileChip.types 를 그대로 import 한다 (수동 선언 금지 — G6).
//
// [FileDropzone 과 짝이다] 둘은 가로로 나란히 서고, 미리보기는 드롭존이 아니라 브라우저 탭 목업·
// OG 카드라는 **다른 자리**에 그려진다. 그래서 미리보기를 자기가 소유하는 ImageUploadField 로
// 대체할 수 없다 — 미리보기의 주인이 다르다.
//
// [제거 버튼은 onRemove 를 준 만큼만 생긴다] 지울 수 없는 자리에 죽은 버튼을 두지 않는다 (Alert.onClose 선례).
import { ImageThumb } from '../../atoms/ImageThumb';
import type { FileChipProps } from '../../../generated/types/FileChip.types';
import './FilePicker.css';

const BYTES_PER_KB = 1024;

/**
 * 바이트 수를 사람이 읽는 표기로 — `13KB` · `1.2MB`.
 *
 * 소수점은 MB 부터만 붙인다. KB 단위에서 `12.7KB` 는 정보가 아니라 소음이다 —
 * 칩이 보여줄 것은 '작다/크다' 이지 정확한 바이트가 아니다.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < BYTES_PER_KB) return `${String(Math.round(bytes))}B`;

  const kb = bytes / BYTES_PER_KB;
  if (kb < BYTES_PER_KB) return `${String(Math.round(kb))}KB`;

  const mb = kb / BYTES_PER_KB;
  return `${mb.toFixed(1)}MB`;
}

export function FileChip({ src = '', name, size, disabled = false, onRemove }: FileChipProps) {
  return (
    // 썸네일·이름·용량·제거 버튼은 파일 한 건을 함께 가리킨다 — 계약 a11y.role="group" 대로 묶는다.
    // 이름은 따로 주지 않는다: 칩 안의 이름 텍스트와 제거 버튼('<name> 제거')이 이미 어느 파일인지 알린다.
    <span className="tds-filechip" role="group">
      <ImageThumb src={src} alt={`${name} 썸네일`} />
      <span className="tds-filechip__text">
        <span className="tds-filechip__name">{name}</span>
        <span className="tds-filechip__size">{formatFileSize(size)}</span>
      </span>
      {onRemove !== undefined && (
        <button
          type="button"
          className="tds-filechip__remove"
          // 계약 events.onRemove.blockedWhen — disabled 에서는 네이티브가 click 을 막는다
          disabled={disabled}
          aria-label={`${name} 제거`}
          onClick={() => onRemove()}
        >
          ✕
        </button>
      )}
    </span>
  );
}
