/**
 * Foundations/Font Colors — color.text.* 계열을 실제 텍스트에 적용해 표시.
 * 배경 대비를 실제 렌더로 확인한다.
 *
 * [선행 조건] `pnpm codegen` 선행 필요 — generated/tokens/* 미생성 시 Storybook 빌드 불가.
 * 값 하드코딩 0건: tokenVars 맵 순회 + tokens.css(CSSOM) 런타임 해석 (_shared.tsx 참고).
 * tokens/tokens.json 에 color.text.* 토큰을 추가하면 이 스토리는 자동 갱신된다.
 */
import type { Meta, StoryObj } from '@storybook/react';
import type { CSSProperties } from 'react';
import {
  Code,
  cssVar,
  metaTextStyle,
  resolveTokenValue,
  Section,
  thinBorder,
  tokenEntries,
  TokenTable,
  tokenVars,
  typographyStyle,
  type TokenEntry,
  type TokenPath,
} from './_shared';

const meta: Meta = {
  title: 'Design System/Foundations/Font Colors',
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj;

const SAMPLE = '다람쥐 헌 쳇바퀴에 타고파 — The quick brown fox 0123456789';

const textEntries = () => tokenEntries((p) => p.startsWith('color.text.'));

/**
 * 표본 배경 결정 — 경로 규약 기반 동적 매칭.
 * color.text.on-X 는 대응 액션 배경(color.action.X.default) 위에서 검수해야 의미가 있다.
 * 그 외에는 기본 서피스 위에 렌더한다. (토큰이 늘어나도 규약만 지키면 자동 반영)
 */
function sampleBackground(path: string): string {
  const m = /^color\.text\.on-(.+)$/.exec(path);
  const target = m?.[1];
  if (target !== undefined) {
    const actionPath = `color.action.${target}.default`;
    if (actionPath in tokenVars) return cssVar(actionPath as TokenPath);
  }
  return cssVar('color.surface.default');
}

function FontColorSpecimen({ entry }: { entry: TokenEntry }) {
  const resolved = resolveTokenValue(entry.varName);
  const rowStyle: CSSProperties = {
    display: 'grid',
    gap: cssVar('space.1'),
    padding: cssVar('space.2'),
    borderBlockEnd: thinBorder(),
  };
  return (
    <div style={rowStyle}>
      <p
        style={{
          ...typographyStyle('typography.body.md'),
          color: `var(${entry.varName})`,
          background: sampleBackground(entry.path),
          borderRadius: cssVar('radius.sm'),
          padding: cssVar('space.2'),
          margin: 0,
        }}
      >
        {SAMPLE}
      </p>
      <Code>{entry.path}</Code>
      <span style={metaTextStyle}>
        {entry.varName} = {resolved}
      </span>
    </div>
  );
}

/** 실제 텍스트에 적용해 배경 대비를 확인한다 */
export const Specimen: Story = {
  render: () => (
    <Section
      title="Font Colors (color.text.*)"
      description="각 토큰을 실제 텍스트에 적용해 렌더한다. on-* 토큰은 대응 액션 배경 위에 표시된다 (경로 규약: color.text.on-X ↔ color.action.X.default)."
    >
      <div>
        {textEntries().map((entry) => (
          <FontColorSpecimen key={entry.path} entry={entry} />
        ))}
      </div>
    </Section>
  ),
};

/** 표 형태 — 토큰 경로 · CSS 변수 · 해석값 */
export const Table: Story = {
  render: () => (
    <Section
      title="Font Color Tokens"
      description="tokens.json 의 color.text.* 전체 — 값은 tokens.css 의 var() 체인을 런타임에 풀어 표기한다."
    >
      <TokenTable
        previewLabel="Aa"
        rows={textEntries().map((entry) => ({
          ...entry,
          preview: (
            <span
              aria-hidden
              style={{
                ...typographyStyle('typography.body.md'),
                color: `var(${entry.varName})`,
                background: sampleBackground(entry.path),
                borderRadius: cssVar('radius.sm'),
                paddingInline: cssVar('space.2'),
              }}
            >
              Aa
            </span>
          ),
        }))}
      />
    </Section>
  ),
};
