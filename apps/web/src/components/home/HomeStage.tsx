"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Media } from "@/components/media/Media";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { MOCKUP_RATIO, mockupMedia, startHandoff } from "@/lib/handoff";
import type { ProjectGroup, ProjectMedia, Tint } from "@/lib/projects";
import { groupLabels, homeCopy } from "@/lib/site";
import { isTransitionLocked } from "@/lib/transition-machine";
import { isTransitionBusy, whenTransitionIdle } from "@/lib/transition-gate";
import { tintToken } from "@/lib/tint";
import styles from "./HomeStage.module.css";

export type HomeProject = {
  slug: string;
  group: ProjectGroup;
  shortName: string;
  tagline: string;
  productType: string;
  tint: Tint;
  media?: ProjectMedia;
};

// 알약 하나에 대응하는 hover 장면 한 벌(큰 제목·설명·분류·썸네일). 마지막 항목은 Works(/works로 가는 알약, 썸네일 없음)
// 썸네일 이미지 폭 힌트(가장 넓은 변형이 화면 폭의 40%). 확대 면도 같은 값으로 첫 그림을 그린다
const THUMB_SIZES = "40vw";

type Item = { key: string; href: string; name: string; desc: string; type: string | null; tint: Tint; media?: ProjectMedia; thumb: boolean; group: ProjectGroup };

// 알약 그룹의 표시 순서와 라벨(메뉴 Case Studies와 같은 값: lib/site.ts의 groupLabels)
const GROUPS: { key: ProjectGroup; label: string }[] = [
  { key: "featured", label: groupLabels.featured },
  { key: "selected", label: groupLabels.selected },
];

