// About 페이지 데이터. 전부 사이트 주인의 기존 포트폴리오(seungyeol.kr)에서 가져온 원문이다.
// 문구를 지어내지 않는다: 바꿀 때는 이 파일만 고친다. (한국어 원문은 한국어 그대로 둔다)

// ---------- 히어로·선언문 ----------
export type HeroSlot =
  | { kind: "video"; mp4: string; webm?: string; poster: string; position?: string }
  | { kind: "image"; src: string; position?: string };
export const aboutCopy = {
  // 기존 사이트의 "POWERED BY CLARITY" 문구. 히어로 H1이 된다(단어 사이에 사진 슬롯이 끼어 든다)
  heroWords: ["Powered", "by", "clarity"],
  // 히어로 H1의 인라인 미디어 3칸(순서 = 화면에 나오는 순서: 1줄 "Powered [1] by" / 2줄 "[2] clarity [3]").
  // 전부 사이트 주인의 자산이다: 영상 2개는 기존 포트폴리오(seungyeol.kr)의 영상을 8:5 640x400으로 크롭·무음·루프 처리했고(public/videos/about/),
  // 가운데 정지 이미지는 주인의 사진(hobby-brick-building)이다. 스톡 사진을 쓰게 되면 사진가 이름·원본 URL을 이 항목에 credit으로 적는다
  // 순서 이유: 색·움직임이 한쪽으로 쏠리지 않게 "밝고 차가운 영상(위) / 붉은 정지 이미지(아래 왼쪽) / 어둡고 손이 움직이는 영상(아래 오른쪽)"
  heroMedia: [
    { kind: "video", mp4: "/videos/about/about-light-caustics.mp4", webm: "/videos/about/about-light-caustics.webm", poster: "/images/seungyeol/about/about-light-caustics.webp", position: "50% 50%" },
    { kind: "image", src: "/images/seungyeol/hobby-brick-building.webp", position: "50% 50%" },
    { kind: "video", mp4: "/videos/about/about-laptop-desk.mp4", webm: "/videos/about/about-laptop-desk.webm", poster: "/images/seungyeol/about/about-laptop-desk.webp", position: "50% 50%" },
  ] as readonly HeroSlot[],
  introLabel: "Introduce", // 선언문 아래 왼쪽 라벨(12px 회색)
  name: "Lee Seungyeol",
  role: "Frontend Engineer",
  place: "Seoul, South Korea",
  // 큰 선언문(Introduce, 사용자가 B 버전으로 확정). 단어가 하나씩 채워지는 한 문장이라 영문은 한 문장으로 둔다.
  // 한글 원문은 바로 아래 한 줄(statementKoLine)로 병기한다
  statement: "Fast with AI, structured by people first.",
  statementKoLine: "구현은 AI와 빠르게, 구조는 사람이 먼저.",
  // 오른쪽 한글 3단락(원문 그대로. 백틱은 인라인 코드 표시). 세 번째 단락의 "에서도 확인했습니다"는 사용자가 완화해 확정한 표현
  statementKo: [
    "구름 AX 과정에서 팀의 AI 서비스 셋업을 CLI 스타터킷 MeerKit으로 만들었습니다. 구현은 AI와 함께 빠르게 할 수 있었지만, 결과를 좌우한 건 어떤 구조로 작업할지 먼저 정하는 설계였습니다.",
    "그래서 `CLAUDE.md`를 작업별 하네스 문서로 안내하는 라우터로 만들었고, 반복된 오류는 Always/Never 규칙과 그 이유로 기록했습니다. AI가 같은 실수를 되풀이하지 않게 하려는 것이었습니다.",
    "이 생각은 WEAVE에서도 확인했습니다. 같은 시안을 AI에게 WEAVE로 작업시켜 비교하니 시안에 없는 임의 값이 60개에서 0개로 줄었습니다. 규칙이 있는 환경에서는 AI도 일관되게 일했습니다.",
  ],
  // 푸터 H1(기존 "START A STORY - SHARE A DREAM - WRITE TO MARU")
  footerTitle: ["Start a story", "with me"],
  footerBody: "I want to build a web experience with you that makes someone's world a little more beautiful.",
} as const;

