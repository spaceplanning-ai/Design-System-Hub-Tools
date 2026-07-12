import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-designs",
    "@storybook/addon-a11y"
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
  async viteFinal(config, { configType }) {
    // GitHub Pages 프로젝트 사이트는 /<repo>/ 하위 경로로 서빙된다.
    // (예: figam-dev-variable-tools.github.io/Design-System-Hub-Tools/storybook/)
    // 따라서 Storybook base에 저장소 프리픽스가 반드시 포함돼야 에셋(iframe-*.js 등)이
    // 404 없이 로드된다. Actions가 제공하는 GITHUB_REPOSITORY에서 저장소명을 뽑아 자동 구성.
    // (로컬 빌드처럼 env가 없으면 /storybook/로 폴백 → 루트 서빙 시 정상.)
    if (configType === 'PRODUCTION') {
      const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
      config.base = repo ? `/${repo}/storybook/` : '/storybook/';
    }
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