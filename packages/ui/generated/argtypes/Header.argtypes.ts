// AUTO-GENERATED from contracts/Header.contract.json@1.0.0 — DO NOT EDIT (pnpm codegen)

/** Storybook argTypes — 계약에서 생성. Story 파일에서 spread 하여 사용한다. */
export const HeaderArgTypes = {
  title: {
    description: '지금 화면의 이름 — <h1> 이 된다. 앱에서 가장 많이 보이는 제목이며 라우트마다 바뀐다. 어드민은 nav-config 의 findCoveringLeaf 로 경로에서 유도하는데, 그 판정은 DS 밖의 일이라 결과 문자열만 받는다',
    control: {
      type: 'text',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'string',
      },
    },
  },
  eyebrow: {
    description: '제목 위에 붙는 작은 문구 — 브랜드·역할 같은 상위 맥락(\'LOGO · 관리자\'). 빈 문자열이면 그 줄을 아예 그리지 않는다(빈 <p> 를 남기면 제목이 아래로 밀린다)',
    control: {
      type: 'text',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'string',
      },
      defaultValue: {
        summary: '""',
      },
    },
  },
  meta: {
    description: '오른쪽 끝 슬롯 — 오늘 날짜·로그인 계정처럼 화면과 무관한 상시 정보가 온다. 날짜 포맷도 세션 조회도 앱의 일이라 DS 는 자리만 준다. 주지 않으면 제목이 폭을 다 쓴다',
    control: {
      type: 'text',
    },
    table: {
      category: 'Props',
      type: {
        summary: 'ReactNode',
      },
      defaultValue: {
        summary: 'null',
      },
    },
  },
} as const;

/**
 * 커버리지 검증용 조합 행렬 — enum prop 값 곱 × boolean prop 당 2.
 * 총 1개 조합. Story 커버리지는 이 행렬 대비 100%여야 G5 통과.
 *
 * **states 는 여기 없다** — contract-test 의 combinationMatrixSize() 와 같은 식이어야 하고,
 * state 커버리지는 커버리지 축2(contract-states)가 단언 있는 테스트로 따로 강제한다.
 */
export const combinationMatrix = [
  {  },
] as const;

export type HeaderCombination = (typeof combinationMatrix)[number];
