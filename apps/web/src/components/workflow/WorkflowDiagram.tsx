"use client";

import { useRef, type JSX } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { MOTION, prefersReducedMotion, registerGsap } from "@/lib/motion";
import { whenTransitionIdle } from "@/lib/transition-gate";
import { flowCopy, flowLegend, flowMain, flowSide, type FlowNode } from "@/lib/workflow";
import styles from "./Workflow.module.css";

// ------------------------------------------------------------------
// 작업 흐름 도식(순수 인라인 SVG, 라이브러리 없음). 서버에서도 그대로 그려지고, 모션은 마운트 뒤 GSAP이 건다.
// 데스크톱(>=1100px): 2행 지그재그 = 윗줄 왼쪽->오른쪽, 아랫줄 오른쪽->왼쪽. 모바일: 세로 한 줄.
// 두 SVG를 모두 렌더하고 CSS가 하나만 보여 준다(가로 스크롤 없이 글자 크기를 지키려고 viewBox를 따로 둔다).
// ------------------------------------------------------------------

type Box = { x: number; y: number; w: number; h: number };
type Dir = "right" | "left" | "down" | "up";
type Edge = { line: string; head: string; dashed?: boolean; loop?: boolean };

// 화살표 머리(열린 V자). 끝점 (x,y)가 가리키는 방향에 따라 두 획을 그린다
function head(x: number, y: number, dir: Dir): string {
  const s = 6;
  const d = { right: [-s, -s, -s, s], left: [s, -s, s, s], down: [-s, -s, s, -s], up: [-s, s, s, s] }[dir];
  return `M${x + d[0]} ${y + d[1]} L${x} ${y} L${x + d[2]} ${y + d[3]}`;
}

const mid = (b: Box) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2 });

// ---- 데스크톱 배치: 6열 x 2행 + 아래 옆 가지 ----
const D = { w: 1200, h: 470, nw: 156, nh: 66, gap: 44, left: 22, row1: 36, row2: 196, row3: 356 };
const colX = (c: number) => D.left + c * (D.nw + D.gap);

function desktopLayout() {
  const boxes: Box[] = flowMain.map((_, i) => {
    const row1 = i < 6;
    const col = row1 ? i : 11 - i; // 아랫줄은 오른쪽(5열)에서 왼쪽으로
    return { x: colX(col), y: row1 ? D.row1 : D.row2, w: D.nw, h: D.nh };
  });
  // 옆 가지: 독립 검증(3열) 바로 아래 = 기록, 그 왼쪽(2열) = 방어 수준 상향
  const side: Box[] = [
    { x: colX(3), y: D.row3, w: D.nw, h: D.nh },
    { x: colX(2), y: D.row3, w: D.nw, h: D.nh },
  ];
  const edges: Edge[] = [];
  for (let i = 0; i < boxes.length - 1; i++) {
    const a = boxes[i];
    const b = boxes[i + 1];
    if (i === 5) {
      // 윗줄 끝 -> 아랫줄 시작: 아래로
      const { cx } = mid(a);
      edges.push({ line: `M${cx} ${a.y + a.h} L${cx} ${b.y}`, head: head(cx, b.y, "down") });
    } else if (i < 5) {
      const y = a.y + a.h / 2;
      edges.push({ line: `M${a.x + a.w} ${y} L${b.x} ${y}`, head: head(b.x, y, "right") });
    } else {
      const y = a.y + a.h / 2;
      edges.push({ line: `M${a.x} ${y} L${b.x + b.w} ${y}`, head: head(b.x + b.w, y, "left") });
    }
  }
  // 되돌아가는 루프: Fix loop(7) 아래 -> 외부 리뷰(6) 아래로 돌아 위로 들어간다
  const fix = boxes[7];
  const rev = boxes[6];
  const fx = mid(fix).cx;
  const rx = mid(rev).cx;
  const by = fix.y + fix.h;
  edges.push({ line: `M${fx} ${by} C${fx} ${by + 50} ${rx} ${by + 50} ${rx} ${by}`, head: head(rx, by, "up"), loop: true });
  // 옆 가지: 독립 검증 아래 -> 기록(점선), 기록 -> 방어 수준 상향
  const ver = boxes[8];
  const vx = mid(ver).cx;
  edges.push({ line: `M${vx} ${ver.y + ver.h} L${vx} ${side[0].y}`, head: head(vx, side[0].y, "down"), dashed: true });
  const sy = side[0].y + D.nh / 2;
  edges.push({ line: `M${side[0].x} ${sy} L${side[1].x + D.nw} ${sy}`, head: head(side[1].x + D.nw, sy, "left"), dashed: true });
  return { boxes, side, edges, loopLabel: { x: (fx + rx) / 2, y: by + 62 } };
}