// ---------- Profile 블록(About 히어로 바로 아래) ----------
// 출처: 경력기술서 PDF(이승열_경력기술서.pdf) 상단 + HANDOFF의 사용자 소개. 문장은 원문 그대로, 숫자는 총 경력 하나만 쓴다(근거 없는 숫자 금지). 전화번호는 싣지 않는다.
// 예전의 숫자 스트립(25건·5개+·4회)은 지웠다. 그 수치의 PDF 원문은 경력 드로어(lib/career.ts)에만 남는다.
export type ProfileFact = { label: string; value: string; birth?: { y: number; m: number; d: number } };
export const profile = {
  nameEn: "Seungyeol Lee", // 메인 이름(세리프)
  nameKo: "이승열", // 작은 보조 이름
  headline: "환경이 바뀌어도, 반복되는 작업은 도구로 바꾸어 온 개발자", // PDF 요약 박스 제목
  summary:
    "웹 퍼블리셔로 4년 11개월 동안 일했습니다. Tailwind를 쓸 수 없는 PHP·Java 환경에서 프로젝트마다 같은 세팅이 반복되자, 사내 퍼블리싱 키트 WEAVE를 직접 설계해 실제 프로젝트에 적용했습니다. 구름 AX 풀스택 빌더 과정에서는 팀의 AI 서비스 셋업을 CLI 스타터킷 MeerKit으로 만들고, AI가 같은 실수를 반복하지 않도록 작업 규칙을 하네스 문서로 정리했습니다.",
  // 정의 목록 4행(라벨 12px / 값 16px). 순서: Role, Birth, Experience, Address. (Focus 행은 뺐고, Based in은 Address가 대신한다)
  // Birth는 만 나이를 붙인다. 나이는 해가 지나면 바뀌므로 글자로 적지 않고 birth(연·월·일)로 화면에서 계산한다(BirthValue)
  facts: [
    { label: "Role", value: "프론트엔드 엔지니어" },
    { label: "Birth", value: "2001.03.30", birth: { y: 2001, m: 3, d: 30 } },
    { label: "Experience", value: "웹 퍼블리셔 4년 11개월" }, // PDF "총 4년 11개월"
    { label: "Address", value: "Dobong-gu, Seoul" },
  ] as readonly ProfileFact[],
} as const;

// ---------- 취미 섹션(Profile 아래, 사진이 천천히 흘러가는 트랙) ----------
// 문구와 사진은 여기만 고치면 된다. 사진은 public/images/seungyeol/에 넣고 src만 바꾼다(교체 예정).
// 사진마다 크기·세로 위치·어둡기가 달라 비대칭으로 흐른다. 값은 전부 "섹션 높이에 대한 비율"이라 화면 크기가 바뀌어도 모양이 같다.
export type Hobby = {
  src: string;
  alt: string;
  /** 가로 / 세로 (1 = 정사각, 0.8 = 세로형, 1.5 = 가로형). 칸 모양이고 사진은 이 칸을 꽉 채워 잘린다(object-fit: cover) */
  ratio: number;
  /** 사진 높이 = 섹션 높이 x h */
  h: number;
  /** 섹션 위쪽에서 떨어진 거리 = 섹션 높이 x top (h + top이 1을 넘지 않게) */
  top: number;
  /** 검정을 덮는 정도(0~1). 클수록 어둡다. 헤드라인이 겹쳐도 읽히게 모두 0.4 이상 */
  dim: number;
};
export const hobbyCopy = {
  label: "Off the clock",
  headline: ["Small things,", "looked at closely."],
} as const;
export const hobbies: readonly Hobby[] = [
  { src: "/images/seungyeol/hobby-shrimp-moss.webp", alt: "이끼 위에 앉은 파란 새우", ratio: 0.8, h: 0.78, top: 0.06, dim: 0.45 },
  { src: "/images/seungyeol/street-crosswalk.webp", alt: "횡단보도를 건너는 사람의 다리를 찍은 흑백 사진", ratio: 1.5, h: 0.42, top: 0.5, dim: 0.55 },
  { src: "/images/seungyeol/hobby-moss-terrarium.webp", alt: "이끼와 고사리로 꾸민 테라리움", ratio: 1, h: 0.5, top: 0.08, dim: 0.6 },
  { src: "/images/seungyeol/hobby-neon-koi.webp", alt: "푸른 물결 속을 헤엄치는 붉은 잉어", ratio: 0.75, h: 0.72, top: 0.22, dim: 0.4 },
  { src: "/images/seungyeol/hobby-sunset-skyline.webp", alt: "보랏빛 노을 아래 빌딩 숲", ratio: 1.4, h: 0.4, top: 0.12, dim: 0.5 },
  { src: "/images/seungyeol/hobby-brick-building.webp", alt: "푸른 하늘을 배경으로 한 붉은 벽돌 건물", ratio: 1, h: 0.55, top: 0.4, dim: 0.55 },
];

