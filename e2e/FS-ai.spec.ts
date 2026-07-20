import { test } from '@playwright/test';
import { seedAuthenticated } from './support/app';
const OUT =
  'C:/Users/ADMIN-F/AppData/Local/Temp/claude/c--Users-ADMIN-F-Desktop-Dev-Design-System-Admin-Hub-Tools/d70865e0-698d-4c07-8d43-e8cfac30214c/scratchpad';

test('AI 메뉴가 사이드바에 보이나', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 1000 });
  await seedAuthenticated({ page });
  await page.goto('/dashboard');
  await page.waitForTimeout(1000);
  const nav = page.getByRole('navigation', { name: '주 내비게이션' });
  console.log('사이드바 항목:', (await nav.innerText()).split('\n').filter(Boolean).join(' | '));
  console.log('AI 에이전트 보임?', await nav.getByText('AI 에이전트').count());

  await page.goto('/ai/chat');
  await page.waitForTimeout(1500);
  const denied = await page.getByText(/권한|접근할 수 없|없습니다/).count();
  console.log('/ai/chat 접근 차단?', denied);
  await page.screenshot({ path: `${OUT}/ai-chat.png` });
});
