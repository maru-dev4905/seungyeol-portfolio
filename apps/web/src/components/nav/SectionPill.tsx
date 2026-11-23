"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { ANCHOR_OFFSET, getScroller, prefersReducedMotion } from "@/lib/motion";
import styles from "./SectionPill.module.css";

export type PillSection = { id: string; label: string };

type Props = {
  /** 이동할 섹션 목록(위에서 아래 순서). id는 페이지 안의 요소 id와 같다 */
  sections: PillSection[];
  /** 이 요소가 화면 아래쪽에 닿으면 알약을 숨긴다(푸터와 겹치지 않게). 없으면 숨기지 않는다 */
  endId?: string;
  /** 목록 영역의 이름(스크린 리더용) */
  label?: string;
};

// 현재 섹션 = 윗면이 화면 위에서 이 비율(40%) 선보다 위로 올라간 섹션 중 가장 아래의 것
const CURRENT_LINE = 0.4;
// 항목을 눌러 이동한 직후 이 시간 동안은 스크롤 위치로 현재 섹션을 다시 계산하지 않는다(지나가는 중간 섹션들로 글자가 깜빡이지 않게).
// 이동이 끝난 뒤에도 사용자가 LOCK_RELEASE_PX 넘게 직접 스크롤해야 잠금이 풀린다(누른 항목이 그대로 표시되도록)
const LOCK_MS = 1600;
const LOCK_RELEASE_PX = 60;
// 알약이 차지하는 띠(화면 아래에서 20px 띄우고 높이 44px, 목록 여유 포함 위로 64px까지)와 endId 요소가 겹치면 숨긴다
const PILL_BAND_BOTTOM = 20;
const PILL_BAND_TOP = 84;
const RING_R = 8; // 진행도 링 반지름(둘레 계산에 쓴다)
const RING_C = 2 * Math.PI * RING_R;

// 서버 렌더와 하이드레이션 직전에는 false, 하이드레이션이 끝난 뒤엔 true. effect 안의 setState 없이 "마운트됐는지"를 안다
const subscribeNone = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribeNone,
    () => true,
    () => false,
  );

/**
 * 화면 아래 가운데에 떠 있는 섹션 알약. 현재 섹션을 `NN — 이름`으로 보여 주고,
 * 누르면 위로 목록이 펼쳐져 섹션으로 부드럽게 이동한다(Lenis, 움직임 줄이기면 즉시).
 *  - 왼쪽 링: 페이지 전체 스크롤 진행도 / 오른쪽 chevron: 열림 방향
 *  - 현재 섹션·진행도·푸터 겹침: 스크롤 이벤트를 requestAnimationFrame으로 묶어 한 프레임에 한 번만 계산한다.
 *    섹션은 6~7개뿐이라 getBoundingClientRect를 읽어도 가볍고, IntersectionObserver와 달리 섹션 사이의 빈 틈이나 순간 이동(점프)에도 값이 틀어지지 않는다.
 *    진행도 링·숨김은 DOM 속성을 직접 바꿔 리렌더가 없다
 *  - 하이드레이션 전엔 그리지 않고(깜빡임 방지), JS가 없으면 <noscript>의 앵커 목록으로 대신한다
 *  - 메뉴가 열리면 CSS가 숨긴다(html[data-menu="open"])
 */
