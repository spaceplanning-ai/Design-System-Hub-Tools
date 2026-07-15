// 공지사항 폼 검증 규칙 (A41 — ADR-0008 §7.3 집행)
//
// **검증 규칙의 정본은 이 zod 스키마다.** 화면은 판정 결과만 읽는다.
// 진입점은 `zod/mini` 다 (ADR-0008 §7.3 — classic zod +17.5 kB vs mini +4.6 kB).
import * as z from 'zod/mini';

import { BODY_MAX_LENGTH, TITLE_MAX_LENGTH } from './types';

/** 'YYYY-MM-DD' 형식 + 실재하는 날짜인지 (Date 가 2026-02-31 을 3/3 으로 굴리는 것을 막는다) */
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const [y, m, d] = value.split('-').map(Number);
  return date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d;
}

/** 체크 순서 = 에러 우선순위 (resolver 가 필드당 첫 이슈만 싣는다) */
export const noticeSchema = z
  .object({
    title: z.string().check(
      z.refine((value) => value.trim() !== '', { error: '제목을 입력하세요.' }),
      z.refine((value) => value.trim().length <= TITLE_MAX_LENGTH, {
        error: `제목은 ${String(TITLE_MAX_LENGTH)}자를 넘을 수 없습니다.`,
      }),
    ),
    category: z.enum(['notice', 'event', 'maintenance']),
    status: z.enum(['published', 'draft', 'scheduled']),
    pinned: z.boolean(),
    publishedAt: z.string(),
    body: z.string().check(
      z.refine((value) => value.trim() !== '', { error: '본문을 입력하세요.' }),
      z.refine((value) => value.length <= BODY_MAX_LENGTH, {
        error: `본문은 ${String(BODY_MAX_LENGTH)}자를 넘을 수 없습니다.`,
      }),
    ),
  })
  .check((ctx) => {
    // 예약 상태일 때만 게시일이 필수이고, 미래여야 한다 — 임시저장/게시는 날짜를 강제하지 않는다.
    if (ctx.value.status !== 'scheduled') return;
    const raw = ctx.value.publishedAt.trim();
    if (raw === '' || !isRealDate(raw)) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.publishedAt,
        path: ['publishedAt'],
        message: '예약하려면 게시일을 YYYY-MM-DD 형식으로 입력하세요.',
      });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${raw}T00:00:00`).getTime() < today.getTime()) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.publishedAt,
        path: ['publishedAt'],
        message: '예약 게시일은 오늘 이후여야 합니다.',
      });
    }
  });

export type NoticeFormValues = z.infer<typeof noticeSchema>;
