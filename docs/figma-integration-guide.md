# Figma 양방향 연동 가이드

이 문서는 사람이 직접 수행해야 하는 Figma ↔ Storybook 연동 절차를 정리한다.

## 1. 개요: 방향 2가지

| 방향 | 도구 | 상태 |
|---|---|---|
| Figma → Storybook | `@storybook/addon-designs` (스토리에 Figma Design 탭 임베드) | 코드 완료 (W12) |
| Storybook → Figma | Chromatic 배포 후 Figma 플러그인으로 스토리 임포트 | 코드 준비 완료 (W13) — 배포·연결은 사람 단계 |

## 2. Figma → Storybook 절차

1. `@storybook/addon-designs`는 이미 설치·설정되어 있다 (`.storybook/main.ts`의 addons 참조).
2. 모든 스토리의 `parameters.design.url`은 현재 placeholder다:
   - 공통 파일 URL 상수: [src/shared/figma.ts](../src/shared/figma.ts)의 `FIGMA_FILE`
     (`https://www.figma.com/file/REPLACE_ME/Design-System`)
   - 각 스토리는 `${FIGMA_FILE}?node-id=0-1` 형태를 사용한다.
3. 교체 방법:
   1. Figma에서 대상 파일을 열고 파일 URL을 복사해 `FIGMA_FILE` 값을 교체한다.
   2. 각 스토리에 대응하는 Figma 프레임을 선택 → 우클릭 → *Copy link to selection* →
      URL의 `node-id` 값을 해당 스토리의 `design.url`에 반영한다.
4. Storybook 실행 후 임의 스토리에서 **Design** 탭이 보이고 Figma 프레임이 임베드되면 완료.

## 3. Storybook → Figma 절차 — 3개 플러그인 비교

### 3-1. Storybook Connect (Chromatic)

- Chromatic 배포가 선행되어야 하며 **Public 프로젝트**가 필요하다. Private 프로젝트는
  Figma 플러그인에서 접근하지 못하는 한계가 있다.
- Chromatic 도메인 형식만 허용된다: `https://<branch>--<projectId>.chromatic.com`
- 절차: Chromatic 배포 → Figma에서 Storybook Connect 플러그인 실행 → Chromatic 계정
  연결 → 스토리 URL 붙여넣기 → 프레임에 링크.

### 3-2. Anima

- 베타 토큰이 필요하고 설정이 복잡하다 → **비권장** (사용자 판단 기록).

### 3-3. story.to.design ★권장

- 제약이 적고 간단하다. 도달 가능한 Storybook URL(Public 배포 또는 로컬 터널)만 있으면 된다.
- 절차: 플러그인 실행 → Storybook URL 연결 → *Select story* → *args import* →
  *Add to canvas*.

## 4. 권장 워크플로 요약

1. **story.to.design 우선** 사용.
2. 사내 Private Storybook이면 Storybook Connect는 **Public 전환이 필요**하다는 점을 감안한다.

## 5. 트러블슈팅

- **"Failed to fetch dynamically imported module"**: 플러그인 팝업을 닫고 재시도한다.
- Design 탭이 비어 있으면 `design.url`의 `node-id`가 실제 프레임을 가리키는지 확인한다.
- Chromatic 빌드 실패 시 `pnpm build:tw`가 선행 실행되었는지 확인한다
  (`tailwind.generated.css` 필요).
