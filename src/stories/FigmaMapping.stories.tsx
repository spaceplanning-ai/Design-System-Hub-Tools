import type { Meta, StoryObj } from '@storybook/react';
import { componentMetas } from '@/components/metas';
import { variantCount } from '@core/defineComponent';
import type { Category } from '@core/types';

const meta: Meta = {
  title: 'Foundations/Figma Mapping',
  parameters: {
    layout: 'fullscreen',
    options: { showPanel: false },
    docs: {
      description: {
        component:
          'Every component exposes structured metadata that maps 1:1 to Figma. `npm run ds:build` compiles it into `figma/tds.plugin.json`, which a plugin turns into Variables, Styles, Components and Component Sets with zero manual setup.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const chip = (text: string, bg = 'var(--tds-color-bg-subtle)', fg = 'var(--tds-color-fg-muted)') => (
  <span
    key={text}
    style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 'var(--tds-radius-pill)',
      background: bg,
      color: fg,
      fontSize: 11,
      fontWeight: 500,
      marginRight: 4,
      marginBottom: 4,
    }}
  >
    {text}
  </span>
);

const CATEGORY_LABEL: Record<Category, string> = { atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms' };

export const Overview: Story = {
  render: () => {
    const byCategory = (['atom', 'molecule', 'organism'] as Category[]).map((cat) => ({
      cat,
      items: componentMetas.filter((m) => m.category === cat),
    }));
    const totalVariants = componentMetas.reduce((a, m) => a + variantCount(m), 0);

    return (
      <div style={{ padding: 'var(--tds-space-6)', maxWidth: 1000 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            ['Components', componentMetas.length],
            ['Atoms', componentMetas.filter((m) => m.category === 'atom').length],
            ['Molecules', componentMetas.filter((m) => m.category === 'molecule').length],
            ['Organisms', componentMetas.filter((m) => m.category === 'organism').length],
            ['Total variant combos', totalVariants.toLocaleString()],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: '12px 20px',
                borderRadius: 12,
                background: 'var(--tds-color-bg-surface)',
                border: '1px solid var(--tds-color-border-default)',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--tds-color-fg-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {byCategory.map(({ cat, items }) => (
          <section key={cat} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 'var(--tds-font-size-lg)', marginBottom: 12 }}>{CATEGORY_LABEL[cat]}</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map((m) => (
                <div
                  key={m.slug}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--tds-color-bg-surface)',
                    border: '1px solid var(--tds-color-border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                    <strong>{m.name}</strong>
                    <span style={{ fontSize: 12, color: 'var(--tds-color-fg-subtle)' }}>
                      {m.isComponentSet ? 'Component Set' : 'Component'} · {variantCount(m).toLocaleString()} variants
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--tds-color-fg-muted)', margin: '6px 0 10px' }}>{m.description}</p>
                  <div>
                    {m.variantProps.map((v) =>
                      chip(`${v.label}: ${v.options.length}`, 'var(--tds-color-brand-subtle)', 'var(--tds-color-brand-subtleFg)'),
                    )}
                    {m.states.length > 1 &&
                      chip(`State: ${m.states.length}`, 'var(--tds-color-info-subtle)', 'var(--tds-color-info-subtleFg)')}
                    {(m.componentProps ?? []).map((p) =>
                      chip(`${p.name} (${p.figmaType})`, 'var(--tds-color-bg-subtle)', 'var(--tds-color-fg-muted)'),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  },
};
