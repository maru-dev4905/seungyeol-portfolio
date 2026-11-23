"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { siteCopy } from "@/lib/site";
import styles from "./SeoulClock.module.css";

// 시계를 이루는 조각. 한 조각 = 한 칸(자릿수 하나, 또는 AM/PM). 바뀐 조각만 롤링한다
type Parts = { h1: string; h2: string; m1: string; m2: string; ap: string };

/** 서울 시각을 "7:17 PM" 조각으로 나눈다. 시간대 계산은 브라우저 Intl에 맡긴다(서머타임 같은 규칙을 직접 다루지 않는다) */
function seoulParts(date: Date): Parts {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: siteCopy.clock.timeZone, hour: "numeric", minute: "2-digit", hour12: true });
  const get = (type: string) => f.formatToParts(date).find((p) => p.type === type)?.value ?? "";
  const hour = get("hour"); // "7" 또는 "12"
  const minute = get("minute").padStart(2, "0"); // "05"
  return { h1: hour.length > 1 ? hour[0] : "", h2: hour.slice(-1), m1: minute[0], m2: minute[1], ap: get("dayPeriod").toUpperCase() };
}

/**
 * 칸 하나. 값이 바뀌면 옛 값이 위로 밀려 나가고 새 값이 아래에서 올라온다(세로 슬라이드).
 * 두 줄짜리 세로 기둥을 CSS 애니메이션으로 한 줄만큼 올린다. 끝나면(onAnimationEnd) 새 값 한 줄로 되돌려 DOM을 가볍게 둔다.
 * 부모가 animate=false로 값을 바꾸면(처음 표시·탭 복귀) 롤링 없이 바로 바뀐다.
 * 값 비교는 effect 대신 "렌더 중 상태 보정"으로 한다(effect를 쓰면 새 값이 한 프레임 먼저 보인다).
 */
function Roll({ value, animate }: { value: string; animate: boolean }) {
  const [seen, setSeen] = useState(value);
  const [roll, setRoll] = useState<{ from: string; n: number } | null>(null);
  if (seen !== value) {
    setSeen(value);
    setRoll(animate ? { from: seen, n: (roll?.n ?? 0) + 1 } : null);
  }
  if (!roll) return <span className={styles.cell}>{value}</span>;
  return (
    // key = 롤링 횟수: 롤링 도중 또 바뀌어도 애니메이션이 처음부터 다시 시작한다
    <span key={roll.n} className={styles.cell} onAnimationEnd={() => setRoll(null)}>
      <span className={styles.column}>
        <span className={styles.row}>{roll.from}</span>
        <span className={styles.row}>{value}</span>
      </span>
    </span>
  );
}

/**
 * 헤더 오른쪽의 "KOR + 서울 시각"(12px). 한국 시간만 보여 주고, 분이 바뀌는 순간 바뀐 칸만 세로로 롤링한다(예: 9:59 -> 10:00은 세 칸).
 *  - 서버 HTML에는 시각을 넣지 않는다(서버 시각은 브라우저와 다르다 -> 하이드레이션 불일치). 마운트 후에 채운다.
 *  - 다음 "정각 분"에 맞춘 타이머로 갱신한다(초 단위 표시는 없다). 탭이 숨겨졌다 돌아오면 그 자리에서 즉시 맞춘다(롤링 없이).
 *  - 움직임 줄이기에서는 롤링 없이 바로 바꾼다.
 *  - 스크린 리더에는 롤링 조각 대신 "Seoul 7:17 PM" 한 줄만 읽히도록 조각 줄은 aria-hidden이고 sr-only 한 줄이 따로 있다.
 */
export function SeoulClock() {
  const [state, setState] = useState<{ parts: Parts; animate: boolean } | null>(null);

  useEffect(() => {
    let timer = 0;
    // animate: 정각 타이머에서 온 갱신만 롤링한다
    const sync = (animate: boolean) => setState({ parts: seoulParts(new Date()), animate: animate && !prefersReducedMotion() });
    const schedule = () => {
      // 다음 분 경계 + 50ms(타이머가 조금 일찍 깨도 같은 분에 머물지 않게)
      timer = window.setTimeout(() => {
        sync(true);
        schedule();
      }, 60_000 - (Date.now() % 60_000) + 50);
    };
    // 서버 HTML과 첫 렌더는 시각이 비어 있다. 마운트 직후(다음 틱)에 채운다
    const first = window.setTimeout(() => sync(false), 0);
    schedule();
    // 숨겨진 탭은 타이머가 늦게 깨므로, 돌아오면 타이머를 다시 맞추고 즉시 현재 시각으로 바꾼다
    const onVisible = () => {
      if (document.hidden) return;
      window.clearTimeout(timer);
      sync(false);
      schedule();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const p = state?.parts;
  const animate = state?.animate ?? false;
  return (
    <div className={styles.clock}>
      <span className="sr-only">{p ? `${siteCopy.clock.name} ${p.h1}${p.h2}:${p.m1}${p.m2} ${p.ap}` : ""}</span>
      <div className={styles.line} aria-hidden="true">
        {p && (
          <>
            {siteCopy.clock.code}&nbsp;
            <Roll value={p.h1} animate={animate} />
            <Roll value={p.h2} animate={animate} />:
            <Roll value={p.m1} animate={animate} />
            <Roll value={p.m2} animate={animate} />
            &nbsp;
            <Roll value={p.ap} animate={animate} />
          </>
        )}
      </div>
    </div>
  );
}