// ---- 모바일 배치: 세로 한 줄(오른쪽 여백에 루프 화살표) ----
const M = { w: 358, nw: 276, nh: 56, pitch: 80, left: 14, top: 10 };

function mobileLayout() {
  const boxes: Box[] = flowMain.map((_, i) => ({ x: M.left, y: M.top + i * M.pitch, w: M.nw, h: M.nh }));
  const sideTop = M.top + flowMain.length * M.pitch + 40; // 옆 가지 머리글 자리
  const side: Box[] = [
    { x: M.left, y: sideTop, w: M.nw, h: M.nh },
    { x: M.left, y: sideTop + M.pitch, w: M.nw, h: M.nh },
  ];
  const edges: Edge[] = [];
  const down = (a: Box, b: Box, dashed?: boolean) => {
    const cx = a.x + a.w / 2;
    edges.push({ line: `M${cx} ${a.y + a.h} L${cx} ${b.y}`, head: head(cx, b.y, "down"), dashed });
  };
  for (let i = 0; i < boxes.length - 1; i++) down(boxes[i], boxes[i + 1]);
  // 루프: Fix(7) 오른쪽 -> 오른쪽 여백으로 나갔다가 외부 리뷰(6) 오른쪽으로 들어온다
  const fix = boxes[7];
  const rev = boxes[6];
  const x0 = fix.x + fix.w;
  const x1 = x0 + 40;
  const fy = fix.y + fix.h / 2;
  const ry = rev.y + rev.h / 2;
  edges.push({ line: `M${x0} ${fy} L${x1} ${fy} L${x1} ${ry} L${x0} ${ry}`, head: head(x0, ry, "left"), loop: true });
  down(side[0], side[1], true);
  return { boxes, side, edges, headY: sideTop - 16, h: side[1].y + M.nh + 10, loopX: x1 + 16, loopY: (fy + ry) / 2 };
}

// 박스 하나: 종류별 모양(AI = 둥근 실선, 자동화 = 둥근 점선, 사람 = 이중선 직각)
function NodeBox({ n, b, i, small }: { n: FlowNode; b: Box; i: number; small?: boolean }): JSX.Element {
  const cx = b.x + b.w / 2;
  return (
    <g data-wf="node" data-i={i} className={styles.node}>
      {n.kind === "human" ? (
        <>
          <rect className={styles.boxHuman} x={b.x} y={b.y} width={b.w} height={b.h} rx={2} />
          <rect className={styles.boxHuman} x={b.x + 4} y={b.y + 4} width={b.w - 8} height={b.h - 8} rx={1} />
        </>
      ) : (
        <rect className={n.kind === "auto" ? styles.boxAuto : styles.boxAi} x={b.x} y={b.y} width={b.w} height={b.h} rx={12} />
      )}
      <text className={styles.nodeTitle} x={cx} y={b.y + (small ? 26 : 29)} textAnchor="middle">
        {n.title}
      </text>
      <text className={styles.nodeSub} x={cx} y={b.y + (small ? 46 : 50)} textAnchor="middle">
        {n.sub}
      </text>
    </g>
  );
}

function EdgeView({ e, i }: { e: Edge; i: number }): JSX.Element {
  return (
    <g data-wf="edge" data-i={i} className={e.loop ? styles.edgeLoop : styles.edge}>
      {/* pathLength=1: 길이와 상관없이 dashoffset 1 -> 0으로 "그려지는" 모션을 걸 수 있다 */}
      <path className={e.dashed ? styles.lineDashed : styles.line} d={e.line} pathLength={1} />
      <path className={styles.head} d={e.head} />
    </g>
  );
}

