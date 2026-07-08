import type { ReactNode } from 'react';

/**
 * OAuth provider identifiers. Each maps 1:1 to a Figma variant value and to a
 * brand palette + logo mark below. Keep this list in sync with the `provider`
 * variant options in `SocialLoginButton.meta.ts`.
 */
export type SocialProvider = 'kakao' | 'naver' | 'apple' | 'google' | 'facebook' | 'email';

export const socialProviders: SocialProvider[] = [
  'kakao',
  'naver',
  'apple',
  'google',
  'facebook',
  'email',
];

/** Default Korean CTA label per provider. Overridable via the `label` prop. */
export const providerLabels: Record<SocialProvider, string> = {
  kakao: '카카오톡으로 계속하기',
  naver: '네이버로 계속하기',
  apple: 'Apple로 계속하기',
  google: 'Google로 계속하기',
  facebook: 'Facebook으로 계속하기',
  email: '이메일로 계속하기',
};

/**
 * Brand logo marks. Each is a self-contained <svg> with its own viewBox so it
 * can be dropped anywhere. Monochrome marks use `currentColor` (the button sets
 * the correct on-brand color); Google keeps its official four colors regardless
 * of the surface. A Figma plugin can register each mark as a vector node.
 */
export const brandMarks: Record<SocialProvider, ReactNode> = {
  kakao: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.52 2 10.86c0 2.79 1.86 5.24 4.66 6.63-.15.52-.96 3.32-.99 3.54 0 0-.02.18.1.25.11.07.25.02.25.02.32-.05 3.72-2.44 4.34-2.86.53.08 1.08.12 1.64.12 5.52 0 10-3.52 10-7.86C22 6.52 17.52 3 12 3Z"
      />
    </svg>
  ),
  naver: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M15.28 12.86 8.44 3H3v18h5.72v-9.86L15.56 21H21V3h-5.72v9.86Z" />
    </svg>
  ),
  apple: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.05 12.53c-.03-2.6 2.12-3.84 2.22-3.9-1.21-1.78-3.1-2.02-3.77-2.05-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.46 7.81 1.3 10.37.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.39.81 1.4-.02 2.28-1.27 3.14-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.02-2.72-1.04-2.75-4.13ZM14.5 4.92c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-3 1.54-.66.76-1.24 1.98-1.08 3.15 1.14.09 2.3-.58 3.02-1.44Z"
      />
    </svg>
  ),
  google: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M15.12 8.03h1.88V5.1c-.33-.05-1.44-.15-2.74-.15-2.71 0-4.57 1.66-4.57 4.71V12H7.08v3.28h2.61V24h3.2v-8.72h2.5l.4-3.28h-2.9V9.98c0-.95.26-1.6 1.75-1.6Z"
      />
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4 7 8 5 8-5"
      />
    </svg>
  ),
};
