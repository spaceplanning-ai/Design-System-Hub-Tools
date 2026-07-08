import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import { formFieldMeta } from './FormField.meta';
import { argTypesFromMeta, argsFromMeta, metaParameters } from '@core/storybook';
import { Input } from '../../atoms/Input';
import { Combobox } from '../Combobox';
import { DatePicker } from '../DatePicker';

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: metaParameters(formFieldMeta),
  argTypes: argTypesFromMeta(formFieldMeta),
  args: { ...argsFromMeta(formFieldMeta), label: 'Email', hint: 'We never share it.' },
  decorators: [(Story) => <div style={{ maxWidth: 380 }}>{Story()}</div>],
};
export default meta;

type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  render: (a) => (
    <FormField {...a}>
      <Input placeholder="you@example.com" />
    </FormField>
  ),
};

/** Label + input only — no helper/error line below. */
export const LabelOnly: Story = {
  render: (a) => (
    <FormField {...a} hint={undefined}>
      <Input placeholder="you@example.com" />
    </FormField>
  ),
};

// FormField now forwards `status="error"` to the control automatically — no need
// to set it on the Input by hand. The field paints red and the message shows below.
export const WithError: Story = {
  render: (a) => (
    <FormField {...a} error="Please enter a valid email." hint={undefined}>
      <Input defaultValue="invalid@" />
    </FormField>
  ),
};

export const Required: Story = {
  render: (a) => (
    <FormField {...a} required label="Full name">
      <Input placeholder="Jane Doe" />
    </FormField>
  ),
};

export const WithSuccess: Story = {
  render: (a) => (
    <FormField {...a} success="Looks good!" hint={undefined}>
      <Input status="success" defaultValue="jane@example.com" />
    </FormField>
  ),
};

export const OptionalAndHint: Story = {
  render: (a) => (
    <FormField {...a} optional labelHint="We'll never share this">
      <Input placeholder="you@example.com" />
    </FormField>
  ),
};

/** FormField wires label + error into a Combobox — id, aria and error styling all forwarded. */
export const ComboboxField: Story = {
  render: (a) => (
    <FormField {...a} label="도시" error="도시를 선택해 주세요." hint={undefined}>
      <Combobox
        options={[
          { label: '서울', value: 'seoul' },
          { label: '부산', value: 'busan' },
          { label: '제주', value: 'jeju' },
        ]}
      />
    </FormField>
  ),
};

/** Same wrapper works for a DatePicker — label above, helper below. */
export const DateField: Story = {
  render: (a) => (
    <FormField {...a} label="예약일" hint="영업일 기준 3일 후부터 선택할 수 있어요.">
      <DatePicker defaultValue="2026-07-10" />
    </FormField>
  ),
};
