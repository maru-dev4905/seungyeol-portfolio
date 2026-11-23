"use client";

import { useState, type JSX } from "react";
import { careerTenure, type CareerItem } from "@/lib/about";
import { careerDetails } from "@/lib/career";
import { siteCopy } from "@/lib/site";
import { CareerDetailBody } from "./CareerDetailBody";
import { CareerDrawer } from "./CareerDrawer";
import styles from "./About.module.css";

/**
 * 경력 원장(ledger)형 표: 행마다 No. / 회사명 / 기간 / 재직 기간 / + 아이콘. 가는 구분선만 있고 타임라인 선·노드는 없다.
 * 재직 기간은 period에서 계산한다(careerTenure). 데이터에 없는 직무·성과는 넣지 않는다.
 *
 * 경력기술서 내용(lib/career.ts)이 있는 행은 <button>이다: hover하면 이름이 밀리고 + 아이콘이 뒤집히며(클릭할 수 있다는 표시),
 * 누르면 화면 중앙 모달(CareerDrawer)이 아래에서 올라온다. Enter/Space는 버튼 기본 동작이다. 내용이 없는 행(지금은 없다)은 버튼도 + 도 hover 움직임도 없다
 * (눌러도 아무 일도 없는 행을 만들지 않는다).
 * JS가 꺼졌을 때: 버튼은 동작하지 않으므로 + 아이콘을 숨기고(data-needs-js), 행 아래에 같은 내용(CareerDetailBody)의 정적 복사본을 보여 준다
 * (평소엔 display:none이라 스크린 리더에도 한 번만 읽힌다. 아래 noscript 스타일이 켠다).
 * 등장 모션(스태거)은 바깥 RevealGroup이 data-r="item"으로 건다.
 * 머리 줄(No./Company/…)은 장식이라 스크린 리더에서 뺀다.
 */
export function CareerLedger({ items }: { items: readonly CareerItem[] }): JSX.Element {
  const [open, setOpen] = useState<number | null>(null);
  const total = items.length;
  const openItem = open !== null ? items[open] : null;
  const openDetail = openItem ? careerDetails[openItem.company] : undefined;

  return (
    <div className={styles.ledger}>
      <div className={styles.ledgerHead} aria-hidden="true" data-r="body">
        <span>No.</span>
        <span>Company</span>
        <span>Period</span>
        <span>Tenure</span>
        <span />
      </div>
      <ol className={styles.ledgerList} aria-label="Career">
        {items.map((c, i) => {
          const detail = careerDetails[c.company];
          const cells = (
            <>
              <span className={styles.ledgerNo}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.ledgerName}>{c.company}</span>
              <span className={styles.ledgerPeriod}>{c.period}</span>
              <span className={styles.ledgerTenure}>{careerTenure(c.period)}</span>
            </>
          );
          return (
            <li key={c.company} data-r="item">
              {detail ? (
                <button type="button" className={`${styles.ledgerRow} ${styles.ledgerBtn}`} aria-haspopup="dialog" onClick={() => setOpen(i)}>
                  {cells}
                  <span className={styles.ledgerPlus} aria-hidden="true" data-needs-js />
                  <span className="sr-only"> — 경력기술서 보기</span>
                </button>
              ) : (
                <div className={styles.ledgerRow}>{cells}</div>
              )}
              {detail && (
                <div className={styles.ledgerStatic} data-career-static>
                  <CareerDetailBody detail={detail} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <noscript>
        <style>{"[data-career-static]{display:block !important}"}</style>
      </noscript>
      {openItem && openDetail && open !== null && (
        <CareerDrawer key={open} item={openItem} detail={openDetail} index={open} total={total} email={siteCopy.email} onClosed={() => setOpen(null)} />
      )}
    </div>
  );
}
