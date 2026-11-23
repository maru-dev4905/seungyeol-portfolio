// Library(/library) 데이터. 써 보려고 모아 두는 라이브러리·플러그인 목록이다.
// 규칙: 시드는 "이 포트폴리오나 경력기술서(lib/career.ts)에서 실제로 쓴 것"만 status "used"로 둔다.
//       note(한 줄 코멘트)는 사이트 주인이 직접 쓰는 칸이라 비워 둔다(지어내지 않는다). 써볼 예정(planned)·관심(watching) 항목도 주인이 채운다.
//       tagline은 각 공식 사이트·README의 한 줄 소개 수준의 사실만 적는다.
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

// ---------- 화면용 라벨(스키마는 값만 안다) ----------
export const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  animation: "애니메이션",
  ui: "UI",
  state: "상태 관리",
  form: "폼",
  data: "데이터",
  framework: "프레임워크",
  tooling: "도구",
  testing: "테스트",
  other: "기타",
};
export const STATUS_LABELS: Record<LibraryStatus, string> = {
  used: "써봄",
  planned: "써볼 예정",
  watching: "관심",
};
// 필터 알약 순서 = 스키마 enum 순서
export const CATEGORIES = libraryCategorySchema.options;
export const STATUSES = libraryStatusSchema.options;

// ---------- 시드(전부 status "used") ----------
const PORTFOLIO = "이 포트폴리오";
const seed: LibraryItem[] = [
  { id: "gsap", name: "GSAP", tagline: "JavaScript 애니메이션 라이브러리", category: "animation", status: "used", url: "https://gsap.com", npm: "gsap",
    usedIn: [`${PORTFOLIO}: 등장 모션·ScrollTrigger`, "경력: 웹 퍼블리싱 프로젝트 인터랙션"], addedAt: "2026-11-23" },
  { id: "lenis", name: "Lenis", tagline: "Smooth scroll library", category: "animation", status: "used", url: "https://lenis.darkroom.engineering", npm: "lenis",
    usedIn: [`${PORTFOLIO}: 부드러운 스크롤`], addedAt: "2026-11-23" },
  { id: "nextjs", name: "Next.js", tagline: "The React framework for the web", category: "framework", status: "used", url: "https://nextjs.org", npm: "next",
    usedIn: [`${PORTFOLIO}: 사이트 전체`], addedAt: "2026-11-23" },
  { id: "typescript", name: "TypeScript", tagline: "JavaScript with syntax for types", category: "tooling", status: "used", url: "https://www.typescriptlang.org", npm: "typescript",
    usedIn: [`${PORTFOLIO}: 사이트 전체`], addedAt: "2026-11-23" },
  { id: "zod", name: "Zod", tagline: "TypeScript-first schema validation with static type inference", category: "data", status: "used", url: "https://zod.dev", npm: "zod",
    usedIn: [`${PORTFOLIO}: 공유 스키마(packages/schemas)`], addedAt: "2026-11-23" },
  { id: "playwright", name: "Playwright", tagline: "Fast and reliable end-to-end testing for modern web apps", category: "testing", status: "used", url: "https://playwright.dev", npm: "playwright",
    usedIn: [`${PORTFOLIO}: 화면·모션 검증(스크린샷)`], addedAt: "2026-11-23" },
  { id: "swiper", name: "Swiper", tagline: "Most modern mobile touch slider", category: "ui", status: "used", url: "https://swiperjs.com", npm: "swiper",
    usedIn: ["경력: 디프라이"], addedAt: "2026-11-23" },
  { id: "locomotive-scroll", name: "Locomotive Scroll", tagline: "Smooth scroll and in-viewport detection library", category: "animation", status: "used", url: "https://github.com/locomotivemtl/locomotive-scroll", npm: "locomotive-scroll",
    usedIn: ["경력: 디프라이"], addedAt: "2026-11-23" },
  { id: "scrollmagic", name: "ScrollMagic", tagline: "The javascript library for magical scroll interactions", category: "animation", status: "used", url: "https://scrollmagic.io", npm: "scrollmagic",
    usedIn: ["경력: 디프라이"], addedAt: "2026-11-23" },
  { id: "fullpage-js", name: "fullPage.js", tagline: "Create full screen scrolling websites", category: "ui", status: "used", url: "https://alvarotrigo.com/fullPage/", npm: "fullpage.js",
    usedIn: ["경력: 디프라이"], addedAt: "2026-11-23" },
  { id: "gulp", name: "Gulp", tagline: "A toolkit to automate and enhance your workflow", category: "tooling", status: "used", url: "https://gulpjs.com", npm: "gulp",
    usedIn: ["경력: 디프라이 빌드 환경"], addedAt: "2026-11-23" },
  { id: "pug", name: "Pug", tagline: "Robust, elegant, feature rich template engine for Node.js", category: "tooling", status: "used", url: "https://pugjs.org", npm: "pug",
    usedIn: ["경력: 디프라이 빌드 환경"], addedAt: "2026-11-23" },
  { id: "sass", name: "Sass (SCSS)", tagline: "CSS with superpowers", category: "tooling", status: "used", url: "https://sass-lang.com", npm: "sass",
    usedIn: ["경력: 디프라이 빌드 환경"], addedAt: "2026-11-23" },
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
