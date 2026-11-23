"use client";

import { useEffect, useRef } from "react";
import type { ProjectSection } from "@/lib/projects";
import { Timeline } from "@/components/timeline/Timeline";
import { prefersReducedMotion } from "@/lib/motion";
import { Inline } from "./Inline";

type Props = { section: Extract<ProjectSection, { type: "timeline" }> };

/**
 * 타임라인 섹션: 세로선 + 원형 노드(Timeline). 사건 문장이 제목, 날짜가 제목 아래 작은 회색 메타(<time>).
 * 스크롤 점등: 노드가 화면 세로 중앙선을 지나면 그 항목이 켜진다(빈 원 -> 채워진 노드 + 글로우 링, 글자 회색 -> 흰색).
 * 선은 "중앙선이 지나간 만큼" 위에서 아래로 채워진다. 스크롤을 되돌리면 같은 규칙으로 꺼진다(상태를 저장하지 않고 매번 위치로 계산한다).
 * JS가 없거나 움직임 줄이기면 아무것도 걸지 않는다 -> CSS 기본값(전부 점등)인 정적 상태로 읽힌다.
 * 구현: 스크롤·리사이즈를 requestAnimationFrame으로 묶어 한 프레임에 한 번, 항목 수(10개 안팎)만큼 getBoundingClientRect를 읽고
 *       항목(li)에 data-lit과 --seg(그 노드에서 다음 노드까지 선이 채워진 비율 0~1)를 쓴다. 리렌더 없이 DOM 속성만 바꾼다.
 */
export function TimelineSection({ section }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const list = root?.querySelector("ol");
    if (!root || !list || prefersReducedMotion()) return;
    const items = Array.from(list.children) as HTMLElement[];
    list.setAttribute("data-armed", ""); // 여기서부터 CSS가 "꺼진 항목"을 어둡게 그린다(기본은 전부 켜짐)
    let raf = 0;

    const update = () => {
      raf = 0;
      const mid = window.innerHeight / 2; // 화면 세로 중앙선
      // 각 노드 중심의 화면 y
      const ys = items.map((li) => {
        const r = li.querySelector("[data-tl-node]")?.getBoundingClientRect();
        return r ? r.top + r.height / 2 : Infinity;
      });
      items.forEach((li, i) => {
        const lit = ys[i] <= mid;
        if (lit) li.setAttribute("data-lit", "");
        else li.removeAttribute("data-lit");
        // 이 노드에서 다음 노드까지의 선: 중앙선이 그 구간을 지나간 만큼 채운다
        const next = ys[i + 1];
        const seg = next === undefined ? 0 : Math.min(1, Math.max(0, (mid - ys[i]) / (next - ys[i])));
        li.style.setProperty("--seg", seg.toFixed(3));
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      // 정리: 걸어 둔 속성을 모두 되돌려 정적(전부 점등) 상태로 둔다(숨겨진 페이지·언마운트에서 누수 없음)
      list.removeAttribute("data-armed");
      items.forEach((li) => {
        li.removeAttribute("data-lit");
        li.style.removeProperty("--seg");
      });
    };
  }, []);

  return (
    <div ref={ref}>
      <Timeline
        variant="log"
        scroll
        items={section.meta.map((e) => ({
          id: e.date,
          title: <Inline text={e.text} />,
          meta: <time>{e.date}</time>,
        }))}
      />
    </div>
  );
}
