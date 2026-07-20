// 프리셋 — 레일이 내주는 시작점의 계약
//
// [왜 프리셋에 테스트가 필요한가] 프리셋은 로직이 거의 없는 데이터라 '깨진다' 는 느낌이 없다.
// 그런데 실제로 깨지는 방식이 있다: 블록 하나가 빈 채로 들어가면 운영자가 **미완성인 줄 모른 채
// Publish** 하고, 푸터를 빠뜨리면 법 요건이 빠진 메일이 나가고, 두 프리셋이 같은 내용이 되면
// 레일이 고를 수 없는 목록이 된다. 전부 타입이 잡아 주지 못하는 것들이라 여기서 잡는다.
import { describe, expect, it } from 'vitest';

import { wireDomains } from '../../../../wiring';
import {
  findTemplateVariable,
  unknownTemplateVariableKeys,
} from '../../../../shared/domain/template-variables';
import { EMAIL_PRESETS, findPreset, PRESET_VARIABLE_KEYS, presetCanvas } from './presets';
import type { PresetId } from './presets';
import { hasLegalFooter, isBlockIncomplete } from '../types';
import type { EmailBlock } from '../types';
import { renderBlocksToHtml } from '../render-html';

/** 테스트용 id 발급기 — 빌더의 것과 같은 모양이되 테스트마다 0 에서 시작한다 */
function idFactory(): () => string {
  let seq = 0;
  return () => {
    seq += 1;
    return `block-${String(seq)}`;
  };
}

function build(id: PresetId): readonly EmailBlock[] {
  const preset = findPreset(id);
  expect(preset).toBeDefined();
  return preset === undefined ? [] : preset.build(idFactory());
}

/** 최상위와 칸 안을 모두 훑는다 — 미완성 블록은 칸 안에도 숨을 수 있다 */
function flatten(blocks: readonly EmailBlock[]): readonly EmailBlock[] {
  return blocks.flatMap((block) =>
    block.blockKind === 'columns'
      ? [block, ...block.columns.flatMap((column) => column.blocks)]
      : [block],
  );
}

function textOf(blocks: readonly EmailBlock[]): string {
  return flatten(blocks)
    .map((block) => {
      if (block.blockKind === 'heading' || block.blockKind === 'text') return block.content;
      if (block.blockKind === 'button') return block.content;
      if (block.blockKind === 'list') return block.items.map((item) => item.text).join(' ');
      if (block.blockKind === 'menu') return block.items.map((item) => item.label).join(' ');
      return '';
    })
    .join('\n');
}

/** 요청받은 트랜잭션 6종 — 레일의 축이다 */
const TRANSACTIONAL: readonly PresetId[] = [
  'signup',
  'verify-code',
  'purchase-complete',
  'shipping-started',
  'delivery-complete',
  'promotion',
];

