// AUTO-GENERATED from docs/docs-content.json — 플러그인 내장 문서 기본값.
// DO NOT EDIT. 재생성: pnpm --dir figma-plugin sync:docs (build 시 자동)
import type { DocsContent } from './generators/docs'
export const DOCS_CONTENT: DocsContent = {
  "sections": [
    {
      "id": "getting-started",
      "order": 0,
      "title": "시작하기",
      "figmaPage": "0. 시작하기",
      "storybookTitle": "0. 시작하기",
      "blocks": [
        {
          "type": "heading",
          "text": "시작하기"
        },
        {
          "type": "paragraph",
          "text": "이 프로젝트는 pnpm 전용입니다(npm 사용 금지). Node 20 또는 22가 필요하며, pnpm은 corepack으로 활성화합니다."
        },
        {
          "type": "paragraph",
          "text": "1) 설치 — corepack으로 pnpm 활성화 후 의존성 설치:"
        },
        {
          "type": "code",
          "text": "corepack enable\npnpm install"
        },
        {
          "type": "paragraph",
          "text": "2) 실행 — 문서 사이트(Storybook)를 로컬에서 띄웁니다 (http://localhost:6006):"
        },
        {
          "type": "code",
          "text": "pnpm storybook"
        },
        {
          "type": "paragraph",
          "text": "3) 검증·빌드 — 타입 게이트와 통합 빌드:"
        },
        {
          "type": "code",
          "text": "pnpm typecheck\npnpm build-storybook"
        },
        {
          "type": "paragraph",
          "text": "그 외 자주 쓰는 스크립트:"
        },
        {
          "type": "code",
          "text": "pnpm build:tokens              # tokens/*.json → CSS 변수·TS 타입\npnpm build:manifest            # Figma 매니페스트 직렬화 + 왕복 검증\npnpm --dir figma-plugin build  # Figma 플러그인 번들"
        },
        {
          "type": "callout",
          "text": "우측 상단 툴바 Preset(Bootstrap/Tailwind/TOSS)으로 DS 컴포넌트의 토큰 스타일을 실시간 전환할 수 있습니다. 모든 색·타이포 값은 tokens/ JSON에서만 관리됩니다."
        }
      ]
    },
    {
      "id": "colors",
      "order": 1,
      "title": "컬러",
      "figmaPage": "1. 컬러",
      "storybookTitle": "1. 컬러",
      "blocks": [
        {
          "type": "heading",
          "text": "컬러"
        },
        {
          "type": "paragraph",
          "text": "메인·서브·에러·성공·경고 5개 의미 색상과 배경·서브 배경·텍스트·보더 색을 제공합니다."
        },
        {
          "type": "colorGrid",
          "tokens": [
            "primary",
            "secondary",
            "error",
            "success",
            "warning",
            "bg",
            "bgSubtle",
            "text",
            "border"
          ]
        }
      ]
    },
    {
      "id": "typography",
      "order": 2,
      "title": "타이포그래피",
      "figmaPage": "2. 타이포그래피",
      "storybookTitle": "2. 타이포그래피",
      "blocks": [
        {
          "type": "heading",
          "text": "타이포그래피"
        },
        {
          "type": "paragraph",
          "text": "프리셋별 폰트 패밀리와 6단계 사이즈 스케일을 사용합니다."
        },
        {
          "type": "typeScale",
          "sizes": [
            "xs",
            "sm",
            "md",
            "lg",
            "xl",
            "xxl"
          ]
        }
      ]
    },
    {
      "id": "components",
      "order": 3,
      "title": "컴포넌트",
      "figmaPage": "3. 컴포넌트",
      "storybookTitle": "3. 컴포넌트",
      "blocks": [
        {
          "type": "heading",
          "text": "컴포넌트"
        },
        {
          "type": "componentDemo",
          "component": "Button"
        },
        {
          "type": "componentDemo",
          "component": "TextField"
        },
        {
          "type": "componentDemo",
          "component": "Card"
        },
        {
          "type": "componentDemo",
          "component": "Alert"
        },
        {
          "type": "componentDemo",
          "component": "Badge"
        }
      ]
    },
    {
      "id": "charts",
      "order": 4,
      "title": "차트",
      "figmaPage": "4. 차트",
      "storybookTitle": "4. 차트",
      "blocks": [
        {
          "type": "heading",
          "text": "차트"
        },
        {
          "type": "paragraph",
          "text": "Chart.js 기반이며 색상은 토큰 팔레트를 따릅니다. Figma로는 스냅샷이 전달되고, 역방향은 토큰(색상)만 반영됩니다."
        },
        {
          "type": "componentDemo",
          "component": "DsChart"
        }
      ]
    },
    {
      "id": "social-login",
      "order": 5,
      "title": "소셜 로그인",
      "figmaPage": "5. 소셜 로그인",
      "storybookTitle": "5. 소셜 로그인",
      "blocks": [
        {
          "type": "heading",
          "text": "소셜 로그인"
        },
        {
          "type": "paragraph",
          "text": "카카오·구글·페이스북·네이버 4개 프로바이더를 지원합니다. 색상·문구는 각 사 브랜드 규정을 따르며 임의 변경할 수 없습니다."
        },
        {
          "type": "componentDemo",
          "component": "SocialLoginButton"
        },
        {
          "type": "table",
          "id": "oauth-scopes"
        }
      ]
    },
    {
      "id": "kr",
      "order": 6,
      "title": "KR 컴포넌트",
      "figmaPage": "6. KR 컴포넌트",
      "storybookTitle": "6. KR 컴포넌트",
      "blocks": [
        {
          "type": "heading",
          "text": "KR 컴포넌트"
        },
        {
          "type": "paragraph",
          "text": "한국 서비스에서 자주 쓰는 입력 패턴을 기본 제공합니다. 휴대폰·주민등록번호·사업자번호·카드·계좌 필드는 자동 하이픈과 검증식(주민번호 형식, 사업자번호 국세청 검증식, 카드 Luhn)을 내장하고, 주소 입력은 우편번호 조회·자동완성 UX를 제공합니다."
        },
        {
          "type": "callout",
          "text": "우편번호 조회는 카카오(다음) 우편번호 서비스 연동 지점의 동일 UX mock입니다. 실서비스 전 실제 API로 교체하세요."
        }
      ]
    },
    {
      "id": "states",
      "order": 7,
      "title": "상태 & 검증",
      "figmaPage": "7. 상태 & 검증",
      "storybookTitle": "7. 상태 & 검증",
      "blocks": [
        {
          "type": "heading",
          "text": "상태 & 검증"
        },
        {
          "type": "paragraph",
          "text": "요구사항 §7의 공통 State 15종과 §8의 Validation 13종을 전수 매트릭스로 정리합니다. 각 상태의 라이브 데모는 해당 컴포넌트의 States 스토리에서 확인할 수 있습니다."
        },
        {
          "type": "table",
          "id": "state-matrix"
        },
        {
          "type": "paragraph",
          "text": "Validation은 표준 메시지와 처리 패턴을 고정합니다. 서버 연동이 필요한 항목(중복·잠금 등)은 연동 지점만 정의하고 데모는 mock으로 제공합니다."
        },
        {
          "type": "table",
          "id": "validation-matrix"
        },
        {
          "type": "callout",
          "text": "코어 5종(Button·TextField·Card·Alert·Badge)의 props는 Figma 매니페스트와 왕복 동일성이 검증되므로, 상태 추가 시 매니페스트도 함께 갱신해야 합니다."
        }
      ]
    },
    {
      "id": "playground",
      "order": 8,
      "title": "Playground",
      "figmaPage": "8. Playground",
      "storybookTitle": "8. Playground",
      "blocks": [
        {
          "type": "heading",
          "text": "Playground"
        },
        {
          "type": "paragraph",
          "text": "DS 컴포넌트를 실제 서비스 플로우로 조합한 통합 데모입니다. 입력 → 검증 → 확인 다이얼로그 → 완료 알림까지 하나의 폼으로 동작하며, 우측 상단 프리셋 전환에도 반응합니다."
        }
      ]
    },
    {
      "id": "accessibility",
      "order": 10,
      "title": "접근성",
      "figmaPage": "10. 접근성",
      "storybookTitle": "10. 접근성",
      "blocks": [
        {
          "type": "heading",
          "text": "접근성"
        },
        {
          "type": "paragraph",
          "text": "DS 컴포넌트가 공통으로 지키는 접근성 패턴입니다. 새 컴포넌트는 이 매트릭스를 기준으로 구현·리뷰합니다."
        },
        {
          "type": "table",
          "id": "a11y-matrix"
        },
        {
          "type": "callout",
          "text": "OS의 '모션 감소'(prefers-reduced-motion) 설정 시 모든 애니메이션·트랜지션이 전역에서 비활성화됩니다 — src/tokens/motion.css."
        }
      ]
    }
  ],
  "tables": {
    "a11y-matrix": {
      "columns": [
        "영역",
        "패턴",
        "적용"
      ],
      "rows": [
        [
          "포커스 표시",
          "모든 인터랙티브 요소에 3px color-mix 포커스 링 (:focus-visible / :focus-within)",
          "입력 계열 · Button · Select/Dropdown · Calendar 셀"
        ],
        [
          "키보드 조작",
          "Enter/Space 활성화, 화살표 이동, Escape 닫기",
          "Toggle · OtpField(←→) · NumberField(↑↓) · Autocomplete(↑↓/Enter) · 오버레이·드롭다운(Esc)"
        ],
        [
          "ARIA 역할",
          "role=switch·listbox/option·group·alert, aria-checked/expanded/haspopup/selected",
          "Toggle · Select/MultiSelect/Dropdown · OtpField · Alert · Modal류"
        ],
        [
          "상태 알림",
          "aria-invalid + error 헬퍼 텍스트 동반 표기",
          "InputBase 파생 전체 · Textarea"
        ],
        [
          "아이콘 버튼 라벨",
          "텍스트 없는 버튼은 aria-label 필수 (지우기/닫기/증감/표시 토글)",
          "SearchField · PasswordField · NumberField · Modal/Drawer 닫기 · Snackbar"
        ],
        [
          "장식 요소 숨김",
          "장식용 SVG는 aria-hidden, 의미 있는 아이콘만 라벨 부여",
          "전 인라인 SVG 아이콘"
        ],
        [
          "명도 대비",
          "본문은 text/secondary 토큰만 사용 — 프리셋 값 기준 4.5:1 근사 확보",
          "토큰 정책 (tokens/*.json)"
        ],
        [
          "모션 감소",
          "prefers-reduced-motion: reduce 시 애니메이션·트랜지션 전역 무효화",
          "src/tokens/motion.css"
        ]
      ]
    },
    "state-matrix": {
      "columns": [
        "상태",
        "정의",
        "대표 지원 컴포넌트"
      ],
      "rows": [
        [
          "Default",
          "기본 표시 상태",
          "전 컴포넌트"
        ],
        [
          "Hover",
          "포인터 오버 시각 피드백 (CSS :hover)",
          "Button · 입력 계열 · List · Chip · 메뉴 항목"
        ],
        [
          "Focus",
          "키보드/클릭 포커스 링 (color-mix 15% 링)",
          "입력 계열 · Button · Select/Dropdown 트리거"
        ],
        [
          "Pressed",
          "클릭(active) 눌림 피드백",
          "Button(scale) · SocialLoginButton"
        ],
        [
          "Selected",
          "선택 항목 강조 (primary 틴트)",
          "Select · List · Sidebar · Chip · Calendar · Tab"
        ],
        [
          "Checked",
          "체크됨",
          "Checkbox · Radio · Toggle · MultiSelect 옵션"
        ],
        [
          "Loading",
          "진행 중 표시",
          "Loading(spinner/dots/overlay) · Snackbar 플로우"
        ],
        [
          "Disabled",
          "비활성 (opacity .45 + 포인터 차단)",
          "전 인터랙티브 컴포넌트"
        ],
        [
          "Readonly",
          "읽기 전용 (bgSubtle 배경, 포커스 링 없음)",
          "TextField · InputBase 파생 · Textarea · NumberField"
        ],
        [
          "Required",
          "필수 표시 (라벨 * 마커)",
          "InputBase 파생 · Textarea · Dialog(prompt)"
        ],
        [
          "Success",
          "성공 상태 (success 토큰)",
          "TextField · EmailField · Alert · Badge · Timeline · Snackbar"
        ],
        [
          "Warning",
          "경고 상태 (warning 토큰)",
          "Statistics(중립 delta) · 토큰 문서 스와치"
        ],
        [
          "Error",
          "오류 상태 (error 토큰)",
          "입력 계열 · Alert · Dialog(danger) · Badge · Snackbar"
        ],
        [
          "Invalid",
          "형식 검증 실패 (aria-invalid + error 표시)",
          "EmailField · KrPhoneField · KrRrnField · KrCardNoField"
        ],
        [
          "Empty",
          "빈 상태 안내 문구",
          "Table(emptyText) · Autocomplete(결과 없음) · Upload(파일 없음)"
        ]
      ]
    },
    "validation-matrix": {
      "columns": [
        "검증",
        "표준 처리 · 메시지",
        "구현 위치"
      ],
      "rows": [
        [
          "정상",
          "success 보더 + 확인 헬퍼",
          "EmailField · KR 필드(validate)"
        ],
        [
          "필수값",
          "'필수 항목입니다.' + required 마커",
          "InputBase(required) · Select(error)"
        ],
        [
          "최대길이",
          "maxLength 입력 차단 + 카운터(현재/최대)",
          "TextField · Textarea · InputBase"
        ],
        [
          "최소길이",
          "'N자 이상 입력하세요.' 헬퍼",
          "PasswordField"
        ],
        [
          "중복",
          "'이미 사용 중입니다.' — 서버 응답 후 error 표시",
          "서버 연동 지점 (데모 mock)"
        ],
        [
          "형식오류",
          "'형식이 올바르지 않습니다.' + Invalid 상태",
          "EmailField · KrPhoneField · KrRrnField · KrBizNoField · KrCardNoField(Luhn)"
        ],
        [
          "네트워크오류",
          "Snackbar(error) '네트워크 연결을 확인해주세요.'",
          "Snackbar"
        ],
        [
          "서버오류",
          "Dialog(alert) '일시적인 오류가 발생했습니다.'",
          "Dialog"
        ],
        [
          "인증실패",
          "'인증번호가 일치하지 않습니다.' + error 셀",
          "OtpField · KrPhoneAuth"
        ],
        [
          "인증만료",
          "카운트다운 만료 → 재전송 버튼 활성",
          "KrPhoneAuth"
        ],
        [
          "재시도",
          "재전송/다시 시도 액션 노출",
          "KrPhoneAuth · Snackbar 액션"
        ],
        [
          "잠금",
          "N회 실패 시 입력 disabled + 잠금 안내",
          "정책 연동 지점 (데모 mock)"
        ],
        [
          "시간초과",
          "타임아웃 안내 + 재시도 유도",
          "KrPhoneAuth 타이머"
        ]
      ]
    },
    "oauth-scopes": {
      "columns": [
        "프로바이더",
        "기본 스코프",
        "버튼 기본 문구"
      ],
      "rows": [
        [
          "카카오",
          "profile_nickname, profile_image, account_email",
          "카카오 로그인"
        ],
        [
          "구글",
          "openid, email, profile",
          "Google로 로그인"
        ],
        [
          "페이스북",
          "public_profile, email",
          "Facebook으로 로그인"
        ],
        [
          "네이버",
          "name, email, profile_image",
          "네이버 로그인"
        ]
      ]
    }
  }
}