// ---------- 경력(Career) ----------
export type CareerItem = { company: string; period: string };
export const career: readonly CareerItem[] = [
  { company: "WeverCNS", period: "2023.03 ~ 2026.05" },
  { company: "Bstones", period: "2022.06 ~ 2023.02" },
  { company: "Dfry", period: "2020.10 ~ 2021.08" },
];

/**
 * 재직 기간 글자("3 yrs 3 mo")를 period("YYYY.MM ~ YYYY.MM")에서 계산한다. 데이터에 없는 값을 지어내지 않고 있는 기간만 쓴다.
 * 시작·끝 달을 모두 근무한 달로 셈한다(2023.03 ~ 2026.05 = 39개월). 형식이 다르면 빈 문자열(표에서는 칸만 비운다).
 */
export function careerTenure(period: string): string {
  const m = period.match(/^(\d{4})\.(\d{2})\s*~\s*(\d{4})\.(\d{2})$/);
  if (!m) return "";
  const [sy, sm, ey, em] = m.slice(1).map(Number);
  const total = (ey - sy) * 12 + (em - sm) + 1;
  if (total <= 0) return "";
  const years = Math.floor(total / 12);
  const months = total % 12;
  const y = years ? `${years} ${years === 1 ? "yr" : "yrs"}` : "";
  const mo = months ? `${months} mo` : "";
  return [y, mo].filter(Boolean).join(" ");
}

