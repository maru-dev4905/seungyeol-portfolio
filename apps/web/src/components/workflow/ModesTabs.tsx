"use client";

import { useRef, useState, useSyncExternalStore, type JSX, type KeyboardEvent } from "react";
import { modeIntro, modes, type Actor, type Mode } from "@/lib/workflow";
import styles from "./Modes.module.css";

// 작업 모드 탭(Sequential / Compare / Parallel). 탭마다 패널 하나: 언제 쓰나 -> 단계별 스테퍼 -> 입력 명령 알약 -> 제약.
// 접근성: role=tablist/tab/tabpanel, aria-selected, 한 번에 탭 하나만 Tab 순서에 들어가고(roving tabindex) 방향키·Home/End로 옮긴다.
// 패널은 모두 같은 칸(grid)에 겹쳐 놓고 활성 패널만 보이게 한다: 전환은 투명도 0.25s 페이드이고, 가장 큰 패널 높이를 늘 차지해 탭을 바꿔도 아래 내용이 튀지 않는다.
// JS가 없으면(서버 HTML) 페이지의 <noscript> 스타일이 탭 줄을 숨기고 세 패널을 모두 세로로 펼친다.
// URL 해시(#mode-compare)로 탭을 직접 열 수 있다. 탭을 고르면 해시도 바꿔 공유할 수 있다.

const HASH_PREFIX = "mode-";

// 해시(#mode-compare)를 외부 저장소로 읽는다: 서버·하이드레이션 직전에는 "", 이후 실제 해시. effect 안의 setState 없이 해시를 따라간다
function subscribeHash(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const getHash = () => window.location.hash;
const getServerHash = () => "";

function Chip({ who }: { who: Actor }): JSX.Element {
  // 사람(Owner) = 진한 테두리, AI 세션 = 옅은 테두리(조직도·도식의 "사람 = 강조" 약속과 같다)
  return (
    <span className={styles.chip} data-human={who === "Owner" || undefined}>
      {who}
    </span>
  );
}

function Panel({ m, active }: { m: Mode; active: boolean }): JSX.Element {
  return (
    <div
      role="tabpanel"
      id={`${HASH_PREFIX}${m.id}`}
      aria-labelledby={`modetab-${m.id}`}
      data-mode-panel
      data-active={active || undefined}
      className={styles.panel}
    >
      <p className={styles.panelTitle}>
        {m.name} <span className={styles.mono}>{m.label}</span>
      </p>
      <p className={styles.when}>{m.when}</p>

      <div className={styles.body}>
        <div>
          {m.stepNote && <p className={styles.stepNote}>{m.stepNote}</p>}
          <ol className={styles.stepper}>
            {m.steps.map((s, i) => (
              <li key={i} className={styles.step}>
                <span className={styles.num} aria-hidden="true">
                  {i + 1}
                </span>
                <div className={styles.stepBody}>
                  <Chip who={s.who} />
                  <p className={styles.what}>{s.what}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.aside}>
          <section>
            <h4 className={styles.asideLabel}>제가 입력하는 명령</h4>
            <ul className={styles.cmds}>
              <li>
                <code className={styles.cmdPill} data-start>
                  {m.start.cmd}
                </code>
                <span className={styles.cmdNote}>{m.start.note}</span>
              </li>
            </ul>
          </section>
          <section>
            <h4 className={styles.asideLabel}>이어서 쓰는 명령</h4>
            {m.next.length > 0 ? (
              <ul className={styles.cmds}>
                {m.next.map((c) => (
                  <li key={c.cmd}>
                    <code className={styles.cmdPill}>{c.cmd}</code>
                    <span className={styles.cmdNote}>{c.note}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.cmdNote}>{m.nextNote}</p>
            )}
          </section>
          <section>
            <h4 className={styles.asideLabel}>제약 · 가드</h4>
            <ul className={styles.guards}>
              {m.guards.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export function ModesTabs(): JSX.Element {
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  // 사용자가 탭을 눌러 고른 값(null이면 해시를 따른다). 해시가 바뀌면(뒤로 가기·링크) 해시가 다시 우선한다
  const [picked, setPicked] = useState<{ id: Mode["id"]; at: string } | null>(null);
  const hashIndex = modes.findIndex((m) => hash === `#${HASH_PREFIX}${m.id}`);
  const activeIndex = picked && picked.at === hash ? modes.findIndex((m) => m.id === picked.id) : hashIndex >= 0 ? hashIndex : 0;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (i: number, focus: boolean) => {
    const id = modes[i].id;
    // 해시를 바꿔(스크롤은 일으키지 않는다) 같은 탭 주소를 공유할 수 있게 한다
    window.history.replaceState(null, "", `#${HASH_PREFIX}${id}`);
    setPicked({ id, at: window.location.hash });
    if (focus) tabRefs.current[i]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const last = modes.length - 1;
    let next = -1;
    if (e.key === "ArrowRight") next = activeIndex === last ? 0 : activeIndex + 1;
    else if (e.key === "ArrowLeft") next = activeIndex === 0 ? last : activeIndex - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next < 0) return;
    e.preventDefault();
    select(next, true);
  };

  return (
    <div className={styles.modes}>
      <p className={styles.intro}>{modeIntro}</p>
      <div role="tablist" aria-label="작업 모드" data-mode-tablist className={styles.tablist} onKeyDown={onKeyDown}>
        {modes.map((m, i) => (
          <button
            key={m.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`modetab-${m.id}`}
            aria-selected={i === activeIndex}
            aria-controls={`${HASH_PREFIX}${m.id}`}
            tabIndex={i === activeIndex ? 0 : -1}
            className={styles.tab}
            onClick={() => select(i, false)}
          >
            <span className={styles.tabName}>{m.tab}</span>
            <span className={styles.tabSub}>{m.name}</span>
          </button>
        ))}
      </div>
      <div className={styles.panels}>
        {modes.map((m, i) => (
          <Panel key={m.id} m={m} active={i === activeIndex} />
        ))}
      </div>
    </div>
  );
}
