import { defineComponentMeta } from '../../../core/defineComponent';

export const datePickerMeta = defineComponentMeta({
  name: 'DatePicker',
  slug: 'date-picker',
  category: 'molecule',
  description:
    'Single-date field with a calendar popup. Composes the Input with a month grid — pick by click or type an ISO date (YYYY-MM-DD). Min/max bounds disable out-of-range days.',
  tags: ['form', 'date', 'calendar', 'composition'],
  variantProps: [
    { name: 'variant', label: 'Type', options: ['outline', 'filled'], default: 'outline' },
    { name: 'size', label: 'Size', options: ['sm', 'md', 'lg'], default: 'md' },
  ],
  componentProps: [
    { name: 'placeholder', type: 'text', default: 'YYYY-MM-DD', figmaType: 'TEXT' },
    {
      name: 'value',
      type: 'text',
      figmaType: 'TEXT',
      description: 'Selected date as ISO YYYY-MM-DD (controlled).',
    },
    { name: 'min', type: 'text', figmaType: 'TEXT', description: 'Earliest selectable ISO date.' },
    { name: 'max', type: 'text', figmaType: 'TEXT', description: 'Latest selectable ISO date.' },
    { name: 'disabled', type: 'boolean', default: false, figmaType: 'BOOLEAN' },
  ],
  states: ['default', 'hover', 'focus', 'disabled', 'error'],
  a11y: {
    role: 'dialog',
    keyboard: [
      'Enter / Space on trigger icon: open',
      'Escape: close',
      'Type an ISO date directly in the field',
    ],
    notes: [
      'Field is `role="combobox"` + `aria-haspopup="dialog"`; the calendar is a labelled `role="dialog"` with a `role="grid"` of days.',
      'Selected day has `aria-selected`; today is marked; out-of-range days are `aria-disabled`.',
    ],
  },
  responsive: 'Field fills container width; the calendar pops below and is fixed-width.',
  figma: {
    layoutMode: 'VERTICAL',
    itemSpacing: 'space.2',
    cornerRadius: 'radius.control',
    fill: 'color.field.bg',
    strokeColor: 'color.field.border',
    strokeWidth: 'border.width.1',
  },
});
