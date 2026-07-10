import React from 'react'
import type { Decorator, Preview } from '@storybook/react'
import { ThemeScope } from '../src/shared/ThemeScope'
import type { StylePreset } from '../src/tokens/generated/types'
import 'pretendard/dist/web/static/pretendard.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/700.css'

const withTheme: Decorator = (Story, context) => {
  if (context.parameters.noDsTheme) return <Story />
  return (
    <ThemeScope preset={context.globals.theme as StylePreset}>
      <Story />
    </ThemeScope>
  )
}

const preview: Preview = {
  globalTypes: {
    theme: {
      description: '스타일 프리셋 (디자인 토큰)',
      toolbar: {
        title: 'Preset',
        items: ['bootstrap', 'tailwind', 'toss'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'toss' },
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
