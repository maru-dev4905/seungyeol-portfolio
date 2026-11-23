"use client";

import { useEffect, useRef } from "react";
import type { Tint } from "@/lib/projects";
import { tintToken } from "@/lib/tint";
import { createFullscreenProgram, readColor } from "./webgl";
import { sceneFrag } from "./scene.frag";
import { SHAPES, type SceneShape } from "./shapes";

type Props = {
  /** null이면 기본 오브젝트(크롬 별), 값이 있으면 그 프로젝트의 색조 장면 */
  tint: Tint | null;
  /** 1 = 전체. 메뉴 가운데 미디어처럼 가까이 보려면 키운다 */
  zoom?: number;
  /** true면 끌어서(Drag) 오브젝트를 돌리고 옮길 수 있다 */
  draggable?: boolean;
  /** true면 그리기를 멈춘다(홈에서 프로젝트 이미지가 화면을 다 덮은 동안). 덮는 페이드가 끝난 뒤(PAUSE_DELAY) 멈춘다 */
  paused?: boolean;
  /** 오브젝트 형태(shapes.ts). 바뀌면 약 0.3초 동안 막대 배치 파라미터가 부드럽게 섞인다(셰이더 보간). 기본은 홈의 크롬 별 */
  shape?: SceneShape;
  /** 첫 프레임을 그린 직후 한 번 부른다(확대 면이 "그려진 뒤에" 나타나게 하려는 용도) */
  onFirstFrame?: () => void;
  className?: string;
};

// 덮는 이미지의 페이드(최대 0.5초)가 끝날 때까지는 계속 그린다. 바로 멈추면 페이드 중에 장면이 굳어 보인다
const PAUSE_DELAY = 600;

// 성능: 가만히 흘러가는 동안(드래그·전환이 없을 때)은 30fps로 그린다(셰이더가 무거워 60fps는 낭비다). 화면 픽셀 수도 예산을 둔다
const IDLE_FRAME_MS = 25; // 60Hz 화면에서 프레임 하나를 건너뛰면 약 33ms -> 30fps. 25ms 문턱은 타이머 오차로 두 프레임씩 건너뛰지 않게 한다
const PIXEL_BUDGET = 2_400_000; // 1440x900 화면에서 dpr 1.36 정도

const SEEDS: Record<Tint, number> = { indigo: 0.0, red: 1.0, teal: 2.0 };
const TINTS: Tint[] = ["indigo", "red", "teal"];

/**
 * 영상이 없을 때 홈 배경을 그리는 WebGL 캔버스(셰이더는 scene.frag.ts).
 * - tint가 바뀌면 약 0.3초 동안 장면(uMix)과 색조가 부드럽게 섞인다 -> 알약 hover의 배경 크로스페이드
 * - draggable이면 포인터를 끌 때 회전/이동하고, 놓으면 속도가 줄어들며(관성) 멈춘다
 * - 가만히 있어도 조명·기울기·위치가 천천히 흘러간다(셰이더의 uTime). 드래그와는 더해질 뿐 서로 막지 않는다. 30fps, 탭·화면 밖에서는 정지
 * - 움직임 줄이기: 연속 애니메이션과 드래그를 끄고, 값이 바뀔 때 한 번만 다시 그린다(정지 프레임)
 * WebGL2가 없으면 아무것도 그리지 않는다(부모의 CSS 바탕만 보인다).
 * React 상태 대신 ref에 값을 두는 이유: 프레임마다 리렌더가 일어나지 않게 하려는 것이다.
 */
