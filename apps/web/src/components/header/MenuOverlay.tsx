"use client";

import { useEffect, useRef, useState, type FocusEvent } from "react";
import { usePathname } from "next/navigation";
import { Media } from "@/components/media/Media";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { shapeForPath, type SceneShape } from "@/components/scene/shapes";
import { HandoffLink } from "@/components/transition/HandoffLink";
import { mockupMedia } from "@/lib/handoff";
import type { ProjectGroup, ProjectMedia, Tint } from "@/lib/projects";
import { groupLabels, homeCopy, siteCopy } from "@/lib/site";
import styles from "./MenuOverlay.module.css";

export type MenuProject = { slug: string; group: ProjectGroup; shortName: string; tint: Tint; media?: ProjectMedia };
// 내비 항목(Works·About·Library·Contact)은 모두 각자의 페이지(/works, /about, /library, /contact)로 이동하는 링크다

// 내비 항목(Works·About·Library·Contact)에 올렸을 때 가운데 창에 나오는 장면 = 홈 배경과 같은 재질·조명·움직임의 셰이더 오브젝트인데 "형태"만 다르다(scene/shapes.ts).
// 누르면 이 장면이 그대로 화면 전체로 커진 뒤 그 페이지로 간다(Works·About). 창 안의 그림과 커지는 면이 같은 셰이더라 이음매가 없다
// 키 = 항목 이름, 값 = 그 항목의 형태. Library는 새 형태를 만들지 않고 Works의 부채꼴(여러 막대가 모이는 별표 모양 = "모아 둔 도구")을 다시 쓴다.
// 목록에서 Works와 이웃하지 않게 About 아래에 두어, 올렸을 때 옆 항목과 같은 모양이 연달아 나오지 않는다
const SHAPE_BY_KEY: Readonly<Record<string, SceneShape>> = { works: "works", about: "about", library: "works", contact: "contact", workflow: "home" };
// workflow = Engineering 그룹 맨 앞의 Workflow 알약(프로젝트가 아니라 /workflow 페이지 링크). /workflow 페이지의 형태가 기본형("home")이라 같은 형태를 쓴다 -> 새 형태 없이 hover·확대·도착 장면이 이어진다
// 창(30vw x 창 높이, 가로가 좁다)에서 오브젝트 전체가 들어오도록 줄여 보는 배율. 확대 면(HandoffLayer)도 같은 값을 쓴다
const WINDOW_ZOOM = 0.5;

/**
 * 풀스크린 메뉴(측정 1440x900). 흰 면 위에: 왼쪽 세리프 내비 4개(Works / About / Library / Contact) + 그 아래 그룹 2개(Engineering = Workflow·Meerkit·Weave, Selected works = 나머지) 목록,
 * 가운데 창(432x740), 오른쪽 "Latest" 카드 스택, 왼쪽 아래 ©연도.
 * 열기/닫기: 흰 프레임 4조각이 사방에서 가운데 창으로 좁혀 들어오고(닫힐 땐 늦게 나감), 내용은 같은 곡선으로 슬라이드한다(측정값은 CSS 상단).
 * 가운데 창은 구멍이다: 그 안에 보이는 것은 지금 페이지 자체(같은 스크롤 위치)다. 사용자 영상 16.0~16.3·25.1~25.4·28.0초에서
 * 창 안의 글자·기기 크기가 전체 화면일 때와 같아(축소 없음) 페이지는 그대로 두고 프레임만 좁혀 들어오게 했다.
 * 내비 항목·알약에 올리면 그 항목의 미리보기가 창 안에서 크로스페이드로 바뀌고(0.3초), 벗어나면 서서히 사라져 다시 페이지가 보인다.
 * 항목을 누르면 창 사각형이 화면 전체로 커진 뒤 이동한다(HandoffLink -> HandoffLayer. 영상 20.0~21.7초).
 * 내비 항목은 hover 때 나머지가 흐려지고 밑줄이 그어진다.
 *
 * 접근성: 네이티브 dialog 대신 role="dialog"로 만든다. 이유: <dialog>.showModal()은 최상위 레이어라
 * 헤더(Close 버튼, 달 버튼)를 가려 버리는데, 이 디자인은 헤더가 메뉴 위에 보여야 한다.
 * 대신 열려 있는 동안 페이지(#page)를 inert로 만들어 포커스·클릭이 뒤로 새지 않게 하고, Esc로 닫으며, 열리면 첫 항목에 포커스를 준다.
 */
