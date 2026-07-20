// 사이트 기본 설정 검증 회귀 테스트 (시스템 설정 섹션)
//
// 이 화면이 조용히 틀리기 쉬운 자리 넷을 못박는다:
//   ① 바이트 카운터 — 한글은 1자가 2byte 다. 글자 수로 세면 40byte 상한이 두 배로 헐거워진다.
//   ② 글자 수 상한 — 사이트 이름 20자 / 설명 100자.
//   ③ 파일 규칙 — 확장자·용량·해상도.
//   ④ 공개 범위 ↔ 비공개용 이미지의 관계 — 전체 공개일 때 이 이미지는 판정 대상이 아니다.
import { describe, expect, it } from 'vitest';

import { byteLengthOf } from '../../../shared/format';
import {
  MESSAGING_NAME_MAX_BYTES,
  faviconDimensionError,
  faviconFileError,
  imageFileError,
  isDisplayableAssetUrl,
  isPrivateImageEditable,
  siteSettingsSchema,
} from './validation';
import type { PickedFile, SiteAsset, SiteSettingsValues } from './validation';

const ASSET: SiteAsset = {
  name: 'cover.png',
  size: 1024,
  url: 'https://cdn.example.com/cover.png',
};

const BASE: SiteSettingsValues = {
  siteName: 'TDS 스페이스플래닝',
  siteDescription: '공간 기획·설계·시공',
  messagingNameEnabled: false,
  messagingName: '',
  siteUrl: 'https://tds-spaceplanning.com',
  favicon: null,
  ogImage: null,
  visibility: 'public',
  privateImage: null,
  copyProtection: true,
  mobileZoomAllowed: false,
  keepSignedIn: true,
};

function valuesOf(overrides: Partial<SiteSettingsValues> = {}): SiteSettingsValues {
  return { ...BASE, ...overrides };
}

function fileOf(overrides: Partial<PickedFile> = {}): PickedFile {
  return { name: 'cover.png', size: 1024, type: 'image/png', ...overrides };
}

/** 특정 필드에 오류가 붙었는가 */
function hasIssueOn(values: SiteSettingsValues, field: keyof SiteSettingsValues): boolean {
  const result = siteSettingsSchema.safeParse(values);
  if (result.success) return false;
  return result.error.issues.some((issue) => issue.path[0] === field);
}

describe('siteSettingsSchema — 사이트 이름·설명 (글자 수 카운터의 상한)', () => {
  it('기본값은 통과한다', () => {
    expect(siteSettingsSchema.safeParse(valuesOf()).success).toBe(true);
  });

  it('사이트 이름이 비면 막는다', () => {
    expect(hasIssueOn(valuesOf({ siteName: '   ' }), 'siteName')).toBe(true);
  });

  it('사이트 이름 20자는 통과하고 21자는 막는다 — 카운터의 상한과 같은 수', () => {
    expect(siteSettingsSchema.safeParse(valuesOf({ siteName: '가'.repeat(20) })).success).toBe(
      true,
    );
    expect(hasIssueOn(valuesOf({ siteName: '가'.repeat(21) }), 'siteName')).toBe(true);
  });

  it('사이트 설명 100자는 통과하고 101자는 막는다', () => {
    expect(
      siteSettingsSchema.safeParse(valuesOf({ siteDescription: '가'.repeat(100) })).success,
    ).toBe(true);
    expect(hasIssueOn(valuesOf({ siteDescription: '가'.repeat(101) }), 'siteDescription')).toBe(
      true,
    );
  });

  it('사이트 설명은 비어도 된다 — 필수가 아니다', () => {
    expect(siteSettingsSchema.safeParse(valuesOf({ siteDescription: '' })).success).toBe(true);
  });
});

