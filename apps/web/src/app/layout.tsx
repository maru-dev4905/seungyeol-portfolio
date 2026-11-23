import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { Cursor } from "@/components/cursor/Cursor";
import { ScrollTop } from "@/components/nav/ScrollTop";
import { PageFade } from "@/components/transition/PageFade";
import { HandoffLayer } from "@/components/transition/HandoffLayer";
import { SiteHeader } from "@/components/header/SiteHeader";
import { getProjects } from "@/lib/projects";
import { timelineCssVars } from "@/lib/transition-timeline";

// 서체는 원본(Metalab)의 유료 서체 대신 가장 닮은 무료 서체를 쓴다(D-021).
// 디스플레이 세리프: PP Eiko(weight 240) -> Newsreader 가변 서체. weight 200~800과 opsz 축이 있어 240을 그대로 쓸 수 있다.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

// 본문 산세리프: Basis Grotesque Pro(weight 350) -> Hanken Grotesk 가변 서체(100~900이라 350 가능)
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

// 한글 본문 폴백. 글자 수가 많아 subset을 못 고르므로 preload를 끄고 브라우저가 필요한 조각만 받게 한다
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "이승열 | Portfolio",
  description: "프론트엔드 개발자 이승열의 포트폴리오",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // 헤더의 메뉴 오버레이가 프로젝트 링크를 보여 주려고 목록을 받는다(캐시된 함수라 서버에서만 읽고 한 번만 계산된다)
  const projects = (await getProjects()).map(({ slug, group, shortName, tint, media }) => ({ slug, group, shortName, tint, media }));

  return (
    // html의 style: 전환 타임라인 상수(--tl-*)를 CSS가 읽도록 싣는다(lib/transition-timeline.ts가 유일한 원천)
    <html lang="ko" className={`${newsreader.variable} ${hanken.variable} ${notoSansKr.variable}`} style={timelineCssVars}>
      <body>
        {/* 부드러운 스크롤(Lenis)도 레이아웃에 한 번만. 페이지를 옮겨도 다시 만들어지지 않는다 */}
        <SmoothScroll />
        {/* JS 없이는 메뉴 버튼이 아무 일도 못 한다. 그때는 버튼을 숨기고, 내용은 각 페이지의 noscript 블록이 보여 준다 */}
        <noscript>
          <style>{"[data-needs-js]{display:none !important}"}</style>
        </noscript>
        {/* 헤더는 모든 페이지 공통이라 레이아웃에 한 번만 둔다(페이지를 옮겨도 시계·메뉴 상태가 유지된다) */}
        <SiteHeader projects={projects} />
        {/* 메뉴가 열리면 이 래퍼를 inert로 만들어 뒤 페이지에 포커스·클릭이 가지 않게 한다 */}
        <div id="page">{children}</div>
        {/* 홈 -> 케이스 스터디 이동 때 확대된 미디어가 페이지를 넘어 이어지도록 레이아웃에 둔다 */}
        <HandoffLayer />
        {/* 일반 링크 이동의 짧은 페이드 아웃 -> 인(이전 페이지 퇴장과 새 페이지 등장이 겹치지 않게) */}
        <PageFade />
        {/* 맨 위로 버튼: 알약 유무에 따라 위치가 바뀌므로 페이지 밖(레이아웃)에 한 번만 둔다 */}
        <ScrollTop />
        <Cursor />
      </body>
    </html>
  );
}
