// Icon — 계약 검증 테스트 (contracts/Icon.contract.json@1.0.0)
//
//   states[]   default
//   events     없음 → blockedWhen 없음 (비대화형 표시 전용 — 클릭 이벤트를 갖지 않는다)
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { IconName, IconSize } from '../../../generated/types/Icon.types';
import { ICON_SHAPES } from '../../../generated/icons/icon-geometry';
import { Icon } from './Icon';

const NAMES: IconName[] = [
  'close',
  'x-circle',
  'plus-circle',
  'pencil',
  'trash',
  'download',
  'image',
  'upload',
  'search',
  'chevron-left',
  'chevron-right',
];

const SIZES: IconSize[] = ['inherit', 'sm', 'md', 'lg'];

describe('Icon — 계약 states[]', () => {
  it('Icon: default 상태 — label 이 없으면 장식으로 보고 aria-hidden 처리한다', () => {
    const { container } = render(<Icon name="close" />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('role')).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('Icon: default 상태 — label 을 주면 role=img 와 aria-label 로 이름을 노출한다', () => {
    render(<Icon name="trash" label="삭제" />);
    const svg = screen.getByRole('img', { name: '삭제' });

    expect(svg.getAttribute('aria-hidden')).toBeNull();
  });

  it('Icon: default 상태 — size 기본값은 inherit 이며 계약 enum 4종이 각각 클래스로 나온다', () => {
    const { container: def } = render(<Icon name="search" />);
    expect(def.querySelector('svg')?.className.baseVal).toContain('tds-icon--inherit');

    for (const size of SIZES) {
      const { container } = render(<Icon name="search" size={size} />);
      expect(container.querySelector('svg')?.className.baseVal).toContain(`tds-icon--${size}`);
    }
  });

  it('Icon: default 상태 — 계약 enum name 11종이 전부 도형을 그린다 (빈 아이콘 없음)', () => {
    for (const name of NAMES) {
      const { container } = render(<Icon name={name} />);
      const svg = container.querySelector('svg');

      expect(svg, `${name}: svg 가 렌더되지 않았다`).not.toBeNull();
      // path 또는 circle/rect — 어느 것도 없으면 빈 아이콘이 조용히 나간다
      const shapes = svg?.querySelectorAll('path, circle, rect') ?? [];
      expect(shapes.length, `${name}: 도형이 하나도 없다`).toBeGreaterThan(0);
    }
  });

  it('Icon: default 상태 — 색을 스스로 정하지 않고 currentColor 를 따른다 (계약 a11y)', () => {
    const { container } = render(<Icon name="pencil" />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('stroke')).toBe('currentColor');
    expect(svg?.getAttribute('fill')).toBe('none');
  });
});

// ---------------------------------------------------------------------------
// 아이콘 기하 회귀 방지 — 생성 기하가 **기존 렌더 결과와 동일**한지 못 박는다.
//
// 왜: 기하를 손으로 적던 것에서 codegen 추출로 바꿨다. 추출 과정에서 조용히 도형이 빠진
// 전례가 있다(search·x-circle·plus-circle 의 원이 사라졌다가 발견됐고, 그 뒤 Icon.tsx 가
// 산출물을 소비하게 되면서 DS 11종이 통째로 앱 사본으로 바뀐 적도 있다). 그래서 원래 11종의
// 도형 목록을 여기 **그대로 박아 두고** 생성물과 대조한다. 이 표는 갱신 대상이 아니라 기준점이다.
// ---------------------------------------------------------------------------

/** 변경 전 Icon.tsx 가 그리던 것 그대로 (Shapes 먼저, 그다음 PATHS) */
const BASELINE: Record<string, string[]> = {
  close: ['path:m6 6 12 12', 'path:m18 6-12 12'],
  'x-circle': ['circle:12,12,9', 'path:m9 9 6 6', 'path:m15 9-6 6'],
  'plus-circle': ['circle:12,12,9', 'path:M12 8v8', 'path:M8 12h8'],
  pencil: ['path:M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z', 'path:M15 5l3 3'],
  trash: [
    'path:M4 7h16',
    'path:M10 11v6',
    'path:M14 11v6',
    'path:M6 7l1 13h10l1-13',
    'path:M9 7V4h6v3',
  ],
  download: ['path:M12 3v12', 'path:m7 11 5 5 5-5', 'path:M4 20h16'],
  image: ['rect:3,4,18,16', 'circle:8.5,9.5,1.5', 'path:m4 18 5-5 4 4 3-3 4 4'],
  upload: ['path:M12 15V3', 'path:m7 8 5-5 5 5', 'path:M4 20h16'],
  search: ['circle:11,11,7', 'path:m20 20-3.5-3.5'],
  'chevron-left': ['path:m15 6-6 6 6 6'],
  'chevron-right': ['path:m9 6 6 6-6 6'],
};

/** 도형을 비교 가능한 한 줄로 */
function signature(shape: { tag: string; attrs: Readonly<Record<string, string>> }): string {
  const a = shape.attrs;
  if (shape.tag === 'path') return `path:${a['d'] ?? ''}`;
  if (shape.tag === 'circle') return `circle:${a['cx'] ?? ''},${a['cy'] ?? ''},${a['r'] ?? ''}`;
  if (shape.tag === 'rect')
    return `rect:${a['x'] ?? ''},${a['y'] ?? ''},${a['width'] ?? ''},${a['height'] ?? ''}`;
  return `${shape.tag}:${JSON.stringify(a)}`;
}

describe('아이콘 기하 — 기존 11종 회귀 방지', () => {
  it.each(Object.keys(BASELINE))('%s 의 도형이 변경 전과 동일하다', (name) => {
    const shapes = ICON_SHAPES[name as keyof typeof ICON_SHAPES];
    expect(shapes, `${name} 이 생성 기하에 없다`).toBeDefined();
    expect(shapes.map(signature)).toEqual(BASELINE[name]);
  });

  it('모든 아이콘이 도형을 하나 이상 갖는다 (빈 글리프 0건)', () => {
    const empty = Object.entries(ICON_SHAPES)
      .filter(([, shapes]) => shapes.length === 0)
      .map(([name]) => name);
    expect(empty, `도형이 없는 아이콘: ${empty.join(', ')}`).toEqual([]);
  });

  it('아이콘 59종이 모두 존재한다', () => {
    expect(Object.keys(ICON_SHAPES)).toHaveLength(59);
  });
});