export function MenuOverlay({
  open,
  onClose,
  projects,
  curtain = null,
  bare = false,
  navClose,
  onNav,
}: {
  open: boolean;
  onClose: () => void;
  projects: MenuProject[];
  /**
   * 홈으로 가는 "커튼" 전환(로고 클릭, SiteHeader): in = 프레임이 가운데로 모여 화면을 완전히 가리는 중, arrived = 가린 채 홈에 도착해 기다리는 중,
   * out = 프레임이 열려(물러나) 홈을 드러내는 중. 모든 구간에서 내용(내비·알약·카드)은 숨기고 프레임 시간표는 TL.curtain(Metalab 실측)을 쓴다
   */
  curtain?: "in" | "arrived" | "out" | null;
  /** 메뉴가 닫혀 있다가 시작한 커튼: 덮는 층(목업·형태)을 올리지 않는다(Metalab: 옛 페이지가 조각 구멍으로 그대로 보인다) */
  bare?: boolean;
  /** 항목을 눌러 이동 중인가: 닫히는 프레임이 일반 닫힘(Metalab 측정 지연 .21s) 대신 전환 타임라인의 시간표를 쓰게 한다(확대 면과 같은 시작·길이·곡선) */
  navClose: boolean;
  /** 항목(링크)을 눌러 연출을 시작할 때: navClose를 켜고 메뉴를 닫는다(SiteHeader가 한다) */
  onNav: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const firstNav = useRef<HTMLAnchorElement>(null);
  // 창 미리보기 상태. cur = 지금 올린 항목(페이드 인), prev = 직전 항목(새 장 아래에 남아 있다가 새 장이 다 덮으면 사라짐). 키는 "works"·"about"·프로젝트 slug.
  // 이전 장을 새 장 아래에 불투명으로 남겨 두므로 크로스페이드 중에도 뒤 페이지가 비치지 않는다
  const [preview, setPreview] = useState<{ cur: string | null; prev: string | null }>({ cur: null, prev: null });
  const setHover = (key: string | null) => setPreview((s) => (s.cur === key ? s : { cur: key, prev: s.cur }));
  // 키보드 포커스일 때만 미리보기를 바꾼다. 메뉴가 열릴 때 첫 항목(Works)에 주는 프로그램 포커스까지 따라가면,
  // 열자마자 창이 Works 미리보기로 덮여 지금 페이지가 보이지 않는다(비교 시트에서 발견)
  const onKeyFocus = (key: string | null) => (e: FocusEvent<HTMLElement>) => {
    if (e.currentTarget.matches(":focus-visible")) setHover(key);
  };
  const [dismissed, setDismissed] = useState<number[]>([]);
  const m = siteCopy.menu;
  // 지금 있는 페이지를 메뉴에 표시한다(밑줄 + aria-current, 알약은 hover와 같은 테두리)
  const pathname = usePathname();
  const onAbout = pathname === "/about";
  const onWorks = pathname === "/works";
  const onLibrary = pathname === "/library";
  const onContact = pathname === "/contact";
  const onWorkflow = pathname === "/workflow";
  // 프로젝트 상세 페이지에서 열었다면 지금 보고 있는 프로젝트(그 목업이 창 뒤에서 올라온다). 그 밖의 페이지는 null
  const slugAt = /^\/projects\/([^/]+)\/?$/.exec(pathname)?.[1];
  const current = slugAt ? (projects.find((p) => p.slug === slugAt) ?? null) : null;
  // 창의 셰이더 장면: 올린 항목이 Works·About·Library·Contact면 그 형태, 아니면 지금 페이지의 형태(/works -> Works형, /about -> About형, /library -> Works형, /contact -> Contact형, 그 밖의 비-상세 페이지 -> 기본형).
  // 홈·상세는 null(홈은 창이 페이지가 보이는 구멍, 상세는 현재 프로젝트 목업이 올라온다). 캔버스는 하나이고 형태만 부드럽게 섞인다(셰이더 보간 -> 장면이 쌓이지 않는다)
  const hoverShape = preview.cur ? (SHAPE_BY_KEY[preview.cur] ?? null) : null;
  const wantShape: SceneShape | null = hoverShape ?? shapeForPath(pathname);
  // 장면이 사라지는 동안(opacity 페이드)에도 마지막 형태를 유지한다(사라지면서 모양이 바뀌지 않게)
  const [lastShape, setLastShape] = useState<SceneShape>("home");
  if (wantShape && wantShape !== lastShape) setLastShape(wantShape);
  // 캔버스(WebGL 컨텍스트)는 처음 열릴 때 한 번만 만든다. 닫힌 뒤 프레임이 다 나갈 때까지 그리다가 멈춘다
  const [sceneMounted, setSceneMounted] = useState(false);
  if ((open || curtain) && !sceneMounted) setSceneMounted(true);
  const [sceneRun, setSceneRun] = useState(false);
  useEffect(() => {
    if (open || curtain) {
      const t = window.setTimeout(() => setSceneRun(true), 0);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setSceneRun(false), 1400);
    return () => window.clearTimeout(t);
  }, [open, curtain]);
  // 같은 데이터에서 파생한 두 그룹: 위 Engineering(Meerkit·Weave, 알약이 조금 크다), 아래 Selected works. 홈 알약 목록과 같은 함수·같은 라벨이다
  // (lib/projects.ts는 서버 전용 캐시 API를 쓰므로 클라이언트 컴포넌트에서는 타입만 가져오고, 나누기는 여기서 한다)
  const groups = [
    { key: "featured", label: groupLabels.featured, items: projects.filter((p) => p.group === "featured") },
    { key: "selected", label: groupLabels.selected, items: projects.filter((p) => p.group === "selected") },
  ] as const;

  // 열려 있는 동안 뒤 페이지를 비활성화(inert)하고 Esc를 듣는다
  useEffect(() => {
    if (!open) return;
    const page = document.getElementById("page");
    page?.setAttribute("inert", "");
    firstNav.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      page?.removeAttribute("inert");
      window.removeEventListener("keydown", onKey);
      setPreview({ cur: null, prev: null }); // 닫히면 미리보기를 지운다(다음에 열 때 지금 페이지부터 보이게)
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      className={styles.menu}
      data-open={open || undefined}
      data-nav={navClose || undefined}
      data-curtain={curtain || undefined}
      data-bare={(bare && curtain) || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="메뉴"
      aria-hidden={!open}
      // Lenis가 휠 이벤트를 가로채 뒤 페이지를 스크롤하지 않게 한다
      data-lenis-prevent
    >
      {/* 상세 페이지에서만: 지금 프로젝트의 목업이 화면 아래에서 올라와 화면을 덮는다(Metalab 상세 페이지 측정).
          프레임 4조각과 같은 곡선·시간으로 올라오고 닫힐 때는 같이 내려간다. 프레임(흰색)이 가장자리를 덮으므로 최종적으로는 창 안에서만 보인다(상자가 창보다 넓다).
          그림 상자는 창 hover 미리보기와 같은 크기(창 높이 x 16:10)로 화면 가운데에 둔다 -> 올라온 그림과 hover 그림·확대 전환의 시작 그림이 같은 배율이다 */}
      {current && (
        <div className={styles.rise} aria-hidden="true">
          <Media tint={current.tint} media={mockupMedia(current.media)} label={false} sizes="100vw" eager />
        </div>
      )}

      {/* 상세 페이지가 아닌 서브 페이지(Works·About 등)에서: 그 페이지의 셰이더 "형태"가 위 목업(.rise)과 똑같이 화면 아래에서 올라와 화면을 덮고,
          프레임 4조각이 그 위로 좁혀 들어온다(같은 곡선·지연·길이). 캔버스는 하나라 항목 hover 때는 같은 캔버스의 형태만 부드럽게 섞인다(셰이더 보간).
          상자는 .rise와 같은 크기(창 높이 x 16:10)·같은 자리이고, 셰이더는 높이 기준으로 그려 가운데 창 크기만 잘라 보면 창 hover 장면과 같다(HandoffLayer의 확대 면도 같은 장면) */}
      <div className={styles.scene} aria-hidden="true" data-on={wantShape ? "" : undefined} data-hover={hoverShape ? "" : undefined}>
        {sceneMounted && <SceneCanvas className={styles.sceneCanvas} tint={null} shape={wantShape ?? lastShape} zoom={WINDOW_ZOOM} paused={!sceneRun} />}
      </div>

      {/* 흰 프레임 4조각 + 둥근 모서리 4개(데스크톱) / 통짜 흰 면(모바일). 열리면 사방에서 가운데 창으로 좁혀 들어온다 */}
      <div className={styles.sheet} aria-hidden="true" />
      <div className={`${styles.edge} ${styles.top}`} aria-hidden="true" />
      <div className={`${styles.edge} ${styles.right}`} aria-hidden="true" />
      <div className={`${styles.edge} ${styles.bottom}`} aria-hidden="true" />
      <div className={`${styles.edge} ${styles.left}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerTL}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerTR}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerBL}`} aria-hidden="true" />
      <div className={`${styles.corner} ${styles.cornerBR}`} aria-hidden="true" />

      {/* 왼쪽: 세리프 내비 + 내용 */}
      <nav className={styles.nav} aria-label="Main">
        <ul onPointerLeave={() => setHover(null)}>
          <li>
            {/* Works: 창의 미리보기가 화면 전체로 커진 뒤 /works로 이동하고, 아래로 빠지며 목록이 드러난다. 메뉴가 열리면 첫 포커스가 여기로 온다 */}
            <HandoffLink
              ref={firstNav}
              href="/works"
              tint="indigo"
              scene="works"
              source="[data-menu-window]"
              exit="slide"
              framed
              onStart={onNav}
              className={styles.navItem}
              aria-current={onWorks ? "page" : undefined}
              onPointerEnter={() => setHover("works")}
              onFocus={onKeyFocus("works")}
            >
              <span className={styles.navText}>{m.works}</span>
            </HandoffLink>
          </li>
          <li>
            {/* About: Works와 같은 전환으로 /about 페이지로 이동한다 */}
            <HandoffLink
              href="/about"
              tint="indigo"
              scene="about"
              source="[data-menu-window]"
              exit="slide"
              framed
              onStart={onNav}
              className={styles.navItem}
              aria-current={onAbout ? "page" : undefined}
              onPointerEnter={() => setHover("about")}
              onFocus={onKeyFocus("about")}
            >
              <span className={styles.navText}>{m.about}</span>
            </HandoffLink>
          </li>
          <li>
            {/* Library: Works와 같은 전환. 형태는 Works의 부채꼴을 다시 쓴다(SHAPE_BY_KEY) */}
            <HandoffLink
              href="/library"
              tint="indigo"
              scene="works"
              source="[data-menu-window]"
              exit="slide"
              framed
              onStart={onNav}
              className={styles.navItem}
              aria-current={onLibrary ? "page" : undefined}
              onPointerEnter={() => setHover("library")}
              onFocus={onKeyFocus("library")}
            >
              <span className={styles.navText}>{m.library}</span>
            </HandoffLink>
          </li>
          <li>
            {/* Contact: About과 같은 전환(창의 Contact 형태 장면이 커진 뒤 아래로 빠지며 /contact 페이지가 드러난다). 올리면 창에 Contact 형태의 장면이 나온다 */}
            <HandoffLink
              href="/contact"
              tint="indigo"
              scene="contact"
              source="[data-menu-window]"
              exit="slide"
              framed
              onStart={onNav}
              className={styles.navItem}
              aria-current={onContact ? "page" : undefined}
              onPointerEnter={() => setHover("contact")}
              onFocus={onKeyFocus("contact")}
            >
              <span className={styles.navText}>{m.contact}</span>
            </HandoffLink>
          </li>
        </ul>
      </nav>

      <div className={styles.panel}>
        {groups.map((g) => (
          <div key={g.key} className={styles.group} data-group={g.key}>
            <p className={styles.caption} id={`menu-group-${g.key}`}>
              {g.label}
            </p>
            <ul className={styles.list} aria-labelledby={`menu-group-${g.key}`} onPointerLeave={() => setHover(null)}>
              {/* Engineering 그룹 맨 앞: Workflow 알약. 프로젝트가 아니라 /workflow 페이지로 가므로 내비 항목(About 등)과 같은 전환(창의 장면이 커진 뒤 아래로 빠짐)을 쓴다 */}
              {g.key === "featured" && (
                <li>
                  <HandoffLink
                    href="/workflow"
                    tint="indigo"
                    scene="home"
                    source="[data-menu-window]"
                    exit="slide"
                    framed
                    onStart={onNav}
                    className={`pill ${styles.pillLink}`}
                    data-active={onWorkflow}
                    aria-current={onWorkflow ? "page" : undefined}
                    onPointerEnter={() => setHover("workflow")}
                    onFocus={onKeyFocus("workflow")}
                  >
                    {homeCopy.workflow.name}
                  </HandoffLink>
                </li>
              )}
              {g.items.map((p) => (
                <li key={p.slug}>
                  {/* 알약을 누르면 가운데 창의 목업이 마스크로 열려 상세 히어로로 이어진다(메뉴는 동시에 닫힌다) */}
                  <HandoffLink
                    href={`/projects/${p.slug}`}
                    tint={p.tint}
                    projectMedia={p.media}
                    // 가로 프레임 프로젝트는 창이 아니라 창 안의 가로 프레임이 커지기 시작하는 칸이다(미리보기와 같은 모양으로 시작해야 끊기지 않는다)
                    source={p.media?.aspect ? `[data-menu-frame="${p.slug}"]` : "[data-menu-window]"}
                    framed
                    onStart={onNav}
                    className={`pill ${styles.pillLink}`}
                    data-active={pathname === `/projects/${p.slug}`}
                    aria-current={pathname === `/projects/${p.slug}` ? "page" : undefined}
                    onPointerEnter={() => setHover(p.slug)}
                    onFocus={onKeyFocus(p.slug)}
                  >
                    {p.shortName}
                  </HandoffLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 가운데 창(432x740): 비어 있는 구멍이라 지금 페이지가 그대로 보인다. 항목에 올리면 그 미리보기가 아래에서 위로 덮는다 */}
      <div className={styles.media} aria-hidden="true" data-menu-window>
        {/* 프로젝트는 목업 장면(누르면 그대로 커져 상세 히어로가 되는 그림) */}
        {[
          ...projects.map((p) => ({ key: p.slug, tint: p.tint, media: mockupMedia(p.media), aspect: p.media?.aspect })),
        ].map((it) => (
          <div
            key={it.key}
            className={styles.preview}
            // in = 지금 올린 항목(페이드 인) / under = 직전 항목(새 장이 다 덮을 때까지 그대로) / out = 어느 항목에도 안 올림(페이드 아웃)
            data-wide={it.aspect ? "" : undefined}
            data-state={preview.cur === it.key ? "in" : preview.prev === it.key ? (preview.cur ? "under" : "out") : undefined}
          >
            {/* 메뉴가 열려 있을 때만 그린다(닫힌 동안 이미지 9장을 받지 않게). 열리면 바로 받아 hover 때 빈 칸이 보이지 않는다 */}
            {(open || preview.prev === it.key) &&
              (it.aspect ? (
                // 가로 프레임(media.aspect): 세로 창(432x740)에 cover로 넣으면 양옆이 잘리므로, 창 폭에 맞춘 가로 프레임을 가운데에 두고 그림 전체를 보여 준다
                <div className={styles.previewFrame} style={{ aspectRatio: it.aspect }} data-menu-frame={it.key}>
                  <Media tint={it.tint} media={it.media} label={false} sizes="30vw" eager />
                </div>
              ) : (
                <Media tint={it.tint} media={it.media} label={false} sizes="30vw" eager />
              ))}
          </div>
        ))}
      </div>

      {/* 오른쪽: Latest 카드 스택(자리표시). × 로 하나씩 닫을 수 있다 */}
      <ul className={styles.cards} aria-label="Latest">
        {siteCopy.latest.map((c, i) =>
          dismissed.includes(i) ? null : (
            <li key={c.title} className={styles.card} style={{ "--i": i } as React.CSSProperties}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>{c.title}</h2>
                <button type="button" className={styles.cardClose} aria-label={`Dismiss ${c.title}`} onClick={() => setDismissed((d) => [...d, i])}>
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                    <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1" fill="none" />
                  </svg>
                </button>
              </div>
              {i === 0 ? (
                <div className={styles.cardMedia}>
                  <Media tint="indigo" label={false} />
                </div>
              ) : (
                <div className={styles.cardRow}>
                  <div className={styles.cardThumb}>
                    <Media tint={i === 1 ? "red" : "teal"} label={false} />
                  </div>
                  <p className={styles.cardBody}>{c.body}</p>
                </div>
              )}
            </li>
          ),
        )}
      </ul>

      <p className={styles.year}>©{siteCopy.year}</p>
    </div>
  );
}
