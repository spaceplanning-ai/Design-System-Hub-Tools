import type { Meta, StoryObj } from '@storybook/react';
import { allCollections, cssVar, resolveValue } from '@/tokens';
import type { DesignToken } from '@/tokens';

const meta: Meta = {
  title: 'Foundations/Design Tokens',
  parameters: {
    layout: 'fullscreen',
    options: { showPanel: false },
  },
};
export default meta;

type Story = StoryObj;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 'var(--tds-space-8)' }}>
    <h2 style={{ fontSize: 'var(--tds-font-size-xl)', marginBottom: 'var(--tds-space-4)' }}>
      {title}
    </h2>
    {children}
  </section>
);

const tokensOfType = (type: DesignToken['type']) =>
  allCollections.flatMap((c) =>
    c.tokens.filter((t) => t.type === type).map((t) => ({ t, collection: c })),
  );

/* ------------------------------- Colors -------------------------------- */

export const Colors: Story = {
  render: () => {
    const primitives = allCollections
      .find((c) => c.id === 'primitive')!
      .tokens.filter((t) => t.type === 'color');
    const groups = [...new Set(primitives.map((t) => t.group))];
    return (
      <div style={{ padding: 'var(--tds-space-6)' }}>
        <Section title="Primitive colors">
          {groups.map((g) => (
            <div key={g} style={{ marginBottom: 'var(--tds-space-4)' }}>
              <h3
                style={{
                  fontSize: 'var(--tds-font-size-sm)',
                  color: 'var(--tds-color-fg-muted)',
                  marginBottom: 8,
                }}
              >
                {g}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {primitives
                  .filter((t) => t.group === g)
                  .map((t) => (
                    <div key={t.id} style={{ width: 92 }}>
                      <div
                        style={{
                          height: 48,
                          borderRadius: 8,
                          background: cssVar(t.id),
                          border: '1px solid var(--tds-color-border-subtle)',
                        }}
                      />
                      <div
                        style={{ fontSize: 11, marginTop: 4, color: 'var(--tds-color-fg-muted)' }}
                      >
                        {t.id.replace('color.', '')}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--tds-color-fg-subtle)' }}>
                        {String(resolveValue(t.id))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </Section>
      </div>
    );
  },
};

/* ---------------------------- Typography -------------------------------- */

export const Typography: Story = {
  render: () => {
    const styles = tokensOfType('typography');
    return (
      <div style={{ padding: 'var(--tds-space-6)' }}>
        <Section title="Text styles">
          {styles.map(({ t }) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--tds-space-4)',
                padding: '10px 0',
                borderBottom: '1px solid var(--tds-color-border-subtle)',
              }}
            >
              <code style={{ width: 120, fontSize: 12, color: 'var(--tds-color-fg-subtle)' }}>
                {t.id}
              </code>
              <span className={`tds-${t.id.replace(/\./g, '-')}`}>The quick brown fox</span>
            </div>
          ))}
        </Section>
      </div>
    );
  },
};

/* ---------------------------- Font families ----------------------------- */

const FONT_FAMILIES = [
  {
    id: 'font.family.sans',
    name: 'Pretendard',
    role: 'Default UI / body',
    varName: '--tds-font-family-sans',
  },
  {
    id: 'font.family.paperlogy',
    name: 'Paperlogy',
    role: 'Display / headings',
    varName: '--tds-font-family-paperlogy',
  },
  {
    id: 'font.family.notoSansKr',
    name: 'Noto Sans KR',
    role: 'Alternative body',
    varName: '--tds-font-family-notoSansKr',
  },
];

const WEIGHTS = [
  { w: 100, name: 'Thin' },
  { w: 200, name: 'ExtraLight' },
  { w: 300, name: 'Light' },
  { w: 400, name: 'Regular' },
  { w: 500, name: 'Medium' },
  { w: 600, name: 'SemiBold' },
  { w: 700, name: 'Bold' },
  { w: 800, name: 'ExtraBold' },
  { w: 900, name: 'Black' },
];

export const FontFamilies: Story = {
  render: () => (
    <div style={{ padding: 'var(--tds-space-6)' }}>
      {FONT_FAMILIES.map((f) => (
        <Section key={f.id} title={f.name}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 'var(--tds-space-3)',
              alignItems: 'baseline',
            }}
          >
            <code style={{ fontSize: 12, color: 'var(--tds-color-fg-subtle)' }}>{f.varName}</code>
            <span style={{ fontSize: 12, color: 'var(--tds-color-fg-muted)' }}>{f.role}</span>
          </div>
          <p
            style={{
              fontFamily: `var(${f.varName})`,
              fontSize: 'var(--tds-font-size-4xl)',
              fontWeight: 700,
              margin: '0 0 4px',
              letterSpacing: '-0.02em',
            }}
          >
            디자인 시스템 · Design System
          </p>
          <p
            style={{
              fontFamily: `var(${f.varName})`,
              fontSize: 'var(--tds-font-size-md)',
              color: 'var(--tds-color-fg-muted)',
              margin: '0 0 var(--tds-space-4)',
            }}
          >
            다람쥐 헌 쳇바퀴에 타고파 · The quick brown fox jumps over the lazy dog · 0123456789
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {WEIGHTS.map((wt) => (
              <div
                key={wt.w}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 'var(--tds-space-4)',
                  padding: '4px 0',
                  borderBottom: '1px solid var(--tds-color-border-subtle)',
                }}
              >
                <code style={{ width: 96, fontSize: 11, color: 'var(--tds-color-fg-subtle)' }}>
                  {wt.w} {wt.name}
                </code>
                <span
                  style={{
                    fontFamily: `var(${f.varName})`,
                    fontWeight: wt.w,
                    fontSize: 'var(--tds-font-size-lg)',
                  }}
                >
                  가나다라 AaBbGg 디자인 시스템 123
                </span>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  ),
};

/* --------------------------- Spacing / Radius --------------------------- */

export const Spacing: Story = {
  render: () => {
    const space = allCollections
      .find((c) => c.id === 'primitive')!
      .tokens.filter((t) => t.id.startsWith('space.'));
    return (
      <div style={{ padding: 'var(--tds-space-6)' }}>
        <Section title="Spacing scale">
          {space.map((t) => (
            <div
              key={t.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}
            >
              <code style={{ width: 90, fontSize: 12 }}>{t.id}</code>
              <div
                style={{
                  height: 16,
                  width: cssVar(t.id),
                  background: 'var(--tds-color-brand-solid)',
                  borderRadius: 2,
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--tds-color-fg-subtle)' }}>
                {String(resolveValue(t.id))}px
              </span>
            </div>
          ))}
        </Section>
      </div>
    );
  },
};

export const Radius: Story = {
  render: () => {
    const radii = allCollections
      .find((c) => c.id === 'primitive')!
      .tokens.filter((t) => t.id.startsWith('radius.'));
    return (
      <div style={{ padding: 'var(--tds-space-6)', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {radii.map((t) => (
          <div key={t.id} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                background: 'var(--tds-color-brand-subtle)',
                border: '2px solid var(--tds-color-brand-solid)',
                borderRadius: cssVar(t.id),
              }}
            />
            <div style={{ fontSize: 11, marginTop: 6 }}>{t.id.replace('radius.', '')}</div>
          </div>
        ))}
      </div>
    );
  },
};

export const Elevation: Story = {
  render: () => {
    const shadows = tokensOfType('shadow');
    return (
      <div style={{ padding: 'var(--tds-space-8)', display: 'flex', flexWrap: 'wrap', gap: 32 }}>
        {shadows.map(({ t }) => (
          <div key={t.id} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 120,
                height: 80,
                background: 'var(--tds-color-bg-surface)',
                borderRadius: 12,
                boxShadow: cssVar(t.id),
              }}
            />
            <div style={{ fontSize: 12, marginTop: 10, color: 'var(--tds-color-fg-muted)' }}>
              {t.id}
            </div>
          </div>
        ))}
      </div>
    );
  },
};
