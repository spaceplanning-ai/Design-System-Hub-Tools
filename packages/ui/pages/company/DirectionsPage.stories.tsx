/**
 * Design System/Templates/Company/Directions — 오시는 길 화면 (조립 전용 · 게이트 G5).
 *
 * 카테고리는 영문 메뉴명이다: `/company/directions` → 메뉴 en = "Company"(기업 관리), 화면 en =
 * "Directions" (packages/ui/pages/_data/pages.ts 의 인벤토리 — Company 그룹의
 * `['/company/directions', '오시는 길', 'Directions']`).
 *
 * 대응 실화면: apps/admin/src/pages/company/directions/DirectionsPage.tsx (라우트 /company/directions).
 * 오시는 길도 회사당 1건인 **단일 문서 폼**이라 목록·검색·선택이 없다. 주소 → 상세주소 → 좌표(위도·경도)
 * → 지도 → 교통편 순서는 '어디인가 → 정확히 어디인가 → 어떻게 가는가' 의 읽는 순서 그대로다. 좌표 두
 * 칸은 한 덩어리라 한 줄에 나란히 서고, 그 **바로 아래** 지도 자리가 온다 — 입력한 좌표가 무엇을
 * 가리키는지 눈으로 확인하는 자리다. 지도는 외부 스크립트를 로드하지 않고 좌표를 그대로 보여주는
 * 자리표시(dashed 표면)로 둔다(백엔드 연동 시 지도 SDK 임베드로 교체).
 *
 * [조립 원칙] `../../src` public DS 컴포넌트만 조합한다 — 이 폴더에서 신규 DS 컴포넌트를 만들지 않고
 * apps/admin 을 import 하지 않는다(레이어 경계). 앱 전용 조각은 DS 표면으로 갈음한다:
 *   DocumentFormShell → Card + 토큰만 쓴 <h2> + 저장 툴바(Button) + Alert(danger)
 *
 * 실화면 ↔ DS 컴포넌트 매핑:
 *   폼 껍데기(DocumentFormShell) → Card + 토큰만 쓴 <h2>(CardTitle 은 DS 부재 — 토큰 레이아웃으로 대체)
 *   주소 · 상세주소             → FormField + input(controlStyle)
 *   위도 · 경도(±90/±180)       → FormField + input[inputMode=decimal] (한 줄 2칸)
 *   지도 자리표시               → 토큰만 쓴 dashed 표면(장식이라 aria-hidden) + 좌표 텍스트
 *   교통편(최대 1000자 · 5행)    → FormField + textarea(controlStyle 확장)
 *   저장 실패 배너              → Alert(danger)
 *   조회 실패 + 다시 시도        → Alert(danger) + Button(secondary)
 *   첫 조회 스켈레톤            → Skeleton ×4
 *   저장 툴바                   → 토큰만 쓴 <p>(변경 여부) + Button(primary)
 *
 * 하드코딩 색상(hex)/px 리터럴 0건 — 시각 값은 토큰 CSS 변수(cssVar/typography)와 rem·calc 만 참조한다.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import { useState } from 'react';

import { Alert, Button, Card, FormField, Skeleton, cssVar, typography } from '../../src';

const meta: Meta = {
  title: 'Design System/Templates/Company/Directions',
  parameters: { layout: 'fullscreen' },
};

export default meta;

type Story = StoryObj;

/* ── 상수(실화면 directions/types 미러) ─────────────────────────────────────────────────────── */

const ADDRESS_MAX_LENGTH = 200;
const ADDRESS_DETAIL_MAX_LENGTH = 100;
const TRANSIT_MAX_LENGTH = 1000;

/* ── 데모 데이터(실화면 data-source 의 DIRECTIONS_SEED 미러) ─────────────────────────────────── */

interface DirectionsValues {
  readonly address: string;
  readonly addressDetail: string;
  /** 위도·경도는 입력 그대로 문자열로 보관한다 — 저장 직전 숫자 검증을 거친다 */
  readonly latitude: string;
  readonly longitude: string;
  readonly transit: string;
}

const EMPTY_DIRECTIONS: DirectionsValues = {
  address: '',
  addressDetail: '',
  latitude: '',
  longitude: '',
  transit: '',
};

