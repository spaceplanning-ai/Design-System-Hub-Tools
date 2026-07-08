import type { Meta, StoryObj } from '@storybook/react';
import { componentMetas } from '@/components/metas';
import type { Category, ComponentMeta, VariantProp } from '@core/types';

/**
 * Data-driven documentation for the A/B/C `type` convention. It reads the live
 * component metadata, so it never goes stale as components are added or changed.
 */
const meta: Meta = {
  title: 'Foundations/Type System (A·B·C)',
  parameters: {
    layout: 'fullscreen',
    options: { showPanel: false },
    docs: {
      description: {
        component:
          'Layout/structure presets are exposed as a `type` Variant Property with values **A / B / C**. It is orthogonal to the fill/visual axis (`variant`, labelled **Style**), and to `tone`, `size`, `shape`. Each A/B/C combination becomes a Figma Variant automatically.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const CATEGORY_LABEL: Record<Category, string> = {
  atom: 'Atoms',
  molecule: 'Molecules',
  organism: 'Organisms',
};

const typeProp = (m: ComponentMeta): VariantProp | undefined =>
  m.variantProps.find((v) => v.name === 'type');

/**
 * Extract per-letter meanings from a "… A: foo · B — bar · C: baz" style
 * description, tolerant of `:`/`-`/`–`/`—` separators.
 */
function parseMeanings(description?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!description) return out;
  const re = /\b([ABC])\s*[—–:-]\s*([^·]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(description)) !== null) {
    out[m[1]] = m[2].trim().replace(/[.\s]+$/, '');
  }
  return out;
}

const cell: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid var(--tds-color-border-subtle)',
  verticalAlign: 'top',
  fontSize: 'var(--tds-font-size-sm)',
};
const letterChip = (l: string) => (
  <span
    style={{
      display: 'inline-flex',
      width: 20,
      height: 20,
      borderRadius: 'var(--tds-radius-sm)',
      background: 'var(--tds-color-brand-subtle)',
      color: 'var(--tds-color-brand-subtleFg)',
      fontWeight: 700,
      fontSize: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    }}
  >
    {l}
  </span>
);

export const Overview: Story = {
  render: () => {
    const withType = componentMetas
      .map((m) => ({ m, tp: typeProp(m) }))
      .filter((x): x is { m: ComponentMeta; tp: VariantProp } => Boolean(x.tp));

    return (
      <div style={{ padding: 'var(--tds-space-6)', maxWidth: 960 }}>
        <div
          style={{
            display: 'flex',
            gap: 16,
            padding: '16px 20px',
            marginBottom: 24,
            borderRadius: 12,
            background: 'var(--tds-color-bg-surface)',
            border: '1px solid var(--tds-color-border-default)',
          }}
        >
          <div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{withType.length}</div>
            <div style={{ fontSize: 12, color: 'var(--tds-color-fg-muted)' }}>components with a Type axis</div>
          </div>
          <div style={{ borderLeft: '1px solid var(--tds-color-border-subtle)', paddingLeft: 16, fontSize: 13, color: 'var(--tds-color-fg-muted)', lineHeight: 1.6 }}>
            <strong>Type (A/B/C)</strong> = layout / structure preset →&nbsp;Figma Variant Property.
            <br />
            <strong>Style</strong> (<code>variant</code>) = fill / visual emphasis. The two axes compose freely.
          </div>
        </div>

        {(['atom', 'molecule', 'organism'] as Category[]).map((cat) => {
          const items = withType.filter((x) => x.m.category === cat);
          if (!items.length) return null;
          return (
            <section key={cat} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 'var(--tds-font-size-lg)', marginBottom: 8 }}>{CATEGORY_LABEL[cat]}</h2>
              <div style={{ overflowX: 'auto', border: '1px solid var(--tds-color-border-subtle)', borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: 'var(--tds-color-bg-subtle)', textAlign: 'left' }}>
                      <th style={{ ...cell, width: 130 }}>Component</th>
                      <th style={cell}>Type A</th>
                      <th style={cell}>Type B</th>
                      <th style={cell}>Type C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(({ m, tp }) => {
                      const meanings = parseMeanings(tp.description);
                      return (
                        <tr key={m.slug}>
                          <td style={{ ...cell, fontWeight: 600 }}>{m.name}</td>
                          {(['A', 'B', 'C'] as const).map((l) => (
                            <td key={l} style={cell}>
                              {letterChip(l)}
                              {meanings[l] ?? '—'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    );
  },
};
