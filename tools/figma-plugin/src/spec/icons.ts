/**
 * 아이콘 세트 추출 — **순수 계층**.
 *
 * 아이콘 목록의 원천은 오직 계약이다(contracts/Icon.contract.json 의 name enum).
 * 손으로 적은 배열을 두면 계약에 아이콘이 하나 늘어날 때 문서가 조용히 뒤처진다.
 */
import type { ComponentFigmaSpec } from './component-spec';

/** 아이콘 세트를 담은 계약 이름 — 이 이름의 계약에서 name 축을 읽는다 */
export const ICON_COMPONENT = 'Icon';

/** 아이콘 이름을 공급하는 계약 prop */
const ICON_NAME_PROP = 'name';

/** 아이콘 크기 축의 계약 prop — 문서에는 기본 크기 하나만 늘어놓는다 */
const ICON_SIZE_PROP = 'size';

export interface IconSet {
  /** 아이콘 이름 목록 — 계약 선언 순서를 그대로 보존한다 */
  names: string[];
  /** Figma 변형축 이름 (예: 'Name') — 인스턴스의 변형 속성을 지정할 때 쓴다 */
  nameAxis: string;
  /** 크기 축 이름과 기본값 (없으면 null) */
  sizeAxis: { name: string; defaultValue: string } | null;
}

/**
 * Icon 계약에서 아이콘 세트를 뽑는다. 계약이 없거나 name 축이 없으면 null —
 * 호출자는 아이콘 페이지를 안내 문구만 남기고 건너뛴다(문서 생성은 계속된다).
 */
export function extractIconSet(specs: readonly ComponentFigmaSpec[]): IconSet | null {
  const icon = specs.find((s) => s.name === ICON_COMPONENT);
  if (!icon) return null;

  const properties = icon.properties ?? [];
  const nameProp = properties.find(
    (p) => p.type === 'VARIANT' && (p.prop ?? '') === ICON_NAME_PROP,
  );
  if (!nameProp || !Array.isArray(nameProp.values) || nameProp.values.length === 0) return null;

  const sizeProp = properties.find(
    (p) => p.type === 'VARIANT' && (p.prop ?? '') === ICON_SIZE_PROP,
  );
  const sizeValues = sizeProp?.values ?? [];
  const sizeDefault =
    typeof sizeProp?.default === 'string' && sizeValues.indexOf(sizeProp.default) >= 0
      ? sizeProp.default
      : sizeValues[0];

  return {
    names: [...new Set(nameProp.values)],
    nameAxis: nameProp.name,
    sizeAxis:
      sizeProp && sizeDefault !== undefined
        ? { name: sizeProp.name, defaultValue: sizeDefault }
        : null,
  };
}

/**
 * 아이콘 한 칸이 가리킬 Figma 변형 이름을 만든다 ('Name=close, Size=md').
 * 축 순서는 계약 properties 순서와 같아야 실제 변형 이름과 맞물린다.
 */
export function iconVariantName(set: IconSet, iconName: string): string {
  const parts = [`${set.nameAxis}=${iconName}`];
  if (set.sizeAxis) parts.push(`${set.sizeAxis.name}=${set.sizeAxis.defaultValue}`);
  return parts.join(', ');
}
