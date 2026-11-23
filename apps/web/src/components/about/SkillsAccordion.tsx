"use client";

import { useId, useState } from "react";
import type { Skill } from "@/lib/about";
import styles from "./About.module.css";

/**
 * 스킬 아코디언(측정: 항목 높이 81px, 20px/26 제목, 오른쪽 + 아이콘, 1px 구분선, 열면 16px/22.4 회색 본문).
 * 한 번에 하나만 열린다. 버튼 + aria-expanded/aria-controls로 읽히고, Tab/Enter/Space는 버튼 기본 동작이다.
 * 본문 칸은 항상 DOM에 있다: 닫힌 칸은 grid-template-rows 0fr + visibility hidden(포커스·스크린 리더에서 빠짐),
 * 열면 1fr로 높이가 부드럽게 늘어난다(0.5s power3.out, 본문은 12px 올라오며 페이드 인: 페이지 모션 문법과 같은 곡선).
 * 항목 등장(스태거)은 바깥 RevealGroup이 data-r="item"으로 건다. JS가 없으면 아래 noscript 스타일이 모든 칸을 펼쳐 둔다(본문이 읽힌다).
 */
export function SkillsAccordion({ skills }: { skills: readonly Skill[] }) {
  const base = useId();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <ul className={styles.acc}>
        {skills.map((s, i) => {
          const isOpen = open === i;
          return (
            <li key={s.name} className={styles.accItem} data-open={isOpen || undefined} data-r="item">
              <h3 className={styles.accHead}>
                <button
                  type="button"
                  className={styles.accBtn}
                  aria-expanded={isOpen}
                  aria-controls={`${base}-${i}`}
                  id={`${base}-b${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span>{s.name}</span>
                  {/* + 아이콘: 세로 막대가 90도 돌아 가로 막대와 겹치면 −가 된다 */}
                  <span className={styles.accIcon} aria-hidden="true" />
                </button>
              </h3>
              <div id={`${base}-${i}`} className={styles.accPanel} data-acc-panel>
                <div className={styles.accPanelInner}>
                  <div className={styles.accBody} data-acc-body>
                    <div lang="ko">
                      {s.ko.map((t) => (
                        <p key={t}>{t}</p>
                      ))}
                    </div>
                    <div lang="en">
                      {s.en.map((t) => (
                        <p key={t}>{t}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <noscript>
        <style>{"[data-acc-panel]{grid-template-rows:1fr !important;visibility:visible !important}[data-acc-body]{opacity:1 !important;transform:none !important}"}</style>
      </noscript>
    </>
  );
}
