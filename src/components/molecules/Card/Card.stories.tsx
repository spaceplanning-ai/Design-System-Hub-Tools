import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { cardMeta } from './Card.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Text } from '../../atoms/Text';
import { Button } from '../../atoms/Button';
import { Avatar } from '../../atoms/Avatar';
import { IconButton } from '../../atoms/IconButton';
import { Icon } from '../../atoms/Icon';
import { Image } from '../../atoms/Image';

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: metaParameters(cardMeta),
  argTypes: argTypesFromMeta(cardMeta),
  args: argsFromMeta(cardMeta),
  decorators: [(Story) => <div style={{ maxWidth: 360 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <Card.Header
        media={<Avatar name="Ada Lovelace" />}
        title="Ada Lovelace"
        subtitle="Product Designer"
        action={<IconButton label="More" icon={<Icon name="more-horizontal" size="sm" />} />}
      />
      <Card.Body>
        <Text tone="muted">
          Cards compose a media header, body and footer using the shared padding + surface tokens.
        </Text>
      </Card.Body>
      <Card.Footer>
        <Button size="sm">Follow</Button>
        <Button size="sm" variant="ghost" tone="neutral">
          Message
        </Button>
      </Card.Footer>
    </Card>
  ),
};

export const Interactive: Story = {
  render: (args) => (
    <Card {...args} interactive variant="outlined">
      <Card.Body>
        <Text variant="h4">Interactive card</Text>
        <Text tone="muted">Hover and focus me — try Tab + Enter.</Text>
      </Card.Body>
    </Card>
  ),
};

/** Selectable cards — one selected, one not. */
export const Selectable: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-3)' }}>
      <Card interactive selected variant="outlined">
        <Card.Body>
          <Text variant="h4">Selected plan</Text>
          <Text tone="muted">This card is currently selected.</Text>
        </Card.Body>
      </Card>
      <Card interactive variant="outlined">
        <Card.Body>
          <Text variant="h4">Other plan</Text>
          <Text tone="muted">Click to select this card instead.</Text>
        </Card.Body>
      </Card>
    </div>
  ),
};

/** Footer content aligned to the end. */
export const FooterAligned: Story = {
  render: (args) => (
    <Card {...args}>
      <Card.Body>
        <Text tone="muted">Footer actions are pushed to the trailing edge.</Text>
      </Card.Body>
      <Card.Footer justify="end">
        <Button size="sm" variant="ghost" tone="neutral">
          Cancel
        </Button>
        <Button size="sm">Save</Button>
      </Card.Footer>
    </Card>
  ),
};

/** Type A/B/C — layout presets (vertical · horizontal · overlay). */
export const Types: Story = {
  decorators: [(Story) => <div style={{ maxWidth: 640 }}>{Story()}</div>],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--tds-space-5)' }}>
      {/* Type A — vertical: full-bleed media, padded content stacked below. */}
      <Card type="A">
        <Card.Media>
          <Image src="https://picsum.photos/seed/a/640/240" alt="" ratio="16:9" radius="none" />
        </Card.Media>
        <Card.Header title="Type A — Vertical" subtitle="Media on top, content stacked below" />
        <Card.Body>
          <Text tone="muted">
            The vertical preset reads top-to-bottom — image, heading, supporting copy, then actions.
          </Text>
        </Card.Body>
        <Card.Footer>
          <Button size="sm">Open</Button>
        </Card.Footer>
      </Card>

      {/* Type B — horizontal: media beside a vertically-centered content column. */}
      <Card type="B">
        <Card.Media>
          <Image src="https://picsum.photos/seed/b/320/320" alt="" ratio="square" radius="none" />
        </Card.Media>
        <div>
          <Card.Header title="Type B — Horizontal" subtitle="Compact title beside the media" />
          <Card.Footer>
            <Button size="sm" variant="soft">
              Details
            </Button>
          </Card.Footer>
        </div>
      </Card>

      {/* Type C — overlay: hero title over a media background with a scrim. */}
      <Card type="C" padding="lg">
        <Card.Media>
          <Image src="https://picsum.photos/seed/c/640/320" alt="" radius="none" />
        </Card.Media>
        <Card.Header title="Type C — Overlay" subtitle="Large title over a media background" />
      </Card>
    </div>
  ),
};
