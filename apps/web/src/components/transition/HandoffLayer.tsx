"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Media } from "@/components/media/Media";
import { SceneCanvas } from "@/components/scene/SceneCanvas";
import { endHandoff, onHandoff, releaseHandoffGate, visibleQuery, type Handoff } from "@/lib/handoff";
import { prefersReducedMotion } from "@/lib/motion";
import { cancelTransition, onTransitionCancel } from "@/lib/transition-machine";
import { TL } from "@/lib/transition-timeline";
import styles from "./HandoffLayer.module.css";

/*
 * 시간·곡선은 전부 lib/transition-timeline.ts(TL)의 한 벌이다. 메뉴 프레임 조각(CSS)과 같은 값을 쓰므로 둘이 항상 같은 진행도로 움직인다.
 * 원래 측정(metalab.com, 홈 알약 클릭 -> 케이스 스터디)은: 알약 목록 0.2초 페이드, 썸네일이 화면 전체로 약 1초 커짐, 도착 후 약 1초 내려앉기,
 * 메뉴에서 Works·About으로 갈 때는 전체 화면 그림이 아래로 미끄러져 빠짐(약 0.45초). 이 사이트는 그 모양을 지키되 시간표를 단일 타임라인으로 맞췄다.
 *  OUT  : 시작 칸 -> 화면 전체(clip-path inset + transform). 메뉴 프레임 조각이 물러나는 것과 같은 시각·길이·곡선
 *  ENTER: OUT이 끝난 바로 그 프레임에 시작. 새 페이지 요소 등장(게이트 해제)과 면 걷기(내려앉기/아래로 빠지기/녹기)가 같은 시작·길이·곡선
 * 여기서는 같은 동작을 clip-path(inset)와 transform으로 만든다(레이아웃을 건드리지 않는 합성 속성만).
 */
const TARGET_TIMEOUT_MS = 3000; // 새 페이지가 스트리밍 중이면 히어로 칸을 이만큼 기다린다
const GUARD_MS = 9000; // 어떤 이유로든 끝나지 않으면 면을 걷는 안전장치

type Box = { bw: number; bh: number };

/** 그림 상자(bw x bh, 원점 왼쪽 위)를 사각형(x,y,w,h)을 덮도록(cover) 배치하는 transform. 사각형 중심에 상자 중심을 맞춘다 */
function coverTransform({ bw, bh }: Box, x: number, y: number, w: number, h: number): string {
  const s = Math.max(w / bw, h / bh);
  return `translate(${x + w / 2 - (bw * s) / 2}px, ${y + h / 2 - (bh * s) / 2}px) scale(${s})`;
}

function insetOf(vw: number, vh: number, x: number, y: number, w: number, h: number, r: number): string {
  return `inset(${y}px ${vw - x - w}px ${vh - y - h}px ${x}px round ${r}px)`;
}

/**
 * 그림 상자 크기. 그림의 원본 비율(ratio)을 그대로 쓴다: 이 상자를 어떤 칸에 cover로 맞추면
 * 그 칸 안에서 object-fit: cover로 그린 같은 그림과 정확히 겹친다(시작 썸네일·전체 화면·도착 히어로 모두).
 */
function boxOf(vw: number, ratio: number | undefined): Box {
  const r = ratio && Number.isFinite(ratio) && ratio > 0 ? ratio : vw / window.innerHeight;
  return { bw: vw, bh: vw / r };
}

/**
 * 이미지를 누르면: (1) 그 칸이 마스크가 되어 화면 전체로 열림 (2) 이동 (3) 도착하면 히어로 자리로 내려앉거나(settle) 아래로 빠진다(slide).
 * 레이아웃에 한 번만 있어서 페이지를 옮겨도 이 면이 유지된다(그래서 "이어받는" 느낌이 난다).
 * 연출 도중 뒤로 가기·다른 이동이 일어나면 즉시 걷는다(잔여 면이 남지 않게).
 */
