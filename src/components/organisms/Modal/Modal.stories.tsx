import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal } from './Modal';
import { modalMeta } from './Modal.meta';
import { argTypesFromMeta, metaParameters } from '@core/storybook';
import { Button } from '../../atoms/Button';
import { Text } from '../../atoms/Text';

const meta: Meta<typeof Modal> = {
  title: 'Organisms/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: { ...metaParameters(modalMeta), layout: 'centered' },
  argTypes: argTypesFromMeta(modalMeta),
  args: { size: 'md', placement: 'center', title: 'Delete project', closable: true },
};
export default meta;

type Story = StoryObj<typeof Modal>;

const ModalDemo = (args: React.ComponentProps<typeof Modal>) => {
  const [open, setOpen] = useState(false);
  const label =
    args.type === 'B' ? 'Open bottom sheet' : args.type === 'C' ? 'Open fullscreen' : 'Open modal';
  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      <Modal
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        description="This action cannot be undone."
        footer={
          <>
            <Button variant="ghost" tone="neutral" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button tone="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      >
        <Text tone="muted">
          Deleting this project removes all of its data permanently. Type the project name to
          confirm in a real app.
        </Text>
      </Modal>
    </>
  );
};

export const Playground: Story = { render: ModalDemo };

/** Type A — centered dialog. */
export const TypeA: Story = { render: (a) => ModalDemo({ ...a, type: 'A' }) };
/** Type B — bottom sheet. */
export const TypeB: Story = { render: (a) => ModalDemo({ ...a, type: 'B' }) };
/** Type B — bottom sheet, anchored to the bottom edge and slides up. */
export const TypeBSheet: Story = {
  args: { type: 'B' },
  render: (a) => ModalDemo({ ...a, type: 'B' }),
};
/** Type C — fullscreen. */
export const TypeC: Story = { render: (a) => ModalDemo({ ...a, type: 'C' }) };
