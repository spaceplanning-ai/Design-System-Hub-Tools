// ColorField (atom) — 배럴 export
// 순수 유틸(isHexColor·toSwatchValue)도 함께 낸다: 호출부가 저장 지점에서 **같은 hex 판정**을
// 쓰게 하려면 컴포넌트와 같은 문에서 나와야 한다 (imageFileError·sanitizeRichText 선례).
export { ColorField, isHexColor, toSwatchValue } from './ColorField';
export type { ColorFieldProps, ColorFieldState } from '../../../generated/types/ColorField.types';