describe('메일·SMS 전용 이름 — 바이트 경계 (글자 수가 아니다)', () => {
  it('한글은 1자가 2byte 다 — 이 전제가 깨지면 상한 계산이 전부 틀어진다', () => {
    expect(byteLengthOf('가')).toBe(2);
    expect(byteLengthOf('a')).toBe(1);
    expect(byteLengthOf('가a')).toBe(3);
  });

  it('한글 20자 = 40byte 는 딱 통과한다', () => {
    const name = '가'.repeat(20);
    expect(byteLengthOf(name)).toBe(MESSAGING_NAME_MAX_BYTES);
    expect(
      siteSettingsSchema.safeParse(valuesOf({ messagingNameEnabled: true, messagingName: name }))
        .success,
    ).toBe(true);
  });

  it('한글 21자 = 42byte 는 막는다 — 글자 수(21자)로 셌다면 20자 상한에도 걸리지 않았을 값이다', () => {
    const name = '가'.repeat(21);
    expect(byteLengthOf(name)).toBe(42);
    expect(
      hasIssueOn(valuesOf({ messagingNameEnabled: true, messagingName: name }), 'messagingName'),
    ).toBe(true);
  });

  it('ASCII 40자 = 40byte 는 통과한다 — 같은 상한이 글자 수로는 두 배로 벌어진다', () => {
    const name = 'a'.repeat(40);
    expect(byteLengthOf(name)).toBe(MESSAGING_NAME_MAX_BYTES);
    expect(
      siteSettingsSchema.safeParse(valuesOf({ messagingNameEnabled: true, messagingName: name }))
        .success,
    ).toBe(true);
  });

  it('한글·ASCII 가 섞인 경계값(19자 + 1글자 = 39byte)도 통과한다', () => {
    const name = `${'가'.repeat(19)}a`;
    expect(byteLengthOf(name)).toBe(39);
    expect(
      siteSettingsSchema.safeParse(valuesOf({ messagingNameEnabled: true, messagingName: name }))
        .success,
    ).toBe(true);
  });

  it('스위치를 켜고 이름을 비우면 막는다', () => {
    expect(
      hasIssueOn(valuesOf({ messagingNameEnabled: true, messagingName: '  ' }), 'messagingName'),
    ).toBe(true);
  });

  it('스위치가 꺼져 있으면 길이를 넘겨도 판정하지 않는다 — 쓰지 않을 값을 막지 않는다', () => {
    expect(
      siteSettingsSchema.safeParse(
        valuesOf({ messagingNameEnabled: false, messagingName: '가'.repeat(80) }),
      ).success,
    ).toBe(true);
  });
});

describe('공개 범위 ↔ 비공개용 이미지', () => {
  it('비공개일 때만 비공개용 이미지를 만질 수 있다', () => {
    expect(isPrivateImageEditable('private')).toBe(true);
    expect(isPrivateImageEditable('public')).toBe(false);
  });

  it('전체 공개면 비공개용 이미지가 반쯤 올라간 상태여도 저장을 막지 않는다 — 쓰이지 않는 값이다', () => {
    const halfUploaded: SiteAsset = { name: 'x.png', size: 10, url: '' };
    expect(
      siteSettingsSchema.safeParse(valuesOf({ visibility: 'public', privateImage: halfUploaded }))
        .success,
    ).toBe(true);
  });

  it('비공개인데 이미지 주소가 비면 막는다 — 방문자에게 깨진 이미지를 내보내지 않는다', () => {
    const halfUploaded: SiteAsset = { name: 'x.png', size: 10, url: '   ' };
    expect(
      hasIssueOn(valuesOf({ visibility: 'private', privateImage: halfUploaded }), 'privateImage'),
    ).toBe(true);
  });

  it('비공개인데 이미지가 아예 없으면 통과한다 — 기본 비공개 페이지가 대신 뜬다(안내 문구와 같은 규칙)', () => {
    expect(
      siteSettingsSchema.safeParse(valuesOf({ visibility: 'private', privateImage: null })).success,
    ).toBe(true);
  });

  it('비공개 + 정상 이미지는 통과한다', () => {
    expect(
      siteSettingsSchema.safeParse(valuesOf({ visibility: 'private', privateImage: ASSET }))
        .success,
    ).toBe(true);
  });

  it('공개 범위는 두 값만 받는다', () => {
    const parsed = siteSettingsSchema.safeParse({ ...BASE, visibility: 'unlisted' });
    expect(parsed.success).toBe(false);
  });
});