export function SectionPill({ sections, endId, label = "페이지 섹션" }: Props) {
  const hydrated = useHydrated();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // 항목을 눌러 이동 중일 때의 잠금: id(눌린 항목), until(잠금 끝 시각), y(끝난 뒤 처음 잰 스크롤 위치)
  const lock = useRef<{ id: string; until: number; y: number | null } | null>(null);
  // 스크롤 위로 버튼(ScrollTop)에 알약 상태를 알리려고 <html data-section-pill>을 쓴다: "on" = 보임(버튼은 오른쪽 옆), "open" = 목록이 펼쳐짐(버튼 숨김),
  // "off" = 화면에 없음/푸터에서 숨음(버튼은 하단 가운데). 아래 effect들이 최신 open·atEnd를 함께 보려고 ref에 둔다
  const openRef = useRef(false);
  const atEndRef = useRef(false);
  const publish = useRef(() => {});
  useEffect(() => {
    openRef.current = open;
    publish.current();
  }, [open]);

  // 스크롤 한 번에: 현재 섹션 + 진행도 링 + 푸터 겹침 숨김
  useEffect(() => {
    if (!hydrated) return;
    let raf = 0;
    const update = (now = performance.now()) => {
      raf = 0;

      // 현재 섹션
      const y = window.scrollY;
      const l = lock.current;
      if (l && now >= l.until && l.y === null) l.y = y; // 이동이 끝난 뒤의 기준 위치
      if (l && (now < l.until || l.y === null || Math.abs(y - l.y) < LOCK_RELEASE_PX)) {
        // 잠금 중: 눌린 항목을 그대로 둔다
      } else {
        lock.current = null;
        let current = sections[0]?.id ?? "";
        for (const s of sections) {
          const el = document.getElementById(s.id);
          if (el && el.getBoundingClientRect().top <= window.innerHeight * CURRENT_LINE) current = s.id;
        }
        setActiveId(current);
      }

      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      // 링은 알약 안과 우측 내비 머리글 두 곳에 있다(data-ring). 한 번에 같이 갱신한다
      rootRef.current?.querySelectorAll("[data-ring]").forEach((c) => c.setAttribute("stroke-dashoffset", String(RING_C * (1 - p))));
      const end = endId ? document.getElementById(endId) : null;
      const box = end?.getBoundingClientRect();
      const atEnd = box ? box.top < window.innerHeight - PILL_BAND_BOTTOM && box.bottom > window.innerHeight - PILL_BAND_TOP : false;
      if (atEnd) rootRef.current?.setAttribute("data-hidden", "");
      else rootRef.current?.removeAttribute("data-hidden");
      atEndRef.current = atEnd;
      publish.current();
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update); // rAF가 시각(now)을 넘겨 준다
    };
    // 알약 상태를 <html>에 알린다. 알약이 실제로 그려져 있어야 "on"이다(넓은 화면의 상세 페이지는 CSS가 알약 칸째 숨기므로 getClientRects가 비어 있다)
    const html = document.documentElement;
    publish.current = () => {
      const root = rootRef.current;
      const shown = !!root && root.getClientRects().length > 0 && !atEndRef.current;
      html.dataset.sectionPill = shown ? (openRef.current ? "open" : "on") : "off";
      if (root && shown) html.style.setProperty("--section-pill-w", `${root.getBoundingClientRect().width}px`);
    };
    update(); // 처음 한 번
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      // 이 알약이 사라지면(페이지 이동·숨김) 상태도 지운다
      publish.current = () => {};
      delete html.dataset.sectionPill;
      html.style.removeProperty("--section-pill-w");
    };
  }, [hydrated, sections, endId]);

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const items = () => Array.from(listRef.current?.querySelectorAll<HTMLElement>("a") ?? []);

  // 열 때 현재 항목으로 포커스를 옮긴다(키보드로 열었을 때 바로 방향키로 움직이도록)
  const openList = (focusIndex?: number) => {
    setOpen(true);
    requestAnimationFrame(() => {
      const list = items();
      const at = focusIndex ?? Math.max(0, sections.findIndex((s) => s.id === activeId));
      list[at]?.focus({ preventScroll: true });
    });
  };

  const closeList = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus({ preventScroll: true });
  };

  const goTo = (id: string, index: number, now: number) => {
    const el = document.getElementById(id);
    if (!el) return;
    // 눌린 항목을 바로 현재로 표시하고, 이동이 끝나고 사용자가 다시 스크롤할 때까지 스크롤 계산이 덮어쓰지 못하게 잠근다
    setActiveId(id);
    lock.current = { id, until: now + LOCK_MS, y: null }; // now = 클릭 이벤트의 timeStamp(performance.now와 같은 시계)
    const scroller = getScroller();
    if (scroller && !prefersReducedMotion()) {
      // 첫 항목(Intro)은 맨 위로, 나머지는 헤더 높이만큼 남기고 이동
      if (index === 0) scroller.scrollTo(0);
      else scroller.scrollTo(el, { offset: -ANCHOR_OFFSET });
    } else {
      const top = index === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY - ANCHOR_OFFSET;
      window.scrollTo({ top, behavior: "auto" }); // 움직임 줄이기: 즉시 이동
    }
    closeList(true);
  };

  const onToggleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      openList(e.key === "ArrowUp" ? sections.length - 1 : undefined);
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const move = (n: number) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus({ preventScroll: true });
    };
    if (e.key === "ArrowDown") move(at + 1);
    else if (e.key === "ArrowUp") move(at - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      closeList(true);
    }
  };

  const activeIndex = Math.max(0, sections.findIndex((s) => s.id === activeId));
  const nn = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <>
      {hydrated && (
        <nav
          ref={rootRef}
          aria-label={label}
          className={styles.root}
          data-open={open || undefined}
          data-needs-js
          // 목록 바깥으로 포커스가 나가면(Tab) 닫는다
          onBlur={(e) => {
            if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
          }}
        >
          <ul ref={listRef} id={listId} className={styles.list} onKeyDown={onListKey}>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={styles.item}
                  aria-current={s.id === activeId ? "location" : undefined}
                  tabIndex={open ? 0 : -1}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Lenis의 전역 앵커 처리가 같은 클릭으로 한 번 더 스크롤하지 않게 막는다
                    goTo(s.id, i, e.timeStamp);
                  }}
                >
                  <span className={styles.num}>{nn(i)}</span>
                  <span>{s.label}</span>
                </a>
              </li>
            ))}
          </ul>

          <button
            ref={toggleRef}
            type="button"
            className={`pill ${styles.toggle}`}
            aria-expanded={open}
            aria-controls={listId}
            aria-label={`${label}: 현재 ${sections[activeIndex]?.label ?? ""}. 목록 ${open ? "닫기" : "열기"}`}
            onClick={() => (open ? closeList(false) : openList())}
            onKeyDown={onToggleKey}
          >
            <svg className={styles.ring} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <circle className={styles.ringTrack} cx="10" cy="10" r={RING_R} />
              <circle
                data-ring
                className={styles.ringBar}
                cx="10"
                cy="10"
                r={RING_R}
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C}
              />
            </svg>
            <span className={styles.current} aria-hidden="true">
              {nn(activeIndex)} — {sections[activeIndex]?.label}
            </span>
            <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m2.5 7.5 3.5-3.5 3.5 3.5" />
            </svg>
          </button>
        </nav>
      )}

      {/* JS가 없으면 알약이 없으므로 같은 목록을 본문 위쪽의 앵커 줄로 보여 준다(noscript는 JS가 켜져 있으면 만들어지지 않는다) */}
      <noscript>
        <nav className={styles.fallback} aria-label={label}>
          <ul>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  {nn(i)} — {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </noscript>
    </>
  );
}
