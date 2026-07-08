import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { toDataAttrs } from '@core/defineComponent';
import { Divider } from '../../atoms/Divider';
import { SocialLoginButton } from '../../atoms/SocialLoginButton';
import type {
  SocialProvider,
  SocialLoginButtonSize,
  SocialLoginButtonShape,
} from '../../atoms/SocialLoginButton';
import { socialLoginMeta } from './SocialLogin.meta';
import './SocialLogin.css';

/** Layout preset — A: full-width labelled stack · B: compact icon grid. */
export type SocialLoginType = 'A' | 'B';

export interface SocialLoginProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Layout preset. A: stacked full-width buttons · B: circular icon grid. */
  type?: SocialLoginType;
  /** Primary providers shown as full-width labelled buttons. */
  providers?: SocialProvider[];
  /** Secondary providers shown as circular icon-only buttons under the divider. */
  otherProviders?: SocialProvider[];
  /** Divider caption above the secondary row. Set `showOthers={false}` to hide the row entirely. */
  dividerLabel?: ReactNode;
  /** Show the secondary icon-only row. */
  showOthers?: boolean;
  /** Per-provider label overrides (falls back to each provider’s default). */
  labels?: Partial<Record<SocialProvider, string>>;
  size?: SocialLoginButtonSize;
  shape?: SocialLoginButtonShape;
  /** Disable every provider button (e.g. while a request is in flight). */
  disabled?: boolean;
  /** Show a spinner on the given provider and disable the rest. */
  loadingProvider?: SocialProvider;
  /** Fired when any provider button is activated. */
  onProviderSelect?: (provider: SocialProvider, event: MouseEvent<HTMLButtonElement>) => void;
}

export function SocialLogin({
  type = 'A',
  providers = ['kakao', 'naver', 'apple'],
  otherProviders = ['facebook', 'email'],
  dividerLabel = '다른 계정으로 계속하기',
  showOthers = true,
  labels,
  size = 'md',
  shape = 'rounded',
  disabled = false,
  loadingProvider,
  onProviderSelect,
  className,
  ...rest
}: SocialLoginProps) {
  const hasOthers = showOthers && otherProviders.length > 0;
  const busy = loadingProvider != null;
  const isDisabled = (p: SocialProvider) => disabled || (busy && loadingProvider !== p);

  const containerProps = {
    className: cx('tds-social-login', className),
    role: 'group' as const,
    'aria-label': '소셜 로그인',
    ...toDataAttrs(socialLoginMeta, { type, size, shape }),
    ...rest,
  };

  // Type B — every provider as a circular icon-only button in a centered grid.
  if (type === 'B') {
    const all = [...providers, ...(showOthers ? otherProviders : [])];
    return (
      <div {...containerProps}>
        <div className="tds-social-login__grid">
          {all.map((p) => (
            <SocialLoginButton
              key={p}
              provider={p}
              size={size}
              iconOnly
              label={labels?.[p]}
              loading={loadingProvider === p}
              disabled={isDisabled(p)}
              onClick={(e) => onProviderSelect?.(p, e)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Type A — full-width labelled stack + optional secondary icon row.
  return (
    <div {...containerProps}>
      <div className="tds-social-login__primary">
        {providers.map((p) => (
          <SocialLoginButton
            key={p}
            provider={p}
            size={size}
            shape={shape}
            label={labels?.[p]}
            fullWidth
            loading={loadingProvider === p}
            disabled={isDisabled(p)}
            onClick={(e) => onProviderSelect?.(p, e)}
          />
        ))}
      </div>

      {hasOthers && (
        <>
          {dividerLabel != null && <Divider label={dividerLabel} tone="subtle" />}
          <div className="tds-social-login__others">
            {otherProviders.map((p) => (
              <SocialLoginButton
                key={p}
                provider={p}
                size={size}
                iconOnly
                label={labels?.[p]}
                loading={loadingProvider === p}
                disabled={isDisabled(p)}
                onClick={(e) => onProviderSelect?.(p, e)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
