import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { socialLoginButtonMeta } from './SocialLoginButton.meta';
import { brandMarks, providerLabels } from './brand-marks';
import type { SocialProvider } from './brand-marks';
import './SocialLoginButton.css';

export type { SocialProvider };

export type SocialLoginButtonSize = 'sm' | 'md' | 'lg';
export type SocialLoginButtonShape = 'rounded' | 'pill' | 'square';

export interface SocialLoginButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'color'
> {
  /** OAuth provider — selects the brand palette and logo mark. */
  provider: SocialProvider;
  size?: SocialLoginButtonSize;
  shape?: SocialLoginButtonShape;
  /** CTA text. Defaults to the provider’s localized label. */
  label?: string;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Render as a circular mark-only button; the label becomes the `aria-label`. */
  iconOnly?: boolean;
  /** Show a spinner and block interaction. */
  loading?: boolean;
}

export const SocialLoginButton = forwardRef<HTMLButtonElement, SocialLoginButtonProps>(
  function SocialLoginButton(
    {
      provider,
      size = 'md',
      shape = 'rounded',
      label,
      fullWidth = true,
      iconOnly = false,
      loading = false,
      disabled,
      className,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const dataAttrs = toDataAttrs(socialLoginButtonMeta, { provider, size, shape });
    const text = label ?? providerLabels[provider];

    return (
      <button
        ref={ref}
        type={type}
        className={cx(
          'tds-social-btn',
          fullWidth && !iconOnly && 'tds-social-btn--full',
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-label={iconOnly ? text : undefined}
        data-loading={loading || undefined}
        data-icon-only={iconOnly || undefined}
        {...dataAttrs}
        {...rest}
      >
        {loading && <span className="tds-social-btn__spinner" aria-hidden="true" />}
        <span className="tds-social-btn__mark" aria-hidden="true">
          {brandMarks[provider]}
        </span>
        {!iconOnly && <span className="tds-social-btn__label">{text}</span>}
      </button>
    );
  },
);
