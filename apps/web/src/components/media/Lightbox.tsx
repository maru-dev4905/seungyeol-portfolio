"use client";

import { useEffect, useId, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { getScroller, prefersReducedMotion } from "@/lib/motion";
import styles from "./Lightbox.module.css";

export type LightboxImage = { url: string; alt: string };

type Props = {
  images: readonly LightboxImage[];
  /** 처음 보여 줄 이미지 번호 */
  start: number;
  /** 닫힘 애니메이션이 끝난 뒤 부모가 상태를 비운다(이때 컴포넌트가 사라진다). 마지막으로 보던 번호를 알려 준다 */
  onClosed: (last: number) => void;
  /** 닫힌 뒤 포커스를 돌려줄 요소(번호별 썸네일). 없으면 열 때 포커스가 있던 요소 */
  getOpener?: (index: number) => HTMLElement | null;
};

// 닫기 시간(CSS의 0.35s와 같다). 움직임 줄이기는 페이드만이라 같은 시간이어도 이동 없이 투명도만 변한다
const CLOSE_MS = 350;
// 모바일 스와이프로 넘기는 최소 가로 이동(px)
const SWIPE_PX = 48;
// 대화상자 안에서 Tab으로 갈 수 있는 요소
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 이미지 라이트박스(UI 모달). 상세 페이지의 이미지를 누르면 크게 본다. 갤러리와 챕터 이미지가 같이 쓴다.
 * 동작은 About의 CareerDrawer와 같은 문법이다:
 *  - role="dialog" aria-modal. 열리면 닫기 버튼으로 포커스, Tab은 대화상자 안에서만 순환(포커스 트랩). 닫히면 눌렀던 썸네일로 복귀.
 *  - Esc·배경 클릭·닫기 버튼으로 닫는다. 이미지가 여러 장이면 ← → 키, 이전·다음 버튼, 모바일 가로 스와이프로 넘긴다.
 *  - 열린 동안 <html> overflow hidden + Lenis stop, 뒤 페이지(#page)는 inert. 닫으면 모두 원래대로(언마운트 cleanup도 같다).
 *  - 이미지는 원본을 object-fit: contain으로 뷰포트 90% 안에 통째로 보인다. 받는 동안은 자리표시(껍데기)가 보이고 다 받으면 페이드 인.
 *  - 열기/닫기 0.35s 페이드 + scale .98 -> 1(움직임 줄이기는 페이드만).
 * body 바로 아래로 portal한다: 조상의 쌓임 맥락(z-index)에 갇히면 고정 헤더 아래로 깔리기 때문.
 */
export function Lightbox({ images, start, onClosed, getOpener }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef<number | null>(null);
  const touchX = useRef<number | null>(null);
  const titleId = useId();
  const [at, setAt] = useState(start);
  const [loaded, setLoaded] = useState(false);
  const total = images.length;
  const current = images[at];

  // 이벤트 리스너(마운트 때 한 번만 등록)가 항상 최신 값을 쓰도록 ref에 담아 둔다
  const live = useRef({ at, total, getOpener, onClosed });
  useEffect(() => {
    live.current = { at, total, getOpener, onClosed };
  });

  const step = (d: number) => {
    if (total < 2) return;
    setLoaded(false); // 다음 이미지를 받는 동안 자리표시를 다시 보인다
    setAt((i) => (i + d + total) % total);
  };
  const requestClose = () => {
    const root = rootRef.current;
    if (!root || closing.current !== null) return;
    root.dataset.state = "closed";
    closing.current = window.setTimeout(() => live.current.onClosed(live.current.at), prefersReducedMotion() ? 250 : CLOSE_MS);
  };
  // 최신 함수를 리스너가 부르게 한다
  const fns = useRef({ step, requestClose });
  useEffect(() => {
    fns.current = { step, requestClose };
  });

  useEffect(() => {
    const root = rootRef.current;
    const dialog = dialogRef.current;
    if (!root || !dialog) return;

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

    // 첫 프레임은 닫힌 상태로 그려 두고, 다음 프레임에 열림으로 바꿔야 페이드 전환이 걸린다
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.dataset.state = "open";
      });
    });
    closeRef.current?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        fns.current.requestClose();
        return;
      }
      if (e.key === "ArrowRight") {
        fns.current.step(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        fns.current.step(-1);
        return;
      }
      if (e.key !== "Tab") return;
      // 포커스 트랩: 처음/끝에서 반대쪽 끝으로 돌린다
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialog.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    // 어떤 이유로든 포커스가 대화상자 밖으로 나가면 되돌린다(보조 장치)
    const onFocusIn = (e: FocusEvent) => {
      if (!dialog.contains(e.target as Node)) closeRef.current?.focus({ preventScroll: true });
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
      // 마지막으로 보던 이미지의 썸네일로 복귀(없으면 열 때 포커스가 있던 요소)
      const target = live.current.getOpener?.(live.current.at) ?? opener;
      target?.focus({ preventScroll: true });
    };
  }, []);

  // 이미 캐시에 있는 이미지는 onLoad가 먼저 지나갔을 수 있어, 번호가 바뀔 때 img.complete로 한 번 더 확인한다
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [at]);

  const onTouchEnd = (e: TouchEvent) => {
    const x0 = touchX.current;
    touchX.current = null;
    if (x0 === null || total < 2) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
  };

  return createPortal(
    <div ref={rootRef} className={styles.root} data-state="closed">
      <div className={styles.backdrop} onClick={requestClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className={styles.dialog}
        data-lightbox
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => {
          // 이미지·버튼·캡션이 아닌 빈 곳(배경)을 누르면 닫는다
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.lbBlank !== undefined) requestClose();
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={onTouchEnd}
      >
        <button ref={closeRef} type="button" className={`pill ${styles.close}`} onClick={requestClose}>
          Close
          <span className="sr-only"> (이미지 크게 보기 닫기)</span>
        </button>

        <div className={styles.stage} data-lb-blank>
          {total > 1 && (
            <button type="button" className={`pill ${styles.nav} ${styles.prev}`} onClick={() => step(-1)} aria-label="이전 이미지">
              <span aria-hidden="true">←</span>
            </button>
          )}
          <div className={styles.frame} data-lb-blank>
            {/* 받는 동안의 자리표시: 껍데기가 숨 쉬듯 깜박인다(움직임 줄이기는 정지). 다 받으면 사라진다 */}
            {!loaded && <span className={styles.skeleton} aria-hidden="true" />}
            {/* 원본을 그대로 보이려고 일반 <img>를 쓴다(next/image는 원본 비율·크기를 미리 알아야 contain으로 90%에 맞추기 어렵다).
                key=url이라 이미지가 바뀌면 새 요소로 갈아 끼워 이전 그림이 남지 않는다 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.url}
              ref={imgRef}
              className={styles.img}
              data-loaded={loaded || undefined}
              src={current.url}
              alt="" /* 설명은 아래 캡션(aria-live)이 읽는다: 같은 글을 두 번 읽지 않게 비운다 */
              onLoad={() => setLoaded(true)}
              onError={() => setLoaded(true)}
              draggable={false}
            />
          </div>
          {total > 1 && (
            <button type="button" className={`pill ${styles.nav} ${styles.next}`} onClick={() => step(1)} aria-label="다음 이미지">
              <span aria-hidden="true">→</span>
            </button>
          )}
        </div>

        {/* 캡션: "n / N" + 이미지 설명. 이미지가 바뀌면 스크린 리더가 읽는다(aria-live) */}
        <p id={titleId} className={styles.caption} aria-live="polite">
          <span className={styles.count}>
            {at + 1} / {total}
          </span>
          <span className={styles.alt}>{current.alt}</span>
        </p>
      </div>
    </div>,
    document.body,
  );
}