// 확대 전환(썸네일 -> 전체 화면)이 가능한 화면 폭인가. 769px 미만에서는 썸네일 장면이 display:none이라 확대할 칸이 없다.
// useSyncExternalStore: 서버·하이드레이션 첫 렌더는 false(속성 없음)이고, 브라우저에서 곧바로 실제 값으로 바뀐다
const WIDE_QUERY = "(min-width: 769px)";
const subscribeWide = (cb: () => void) => {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * 홈 한 화면(100svh). 구성:
 *  1. 배경: 기본은 SceneCanvas(WebGL 셰이더, 끌면 회전). 알약 hover 때는 그 프로젝트의 대표 이미지(media.image)가 바로 덮는다.
 *     프로젝트 사이를 옮길 때는 새 이미지가 이전 이미지 "위에서" 짧게 크로스페이드한다(이전 이미지는 새 이미지가 다 덮을 때까지 그대로 → 셰이더가 비치지 않는다).
 *  2. 왼쪽 세로 알약 목록(서버 HTML에도 모두 <a>로 있어 JS가 꺼져도 이동 가능).
 *  3. 기본: 한 문장 헤드라인(두 줄) + View work 링크 + 소개문, 진입 때 순서대로 등장 / 알약 hover·focus: 프로젝트 전용 큰 제목·설명·분류·목업 썸네일(위치는 프로젝트 순서별 3가지 배치).
 *  4. 알약 클릭: 목업 썸네일이 화면 전체로 커진 뒤 이동하고, 상세의 히어로(같은 목업)로 내려앉는다(HandoffLayer).
 * hover와 키보드 focus가 같은 active 상태를 쓰므로 마우스 없이도 같은 정보가 나온다.
 */
export function HomeStage({ projects }: { projects: HomeProject[] }) {
  const router = useRouter();
  const [active, setActive] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const thumbs = useRef<(HTMLDivElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => false,
  );

  // 순차 등장(CSS 애니메이션, data-seq 요소)은 첫 페인트부터 CSS만으로 돈다(JS가 늦어도 안 막힌다).
  // 다만 다른 페이지에서 커튼·확대 전환으로 돌아오는 중(전환 신호등이 켜져 있음)이면 전환이 끝날 때까지 처음 상태로 멈춰 두었다가 그때 시작한다
  // (등장 연출이 가려진 화면 뒤에서 혼자 끝나지 않게. lib/transition-gate.ts)
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !isTransitionBusy()) return;
    el.setAttribute("data-seq-hold", "");
    el.getAnimations({ subtree: true }).forEach((a) => {
      a.currentTime = 0; // 이미 한두 프레임 돈 애니메이션을 처음으로 되돌린다
    });
    const cancel = whenTransitionIdle(() => el.removeAttribute("data-seq-hold"));
    return () => {
      cancel();
      el.removeAttribute("data-seq-hold");
    };
  }, []);

  // Cache Components는 다른 페이지로 가도 이 페이지를 숨긴 채(React Activity) 상태를 보관한다.
  // 그대로 두면 뒤로 가기·로고로 돌아왔을 때 "클릭 직후" 상태(알약 목록 투명, 눌렀던 프로젝트 장면)가 남는다.
  // 숨겨질 때 effect가 정리되므로, 그 정리 함수에서 기본 상태로 되돌려 둔다
  useEffect(
    () => () => {
      setLeaving(false);
      setActive(null);
    },
    [],
  );
  // 배경 이미지 층 상태. top = 지금 프로젝트(맨 위에서 나타남), under = 직전 프로젝트(새 이미지가 다 덮을 때까지 그대로 둔다),
  // out = 기본 상태로 돌아갈 때 서서히 사라지는 층. 나머지 층은 전환 없이 즉시 숨는다.
  // active가 바뀐 렌더 안에서 바로 계산한다("렌더 중 상태 보정": effect를 쓰면 한 프레임 늦어 그 사이 셰이더가 비친다)
  const [bg, setBg] = useState<{ for: number | null; top: number | null; under: number | null; out: number | null }>({
    for: null,
    top: null,
    under: null,
    out: null,
  });

  // 알약 순서: featured(Meerkit, Weave) -> selected(나머지 5개) -> Works(selected 그룹의 맨 끝). 데이터(project-data.ts) 순서가 그대로 순서다
  const items: Item[] = [
    ...projects.map((p) => ({
      key: p.slug,
      href: `/projects/${p.slug}`,
      name: p.shortName,
      desc: p.tagline,
      type: p.productType,
      tint: p.tint,
      media: p.media,
      thumb: true,
      group: p.group,
    })),
    {
      key: "works",
      // 맨 끝 알약: 작업 목록 페이지(/works)로 간다
      href: "/works",
      name: homeCopy.allWork,
      desc: homeCopy.allWorkTagline,
      type: null,
      tint: "indigo" as Tint,
      thumb: false,
      group: "selected" as ProjectGroup,
    },
  ];

  // 순차 등장 지연(초): 알약 목록은 헤드라인 뒤 1.0초부터 위에서 아래로 0.06초씩(그룹 라벨도 한 칸으로 센다)
  let seq = 0;
  const seqStyle = () => ({ "--d": `${(1.0 + 0.06 * seq++).toFixed(2)}s` }) as CSSProperties;
  const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

  if (bg.for !== active) {
    const next = active !== null && items[active].media?.image ? active : null;
    setBg(
      next === null
        ? { for: active, top: null, under: null, out: bg.top } // 기본 상태로: 지금 층만 서서히 사라진다
        : // 다른 프로젝트로: 이전 층은 새 층 아래에 그대로 남는다. 기본 상태에서 막 사라지던 층(out)은 하던 페이드를 마저 한다
          { for: active, top: next, under: bg.top, out: bg.top === null ? bg.out : null },
    );
  }
  // 이미지가 화면을 다 덮고 있으면 아래 셰이더는 그릴 필요가 없다(SceneCanvas가 페이드가 끝난 뒤 멈춘다)
  const covered = bg.top !== null;

  const onPillClick = (e: React.MouseEvent<HTMLAnchorElement>, i: number) => {
    // 새 탭/창 등 브라우저 기본 동작은 건드리지 않는다
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    // 다른 전환이 진행 중이면 이 클릭은 무시한다(연타 방지, lib/transition-machine.ts)
    if (isTransitionLocked()) {
      e.preventDefault();
      return;
    }
    const item = items[i];
    const thumb = thumbs.current[i];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = thumb?.getBoundingClientRect();
    // 썸네일이 없거나(Works) 화면에 안 보이거나(모바일·움직임 줄이기) 하면 확대 연출 없이 바로 이동한다
    if (!item.thumb || !r || r.width === 0 || reduce) return;
    e.preventDefault();
    setActive(i);
    setLeaving(true); // 알약 목록이 0.2초에 사라진다(측정). 제목·설명은 커지는 이미지가 덮을 때까지 그대로 둔다
    // 커지는 그림 = 썸네일과 같은 목업. ratio를 넘겨야 썸네일 안의 cover 그림과 확대 면의 그림이 정확히 겹친다
    const started = startHandoff({
      href: item.href,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      radius: 8,
      tint: item.tint,
      media: mockupMedia(item.media),
      ratio: item.media?.mockup ? MOCKUP_RATIO : undefined,
      sizes: THUMB_SIZES, // 썸네일이 이미 받은 파일을 확대 면의 첫 그림으로 다시 쓴다
    });
    if (!started) router.push(item.href);
  };

  return (
    <div ref={stageRef} className={styles.stage} data-active={active ?? "none"} data-leaving={leaving || undefined}>
      {/* 1. 배경 */}
      <div className={styles.bg} aria-hidden="true">
        {/* 셰이더는 항상 기본 장면(tint=null)만 그린다. hover 때 색조 장면으로 바꾸면 이미지가 덮기 전에 그 변화가 비친다(사용자 피드백) */}
        <SceneCanvas className={styles.canvas} tint={null} draggable paused={covered} />
        {/* 프로젝트 대표 이미지 층. eager: 첫 hover 때 이미지가 아직 안 받아져 빈 층(셰이더)이 보이지 않게 미리 받는다.
            --dim: 밝은 배경 위 흰 글자 대비를 맞추는 어둠(project-data의 media.dim) */}
        {items.map((it, i) =>
          it.media?.image ? (
            <div
              key={it.key}
              className={styles.bgMedia}
              data-bg={bg.top === i ? "top" : bg.under === i ? "under" : bg.out === i ? "out" : undefined}
              data-from-none={(bg.top === i && bg.under === null) || undefined}
              style={{ "--dim": it.media.dim ?? 0 } as CSSProperties}
            >
              <Media tint={it.tint} media={{ image: it.media.image }} label={false} eager />
            </div>
          ) : null,
        )}
      </div>

      <div className={styles.content}>
        {/* JS가 꺼져 있으면 순차 등장 없이 모두 바로 보인다(위계는 크기·대비가 맡는다) */}
        <noscript>
          <style>{"[data-seq]{animation:none !important}"}</style>
        </noscript>
        {/* 2. 알약 목록. 그룹 2개(Engineering = Meerkit·Weave를 크게 / Selected works = 나머지를 작게).
            목록 전체에서 포인터가 나가거나 포커스가 나가면 기본 상태로 돌아간다 */}
        <nav
          className={styles.pills}
          aria-label="Projects"
          onPointerLeave={() => !leaving && setActive(null)}
          onBlur={(e) => {
            if (!leaving && !e.currentTarget.contains(e.relatedTarget)) setActive(null);
          }}
        >
          {/* 힌트 라벨: 알약 목록 바로 위(목록 위치는 그대로). 터치 화면에는 hover가 없어 CSS가 숨긴다 */}
          <p className={styles.hint} aria-hidden="true" data-seq style={delay(0.9)}>
            {homeCopy.hint}
          </p>
          {GROUPS.map((g) => (
            <div key={g.key} className={styles.group} data-group={g.key}>
              <p className={styles.groupLabel} id={`pill-group-${g.key}`} data-seq style={seqStyle()}>
                {g.label}
              </p>
              <ul aria-labelledby={`pill-group-${g.key}`}>
                {items.map((it, i) =>
                  it.group !== g.key ? null : (
                    <li key={it.key} data-seq style={seqStyle()}>
                      {/* data-handoff-link: 이 알약은 자기 전환(썸네일 확대)이 있다. 이 표시가 없으면 전역 페이드(PageFade)가 캡처 단계에서 먼저
                          클릭을 가로채 자물쇠를 잡아 버려 아래 onPillClick이 확대를 시작하지 못했다(원인). 확대할 칸이 있는 넓은 화면에서만 단다:
                          좁은 화면(썸네일 없음)·Works 알약은 표시가 없어 전과 같이 페이드로 이동한다 */}
                      <Link
                        href={it.href}
                        className={`pill ${styles.pill}`}
                        data-active={active === i}
                        data-handoff-link={(it.thumb && wide) || undefined}
                        data-seq={i === 0 ? "" : undefined}
                        data-hint={i === 0 || undefined}
                        aria-describedby={`preview-desc-${i}`}
                        onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                        onFocus={() => setActive(i)}
                        onClick={(e) => onPillClick(e, i)}
                      >
                        {it.name}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* 3-a. 기본 상태: 한 문장 헤드라인 + 단일 행동(View work) + 소개문. 순서대로 나타난다(data-seq의 --d가 지연) */}
        <div className={styles.hero}>
          <div className={styles.heroMain}>
            <h1 className={styles.headline}>
              <span className={styles.line1} data-seq style={delay(0.15)}>
                {homeCopy.headline[0]}
              </span>
              <span className={styles.line2} data-seq style={delay(0.3)}>
                {homeCopy.headline[1]}
              </span>
            </h1>
            {/* 홈에서 가장 눈에 띄는 인터랙티브 요소. /works로 가는 일반 링크(페이지 페이드 전환) */}
            <Link href="/works" className={styles.cta} data-seq style={delay(0.75)}>
              {homeCopy.cta}
              <span className={styles.ctaArrow} aria-hidden="true">
                →
              </span>
            </Link>
          </div>
          <p className={styles.intro} data-seq style={delay(1.85)}>
            {homeCopy.intro}
          </p>
        </div>

        {/* 3-b. 알약별 hover 장면. 보이는 글자는 알약과 중복이라 스크린 리더에는 설명(aria-describedby)만 읽힌다 */}
        {items.map((it, i) => (
          <article
            key={it.key}
            className={styles.preview}
            data-variant={it.thumb ? i % 3 : "all"}
            data-on={active === i || undefined}
            style={{ "--tint": `var(${tintToken(it.tint)})` } as CSSProperties}
          >
            <h2 className={styles.title} aria-hidden="true">
              {it.name}
            </h2>
            <p className={styles.desc} id={`preview-desc-${i}`}>
              {it.desc}
            </p>
            {it.type && (
              <p className={styles.type} aria-hidden="true">
                {it.type}
              </p>
            )}
            {it.thumb && (
              <div
                className={styles.thumb}
                aria-hidden="true"
                // 프로젝트가 가로 프레임(media.aspect)을 정했으면 카드 비율을 그 값으로 바꾼다(CSS .thumb[data-wide])
                data-wide={it.media?.aspect ? "" : undefined}
                style={it.media?.aspect ? ({ "--thumb-aspect": it.media.aspect } as CSSProperties) : undefined}
                ref={(el) => {
                  thumbs.current[i] = el;
                }}
              >
                {/* 작은 썸네일은 기기 목업 장면(배경 이미지와 다른 그림). 클릭하면 이 그림이 그대로 커져 상세 히어로가 된다 */}
                <Media tint={it.tint} media={mockupMedia(it.media)} sizes={THUMB_SIZES} eager />
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