const SEED_DIRECTIONS: DirectionsValues = {
  address: '서울특별시 예시구 가상대로 123',
  addressDetail: '예시타워 8층',
  latitude: '37.500000',
  longitude: '127.030000',
  transit:
    '지하철: 2호선 예시역 3번 출구에서 도보 5분\n버스: 간선 000, 지선 0000 예시타워 정류장 하차\n주차: 건물 지하 1~3층(방문 2시간 무료)',
};

/** 좌표만 비운 상태 — 지도 자리표시가 '좌표를 입력하면…' 으로 바뀐다 */
const NO_COORDS_DIRECTIONS: DirectionsValues = {
  ...SEED_DIRECTIONS,
  latitude: '',
  longitude: '',
};

/** 검증 오류 데모 — 실화면 directionsSchema(zod) 가 내는 문구를 그대로 미러 */
interface FieldErrors {
  readonly address?: string;
  readonly addressDetail?: string;
  readonly latitude?: string;
  readonly longitude?: string;
  readonly transit?: string;
}

const DEMO_ERRORS: FieldErrors = {
  address: '주소를 입력하세요.',
  latitude: '위도는 -90 ~ 90 범위여야 합니다.',
  longitude: '경도는 숫자여야 합니다.',
};

/** 오류 시연용 시드 — 범위를 벗어난 위도와 숫자가 아닌 경도가 남아 있다 */
const INVALID_DIRECTIONS: DirectionsValues = {
  ...EMPTY_DIRECTIONS,
  latitude: '137.5',
  longitude: '동경 127도',
};

