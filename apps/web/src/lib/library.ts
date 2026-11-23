// Library(/library) 데이터. 써 보려고 모아 두는 라이브러리·플러그인 목록이다.
// 규칙: 시드는 "이 포트폴리오나 경력기술서(lib/career.ts)에서 실제로 쓴 것"만 status "used"로 둔다.
//       note(한 줄 코멘트)는 사이트 주인이 직접 쓰는 칸이라 비워 둔다(지어내지 않는다). 써볼 예정(planned)·관심(watching) 항목도 주인이 채운다.
//       tagline은 각 공식 소개를 한국어로 풀이한 한 줄(사실 수준)만 적는다.
// 나중에 관리자 페이지(라이브러리/블로그/작업물 CRUD)가 생기면 getLibraryItems() 안쪽만 DB 조회로 바꾼다. 페이지는 이 함수만 부른다.
import {
  libraryCategorySchema,
  libraryItemSchema,
  libraryStatusSchema,
  type LibraryCategory,
  type LibraryItem,
  type LibraryStatus,
} from "@portfolio/schemas";

export type { LibraryCategory, LibraryItem, LibraryStatus };

// ---------- 화면용 라벨(스키마는 값만 안다. 화면 문자열은 영문) ----------
export const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  animation: "Animation",
  ui: "UI",
  state: "State",
  form: "Form",
  data: "Data",
  framework: "Framework",
  tooling: "Tooling",
  testing: "Testing",
  other: "Other",
};
export const STATUS_LABELS: Record<LibraryStatus, string> = {
  used: "Used",
  planned: "Planned",
  watching: "Watching",
};
// 필터 알약 순서 = 스키마 enum 순서
export const CATEGORIES = libraryCategorySchema.options;
export const STATUSES = libraryStatusSchema.options;

// ---------- 시드(전부 status "used") ----------
// tagline은 공식 소개를 한국어로 풀이한 한 줄(사실 수준)
const seed: LibraryItem[] = [
  { id: "gsap", name: "GSAP", tagline: "JavaScript 애니메이션 라이브러리, ScrollTrigger 등 플러그인 제공", category: "animation", status: "used", url: "https://gsap.com", npm: "gsap", addedAt: "2026-11-23" },
  { id: "lenis", name: "Lenis", tagline: "부드러운 스크롤을 구현하는 라이브러리", category: "animation", status: "used", url: "https://lenis.darkroom.engineering", npm: "lenis", addedAt: "2026-11-23" },
  { id: "nextjs", name: "Next.js", tagline: "React 기반 웹 프레임워크", category: "framework", status: "used", url: "https://nextjs.org", npm: "next", addedAt: "2026-11-23" },
  { id: "typescript", name: "TypeScript", tagline: "JavaScript에 타입을 더한 언어", category: "tooling", status: "used", url: "https://www.typescriptlang.org", npm: "typescript", addedAt: "2026-11-23" },
  { id: "zod", name: "Zod", tagline: "TypeScript용 스키마 선언·검증 라이브러리", category: "data", status: "used", url: "https://zod.dev", npm: "zod", addedAt: "2026-11-23" },
  { id: "playwright", name: "Playwright", tagline: "웹 앱용 E2E 테스트 프레임워크", category: "testing", status: "used", url: "https://playwright.dev", npm: "playwright", addedAt: "2026-11-23" },
  { id: "swiper", name: "Swiper", tagline: "터치 슬라이더 라이브러리", category: "ui", status: "used", url: "https://swiperjs.com", npm: "swiper", addedAt: "2026-11-23" },
  { id: "locomotive-scroll", name: "Locomotive Scroll", tagline: "부드러운 스크롤과 뷰포트 진입 감지 라이브러리", category: "animation", status: "used", url: "https://github.com/locomotivemtl/locomotive-scroll", npm: "locomotive-scroll", addedAt: "2026-11-23" },
  { id: "scrollmagic", name: "ScrollMagic", tagline: "스크롤 기반 인터랙션용 JavaScript 라이브러리", category: "animation", status: "used", url: "https://scrollmagic.io", npm: "scrollmagic", addedAt: "2026-11-23" },
  { id: "fullpage-js", name: "fullPage.js", tagline: "풀스크린 스크롤 웹사이트를 만드는 라이브러리", category: "ui", status: "used", url: "https://alvarotrigo.com/fullPage/", npm: "fullpage.js", addedAt: "2026-11-23" },
  { id: "gulp", name: "Gulp", tagline: "작업 흐름을 자동화하는 툴킷", category: "tooling", status: "used", url: "https://gulpjs.com", npm: "gulp", addedAt: "2026-11-23" },
  { id: "pug", name: "Pug", tagline: "Node.js용 HTML 템플릿 엔진", category: "tooling", status: "used", url: "https://pugjs.org", npm: "pug", addedAt: "2026-11-23" },
  { id: "sass", name: "Sass (SCSS)", tagline: "CSS를 확장한 스타일시트 언어", category: "tooling", status: "used", url: "https://sass-lang.com", npm: "sass", addedAt: "2026-11-23" },
];

// 모듈이 로드될 때 한 번 검증한다. 데이터가 스키마와 어긋나면 빌드가 여기서 멈춘다(잘못된 데이터가 화면까지 가지 않는다)
const items: LibraryItem[] = libraryItemSchema.array().parse(seed);

// 정렬: 상태(써봄 > 써볼 예정 > 관심) -> 이름. 상태 순서는 STATUSES 배열 순서를 그대로 쓴다
function sortItems(list: readonly LibraryItem[]): LibraryItem[] {
  return [...list].sort(
    (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );
}

/**
 * 페이지가 항목을 얻는 유일한 입구. 정렬까지 마쳐서 돌려준다.
 * 관리자 단계: 이 함수 안쪽만 DB(API) 조회 + 같은 스키마 parse로 바꾸면 페이지·컴포넌트는 그대로다. 그래서 async로 둔다.
 */
export async function getLibraryItems(): Promise<LibraryItem[]> {
  return sortItems(items);
}
