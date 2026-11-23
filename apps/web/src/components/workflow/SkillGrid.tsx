import type { JSX } from "react";
import { skillGroups, skills } from "@/lib/workflow";
import styles from "./Skills.module.css";

// 스킬 12종 컴팩트 카드 그리드(서버 컴포넌트). 12개가 한 그리드의 3열 x 4행(>=900px), 2열(560~899), 1열이다.
// 그룹(모드 시작·전환·검증·기록)은 별도 블록이 아니라 카드 윗줄의 12px 회색 라벨로 줄였다 -> 그룹별 개수(3·4·2·3)와 상관없이 마지막 줄이 비지 않는다.
// 카드는 명령 + 한 줄 목적만 보이고, "언제 · 가드"는 카드 안의 <details>로 접어 둔다.
//   왜 details인가: 툴팁(title)은 키보드·터치에서 읽을 수 없고, hover 펼침은 이웃 카드를 밀어낸다. details는 브라우저가 Enter/Space·aria-expanded를 처리해 주고
//   JS가 없어도 열린다. 닫힌 상태에서는 같은 줄 카드 높이가 맞고, 열면 그 줄이 함께 늘어난다.
export function SkillGrid(): JSX.Element {
  return (
    <ul className={styles.grid}>
      {skills.map((s) => (
        <li key={s.cmd} className={styles.card} data-skill>
          <p className={styles.group}>{skillGroups[s.group]}</p>
          <h3 className={styles.cmd}>{s.cmd}</h3>
          <p className={styles.purpose}>{s.purpose}</p>
          <details className={styles.more}>
            <summary>
              <span>언제 · 가드</span>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
                <path d="M2 3.5 5 6.5 8 3.5" />
              </svg>
            </summary>
            <dl className={styles.dl}>
              <div>
                <dt>언제 쓰나</dt>
                <dd>{s.when}</dd>
              </div>
              <div>
                <dt>핵심 가드와 동작</dt>
                <dd>{s.guard}</dd>
              </div>
            </dl>
          </details>
        </li>
      ))}
    </ul>
  );
}
