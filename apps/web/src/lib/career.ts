// 경력 상세(Career 행을 누르면 열리는 드로어의 내용). 출처: 사이트 주인의 경력기술서 PDF(이승열_경력기술서.pdf).
// 문장은 PDF 원문 그대로다(요약·윤색·번역 없음). 줄바꿈 때문에 끊긴 문장만 이어 붙였다. 바꿀 때는 이 파일만 고친다.
// 기간은 lib/about.ts의 career(period)를 쓴다(PDF 추출본에는 날짜가 비어 있었다). 전화번호는 PDF에 있어도 싣지 않는다.
// 키는 lib/about.ts career의 company와 같다. 여기에 없는 회사가 생기면 경력기술서 내용이 없는 것이라 그 행에는 드로어도 없다.

/** 불릿 한 줄. lead는 PDF에서 굵게 쓴 앞머리("공공기관 웹 접근성")이고 text가 그 뒤 문장이다. 백틱은 코드 조각 */
export type CareerBullet = { lead?: string; text: string };

/** 프로젝트 카드의 한 줄(왜 / 무엇을 / 어떻게 / 검증) */
export type CareerStep = { label: string; text: string };

export type CareerDetail = {
  /** PDF의 한글 회사명 */
  nameKo: string;
  /** 직급 / 직무 / 주요사업 / 주요업무 */
  rank: string;
  duty: string;
  business: string;
  tasks?: string;
  /** 회사 한 줄 요약(PDF 굵은 문장) */
  summary: string;
  /** "업무 내용" 불릿 */
  bullets: readonly CareerBullet[];
  /** 사내 키트 같은 대표 프로젝트 카드 */
  project?: { title: string; meta: string; link?: { label: string; href: string }; steps: readonly CareerStep[] };
  /** 성과 지표 칩(PDF의 25건 / 5개+ / 4회) */
  metrics?: readonly { value: string; label: string }[];
  /** 배운 점 */
  lesson?: string;
};

export const careerDetails: Readonly<Record<string, CareerDetail>> = {
  WeverCNS: {
    nameKo: "웨버씨엔에스",
    rank: "개발팀 주임",
    duty: "웹 퍼블리셔",
    business: "기업·공공기관 웹사이트 구축",
    tasks: "웹 퍼블리싱, 웹 접근성, 사내 키트 WEAVE",
    summary: "기업·공공기관 웹사이트 25건을 퍼블리싱하고, 반복되던 세팅을 사내 키트 WEAVE로 묶었습니다.",
    bullets: [
      {
        text: "기업 홈페이지, 플랫폼, 랜딩 페이지 퍼블리싱 (대동모빌리티, 마음하나, KIC 한국투자공사, 대통령 경호처 등). 백엔드 템플릿(CMS) 환경 퍼블리싱과 동적 데이터 바인딩 처리",
      },
      {
        lead: "공공기관 웹 접근성",
        text: ": 시맨틱 마크업, 대체 텍스트, 키보드 탭 이동·포커스 흐름 정리 (대통령 경호처, KIC)",
      },
      { text: "JavaScript 폼 유효성 검사, 탭·모달·스크롤 인터랙션, GSAP 애니메이션 구현. 운영 중 유지보수와 긴급 수정 대응" },
    ],
    project: {
      title: "WEAVE — 사내 퍼블리싱 키트",
      meta: "1인 설계·개발",
      link: { label: "weavekit.kr", href: "https://weavekit.kr/" },
      steps: [
        {
          label: "왜",
          text: "PHP·Java 환경이라 Tailwind를 쓸 수 없었고, reset·base CSS와 JS 공통 구조, 라이브러리 세팅을 프로젝트마다 새로 만들었습니다.",
        },
        {
          label: "무엇을",
          text: "디자인 값이 곧 클래스 이름이 되는 유틸리티 CSS(`fs_40` = 40px)와 색상 토큰, 탭·모달·폼 검증 등 JS 플러그인 11개, 문서·데모 사이트 8페이지",
        },
        {
          label: "어떻게",
          text: "반복되는 것은 키트로, 서비스 전용 레이아웃은 기존 방식으로 나눠 적용. 일정이 촉박했던 대동모빌리티를 WEAVE로 빠르게 구축하고, 마음하나에도 같은 방식 적용",
        },
        {
          label: "검증",
          text: "AI에게 WEAVE로 작업시켜 비교한 결과, 시안에 없는 임의 값이 60개에서 0개로 줄고, 하이브리드 방식은 같은 구조 수정 시 HTML 46곳 대신 CSS 1곳만 고치면 됐습니다.",
        },
      ],
    },
    metrics: [
      { value: "25건", label: "웹사이트 퍼블리싱" },
      { value: "5개+", label: "WEAVE 적용 프로젝트" },
      { value: "4회", label: "GDWEB 위너프라이즈" },
    ],
    lesson:
      "반복을 도구로 바꾸는 건 혼자서도 효과가 있었지만, 다른 사람이 쓰려면 읽기 쉬운 문서와 의미가 담긴 규칙이 필요하다는 걸 배웠습니다.",
  },
  Bstones: {
    nameKo: "비스톤스",
    rank: "개발팀 사원",
    duty: "웹 퍼블리셔",
    business: "웹 퍼블리싱 (삼성전자 기획전)",
    summary: "삼성전자 기획전 페이지 7건을 2~4인 협업으로 제작·운영했습니다.",
    bullets: [
      { text: "포토샵 시안 분석 후 HTML/CSS/JS 마크업, vw 단위 반응형 레이아웃 구현" },
      { text: "탭, 이미지 슬라이드, 앵커 이동 인터랙션 개발과 운영 중 수정·업데이트 대응" },
      { text: "#YouMake 프로젝트·오픈 알림 신청, 세일 페스타, 선물하기&연말, e식품관 추석 기획전, BESPOKE 그랑데 AI, SUMMER FOOD FESTA" },
    ],
  },
  Dfry: {
    nameKo: "디프라이",
    rank: "개발팀 사원",
    duty: "웹 퍼블리셔",
    business: "웹 에이전시",
    summary: "웹사이트 5건을 단독 퍼블리싱하고, 빌드 환경을 직접 구축했습니다.",
    bullets: [
      { lead: "빌드 환경 구축", text: ": Gulp·Pug·SCSS 환경을 직접 세팅해 공통 마크업은 Pug로 나누고, CSS는 컴포넌트 단위로 관리" },
      {
        lead: "삼화제지",
        text: " 메인 포함 전 페이지 프론트엔드 구현. 인터랙션을 처음 맡아 ScrollMagic·GSAP·Fullpage.js 등을 직접 써 보며 인터랙션 라이브러리를 익힌 계기 → Web Award Korea 2021 제조 분야 대상, GDWEB 골드프라이즈",
      },
      { text: "키오스크 화면, 기업·플랫폼 홈페이지의 반응형·애니메이션 구현 (jQuery, Vanilla JS, Swiper, Locomotive Scroll)" },
    ],
  },
};
