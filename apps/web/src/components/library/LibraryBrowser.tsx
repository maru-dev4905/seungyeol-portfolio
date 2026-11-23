"use client";

import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CATEGORIES, CATEGORY_LABELS, STATUSES, STATUS_LABELS, type LibraryCategory, type LibraryItem, type LibraryStatus } from "@/lib/library";
import { MOTION, prefersReducedMotion } from "@/lib/motion";
import { whenTransitionIdle } from "@/lib/transition-gate";
import { LibraryRows } from "./LibraryRows";
import styles from "./Library.module.css";

/**
 * 필터(분류·상태) + 개수 + 행 목록. 필터의 진실의 원천은 URL 쿼리(?c=분류&s=상태)다:
 * 알약을 누르면 history.pushState로 쿼리만 바꾸고(Next가 useSearchParams에 반영한다), 화면은 항상 쿼리에서 계산한다.
 * -> 새로고침·뒤로 가기·링크 공유에서 같은 화면이 나온다. 서버 요청 없이 전환되고, 알 수 없는 값은 "All"로 본다.
 * 이 컴포넌트는 Suspense 안에서만 쓴다(useSearchParams 때문). JS가 꺼져 있으면 fallback의 전체 목록이 그대로 보인다.
 */
export function LibraryBrowser({ items }: { items: readonly LibraryItem[] }) {
  const params = useSearchParams();
  // 쿼리 값이 목록에 있는 값일 때만 인정한다
  const c = CATEGORIES.find((v) => v === params.get("c")) ?? null;
  const s = STATUSES.find((v) => v === params.get("s")) ?? null;

  const shown = items.filter((it) => (!c || it.category === c) && (!s || it.status === s));
  const listRef = useRef<HTMLDivElement>(null);

  // 알약 클릭: 현재 쿼리에서 해당 키만 바꾼다(null = All이라 키를 지운다). 이벤트 안에서는 window.location을 읽는다
  const setParam = (key: "c" | "s", value: string | null) => {
    const q = new URLSearchParams(window.location.search);
    if (value) q.set(key, value);
    else q.delete(key);
    const qs = q.toString();
    window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  // 처음 그릴 때와 필터가 바뀔 때 행이 순서대로 다시 등장한다(과하지 않게: 간격은 공통 스태거의 절반, 길이도 짧게).
  // 움직임 줄이기에서는 아무것도 하지 않는다(정적). transform/opacity만 쓴다
  useGSAP(
    () => {
      const root = listRef.current;
      if (!root || prefersReducedMotion()) return;
      const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-row]"));
      if (!rows.length) return;
      gsap.set(rows, { opacity: 0, y: MOTION.distance / 2 });
      return whenTransitionIdle(() => {
        gsap.to(rows, {
          opacity: 1,
          y: 0,
          duration: MOTION.enter * 0.6,
          ease: MOTION.ease,
          stagger: MOTION.stagger / 2,
          // 끝나면 인라인 값을 지워 행 hover 전환과 겹치지 않게 한다
          onComplete: () => {
            gsap.set(rows, { clearProps: "opacity,transform" });
          },
        });
      });
    },
    { scope: listRef, dependencies: [c, s], revertOnUpdate: true },
  );

  return (
    <>
      <nav className={styles.filters} aria-label="Filter library">
        <FilterGroup<LibraryCategory> label="Category" value={c} options={CATEGORIES} labels={CATEGORY_LABELS} onPick={(v) => setParam("c", v)} />
        <FilterGroup<LibraryStatus> label="Status" value={s} options={STATUSES} labels={STATUS_LABELS} onPick={(v) => setParam("s", v)} />
      </nav>

      <p className={styles.count} role="status">
        {shown.length} {shown.length === 1 ? "item" : "items"}
      </p>

      <div ref={listRef}>
        {shown.length > 0 ? (
          <LibraryRows items={shown} />
        ) : (
          // 빈 상태: 해당 조건의 항목이 아직 없다(예: 써볼 예정). 사이트 주인이 채우는 영역이라 그대로 알려 주고 초기화 길을 둔다
          <div className={styles.empty}>
            <p>아직 없음</p>
            <p className={styles.emptySub}>이 조건에 맞는 항목을 아직 모으지 않았습니다.</p>
            <button
              type="button"
              className={`pill ${styles.chip}`}
              onClick={() => {
                window.history.pushState(null, "", window.location.pathname);
              }}
            >
              필터 초기화
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// 알약 한 줄: 라벨 + All + 옵션들. value가 null이면 All이 눌린 상태
function FilterGroup<T extends string>({
  label,
  value,
  options,
  labels,
  onPick,
}: {
  label: string;
  value: T | null;
  options: readonly T[];
  labels: Record<T, string>;
  onPick: (v: T | null) => void;
}) {
  return (
    <div className={styles.group} role="group" aria-label={label}>
      <p className={styles.filterLabel}>{label}:</p>
      <div className={styles.chips}>
        <button type="button" className={`pill ${styles.chip}`} aria-pressed={value === null} data-active={value === null} onClick={() => onPick(null)}>
          All
        </button>
        {options.map((o) => (
          <button key={o} type="button" className={`pill ${styles.chip}`} aria-pressed={value === o} data-active={value === o} onClick={() => onPick(o)}>
            {labels[o]}
          </button>
        ))}
      </div>
    </div>
  );
}
