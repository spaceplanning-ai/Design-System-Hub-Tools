// 스펙 §9 고정 샘플 데이터 — 변경 금지
export const LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

export const sampleData = {
  revenue: [12, 19, 8, 15, 22, 17],
  traffic: [30, 25, 40, 35, 50, 45],
  share: [45, 25, 20, 10],
} as const

export type DatasetKey = keyof typeof sampleData
