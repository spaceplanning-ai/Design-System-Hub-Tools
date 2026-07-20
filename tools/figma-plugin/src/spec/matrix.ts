/**
 * 변형 매트릭스 배치 계획 — **순수 계층**.
 *
 * 문서에서 "어느 칸이 어느 변형인가"를 읽을 수 있어야 한다는 요구를 만족시키는 곳이다.
 * 축이 2개를 넘으면 앞 2개를 열/행으로 쓰고 나머지 축 조합마다 블록을 나눠 **모든 칸에 라벨**을
 * 붙인다. 좌표가 아니라 오토레이아웃 표(머리행 + 머리열)로 표현하므로 겹칠 수 없다.
 */
import type { ComponentSetSpec, VariantAxis } from './component-spec';

export interface MatrixCell {
  /** 이 칸이 가리키는 변형 이름 ('Variant=primary, Size=md') */
  variantName: string;
  /** 칸 라벨 — 축이 2개 이하일 땐 머리행/머리열이 설명하므로 값만 */
  label: string;
  isDefault: boolean;
}

export interface MatrixRow {
  /** 머리열 라벨 — 'Size=md' (행 축이 없으면 '') */
  label: string;
  cells: MatrixCell[];
}

export interface MatrixBlock {
  /** 나머지 축 조합 라벨 — 'Loading=false · Disabled=false' (없으면 '') */
  label: string;
  /** 머리행 라벨 — 열 축의 값들 */
  columnLabels: string[];
  rows: MatrixRow[];
}

export interface MatrixPlan {
  columnAxis: VariantAxis | null;
  rowAxis: VariantAxis | null;
  /** 열/행으로 쓰지 않은 나머지 축 */
  blockAxes: VariantAxis[];
  blocks: MatrixBlock[];
  /** 계획에 포함된 칸 총수 — 변형 개수와 반드시 같아야 한다 */
  cellCount: number;
}

function labelOf(axis: VariantAxis, value: string): string {
  return `${axis.name}=${value}`;
}

/**
 * 축 목록으로 매트릭스를 계획한다.
 * - 축 0개: 칸 1개짜리 단일 블록
 * - 축 1개: 한 행, 축 값마다 열
 * - 축 2개 이상: 1번 축 = 열, 2번 축 = 행, 나머지 축 조합마다 블록
 */
export function planVariantMatrix(spec: ComponentSetSpec): MatrixPlan {
  const byName = new Map(spec.variants.map((v) => [v.name, v]));
  const axes = spec.axes;
  const columnAxis = axes[0] ?? null;
  const rowAxis = axes[1] ?? null;
  const blockAxes = axes.slice(2);

  if (columnAxis === null) {
    const only = spec.variants[0];
    const cells: MatrixCell[] = only
      ? [{ variantName: only.name, label: spec.name, isDefault: true }]
      : [];
    return {
      columnAxis: null,
      rowAxis: null,
      blockAxes: [],
      blocks: [{ label: '', columnLabels: [spec.name], rows: [{ label: '', cells }] }],
      cellCount: cells.length,
    };
  }

  const blockCombos: Array<Record<string, string>> = blockAxes.reduce<
    Array<Record<string, string>>
  >(
    (acc, axis) =>
      acc.flatMap((combo) => axis.values.map((value) => ({ ...combo, [axis.name]: value }))),
    [{}],
  );

  const blocks: MatrixBlock[] = [];
  let cellCount = 0;
  for (const blockValues of blockCombos) {
    const label = blockAxes.map((axis) => labelOf(axis, blockValues[axis.name] ?? '')).join(' · ');
    const rowValues = rowAxis === null ? [''] : rowAxis.values;
    const rows: MatrixRow[] = [];
    for (const rowValue of rowValues) {
      const cells: MatrixCell[] = [];
      for (const columnValue of columnAxis.values) {
        const values: Record<string, string> = { ...blockValues, [columnAxis.name]: columnValue };
        if (rowAxis !== null) values[rowAxis.name] = rowValue;
        // 변형 이름은 축 선언 순서로 조립된다 — 계획도 같은 순서를 써야 이름이 맞는다
        const variantName = axes
          .map((axis) => `${axis.name}=${values[axis.name] ?? ''}`)
          .join(', ');
        const variant = byName.get(variantName);
        if (!variant) continue;
        cells.push({
          variantName,
          label: labelOf(columnAxis, columnValue),
          isDefault: variant.isDefault,
        });
        cellCount += 1;
      }
      rows.push({ label: rowAxis === null ? '' : labelOf(rowAxis, rowValue), cells });
    }
    blocks.push({
      label,
      columnLabels: columnAxis.values.map((v) => labelOf(columnAxis, v)),
      rows,
    });
  }

  return { columnAxis, rowAxis, blockAxes, blocks, cellCount };
}
