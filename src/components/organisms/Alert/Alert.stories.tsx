import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';
import { alertMeta } from './Alert.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';

const meta: Meta<typeof Alert> = {
  title: 'Organisms/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: metaParameters(alertMeta),
  argTypes: argTypesFromMeta(alertMeta),
  args: {
    ...argsFromMeta(alertMeta),
    title: 'Update available',
    children: 'A new version is ready to install.',
  },
  decorators: [(Story) => <div style={{ maxWidth: 520 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Playground: Story = {};

/** Type A/B/C — layout presets (inline · banner · prominent). */
export const Types: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-4)' }}>
      <Alert {...a} type="A" tone="info" title="Type A — Inline">
        Standard inline alert.
      </Alert>
      <Alert {...a} type="B" tone="warning" title="Type B — Banner" closable>
        Full-width, edge-to-edge banner.
      </Alert>
      <Alert {...a} type="C" tone="danger" title="Type C — Prominent">
        Prominent alert with a left accent bar.
      </Alert>
    </div>
  ),
};

export const Tones: Story = {
  render: (a) => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      {(['info', 'success', 'warning', 'danger', 'neutral'] as const).map((t) => (
        <Alert key={t} {...a} tone={t} title={t} closable>
          {`This is a ${t} alert.`}
        </Alert>
      ))}
    </div>
  ),
};

export const WithAction: Story = {
  args: {
    tone: 'warning',
    action: (
      <Button size="sm" tone="warning">
        Review
      </Button>
    ),
  },
};
