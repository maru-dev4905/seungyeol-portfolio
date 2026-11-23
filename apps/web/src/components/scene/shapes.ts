// 셰이더 오브젝트의 "형태" 4가지. 재질·조명·움직임은 그대로이고 막대 배치 파라미터만 다르다(scene.frag.ts의 uShape·uShape2).
// home = 홈 배경의 크롬 별. works / about / contact = 메뉴 팝업의 항목 hover 장면(그리고 /works·/about 페이지에서 메뉴를 열었을 때)
export type SceneShape = "home" | "works" | "about" | "contact";

//   [막대 중심 거리, 반길이, 두께 배율, 막대 사이 각도(rad), 전체 회전(rad), 막대별 길이 방향 어긋남]
export type ShapeParams = readonly [number, number, number, number, number, number];

export const SHAPES: Record<SceneShape, ShapeParams> = {
  home: [0.3, 0.66, 1, Math.PI / 2, 0, 0], // 바람개비('#'): 90도씩 엇갈린 네 막대(기존과 같다)
  works: [0.13, 0.6, 1.15, Math.PI / 4, 0.25, 0], // 부채꼴: 45도씩 펼쳐진 막대가 중심 근처에서 교차(별표 모양)
  about: [0.4, 0.52, 0.85, (2 * Math.PI) / 3, 0.5, 0], // 삼각형: 120도씩 돌려 세 막대가 삼각형을 이룬다(네 번째는 첫째와 겹침)
  contact: [0.24, 0.62, 0.95, Math.PI, 0.45, 0.3], // 엇갈린 평행 막대: 180도 -> 두 방향 막대가 길이 방향으로 어긋나 계단처럼
};

/** 경로 -> 메뉴를 열었을 때 가운데 창에 깔 형태. null이면 창은 페이지 자체가 보이는 구멍(홈) 또는 현재 프로젝트 목업(상세)이다 */
export function shapeForPath(pathname: string): SceneShape | null {
  if (pathname === "/") return null;
  if (/^\/projects\/[^/]+\/?$/.test(pathname)) return null;
  if (pathname === "/works") return "works";
  if (pathname === "/about") return "about";
  if (pathname === "/library") return "works"; // 새 형태 없이 Works의 부채꼴을 재사용(MenuOverlay의 SHAPE_BY_KEY와 같다)
  if (pathname === "/contact") return "contact";
  return "home"; // 그 밖의 비-상세 페이지(없는 경로 등)는 기본 형태
}