// ---------- 스킬 12개(한국어/영어 설명 원문) ----------
export type Skill = { name: string; ko: readonly string[]; en: readonly string[] };
export const skills: readonly Skill[] = [
  {
    name: "Next.js",
    ko: [
      "App Router에서 서버·클라이언트 컴포넌트의 경계를 구분하고, 환경변수와 하이드레이션 오류를 다룬 경험이 있습니다.",
      "서버에서 오는 데이터는 TanStack Query로, 토큰과 모달 같은 화면 상태는 Zustand로 나누어 관리합니다.",
      "MeerKit 프론트엔드를 Next.js로 개발했습니다.",
    ],
    en: [
      "Works with the App Router, its server/client component boundary, environment variables, and hydration issues.",
      "Separates server data (TanStack Query) from UI state such as tokens and modals (Zustand).",
      "Built the MeerKit frontend with Next.js.",
    ],
  },
  {
    name: "TypeScript",
    ko: [
      "API 응답과 컴포넌트 props를 타입으로 정의하고, tsc와 ESLint로 코드를 검사합니다.",
      "import 방향 같은 구조 규칙을 ESLint 규칙으로 만들어, 어기면 바로 알 수 있게 합니다.",
    ],
    en: [
      "Defines API responses and component props with types, and checks code with tsc and ESLint.",
      "Turns structural rules such as import direction into ESLint rules.",
    ],
  },
  {
    name: "React",
    ko: [
      "화면을 컴포넌트 단위로 나누고 hooks로 로직을 분리합니다.",
      "라우팅과 페이지 전환까지 포함해 이 포트폴리오도 React 19와 React Router로 만들었습니다.",
    ],
    en: [
      "Splits screens into components and separates logic with hooks.",
      "This portfolio itself is built with React 19 and React Router.",
    ],
  },
  {
    name: "Tailwind CSS",
    ko: [
      "디자인 토큰과 유틸리티 클래스로 스타일을 구성하고, 커스텀 CSS가 필요할 때도 토큰을 기준으로 만듭니다.",
      "CSS를 고친 뒤에는 lint가 아니라 빌드로 검증하는 규칙을 두고 있습니다.",
    ],
    en: [
      "Builds styles from design tokens and utility classes, and bases custom CSS on tokens.",
      "Verifies CSS changes with a build, since lint does not parse CSS.",
    ],
  },
  {
    name: "HTML5",
    ko: [
      "시맨틱 태그와 data- 속성을 활용해 구조적이고 확장 가능한 마크업을 작성할 수 있습니다.",
      "접근성과 표준성을 고려한 페이지 구조 설계가 가능합니다.",
    ],
    en: [
      "Able to write semantic and structured markup using data- attributes.",
      "Builds accessible, maintainable, and scalable HTML architecture.",
    ],
  },
  {
    name: "CSS3",
    ko: [
      "유틸리티 클래스와 커스텀 속성을 기반으로 빠르고 일관된 스타일 시스템을 구축합니다.",
      "Flex와 Grid를 활용한 반응형/적응형 레이아웃을 구현할 수 있습니다.",
      "트랜지션과 트랜스폼을 이용해 섬세한 인터랙션 표현도 가능합니다.",
    ],
    en: [
      "Creates fast and reusable styling systems based on utility classes and key properties.",
      "Uses Flex/Grid layouts to implement adaptive and responsive designs.",
    ],
  },
  {
    name: "Javascript",
    ko: [
      "ES6 문법 기반으로 DOM 제어와 이벤트 처리, 간단한 모듈 개발이 가능합니다.",
      "Ajax를 통한 폼 전송, 입력값 유효성 검사 등 사용자 인터랙션 로직을 구현할 수 있습니다.",
      "data-속성 기반으로 상태 제어를 하는 구조적 스크립트 작성에 익숙합니다.",
    ],
    en: [
      "Develops dynamic interactions using ES6 syntax and DOM manipulation.",
      "Handles Ajax form submissions and validation with efficiency.",
      "Uses data- attributes for structured, reusable component scripting.",
    ],
  },
  {
    name: "SCSS",
    ko: [
      "변수, 믹스인, 함수, 중첩을 활용해 구조적이고 체계적인 스타일 설계를 합니다.",
      "유틸리티 클래스 중심의 스타일 시스템으로 빠른 퍼블리싱을 지원합니다.",
    ],
    en: [
      "Builds structured and scalable style architecture using variables, mixins, and nesting.",
      "Supports utility-based systems for fast and consistent styling across pages.",
    ],
  },
  {
    name: "GIT",
    ko: [
      "기본적인 브랜치 생성과 커밋, 버전 관리 및 협업 환경 설정이 가능합니다.",
      "작업 히스토리를 통해 변경점을 관리하고 안정적으로 코드 백업을 수행합니다.",
      "단독 프로젝트와 협업 환경 모두에서 실무적으로 사용 경험이 있습니다.",
    ],
    en: [
      "Handles project version control for stable collaboration.",
      "Manages commits, merges, and updates in practical team environments.",
    ],
  },
  {
    name: "GSAP",
    ko: [
      "ScrollTrigger, MotionPathPlugin 등을 활용해 고급 인터랙션을 구현합니다.",
      "SVG 요소나 DOM 객체의 모션 제어, 시차 스크롤 등의 애니메이션을 구성할 수 있습니다.",
    ],
    en: [
      "Implements advanced animations using ScrollTrigger and MotionPathPlugin.",
      "Creates smooth and interactive scroll-based and SVG path animations.",
    ],
  },
  {
    name: "FIGMA",
    ko: [
      "디자인 시안을 기반으로 정확한 구현이 가능하며, 리소스 추출 및 컴포넌트 확인에 능숙합니다.",
      "간단한 레이아웃 수정이나 스타일 가이드 확인 작업도 직접 수행할 수 있습니다.",
    ],
    en: [
      "Able to check design layouts and extract assets for front-end development.",
      "Reviews components and structure for accurate implementation.",
    ],
  },
  {
    name: "XD, Photoshop",
    ko: [
      "디자인 시안을 분석하고 퍼블리싱에 필요한 리소스를 추출할 수 있습니다.",
      "시안의 레이아웃, 간격, 폰트, 컬러를 기준으로 실제 페이지에 반영할 수 있습니다.",
    ],
    en: [
      "Able to analyze and implement designs efficiently through layout analysis.",
      "References colors, grids, and text for precise front-end reproduction.",
    ],
  },
];

// ---------- Works archive(45개) ----------
export const WORK_CATEGORIES = [
  "Official Websites",
  "Portfolio Sites",
  "Campaign & Promotions",
  "Institutions & Non-profits",
  "Services & Systems",
] as const;
export type WorkCategory = (typeof WORK_CATEGORIES)[number];

export type Work = {
  name: string;
  role: string;
  year: string;
  category: WorkCategory;
  /** 기존 사이트(seungyeol.kr/works/<slug>)에 상세 페이지가 확인된 5개만 값이 있다. 나머지는 링크 없음 */
  slug?: string;
};

// 상세 페이지가 있는 작업은 이 사이트의 /projects/<slug>로 연결한다(예전에는 기존 사이트 https://seungyeol.kr/works/<slug>였다)
export const WORKS_BASE_URL = "/projects";

// 짧은 별칭으로 아래 목록을 읽기 쉽게 한다
const O = "Official Websites" as const;
const P = "Portfolio Sites" as const;
const C = "Campaign & Promotions" as const;
const I = "Institutions & Non-profits" as const;
const S = "Services & Systems" as const;