describe('프리셋 레일의 구성', () => {
  it('빈 템플릿 바로 뒤에 트랜잭션 6종이 고객 여정 순으로 온다', () => {
    const ids = EMAIL_PRESETS.map((preset) => preset.id);
    expect(ids[0]).toBe('blank');
    expect(ids.slice(1, 1 + TRANSACTIONAL.length)).toEqual(TRANSACTIONAL);
  });

  it('같은 목적의 프리셋을 두 벌 두지 않는다 — 통합된 셋은 사라졌다', () => {
    const ids = EMAIL_PRESETS.map((preset) => String(preset.id));
    // welcome→signup · otp→verify-code · ecommerce-receipt→purchase-complete 로 흡수됐다
    expect(ids).not.toContain('welcome');
    expect(ids).not.toContain('otp');
    expect(ids).not.toContain('ecommerce-receipt');
  });

  it('id 와 라벨이 겹치지 않는다', () => {
    const ids = EMAIL_PRESETS.map((preset) => preset.id);
    const labels = EMAIL_PRESETS.map((preset) => preset.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('빈 템플릿만 비어 있고 나머지는 블록을 갖는다', () => {
    for (const preset of EMAIL_PRESETS) {
      const blocks = preset.build(idFactory());
      if (preset.id === 'blank') expect(blocks).toHaveLength(0);
      else expect(blocks.length).toBeGreaterThan(0);
    }
  });

  it('블록 id 가 프리셋 안에서 겹치지 않는다 — 겹치면 한 블록을 고칠 때 둘이 함께 바뀐다', () => {
    for (const preset of EMAIL_PRESETS) {
      const ids = flatten(preset.build(idFactory())).map((block) => block.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('프리셋이 지켜야 할 것', () => {
  it('빈 템플릿을 뺀 모두가 법적 푸터로 끝난다 (정보통신망법 제50조)', () => {
    for (const preset of EMAIL_PRESETS) {
      if (preset.id === 'blank') continue;
      const blocks = preset.build(idFactory());
      expect(hasLegalFooter(blocks)).toBe(true);
      expect(blocks[blocks.length - 1]?.blockKind).toBe('footer');
    }
  });

  it('미완성인 채로 시작하는 블록이 없다 — 칸 안까지 훑는다', () => {
    for (const preset of EMAIL_PRESETS) {
      for (const block of flatten(preset.build(idFactory()))) {
        expect({
          preset: preset.id,
          kind: block.blockKind,
          incomplete: isBlockIncomplete(block),
        }).toEqual({ preset: preset.id, kind: block.blockKind, incomplete: false });
      }
    }
  });

  it('푸터는 한 통에 하나뿐이다', () => {
    for (const preset of EMAIL_PRESETS) {
      const footers = preset.build(idFactory()).filter((block) => block.blockKind === 'footer');
      expect(footers.length).toBeLessThanOrEqual(1);
    }
  });
});

describe('트랜잭션 6종', () => {
  it('여섯 통이 서로 다른 문서다 — 껍데기만 같은 6벌이 아니다', () => {
    const bodies = TRANSACTIONAL.map((id) => textOf(build(id)));
    expect(new Set(bodies).size).toBe(TRANSACTIONAL.length);

    // 제목도 서로 달라야 한다 — 같은 제목이면 받은편지함에서 구별되지 않는다
    const subjects = TRANSACTIONAL.map((id) => findPreset(id)?.subject ?? '');
    expect(new Set(subjects).size).toBe(TRANSACTIONAL.length);
    expect(subjects.every((subject) => subject !== '')).toBe(true);
  });

  it('각자가 그 메일에만 있는 정보를 나른다', () => {
    // 이 목록이 곧 '왜 여섯 통인가' 의 답이다 — 하나라도 빠지면 옆 프리셋과 구별되지 않는다
    const signature: Readonly<Record<string, readonly string[]>> = {
      signup: ['아이디', '가입일', '적립'],
      // 인증코드는 토큰이 아니라 **평문 자리표시**다 — 일회용 코드는 도메인 필드가 아니라
      // 발송 시점 파라미터라 카탈로그에 올리지 않는다(presets.ts V 표 머리말 (나)).
      'verify-code': ['[인증코드]', '유효합니다', '요청 계정'],
      'purchase-complete': ['주문번호', '결제수단', '결제금액'],
      'shipping-started': ['운송장번호', '택배사', '배송지'],
      'delivery-complete': ['수령일시', '후기', '반품'],
      promotion: ['행사기간', '쿠폰코드', '상품명'],
    };

    for (const [id, needles] of Object.entries(signature)) {
      const body = textOf(build(id as PresetId));
      for (const needle of needles) expect(body).toContain(needle);
    }
  });

  it('인증코드 메일은 시선을 나누지 않는다 — 링크 CTA 도 하단 버튼도 없다', () => {
    const blocks = flatten(build('verify-code'));
    expect(blocks.some((block) => block.blockKind === 'button')).toBe(false);
    expect(blocks.some((block) => block.blockKind === 'menu')).toBe(false);
  });

  it('프로모션은 통이미지가 아니라 편집 가능한 상품 그리드다', () => {
    // 상품 그리드는 1:1 2단이다 — 같은 프리셋의 1:2 행은 라벨-값 정보 블록이라 이미지가 없다
    const top = build('promotion');
    const grids = top.filter((block) => block.blockKind === 'columns' && block.ratio === '1:1');
    expect(grids.length).toBeGreaterThanOrEqual(2);

    // 각 칸이 이미지 + 설명의 조합이어야 한다(이미지 한 장으로 때운 칸이 아니다)
    for (const grid of grids) {
      if (grid.blockKind !== 'columns') continue;
      for (const column of grid.columns) {
        expect(column.blocks.some((child) => child.blockKind === 'image')).toBe(true);
        expect(column.blocks.some((child) => child.blockKind === 'text')).toBe(true);
      }
    }
  });

  it('배송 시작의 두 CTA 는 같은 조회 주소로 수렴한다', () => {
    const blocks = flatten(build('shipping-started'));
    const menuUrls = blocks.flatMap((block) =>
      block.blockKind === 'menu' ? block.items.map((item) => item.url) : [],
    );
    const buttonUrls = blocks.flatMap((block) => (block.blockKind === 'button' ? [block.url] : []));
    expect(menuUrls).toEqual(buttonUrls);
  });
});

describe('링크가 살아서 나간다', () => {
  /**
   * [왜 이 축을 따로 보나] `safeUrl` 은 스킴이 없는 주소를 조용히 버린다 — 주소 칸에 치환
   * 토큰만 적으면 버튼은 그려지는데 `href` 가 빠져 **눌러도 아무 데도 가지 않는다**. 블록
   * 자체는 '주소가 비지 않았다' 는 이유로 미완성 표시조차 뜨지 않아, 렌더 결과를 보는
   * 이 테스트 말고는 잡을 자리가 없다(명세 §7 #28).
   */
  it('모든 버튼·링크 CTA 가 렌더된 HTML 에 href 를 남긴다', () => {
    for (const preset of EMAIL_PRESETS) {
      const blocks = preset.build(idFactory());
      if (blocks.length === 0) continue;

      const html = renderBlocksToHtml(blocks, presetCanvas());
      const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map((match) => match[0]);
      for (const anchor of anchors) {
        expect({ preset: preset.id, anchor, hasHref: anchor.includes('href="') }).toEqual({
          preset: preset.id,
          anchor,
          hasHref: true,
        });
      }
    }
  });
});

describe('치환 변수', () => {
  it('키 목록에 중복이 없다', () => {
    expect(new Set(PRESET_VARIABLE_KEYS).size).toBe(PRESET_VARIABLE_KEYS.length);
  });

  it('렌더된 결과에 카탈로그 밖 토큰도, 고객센터 문법도 남지 않는다', () => {
    /* [왜 '선언한 키가 실재한다'(아래) 로 부족한가] 그 테스트가 검사하는 것은 `V` 표에서 뽑은
     * **선언 목록**이다. 표가 맞아도 본문이 표를 거치지 않고 문자열을 직접 적었으면 통과한다.
     * 그래서 여기서는 6종을 **실제로 렌더해** 나온 HTML 을 훑는다 — 운영자가 받는 것과 같은
     * 산출물이라 중간에 새는 경로가 없다.
     *
     * [두 번째 단언] `{{...}}` 는 고객센터 답변 템플릿의 문법이다(support/_shared/domain.ts
     * applyTemplate). 그쪽은 **삽입 시점에** 우리 JS 가 치환하지만 이 화면의 발송 경로는 그
     * 문법을 모른다 — 마케팅 본문에 섞이면 치환되지 않은 채 수신자에게 간다. 두 문법이 왜
     * 하나로 합쳐지지 않았는지는 명세 §7 #30 에 근거를 남겼다.
     *
     * href 축은 위 '링크가 살아서 나간다' 가 이미 본다 — 같은 단언을 두 번 두지 않는다. */
    wireDomains();

    for (const preset of EMAIL_PRESETS) {
      const html = renderBlocksToHtml(preset.build(idFactory()), presetCanvas());
      const scanned = `${html}\n${preset.subject}`;

      expect(unknownTemplateVariableKeys(scanned), `${preset.id}: 카탈로그 밖 토큰`).toEqual([]);
      expect(scanned.match(/\{\{[^}]*\}\}/g), `${preset.id}: 고객센터 문법 혼입`).toBeNull();
    }
  });

  it('선언한 키가 전부 카탈로그에 실재한다 — 프리셋이 카탈로그와 두 벌이 되지 않는다', () => {
    /* [이 테스트가 막는 것] 프리셋이 카탈로그에 없는 이름을 쓰면 그 토큰은 발송 시점에 치환되지
     * 않고 `#{order.no}` 라는 글자가 그대로 수신자에게 간다. 카탈로그가 정본이고 프리셋은
     * 소비자라는 방향을 코드가 강제한다 — 사람의 대조에 맡기면 반드시 어긋난다. */
    wireDomains();
    const missing = PRESET_VARIABLE_KEYS.filter((key) => findTemplateVariable(key) === undefined);
    expect(missing).toEqual([]);
  });

  it('본문이 쓰는 `#{토큰}` 이 전부 키 목록 안에 있다 — 목록 밖의 이름이 새 들어오지 못한다', () => {
    const declared = new Set(PRESET_VARIABLE_KEYS);
    for (const preset of EMAIL_PRESETS) {
      const body = `${textOf(preset.build(idFactory()))}\n${preset.subject}`;
      // 토큰 안쪽은 영문 점 표기다(`#{member.name}`) — 예전 대문자 표기가 아니다
      for (const match of body.matchAll(/#\{([^}]+)\}/g)) {
        expect(declared.has(match[1] ?? '')).toBe(true);
      }
    }
  });
});