/* ── 스타일(토큰·rem·calc 만) ──────────────────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.5'),
  padding: cssVar('space.6'),
  minBlockSize: '100vh',
  background: cssVar('color.surface.default'),
  color: cssVar('color.text.default'),
};

const pageTitleStyle: CSSProperties = {
  ...typography('typography.title.xl'),
  margin: 0,
};

const descriptionStyle: CSSProperties = {
  ...typography('typography.label.md'),
  color: cssVar('color.text.muted'),
  margin: 0,
};

const cardBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.4'),
  minWidth: 0,
};

const cardTitleStyle: CSSProperties = {
  ...typography('typography.title.md'),
  margin: 0,
  color: cssVar('color.text.default'),
};

/** 위도·경도가 나란히 서는 행 — 실화면 rowStyle(auto-fit minmax) 미러 */
const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fit, minmax(calc(${cssVar('space.6')} * 5), 1fr))`,
  gap: cssVar('space.4'),
};

const controlStyle = (invalid: boolean): CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  paddingTop: cssVar('space.2'),
  paddingBottom: cssVar('space.2'),
  paddingLeft: cssVar('space.3'),
  paddingRight: cssVar('space.3'),
  borderStyle: 'solid',
  borderWidth: cssVar('border-width.thin'),
  borderColor: invalid ? cssVar('color.feedback.danger.border') : cssVar('color.border.default'),
  borderRadius: cssVar('radius.md'),
  background: cssVar('color.surface.default'),
  color: cssVar('color.text.default'),
  ...typography('typography.label.md'),
});

/** 교통편 textarea — 실화면 textareaStyle 미러(controlStyle + 최소 높이 + 세로 리사이즈) */
const textareaStyle = (invalid: boolean): CSSProperties => ({
  ...controlStyle(invalid),
  minHeight: `calc(${cssVar('space.6')} * 3)`,
  resize: 'vertical',
});

/** 지도 자리표시 — 실화면 mapPlaceholderStyle 미러 */
const mapPlaceholderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: cssVar('space.1'),
  boxSizing: 'border-box',
  width: '100%',
  minHeight: `calc(${cssVar('space.6')} * 6)`,
  paddingTop: cssVar('space.4'),
  paddingBottom: cssVar('space.4'),
  paddingLeft: cssVar('space.4'),
  paddingRight: cssVar('space.4'),
  borderStyle: 'dashed',
  borderWidth: cssVar('border-width.thin'),
  borderColor: cssVar('color.border.default'),
  borderRadius: cssVar('radius.md'),
  background: cssVar('color.surface.raised'),
  color: cssVar('color.text.muted'),
  textAlign: 'center',
};

const coordTextStyle: CSSProperties = {
  ...typography('typography.label.md'),
  fontVariantNumeric: 'tabular-nums',
  color: cssVar('color.text.default'),
};

const hintStyle: CSSProperties = {
  ...typography('typography.caption.md'),
  color: cssVar('color.text.muted'),
  margin: 0,
};

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: cssVar('space.3'),
};

const skeletonBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: cssVar('space.3'),
};

const errorBodyStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: cssVar('space.3'),
  flexWrap: 'wrap',
};

/* ── 제어형 화면(rules-of-hooks: Decorator 화살표가 아니라 Capitalized 컴포넌트에서 useState) ── */

interface DirectionsScreenProps {
  readonly loading?: boolean;
  readonly loadFailed?: boolean;
  readonly saving?: boolean;
  readonly initialDirty?: boolean;
  readonly serverError?: string | null;
  readonly errors?: FieldErrors;
  readonly seed?: DirectionsValues;
}

function DirectionsScreen({
  loading = false,
  loadFailed = false,
  saving = false,
  initialDirty = false,
  serverError = null,
  errors = {},
  seed = SEED_DIRECTIONS,
}: DirectionsScreenProps) {
  const [address, setAddress] = useState(seed.address);
  const [addressDetail, setAddressDetail] = useState(seed.addressDetail);
  const [latitude, setLatitude] = useState(seed.latitude);
  const [longitude, setLongitude] = useState(seed.longitude);
  const [transit, setTransit] = useState(seed.transit);
  const [dirty, setDirty] = useState(initialDirty);

  const disabled = saving || loading;
  const touch = (): void => setDirty(true);
  const hasCoords = latitude.trim() !== '' && longitude.trim() !== '';

  if (loadFailed) {
    return (
      <div style={pageStyle}>
        <h1 style={pageTitleStyle}>오시는 길</h1>
        <Alert tone="danger">
          <div style={errorBodyStyle}>
            <span>내용을 불러오지 못했습니다.</span>
            <Button variant="secondary">다시 시도</Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1 style={pageTitleStyle}>오시는 길</h1>
      <p style={descriptionStyle}>
        별표(*) 항목은 필수입니다. 좌표(위도·경도)는 지도 표시에 사용됩니다.
      </p>

      <form onSubmit={(event) => event.preventDefault()} noValidate>
        <Card>
          <div style={cardBodyStyle}>
            <h2 style={cardTitleStyle}>오시는 길</h2>

            {serverError !== null && <Alert tone="danger">{serverError}</Alert>}

            {loading ? (
              <div style={skeletonBodyStyle} aria-busy="true">
                {[0, 1, 2, 3].map((row) => (
                  <Skeleton key={`row-${String(row)}`} />
                ))}
              </div>
            ) : (
              <div style={cardBodyStyle}>
                <FormField
                  htmlFor="dir-address"
                  label="주소"
                  required
                  {...(errors.address !== undefined && { error: errors.address })}
                >
                  <input
                    id="dir-address"
                    type="text"
                    style={controlStyle(errors.address !== undefined)}
                    maxLength={ADDRESS_MAX_LENGTH}
                    placeholder="예: 서울특별시 예시구 가상대로 123"
                    disabled={disabled}
                    aria-invalid={errors.address !== undefined}
                    value={address}
                    onChange={(event) => {
                      setAddress(event.target.value);
                      touch();
                    }}
                  />
                </FormField>

                <FormField
                  htmlFor="dir-address-detail"
                  label="상세주소"
                  hint="건물명·층·호수 등 (선택)"
                  {...(errors.addressDetail !== undefined && { error: errors.addressDetail })}
                >
                  <input
                    id="dir-address-detail"
                    type="text"
                    style={controlStyle(errors.addressDetail !== undefined)}
                    maxLength={ADDRESS_DETAIL_MAX_LENGTH}
                    placeholder="예: 예시타워 8층"
                    disabled={disabled}
                    aria-invalid={errors.addressDetail !== undefined}
                    value={addressDetail}
                    onChange={(event) => {
                      setAddressDetail(event.target.value);
                      touch();
                    }}
                  />
                </FormField>

                <div style={rowStyle}>
                  <FormField
                    htmlFor="dir-lat"
                    label="위도"
                    required
                    hint="예: 37.5000"
                    {...(errors.latitude !== undefined && { error: errors.latitude })}
                  >
                    <input
                      id="dir-lat"
                      type="text"
                      inputMode="decimal"
                      style={controlStyle(errors.latitude !== undefined)}
                      placeholder="37.5000"
                      disabled={disabled}
                      aria-invalid={errors.latitude !== undefined}
                      value={latitude}
                      onChange={(event) => {
                        setLatitude(event.target.value);
                        touch();
                      }}
                    />
                  </FormField>

                  <FormField
                    htmlFor="dir-lng"
                    label="경도"
                    required
                    hint="예: 127.0300"
                    {...(errors.longitude !== undefined && { error: errors.longitude })}
                  >
                    <input
                      id="dir-lng"
                      type="text"
                      inputMode="decimal"
                      style={controlStyle(errors.longitude !== undefined)}
                      placeholder="127.0300"
                      disabled={disabled}
                      aria-invalid={errors.longitude !== undefined}
                      value={longitude}
                      onChange={(event) => {
                        setLongitude(event.target.value);
                        touch();
                      }}
                    />
                  </FormField>
                </div>

                {/* 지도 임베드 자리 — 외부 스크립트를 로드하지 않고 좌표만 그대로 보여준다(장식) */}
                <div style={mapPlaceholderStyle} aria-hidden="true">
                  <span>지도 미리보기</span>
                  <span style={coordTextStyle}>
                    {hasCoords
                      ? `위도 ${latitude.trim()} · 경도 ${longitude.trim()}`
                      : '좌표를 입력하면 위치가 표시됩니다.'}
                  </span>
                </div>

                <FormField
                  htmlFor="dir-transit"
                  label="교통편"
                  hint="지하철·버스·주차 안내 등 (선택)"
                  {...(errors.transit !== undefined && { error: errors.transit })}
                >
                  <textarea
                    id="dir-transit"
                    style={textareaStyle(errors.transit !== undefined)}
                    rows={5}
                    maxLength={TRANSIT_MAX_LENGTH}
                    placeholder="예: 지하철 2호선 예시역 3번 출구 도보 5분"
                    disabled={disabled}
                    aria-invalid={errors.transit !== undefined}
                    value={transit}
                    onChange={(event) => {
                      setTransit(event.target.value);
                      touch();
                    }}
                  />
                </FormField>

                <p style={hintStyle}>지도는 백엔드 연동 시 좌표 기반 지도 임베드로 대체됩니다.</p>
              </div>
            )}

            <div style={actionsStyle}>
              <p style={hintStyle}>
                {saving
                  ? '저장하는 중입니다…'
                  : dirty
                    ? '저장하지 않은 변경 사항이 있습니다.'
                    : '변경 사항이 없습니다.'}
              </p>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!dirty || saving || loading}
                onClick={() => setDirty(false)}
              >
                {saving ? '저장 중…' : '저장'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}

/** 정상: 주소·좌표·교통편이 모두 채워진 기본 상태(지도 자리에 좌표가 표시된다) */
export const Default: Story = {
  render: () => <DirectionsScreen />,
};

/** 최초 로드: 카드 본문 스켈레톤 — 첫 조회에서만 켠다(STATE-01) */
export const Loading: Story = {
  render: () => <DirectionsScreen loading />,
};

/** 편집됨: 변경 있음 → 저장 버튼 활성 + '저장하지 않은 변경 사항이 있습니다' (이탈 가드 조건) */
export const Edited: Story = {
  render: () => <DirectionsScreen initialDirty />,
};

/** 좌표 없음: 위도·경도가 비면 지도 자리가 '좌표를 입력하면 위치가 표시됩니다.' 로 바뀐다 */
export const NoCoordinates: Story = {
  render: () => <DirectionsScreen seed={NO_COORDS_DIRECTIONS} />,
};

/** 검증 오류: 빈 주소 + 범위를 벗어난 위도 + 숫자가 아닌 경도 — zod 문구가 인라인으로 붙는다 */
export const ValidationError: Story = {
  render: () => <DirectionsScreen seed={INVALID_DIRECTIONS} errors={DEMO_ERRORS} initialDirty />,
};
