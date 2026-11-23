"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { getScroller, prefersReducedMotion } from "@/lib/motion";
import type { CareerDetail } from "@/lib/career";
import { careerTenure, type CareerItem } from "@/lib/about";
import { CareerDetailBody } from "./CareerDetailBody";
import styles from "./CareerDrawer.module.css";

// 닫기 시간(CSS의 닫기 0.45s와 같다: 아래로 내려가는 동안 기다렸다가 부모가 상태를 비운다). 움직임 줄이기는 투명도만 0.25초
const CLOSE_MS = 450;
const CLOSE_MS_REDUCED = 250;

type Props = {
  item: CareerItem;
  detail: CareerDetail;
  index: number;
  total: number;
  email: string;
  /** 닫힘 애니메이션이 끝난 뒤 부모가 상태를 비운다 */
  onClosed: () => void;
};

// 대화상자 안에서 Tab으로 갈 수 있는 요소
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 경력 상세 모달(경력기술서 내용; 파일·컴포넌트 이름은 드로어로 남겼다). 화면 아래 바깥에서 올라와 화면 정중앙에 멈춘다(데스크톱·모바일 같은 모양, 크기만 다름).
 * 배경은 dim, 모달 안에서만 스크롤, 열기 0.6s / 닫기 0.45s(--ease-reveal). 위치·크기는 CareerDrawer.module.css가 정한다.
 *
 * 접근성·동작:
 *  - role="dialog" aria-modal, 제목(aria-labelledby). 열리면 닫기 버튼으로 포커스, Tab/Shift+Tab은 패널 안에서만 순환(포커스 트랩).
 *  - Esc·배경 클릭·닫기 버튼으로 닫는다. 닫히면 열었던 행 버튼으로 포커스가 돌아간다.
 *  - 열린 동안 페이지 스크롤 잠금: <html> overflow hidden + Lenis stop(), 뒤 페이지(#page)는 inert(포커스·스크린 리더에서 제외). 닫으면 모두 원래대로.
 *    패널 안 스크롤은 data-lenis-prevent로 Lenis가 가로채지 않게 한다.
 *  - 다른 페이지로 가서 이 컴포넌트가 정리(unmount)될 때도 같은 cleanup이 잠금을 푼다.
 * body 바로 아래로 portal한다: 조상(.career, z-index 1)의 쌓임 맥락에 갇히면 고정 헤더(100) 아래로 깔리기 때문.
 */
export function CareerDrawer({ item, detail, index, total, email, onClosed }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const closing = useRef<number | null>(null);

  // 닫기 요청: 상태를 closed로 돌려 아래로 내려가게 하고, 끝나면 부모에게 알린다(중복 호출 무시)
  const requestClose = () => {
    const root = rootRef.current;
    if (!root || closing.current !== null) return;
    root.dataset.state = "closed";
    closing.current = window.setTimeout(onClosed, prefersReducedMotion() ? CLOSE_MS_REDUCED : CLOSE_MS);
  };
  // 최신 requestClose를 이벤트 리스너(한 번만 등록)가 부르도록 ref에 담는다
  const closeFn = useRef(requestClose);
  useEffect(() => {
    closeFn.current = requestClose;
  });

  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const html = document.documentElement;
    const body = document.body;
    const page = document.getElementById("page");
    const prev = { overflow: html.style.overflow, padding: body.style.paddingRight, inert: page?.inert ?? false };

    // 스크롤 잠금: 스크롤바가 사라지며 레이아웃이 밀리지 않게 그 폭만큼 body에 padding을 준다
    const bar = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (bar > 0) body.style.paddingRight = `${bar}px`;
    getScroller()?.stop();
    if (page) page.inert = true;

    // 첫 프레임은 닫힌 상태로 그려 두고, 다음 프레임에 열림으로 바꿔야 올라오는 전환이 걸린다
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.dataset.state = "open";
      });
    });
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeFn.current();
        return;
      }
      if (e.key !== "Tab") return;
      // 포커스 트랩: 처음/끝에서 반대쪽 끝으로 돌린다
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    // 어떤 이유로든 포커스가 패널 밖으로 나가면 되돌린다(마우스로 뒤를 눌러도 backdrop은 닫기로 처리되므로 보조 장치)
    const onFocusIn = (e: FocusEvent) => {
      if (!panel.contains(e.target as Node)) closeRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocusIn);

    return () => {
      cancelAnimationFrame(raf);
      if (closing.current !== null) window.clearTimeout(closing.current);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocusIn);
      html.style.overflow = prev.overflow;
      body.style.paddingRight = prev.padding;
      if (page) page.inert = prev.inert;
      getScroller()?.start();
      opener?.focus({ preventScroll: true }); // 열었던 행 버튼으로 복귀
    };
  }, []);

  return createPortal(
    <div ref={rootRef} className={styles.root} data-state="closed">
      <div className={styles.backdrop} onClick={requestClose} aria-hidden="true" />
      <div ref={panelRef} className={styles.panel} data-career-drawer role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.bar}>
          <p className={styles.eyebrow}>
            Career {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </p>
          <button ref={closeRef} type="button" className={`pill ${styles.close}`} onClick={requestClose}>
            Close
            <span className="sr-only"> (경력 상세 닫기)</span>
          </button>
        </div>
        {/* 패널 안 스크롤 영역: Lenis가 휠을 가로채지 않도록 data-lenis-prevent */}
        <div className={styles.scroll} data-lenis-prevent>
          <div className={styles.stage}>
            <header className={styles.head}>
              <h2 id={titleId} className={styles.title}>
                {item.company}
              </h2>
              <p className={styles.meta}>
                {detail.nameKo} · {item.period}
                {careerTenure(item.period) && ` · ${careerTenure(item.period)}`}
              </p>
            </header>
            <CareerDetailBody detail={detail} />
            {email && (
              <p className={styles.contact}>
                <a className={styles.contactLink} href={`mailto:${email}`}>
                  {email}
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
