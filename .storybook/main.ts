import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { resolve } from 'node:path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: { disableTelemetry: true },
  typescript: {
    reactDocgen: 'react-docgen',
  },
  async viteFinal(cfg) {
    return mergeConfig(cfg, {
      resolve: {
        alias: {
          '@': resolve(__dirname, '../src'),
          '@tokens': resolve(__dirname, '../src/tokens'),
          '@core': resolve(__dirname, '../src/core'),
          '@components': resolve(__dirname, '../src/components'),
        },
      },
    });
  },
};

export default config;
