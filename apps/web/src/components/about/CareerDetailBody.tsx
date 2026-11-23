import type { JSX } from "react";
import { Inline } from "@/components/sections/Inline";
import type { CareerDetail } from "@/lib/career";
import styles from "./CareerDrawer.module.css";

/**
 * 경력기술서 한 회사의 내용(직급·직무 -> 요약 -> 업무 내용 -> 프로젝트 카드 -> 지표 -> 배운 점). 순서는 PDF와 같다.
 * 상태·훅이 없는 순수 컴포넌트라 두 곳에서 쓴다: 드로어 안(JS 켜짐)과, JS가 꺼졌을 때만 보이는 행 아래 정적 복사본(CareerLedger).
 */
export function CareerDetailBody({ detail }: { detail: CareerDetail }): JSX.Element {
  const facts: [string, string][] = [
    ["직급", detail.rank],
    ["직무", detail.duty],
    ["주요사업", detail.business],
  ];
  if (detail.tasks) facts.push(["주요업무", detail.tasks]);

  return (
    <div className={styles.detail} lang="ko">
      <dl className={styles.facts}>
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <p className={styles.summary}>{detail.summary}</p>

      <section className={styles.block}>
        <h3 className={styles.sub}>업무 내용</h3>
        <ul className={styles.bullets}>
          {detail.bullets.map((b) => (
            <li key={b.text}>
              {b.lead && <strong>{b.lead}</strong>}
              {b.text}
            </li>
          ))}
        </ul>
      </section>

      {detail.project && (
        <section className={styles.project}>
          <h3 className={styles.projectTitle}>
            {detail.project.title} <span className={styles.projectMeta}>{detail.project.meta}</span>
            {detail.project.link && (
              <>
                <span className={styles.projectMeta}> · </span>
                <a className={styles.projectLink} href={detail.project.link.href} target="_blank" rel="noopener noreferrer">
                  {detail.project.link.label}
                  <span className="sr-only"> (새 탭)</span>
                </a>
              </>
            )}
          </h3>
          <ul className={styles.steps}>
            {detail.project.steps.map((s) => (
              <li key={s.label}>
                <strong>{s.label}</strong> · <Inline text={s.text} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.metrics && (
        <ul className={styles.metrics} aria-label="성과 지표">
          {detail.metrics.map((m) => (
            <li key={m.label}>
              <strong className={styles.metricValue}>{m.value}</strong>
              <span className={styles.metricLabel}>{m.label}</span>
            </li>
          ))}
        </ul>
      )}

      {detail.lesson && (
        <p className={styles.lesson}>
          <strong>배운 점</strong> · {detail.lesson}
        </p>
      )}
    </div>
  );
}