export function HandoffLayer() {
  const router = useRouter();
  const pathname = usePathname();
  const [h, setH] = useState<Handoff | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const startPath = useRef("");
  // 이동을 이미 시켰는가(또는 시킬 필요가 없는가). 메뉴가 가리고 있을 때(framed)는 처음부터 true
  const [pushed, setPushed] = useState(false);
  // ENTER 시작 조건 두 가지(OUT이 끝남 / 새 페이지 도착)는 ref로 들고, 둘째가 갖춰지는 즉시 같은 콜백 안에서 ENTER를 시작한다.
  // (상태 -> 렌더 -> effect를 거치면 매번 한두 프레임이 더 걸려 OUT 끝과 ENTER 시작 사이에 틈이 생긴다)
  const hRef = useRef<Handoff | null>(null);
  const outDoneRef = useRef(false);
  const arrivedRef = useRef(false);
  const enterStarted = useRef(false);
  const enterCleanup = useRef<() => void>(() => {});
  // 셰이더 면: 첫 프레임이 그려지기 전에는 면을 숨겨 둔다(아래 메뉴 창의 같은 장면이 그대로 보이므로 빈 캔버스가 번쩍이지 않는다)
  const [sceneReady, setSceneReady] = useState(false);
  // 화면 크기(100vw) 그림을 얹을 차례인가. 면이 화면을 다 덮은 뒤에 켠다(작게 줄어든 상태에서 받으면 쓸데없이 큰 파일을 먼저 받고, Next가 sizes 경고를 낸다)
  const [hires, setHires] = useState(false);

  useEffect(
    () =>
      onHandoff((next) => {
        startPath.current = window.location.pathname;
        setPushed(!!next.framed);
        setHires(false);
        setSceneReady(false);
        setH(next);
      }),
    [],
  );

  // 뒤로/앞으로 가기(popstate)는 사용자의 의도가 우선이라 진행 중인 모든 전환을 취소한다(상태 기계 -> 각 주인이 자기 정리를 한다).
  // 이 레이어의 정리: 면을 걷고 자물쇠·게이트를 푼다. 언마운트될 때도 같은 정리를 해서 면·자물쇠가 남지 않게 한다
  useEffect(() => {
    const off = onTransitionCancel(() => {
      setH(null);
      endHandoff();
    });
    window.addEventListener("popstate", cancelTransition);
    return () => {
      off();
      window.removeEventListener("popstate", cancelTransition);
      endHandoff();
    };
  }, []);

  // 우리가 이동시키기 전에 경로가 바뀌었다면(다른 링크·뒤로 가기) 이 연출은 무효다. "렌더 중 상태 보정"으로 같은 렌더에서 걷는다
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    if (h && !pushed) {
      setH(null);
      endHandoff();
    }
  }

  // 2단계(ENTER): OUT이 끝났고 새 페이지가 도착했으면, 도착한 히어로 자리로 내려앉거나(settle) 아래로 빠진다(slide).
  // 시작과 동시에 새 페이지의 등장 연출 게이트를 푼다 -> 면이 걷히는 것과 새 페이지 요소가 나타나는 것이 같은 시작·길이·곡선으로 움직인다
  const tryEnter = useCallback(() => {
    const h = hRef.current;
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!h || !box || !inner || enterStarted.current || !outDoneRef.current || !arrivedRef.current) return;
    enterStarted.current = true;
    let raf = 0;
    let cancelled = false;
    const t0 = performance.now();
    const anims: Animation[] = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const b = boxOf(vw, h.ratio);
    // 1단계 애니메이션이 정리(cancel)되며 인라인 값이 사라지므로, 전체 화면 상태를 바로 다시 고정해 둔다(한 프레임 깜빡임 방지)
    box.style.clipPath = insetOf(vw, vh, 0, 0, vw, vh, 0);
    inner.style.transform = coverTransform(b, 0, 0, vw, vh);

    const finish = () => {
      setH(null);
      endHandoff();
    };
    const opts: KeyframeAnimationOptions = { duration: TL.enter.ms, easing: TL.enter.ease, fill: "forwards" };

    // 마무리 A: 아래로 미끄러져 빠진다(그림 전체가 아래로 이동)
    const leave = () => {
      releaseHandoffGate();
      const a = box.animate([{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], prefersReducedMotion() ? { ...opts, duration: 1 } : opts);
      anims.push(a);
      a.onfinish = finish;
    };

    const tick = () => {
      if (cancelled) return;
      const waited = performance.now() - t0;
      // 히어로가 있는 페이지(settle)면 새 페이지의 "화면에 그려진" 히어로 칸을 찾는다(숨은 이전 페이지의 칸은 제외). 찾는 즉시 시작한다(고정 대기 없음)
      const target = h.exit === "slide" ? null : visibleQuery("[data-handoff-target]");
      if (h.exit !== "slide" && !target && waited < TARGET_TIMEOUT_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!target || prefersReducedMotion()) {
        leave();
        return;
      }
      // 마무리 B: 히어로 칸으로 내려앉는다. 마스크(clip)와 그림(transform)이 같은 곡선으로 칸에 맞춰진다
      releaseHandoffGate();
      const r = target.getBoundingClientRect();
      const clip = box.animate([{ clipPath: insetOf(vw, vh, 0, 0, vw, vh, 0) }, { clipPath: insetOf(vw, vh, r.left, r.top, r.width, r.height, 0) }], opts);
      const move = inner.animate([{ transform: coverTransform(b, 0, 0, vw, vh) }, { transform: coverTransform(b, r.left, r.top, r.width, r.height) }], opts);
      anims.push(clip, move);
      // 다 내려앉으면 아래의 히어로(같은 그림)에 아주 짧게 겹쳐 넘겨준다
      clip.onfinish = () => {
        const fade = box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: TL.handoverMs, fill: "forwards" });
        anims.push(fade);
        fade.onfinish = finish;
      };
    };
    tick(); // 첫 시도는 기다리지 않고 바로(rAF를 거치지 않는다)
    enterCleanup.current = () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      anims.forEach((a) => a.cancel());
    };
  }, []);

  // 연출이 바뀌거나 끝나면 ENTER 조건·정리 함수를 초기화한다(이 effect는 아래 두 effect보다 먼저 선언되어 먼저 실행된다)
  useEffect(() => {
    hRef.current = h;
    outDoneRef.current = false;
    arrivedRef.current = false;
    enterStarted.current = false;
    return () => {
      enterCleanup.current();
      enterCleanup.current = () => {};
    };
  }, [h]);

  // 1단계: 시작 칸 -> 화면 전체, 끝나면 라우팅
  useEffect(() => {
    const box = boxRef.current;
    const inner = innerRef.current;
    if (!h || !box || !inner) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const b = boxOf(vw, h.ratio);
    inner.style.width = `${b.bw}px`;
    inner.style.height = `${b.bh}px`;
    router.prefetch(h.href); // 이동 전에 미리 받아 둔다(OUT이 끝나고 이동할 때 도착이 빠르게)
    const { x, y, w, h: rh } = h.rect;
    const opts: KeyframeAnimationOptions = { duration: TL.out.ms, delay: TL.out.delay, easing: TL.out.ease, fill: "both" };
    const clip = box.animate([{ clipPath: insetOf(vw, vh, x, y, w, rh, h.radius ?? 8) }, { clipPath: insetOf(vw, vh, 0, 0, vw, vh, 0) }], opts);
    const move = inner.animate([{ transform: coverTransform(b, x, y, w, rh) }, { transform: coverTransform(b, 0, 0, vw, vh) }], opts);
    // 메뉴 프레임이 이전 페이지를 가리고 있으면 지금 바로 이동한다: 새 페이지는 가려진 채 OUT 동안 준비되고, 진입 연출은 게이트가 붙잡고 있다
    if (h.framed) router.push(h.href);
    clip.onfinish = () => {
      setHires(true);
      outDoneRef.current = true;
      tryEnter(); // 새 페이지가 이미 와 있으면 OUT이 끝난 바로 이 콜백에서 ENTER를 시작한다
      // 가리는 게 없을 때(홈 알약·목록 행·다음 프로젝트)는 면이 화면을 다 덮은 지금 이동한다(대기 없이)
      if (!h.framed) {
        setPushed(true);
        router.push(h.href);
      }
    };
    const guard = window.setTimeout(() => {
      setH(null);
      endHandoff();
    }, GUARD_MS);
    return () => {
      clip.cancel();
      move.cancel();
      window.clearTimeout(guard);
    };
  }, [h, router, tryEnter]);

  // 새 페이지 도착(경로가 시작 경로와 달라짐): OUT이 이미 끝났다면 이 effect 안에서 바로 ENTER를 시작한다
  useEffect(() => {
    if (!h || !pushed || pathname === startPath.current) return;
    arrivedRef.current = true;
    tryEnter();
  }, [pathname, pushed, h, tryEnter]);

  if (!h) return null;
  return (
    <div ref={boxRef} className={styles.box} aria-hidden="true" data-handoff-layer data-wait={(h.scene && !sceneReady) || undefined}>
      <div ref={innerRef} className={styles.inner}>
        {h.scene ? (
          // 셰이더 면: 메뉴 창의 hover 장면과 같은 형태·같은 확대(zoom 0.5)로 그린다. 상자 비율이 창과 같아 시작 칸에서 두 장면이 정확히 겹친다
          <SceneCanvas className={styles.scene} tint={null} shape={h.scene} zoom={0.5} onFirstFrame={() => setSceneReady(true)} />
        ) : (
          <>
            {/* 아래 장: 시작 칸과 같은 파일(캐시) -> 첫 프레임부터 보인다. 시작 칸 sizes를 모르면 작은 파일(40vw)을 바로 받는다 */}
            <Media tint={h.tint} media={h.media} label={false} sizes={h.sizes ?? "40vw"} eager />
            {/* 위 장: 화면을 다 덮은 뒤 받는 선명한 화면 크기 파일. 상세 히어로(sizes 100vw)와 같은 파일이라 도착 후에도 캐시로 이어진다 */}
            {hires && (
              <div className={styles.hires}>
                <Media tint={h.tint} media={h.media} label={false} sizes="100vw" eager />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
