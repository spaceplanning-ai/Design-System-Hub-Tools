import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Drawer } from './Drawer';
import { drawerMeta } from './Drawer.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';
import { Text } from '../../atoms/Text';

const meta: Meta<typeof Drawer> = {
  title: 'Organisms/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: { ...metaParameters(drawerMeta), layout: 'centered' },
  argTypes: argTypesFromMeta(drawerMeta),
  args: { side: 'right', size: 'md', title: 'Filters', closable: true },
};
export default meta;

type Story = StoryObj<typeof Drawer>;

const DrawerDemo = (args: React.ComponentProps<typeof Drawer>) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <Button tone="brand" onClick={() => setOpen(false)}>
            Apply
          </Button>
        }
      >
        <Text tone="muted">Drawer content slides in from the {args.side} edge.</Text>
      </Drawer>
    </>
  );
};

export const Playground: Story = { render: DrawerDemo };

/** Type A — flush, edge-anchored panel (default). */
export const TypeA: Story = { render: (a) => DrawerDemo({ ...a, type: 'A' }) };
/** Type B — floating inset card. */
export const TypeB: Story = { render: (a) => DrawerDemo({ ...a, type: 'B' }) };
/** Type C — full (fills the cross axis). */
export const TypeC: Story = { render: (a) => DrawerDemo({ ...a, type: 'C' }) };

/** Slides up from the bottom edge. */
export const BottomSheet: Story = {
  render: (a) => DrawerDemo({ ...a, side: 'bottom', title: 'Filters' }),
};
/** Slides down from the top edge. */
export const TopSheet: Story = {
  render: (a) => DrawerDemo({ ...a, side: 'top', title: 'Notifications' }),
};