export function SceneCanvas({ tint, zoom = 1, draggable = false, paused = false, shape = "home", onFirstFrame, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 부모가 준 최신 props를 rAF 루프가 읽는다(루프 안에서 클로저가 낡지 않게)
  const propsRef = useRef({ tint, zoom, shape });
  const firstFrameRef = useRef(onFirstFrame);
  // 렌더 중에는 ref를 건드리지 않고, 렌더가 끝난 뒤(effect)에 최신 값을 넣는다
  useEffect(() => {
    propsRef.current = { tint, zoom, shape };
    firstFrameRef.current = onFirstFrame;
  });
  // 외부(props 변경)가 루프를 깨우는 함수. reduced-motion에서 "한 번 다시 그리기"에도 쓴다
  const kickRef = useRef<() => void>(() => {});
  // 루프를 멈추고/다시 돌리는 함수. 그리기 effect가 만들어 넣고, paused effect가 부른다
  const runRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const built = createFullscreenProgram(gl, sceneFrag);
    if (!built) return;
    const { program, uniforms } = built;
    gl.useProgram(program);

    const root = document.documentElement;
    const tintRgb = Object.fromEntries(TINTS.map((t) => [t, readColor(root, tintToken(t))])) as Record<Tint, [number, number, number]>;
    const violet = readColor(root, "--chrome-violet");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 현재 상태(ref 객체). mix/tint는 목표값을 향해 매 프레임 다가간다
    const s = {
      mix: propsRef.current.tint ? 1 : 0,
      color: [...(tintRgb[propsRef.current.tint ?? "indigo"])] as number[],
      seed: SEEDS[propsRef.current.tint ?? "indigo"],
      rot: 0,
      rotV: 0,
      ox: 0,
      oy: 0,
      ovx: 0,
      ovy: 0,
      dragging: false,
      lastX: 0,
      lastY: 0,
      // 형태 파라미터(shapes.ts)의 현재 값. 목표(propsRef.current.shape)를 향해 매 프레임 다가간다
      shape: [...SHAPES[propsRef.current.shape]] as number[],
    };
    let drewOnce = false;

    const resize = () => {
      // 비용을 위해 1.5배까지만, 그리고 전체 픽셀 수가 PIXEL_BUDGET을 넘지 않도록 렌더 크기를 줄인다(CSS가 캔버스를 화면 크기로 늘려 준다)
      const area = Math.max(1, canvas.clientWidth * canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(PIXEL_BUDGET / area));
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = (time: number) => {
      resize();
      gl.uniform2f(uniforms.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniforms.uTime, reduced ? 0 : time);
      gl.uniform1f(uniforms.uMix, s.mix);
      gl.uniform3f(uniforms.uTint, s.color[0], s.color[1], s.color[2]);
      gl.uniform3f(uniforms.uViolet, violet[0], violet[1], violet[2]);
      gl.uniform1f(uniforms.uSeed, s.seed);
      gl.uniform1f(uniforms.uRot, s.rot);
      gl.uniform2f(uniforms.uOff, s.ox, s.oy);
      gl.uniform1f(uniforms.uZoom, propsRef.current.zoom);
      gl.uniform4f(uniforms.uShape, s.shape[0], s.shape[1], s.shape[2], s.shape[3]);
      gl.uniform2f(uniforms.uShape2, s.shape[4], s.shape[5]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!drewOnce) {
        drewOnce = true;
        // 첫 그림이 화면에 올라간 다음 프레임에 알린다(그리기와 같은 프레임에 알리면 아직 비어 있는 캔버스가 보일 수 있다)
        requestAnimationFrame(() => firstFrameRef.current?.());
      }
    };

    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const t0 = last;
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const { tint: want } = propsRef.current;
      // 장면 섞임: 0.3초 안쪽에서 목표에 도착하도록 지수 감쇠(k=12 -> 약 0.25초에 95%)
      const k = 1 - Math.exp(-12 * dt);
      s.mix += ((want ? 1 : 0) - s.mix) * k;
      if (want) {
        const target = tintRgb[want];
        for (let i = 0; i < 3; i++) s.color[i] += (target[i] - s.color[i]) * k;
        s.seed += (SEEDS[want] - s.seed) * k;
      }
      // 형태 섞임: 같은 지수 감쇠. 목표 파라미터에 다가가는 동안 막대들이 부드럽게 움직이며 다른 형태가 된다
      const goal = SHAPES[propsRef.current.shape];
      let shapeGap = 0;
      for (let i = 0; i < 6; i++) {
        s.shape[i] += (goal[i] - s.shape[i]) * k;
        shapeGap += Math.abs(goal[i] - s.shape[i]);
      }
      // 드래그 관성: 놓은 뒤 속도가 프레임마다 약 6%씩 줄어든다(60fps 기준)
      if (!s.dragging) {
        const decay = Math.pow(0.94, dt * 60);
        s.rot += s.rotV * dt;
        s.ox += s.ovx * dt;
        s.oy += s.ovy * dt;
        s.rotV *= decay;
        s.ovx *= decay;
        s.ovy *= decay;
      }
      // 사용자가 끌거나 관성·장면 전환이 진행 중이면 매 프레임, 아니면 30fps로 그린다
      const busy =
        s.dragging || Math.abs(s.rotV) > 0.01 || Math.abs(s.ovx) + Math.abs(s.ovy) > 0.01 || Math.abs((want ? 1 : 0) - s.mix) > 0.002 || shapeGap > 0.002;
      if (busy || now - lastDraw >= IDLE_FRAME_MS) {
        lastDraw = now;
        draw((now - t0) / 1000);
      }
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // 움직임 줄이기: 목표값으로 바로 이동하고 한 번만 그린다
    kickRef.current = () => {
      if (!reduced) return;
      const want = propsRef.current.tint;
      s.mix = want ? 1 : 0;
      if (want) {
        s.color = [...tintRgb[want]];
        s.seed = SEEDS[want];
      }
      s.shape = [...SHAPES[propsRef.current.shape]];
      draw(0);
    };

    // ---- 드래그 ----
    // 버튼·링크 위에서 시작한 눌림은 드래그가 아니다(알약 클릭이 우선)
    const onDown = (e: PointerEvent) => {
      if (!draggable || reduced || e.button !== 0) return;
      if ((e.target as Element).closest("a, button, [data-nodrag]")) return;
      s.dragging = true;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.rotV = s.ovx = s.ovy = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!s.dragging) return;
      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      const h = window.innerHeight;
      // 가로로 끌면 오브젝트가 돌고(1000px 끌면 약 3라디안), 따라서 화면 높이 기준으로 조금 옮겨진다
      const dRot = dx * 0.003;
      const dOx = (dx / h) * 0.35;
      const dOy = (-dy / h) * 0.35;
      s.rot += dRot;
      s.ox = Math.max(-0.8, Math.min(0.8, s.ox + dOx));
      s.oy = Math.max(-0.6, Math.min(0.6, s.oy + dOy));
      // 마지막 움직임을 속도로 기억해 두었다가 놓을 때 관성으로 쓴다(60fps 기준 초당 값으로 환산)
      s.rotV = dRot * 60;
      s.ovx = dOx * 60;
      s.ovy = dOy * 60;
    };
    const onUp = () => {
      s.dragging = false;
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    // 움직임 줄이기: 크기가 바뀔 때만 다시 그린다(정리할 수 있게 함수를 변수에 둔다)
    const onResize = () => draw(0);
    runRef.current = { start: () => !reduced && start(), stop };
    if (reduced) {
      draw(0);
      window.addEventListener("resize", onResize);
    } else if (!pausedRef.current) {
      start();
    }
    // 탭이 가려지거나 캔버스가 화면 밖이면(예: 다른 페이지로 가서 이 페이지가 숨겨짐) 그리지 않는다
    let onScreen = true;
    const onVis = () => (document.hidden || pausedRef.current || !onScreen ? stop() : !reduced && start());
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      onVis();
    });
    io.observe(canvas);

    return () => {
      stop();
      runRef.current = null;
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      // 컨텍스트를 일부러 잃게(loseContext) 하지 않는다: 개발 모드(StrictMode)는 effect를 두 번 실행하는데,
      // 같은 캔버스에서 이미 잃은 컨텍스트를 다시 받으면 셰이더 컴파일이 실패한다. 캔버스가 사라지면 브라우저가 정리한다.
      gl.deleteProgram(program);
    };
  }, [draggable]);

  // 멈춤/재개: 재개는 바로(덮던 이미지가 사라지기 시작하면 장면이 움직이고 있어야 한다), 멈춤은 페이드가 끝난 뒤
  useEffect(() => {
    pausedRef.current = paused;
    if (!paused) {
      if (!document.hidden) runRef.current?.start(); // (화면 밖이면 IntersectionObserver가 곧 다시 멈춘다)
      return;
    }
    const t = window.setTimeout(() => runRef.current?.stop(), PAUSE_DELAY);
    return () => window.clearTimeout(t);
  }, [paused]);

  // reduced-motion에서는 장면 값이 바뀔 때만 다시 그린다
  useEffect(() => {
    kickRef.current();
  }, [tint, zoom, shape]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