export const works: readonly Work[] = [
  { name: "대통령실", role: "Publishing", year: "2026", category: I },
  { name: "마음타운", role: "Publishing", year: "2026", category: S },
  { name: "대동 계열사 - 대동 애그테크", role: "Publishing", year: "2025", category: O },
  { name: "대동 계열사 - 대동 로보틱스", role: "Publishing", year: "2025", category: O },
  { name: "대동 모빌리티(ko,jp)", role: "Publishing", year: "2024-2025", category: O, slug: "daedongmobility" },
  { name: "M.BUSH 기획", role: "Publishing", year: "2025", category: P },
  { name: "BAU 공간디자인학과 온라인 전시회", role: "Publishing", year: "2022-2025", category: I },
  { name: "K-GO K-arts on the GO", role: "Publishing", year: "2025", category: I },
  { name: "KIC 한국투자공사", role: "Publishing", year: "2025", category: I },
  { name: "마음하나", role: "Publishing", year: "2024-2025", category: S, slug: "maumhana" },
  { name: "Deeply", role: "Publishing", year: "2024", category: O },
  { name: "WWG", role: "Publishing", year: "2024", category: O },
  { name: "Aprilmarch", role: "Publishing & Design", year: "2024", category: P },
  { name: "태제연구재단", role: "Publishing", year: "2024", category: I },
  { name: "매원장학재단", role: "Publishing", year: "2024", category: I },
  { name: "맘시터 비즈니스", role: "Publishing", year: "2024", category: S },
  { name: "CLDB 형사법 DB", role: "Publishing", year: "2024", category: S },
  { name: "매칭코리아", role: "Publishing", year: "2024", category: S },
  { name: "TripClip", role: "Publishing", year: "2023", category: O },
  { name: "DrainFilter", role: "Publishing", year: "2023", category: O },
  { name: "Optima Solution", role: "Publishing", year: "2023", category: O },
  { name: "대동 공식 홈페이지 유지보수", role: "Publishing", year: "2023", category: O },
  { name: "STAXX", role: "Publishing", year: "2023", category: O },
  { name: "POPMSCO", role: "Publishing", year: "2023", category: P },
  { name: "Amon Design", role: "Publishing & Design", year: "2023", category: P },
  { name: "WeverCNS", role: "Publishing", year: "2023", category: P, slug: "wevercns" },
  { name: "컴패션 2023 결연아동후원 캠페인", role: "Publishing", year: "2023", category: C },
  { name: "유니세프 in 블루", role: "Publishing", year: "2023", category: C },
  { name: "삼성 #YouMake 오픈 알림 신청", role: "Publishing", year: "2023", category: C },
  { name: "삼성 #YouMake 프로젝트", role: "Publishing", year: "2023", category: C },
  { name: "삼성전자 세일 페스타", role: "Publishing", year: "2023", category: C },
  { name: "삼성전자 BESPOKE 그랑데 AI 신상 컬렉션", role: "Publishing", year: "2023", category: C },
  { name: "삼성 선물하기 & 연말", role: "Publishing", year: "2023", category: C },
  { name: "삼성 e식품관 SUMMER FOOD FESTA", role: "Publishing", year: "2023", category: C },
  { name: "삼성 e식품관 메리 추석 선물하기 기획전", role: "Publishing", year: "2023", category: C },
  { name: "그린피스 드라이빙 체인지", role: "Publishing", year: "2023", category: C },
  { name: "탄소중립 녹색 성장 캠페인", role: "Publishing", year: "2023", category: C },
  { name: "대통령 경호처", role: "Publishing", year: "2023", category: I, slug: "pss" },
  { name: "Intellisys", role: "Publishing", year: "2021", category: O },
  { name: "삼화제지", role: "Publishing", year: "2021", category: O, slug: "samwhapaper" },
  { name: "DFRY", role: "Publishing", year: "2021", category: P },
  { name: "NC DInos Kiosk Event", role: "Publishing", year: "2021", category: C },
  { name: "스티비 뉴스레터", role: "Publishing", year: "2021", category: S },
  { name: "KLAY RABBIT (NFT)", role: "Publishing", year: "2021", category: S },
  { name: "헬스맥스", role: "Publishing", year: "2021", category: S },
];

// ---------- 연락 링크(기존 사이트 푸터) ----------
export type SocialLink = { label: string; href: string };
export const socialLinks: readonly SocialLink[] = [
  { label: "Github", href: "https://github.com/maru-dev4905" },
  { label: "Facebook", href: "https://www.facebook.com/seungyeol.lee.522/" },
  { label: "Instagram", href: "https://www.instagram.com/syy1_publ/" },
  { label: "CSS Battles", href: "https://cssbattle.dev/player/maru102" },
];
