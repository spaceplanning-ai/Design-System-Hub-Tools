import { createElement, forwardRef } from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { textMeta } from './Text.meta';
import './Text.css';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'bodyLg'
  | 'body'
  | 'bodySm'
  | 'label'
  | 'caption'
  | 'code';
export type TextTone =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inverse';
export type TextAlign = 'start' | 'center' | 'end';
export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const DEFAULT_TAG: Record<TextVariant, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  bodyLg: 'p',
  body: 'p',
  bodySm: 'p',
  label: 'span',
  caption: 'span',
  code: 'code',
};

export interface TextProps extends Omit<HTMLAttributes<HTMLElement>, 'color'> {
  variant?: TextVariant;
  tone?: TextTone;
  align?: TextAlign;
  /** Truncate to a single line with an ellipsis. */
  truncate?: boolean;
  /** Clamp to N lines with an ellipsis (multi-line truncation). */
  clamp?: number;
  /** Override the variant's font weight. */
  weight?: TextWeight;
  /** Polymorphic element override. */
  as?: ElementType;
  children?: ReactNode;
}

export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { variant = 'body', tone = 'default', align = 'start', truncate = false, clamp, weight, as, className, style, title, children, ...rest },
  ref,
) {
  const Tag = as ?? DEFAULT_TAG[variant];
  const dataAttrs = toDataAttrs(textMeta, { variant, tone, align });
  const clamped = clamp != null && clamp > 0;
  // Expose the full string to assistive tech / hover when we visually cut it off.
  const autoTitle = (truncate || clamped) && typeof children === 'string' ? children : undefined;

  return createElement(
    Tag,
    {
      ref,
      className: cx(
        'tds-text',
        `tds-text-${variant}`,
        truncate && 'tds-text--truncate',
        clamped && 'tds-text--clamp',
        className,
      ),
      title: title ?? autoTitle,
      'data-weight': weight,
      style: clamped ? { ['--tds-text-clamp' as string]: clamp, ...style } : style,
      ...dataAttrs,
      ...rest,
    },
    children,
  );
});
