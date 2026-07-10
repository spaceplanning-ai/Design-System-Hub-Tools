import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-designs"
  ],
  "framework": {
    "name": "@storybook/react-vite",
    "options": {}
  },
  "docs": {
    "autodocs": "tag"
  },
  // 빌드 산출물(storybook-static)이 프로젝트 루트에 생성되므로 dev 워처에서 제외한다.
  // 제외하지 않으면 build-storybook 실행 중 dev 서버가 불필요한 page reload를 반복한다.
  async viteFinal(config) {
    config.server = {
      ...config.server,
      watch: {
        ...config.server?.watch,
        ignored: ['**/storybook-static/**', '**/chromatic-build/**'],
      },
    };
    return config;
  }
};
export default config;