// 발송 템플릿 폼 검증 규칙 (검증의 정본은 이 zod 스키마다)
//
// 채널별로 요건이 갈린다: 이메일/알림톡은 제목 필수, 알림톡은 카카오 심사 규칙(변수 ≤40개·변수 전용
// 본문 금지)을 미리 막는다(반려를 사전 예방).
import * as z from 'zod/mini';

import { requiredText } from '../../../shared/crud';
import {
  countVariables,
  htmlToPlainText,
  isHtmlBodyEmpty,
  isVariableOnlyBody,
  TEMPLATE_BODY_MAX,
  TEMPLATE_NAME_MAX,
  TEMPLATE_TITLE_MAX,
  TEMPLATE_VARIABLE_MAX,
  usesTitle,
} from '../_shared/messaging';

export const templateSchema = z
  .object({
    name: requiredText('템플릿명', TEMPLATE_NAME_MAX),
    channel: z.enum(['sms', 'email', 'alimtalk']),
    title: z.string(),
    // 본문 규칙은 채널마다 다르다(이메일은 HTML) — 아래 .check 가 정본. 여기서는 형태만 받는다.
    body: z.string(),
    approvalStatus: z.enum(['draft', 'inspecting', 'approved', 'rejected']),
    rejectReason: z.string(),
  })
  .check((ctx) => {
    // 본문 필수/길이 — 이메일은 리치 텍스트(HTML)라 태그를 걷어낸 '사람이 보는 글자'로 센다.
    // SMS·알림톡은 평문이라 그대로 센다. (SMS 바이트 한도는 발송 시점 규칙이라 여기서 막지 않는다.)
    const isEmail = ctx.value.channel === 'email';
    const empty = isEmail ? isHtmlBodyEmpty(ctx.value.body) : ctx.value.body.trim() === '';
    if (empty) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.body,
        path: ['body'],
        message: '본문을 입력하세요.',
      });
    } else {
      const length = isEmail
        ? htmlToPlainText(ctx.value.body).length
        : ctx.value.body.trim().length;
      if (length > TEMPLATE_BODY_MAX) {
        ctx.issues.push({
          code: 'custom',
          input: ctx.value.body,
          path: ['body'],
          message: `본문은 ${String(TEMPLATE_BODY_MAX)}자를 넘을 수 없습니다.`,
        });
      }
    }
  })
  .check((ctx) => {
    // 제목 — 이메일 제목·알림톡 강조표기는 필수. SMS 는 제목이 없다.
    if (usesTitle(ctx.value.channel) && ctx.value.title.trim() === '') {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.title,
        path: ['title'],
        message: '제목을 입력하세요.',
      });
    }
    if (ctx.value.title.trim().length > TEMPLATE_TITLE_MAX) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.title,
        path: ['title'],
        message: `제목은 ${String(TEMPLATE_TITLE_MAX)}자를 넘을 수 없습니다.`,
      });
    }
  })
  .check((ctx) => {
    // 알림톡 심사 규칙 — 변수 개수 상한·변수 전용 본문 금지(사전 예방).
    if (ctx.value.channel !== 'alimtalk') return;
    if (countVariables(ctx.value.body) > TEMPLATE_VARIABLE_MAX) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.body,
        path: ['body'],
        message: `알림톡 변수는 최대 ${String(TEMPLATE_VARIABLE_MAX)}개까지 사용할 수 있습니다.`,
      });
    }
    if (isVariableOnlyBody(ctx.value.body)) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.body,
        path: ['body'],
        message: '본문을 변수만으로 구성할 수 없습니다. 안내 문구를 추가하세요.',
      });
    }
  });

export type TemplateFormValues = z.infer<typeof templateSchema>;
