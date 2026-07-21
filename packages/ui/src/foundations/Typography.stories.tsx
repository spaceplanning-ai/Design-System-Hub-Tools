/**
 * Foundations/Typography — 타이포그래피 토큰별 스펙시먼.
 * 컴포지트 토큰(typography.*)의 서브 변수(font-family/size/weight/line-height) 표 + 샘플 문장.
 *
 * [선행 조건] `pnpm codegen` 선행 필요 — generated/tokens/* 미생성 시 Storybook 빌드 불가.
 * 값 하드코딩 0건: tokenVars 맵 순회 + tokens.css(CSSOM) 런타임 해석 (_shared.tsx 참고).
 * tokens/tokens.json 에 typography.* 컴포지트를 추가하면 이 스토리는 자동 갱신된다.
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
  typographyEntries,
  typographyStyle,
  type TypographyEntry,
} from './_shared';

const meta: Meta = {
  title: 'Design System/Foundations/Typography',
  parameters: { layout: 'padded' },
};

export default meta;

type Story = StoryObj;

const SAMPLE = '다람쥐 헌 쳇바퀴에 타고파 — The quick brown fox jumps over the lazy dog 0123456789';

// [서브 키 목록을 여기서 손으로 세지 않는다] 예전에는 SUB_KEYS 를 이 파일이 상수로 들고
// 있었다 — codegen 이 전개 규약을 바꾸면 이 화면만 조용히 어긋난다. 이제 각 컴포지트가
// 자기 서브 키를 들고 온다(typographyEntries).

function TypographySpecimen({ entry }: { entry: TypographyEntry }) {
  const cell: CSSProperties = {
    padding: cssVar('space.1'),
    paddingInlineEnd: cssVar('space.4'),
    borderBlockEnd: thinBorder(),
    textAlign: 'start',
    verticalAlign: 'middle',
  };
  return (
    <article
      style={{
        border: thinBorder(),
        borderRadius: cssVar('radius.md'),
        padding: cssVar('space.4'),
        marginBlockEnd: cssVar('space.4'),
        display: 'grid',
        gap: cssVar('space.3'),
      }}
    >
      <Code>{entry.path}</Code>
      {/* 샘플 문장 — 컴포지트 서브 변수를 그대로 적용 */}
      <p style={{ ...typographyStyle(entry.path), margin: 0, color: cssVar('color.text.default') }}>
        {SAMPLE}
      </p>
      {/* 스펙 표 — 서브 변수별 해석값 (typography 는 모드 무관이라 light 값만 표기) */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            {entry.subKeys.map((sub) => {
              const subVar = `${entry.varPrefix}-${sub}`;
              return (
                <tr key={sub}>
                  <th scope="row" style={{ ...cell, ...metaTextStyle }}>
                    {sub}
                  </th>
                  <td style={cell}>
                    <Code>{subVar}</Code>
                  </td>
                  <td style={{ ...cell, ...metaTextStyle }}>{resolveTokenValue(subVar)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

/** 타이포그래피 컴포지트 전수 스펙시먼 */
export const Specimen: Story = {
  render: () => (
    <Section
      title="Typography (typography.*)"
      description="컴포지트 토큰은 codegen 이 서브 변수(--…-font-family/-font-size/-font-weight/-line-height)로 전개한다. 컴포넌트는 이 서브 변수를 참조한다."
    >
      {typographyEntries().map((entry) => (
        <TypographySpecimen key={entry.path} entry={entry} />
      ))}
    </Section>
  ),
};