describe('파일 규칙 — 파비콘', () => {
  it('ICO 가 아니면 막는다', () => {
    expect(faviconFileError(fileOf({ name: 'icon.png' }))).not.toBeNull();
    expect(faviconFileError(fileOf({ name: 'icon.ico', type: 'image/x-icon' }))).toBeNull();
  });

  it('확장자 대소문자를 가리지 않는다', () => {
    expect(faviconFileError(fileOf({ name: 'ICON.ICO' }))).toBeNull();
  });

  it('100KB 를 넘으면 막는다', () => {
    expect(faviconFileError(fileOf({ name: 'icon.ico', size: 100 * 1024 }))).toBeNull();
    expect(faviconFileError(fileOf({ name: 'icon.ico', size: 100 * 1024 + 1 }))).not.toBeNull();
  });

  it('가로·세로가 16 미만이면 막는다', () => {
    expect(faviconDimensionError(16, 16)).toBeNull();
    expect(faviconDimensionError(15, 16)).not.toBeNull();
    expect(faviconDimensionError(16, 15)).not.toBeNull();
  });
});

describe('파일 규칙 — 이미지(대표·비공개용)', () => {
  it('PNG · JPG · GIF 만 받는다', () => {
    expect(imageFileError(fileOf({ name: 'a.png' }))).toBeNull();
    expect(imageFileError(fileOf({ name: 'a.jpg' }))).toBeNull();
    expect(imageFileError(fileOf({ name: 'a.jpeg' }))).toBeNull();
    expect(imageFileError(fileOf({ name: 'a.gif' }))).toBeNull();
    expect(imageFileError(fileOf({ name: 'a.svg' }))).not.toBeNull();
    expect(imageFileError(fileOf({ name: 'a.pdf' }))).not.toBeNull();
  });

  it('확장자가 아예 없으면 막는다', () => {
    expect(imageFileError(fileOf({ name: 'cover' }))).not.toBeNull();
  });

  it('5MB 를 넘으면 막는다', () => {
    expect(imageFileError(fileOf({ size: 5 * 1024 * 1024 }))).toBeNull();
    expect(imageFileError(fileOf({ size: 5 * 1024 * 1024 + 1 }))).not.toBeNull();
  });
});

describe('자산 URL — 스킴을 제한한다', () => {
  it('사이트 내부 경로와 https 는 통과한다', () => {
    expect(isDisplayableAssetUrl('/uploads/og-cover.png')).toBe(true);
    expect(isDisplayableAssetUrl('https://cdn.example.com/a.png')).toBe(true);
    // 아직 아무것도 올리지 않은 상태
    expect(isDisplayableAssetUrl('')).toBe(true);
  });

  it('javascript: 는 막는다 — 이 값은 img src 와 공유 카드로 나간다', () => {
    expect(isDisplayableAssetUrl('javascript:alert(1)')).toBe(false);
    expect(isDisplayableAssetUrl('JavaScript:alert(1)')).toBe(false);
  });

  it('data: 와 평문 http 도 막는다', () => {
    expect(isDisplayableAssetUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isDisplayableAssetUrl('http://cdn.example.com/a.png')).toBe(false);
  });

  it('프로토콜 상대(//host)는 내부 경로처럼 보이지만 외부로 나간다 — 막는다', () => {
    expect(isDisplayableAssetUrl('//evil.example.com/a.png')).toBe(false);
  });
});

describe('파일 형식 — 확장자만 믿지 않는다', () => {
  it('확장자를 png 로 바꾼 SVG 는 MIME 에서 걸린다', () => {
    expect(imageFileError({ name: 'payload.png', size: 1024, type: 'image/svg+xml' })).not.toBe(
      null,
    );
  });

  it('확장자가 맞고 MIME 이 위험하지 않으면 통과한다', () => {
    expect(imageFileError({ name: 'cover.png', size: 1024, type: 'image/png' })).toBe(null);
  });

  it('브라우저가 MIME 을 못 붙여 빈 값이면 확장자로 판정한다 — 정상 파일을 거절하지 않는다', () => {
    expect(imageFileError({ name: 'cover.png', size: 1024, type: '' })).toBe(null);
    expect(imageFileError({ name: 'cover.svg', size: 1024, type: '' })).not.toBe(null);
  });

  it('.ico 의 MIME 은 환경마다 달라 허용목록을 만들 수 없다 — 위험하지 않으면 통과시킨다', () => {
    for (const type of ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', '']) {
      expect(faviconFileError({ name: 'f.ico', size: 1024, type })).toBe(null);
    }
    expect(faviconFileError({ name: 'f.ico', size: 1024, type: 'image/svg+xml' })).not.toBe(null);
  });
});
