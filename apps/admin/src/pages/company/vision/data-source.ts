// 비전·미션 데이터 소스 어댑터 (A41 소유 — apps/admin/src/pages/company/vision/**)
//
// [백엔드 연동 지점] store 의 fetch/save 본문이 프론트 ↔ 백엔드 계약이다. 지금은 픽스처.
import { createDocumentStore } from '../_shared/document';
import type { VisionDoc } from './types';

const VISION_SEED: VisionDoc = {
  vision: '공간의 가능성을 넓혀 모두가 더 나은 일상을 누리게 한다.',
  mission: '데이터와 디자인으로 공간 기획의 기준을 세우고, 고객의 성공을 함께 만든다.',
  coreValues: [
    { title: '정직', description: '고객과 동료에게 사실을 있는 그대로 전한다.' },
    { title: '전문성', description: '맡은 일을 끝까지 책임지고 최고의 결과로 증명한다.' },
    { title: '협력', description: '경계를 넘어 함께 더 큰 가치를 만든다.' },
  ],
};

export const visionKey = ['company', 'vision'] as const;

// TODO(backend): GET /api/company/vision  ·  PUT /api/company/vision
export const visionStore = createDocumentStore<VisionDoc>('vision', VISION_SEED);