function Legend({ x, y }: { x: number; y: number }): JSX.Element {
  return (
    <g data-wf="node" data-i={99} className={styles.node}>
      {flowLegend.map((l, k) => {
        const lx = x + k * 112;
        return (
          <g key={l.kind}>
            {l.kind === "human" ? (
              <>
                <rect className={styles.boxHuman} x={lx} y={y} width={22} height={16} rx={1} />
                <rect className={styles.boxHuman} x={lx + 3} y={y + 3} width={16} height={10} rx={1} />
              </>
            ) : (
              <rect className={l.kind === "auto" ? styles.boxAuto : styles.boxAi} x={lx} y={y} width={22} height={16} rx={5} />
            )}
            <text className={styles.legend} x={lx + 30} y={y + 13}>
              {l.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function WorkflowDiagram(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const d = desktopLayout();
  const m = mobileLayout();

  // 스크롤 진입 때: 박스가 순서대로 나타나고 화살표 선이 그려진다. 모션 줄이기·JS 없음은 최종 상태 그대로(숨김은 여기서만 건다)
  useGSAP(
    (_c, contextSafe) => {
      const root = ref.current;
      if (!root || !contextSafe || prefersReducedMotion()) return;
      registerGsap();
      // 지금 화면에 그려진 SVG만(다른 하나는 display:none)
      const svgs = Array.from(root.querySelectorAll<SVGSVGElement>("svg")).filter((s) => s.getClientRects().length > 0);
      const cancels: Array<() => void> = [];
      svgs.forEach((svg) => {
        const nodes = Array.from(svg.querySelectorAll<SVGGElement>('[data-wf="node"]'));
        const edges = Array.from(svg.querySelectorAll<SVGGElement>('[data-wf="edge"]'));
        const lines = edges.map((e) => e.querySelector<SVGPathElement>("path:first-child")!);
        const heads = edges.map((e) => e.querySelector<SVGPathElement>("path:last-child")!);
        gsap.set(nodes, { opacity: 0 });
        gsap.set(heads, { opacity: 0 });
        gsap.set(lines, { strokeDasharray: 1, strokeDashoffset: 1 });
        const play = contextSafe(() => {
          const tl = gsap.timeline({
            defaults: { ease: MOTION.ease },
            scrollTrigger: { trigger: svg, start: MOTION.start, once: true },
            onComplete: () => {
              gsap.set([...nodes, ...heads, ...lines], { clearProps: "opacity,strokeDasharray,strokeDashoffset" });
            },
          });
          const step = MOTION.stagger * 2.5; // 한 단계(박스 -> 선)의 간격
          const dur = MOTION.enter * 0.5;
          // 주 흐름 순서대로: 박스 i 나타남 -> 박스 i와 i+1 사이 선이 그려짐
          nodes.forEach((n, i) => tl.to(n, { opacity: 1, duration: dur }, i * step));
          edges.forEach((_, i) => {
            tl.to(lines[i], { strokeDashoffset: 0, duration: dur }, i * step + step * 0.5);
            tl.to(heads[i], { opacity: 1, duration: dur * 0.5 }, i * step + step * 0.5 + dur * 0.7);
          });
        });
        cancels.push(whenTransitionIdle(play));
      });
      return () => cancels.forEach((c) => c());
    },
    { scope: ref, revertOnUpdate: false },
  );

  return (
    <div ref={ref} className={styles.diagram}>
      {/* 데스크톱 */}
      <svg className={styles.svgDesktop} viewBox={`0 0 ${D.w} ${D.h}`} role="img" aria-labelledby="wf-title wf-desc">
        <title id="wf-title">{flowCopy.title}</title>
        <desc id="wf-desc">{flowCopy.desc}</desc>
        {d.edges.map((e, i) => (
          <EdgeView key={i} e={e} i={i} />
        ))}
        {flowMain.map((n, i) => (
          <NodeBox key={n.id} n={n} b={d.boxes[i]} i={i} />
        ))}
        {flowSide.map((n, i) => (
          <NodeBox key={n.id} n={n} b={d.side[i]} i={i + 9} />
        ))}
        <text className={styles.loopLabel} x={d.loopLabel.x} y={d.loopLabel.y} textAnchor="middle">
          {flowCopy.loopLabel}
        </text>
        <Legend x={colX(4) + 20} y={D.row3 + 26} />
      </svg>

      {/* 모바일 */}
      <svg className={styles.svgMobile} viewBox={`0 0 ${M.w} ${m.h + 40}`} role="img" aria-labelledby="wf-title-m wf-desc-m">
        <title id="wf-title-m">{flowCopy.title}</title>
        <desc id="wf-desc-m">{flowCopy.desc}</desc>
        {m.edges.map((e, i) => (
          <EdgeView key={i} e={e} i={i} />
        ))}
        {flowMain.map((n, i) => (
          <NodeBox key={n.id} n={n} b={m.boxes[i]} i={i} small />
        ))}
        <text className={styles.legend} x={M.left} y={m.headY}>
          옆 가지 · 마무리 때 기록
        </text>
        {flowSide.map((n, i) => (
          <NodeBox key={n.id} n={n} b={m.side[i]} i={i + 9} small />
        ))}
        <text className={styles.loopLabel} x={m.loopX} y={m.loopY} textAnchor="middle" transform={`rotate(-90 ${m.loopX} ${m.loopY})`}>
          최대 2회
        </text>
        <Legend x={M.left} y={m.h + 12} />
      </svg>
    </div>
  );
}
