import type { ProjectSection } from "@/lib/projects";
import { Inline } from "./Inline";
import styles from "./Section.module.css";

type Props = { section: Extract<ProjectSection, { type: "decisions" }> };

/**
 * 대안 문장 나누기. 데이터의 rejected는 "대안 이름. 기각한 이유." 꼴의 한 문자열이라,
 * 첫 문장(마침표 + 공백까지)을 "대안", 나머지를 "기각 이유"로 본다. 마침표가 없으면 전체가 대안이다(이유 없음).
 * (데이터를 바꾸지 않고 있는 문장 구조만 읽는다)
 */
function splitRejected(text: string): { option: string; why: string | null } {
  const m = text.match(/^(.+?[.。])\s+([\s\S]+)$/);
  return m ? { option: m[1], why: m[2] } : { option: text, why: null };
}

/**
 * 설계 결정 목록: 결정마다 조용한 항목 하나(트러블슈팅과 같은 문법). 머리 = 12px 회색 번호 + 결정(제목).
 * 본문은 같은 "라벨 | 본문" 행이다: "채택" 행(이유) 아래에, 대안이 있으면 "기각" 행(고려한 대안은 굵게 + 기각 이유).
 * 데이터에 대안이 없는 결정은 채택 행만 보인다(없는 대안을 지어내지 않는다). 색 면·알약 없이 글자("채택"·"기각")가 의미를 말한다.
 * 순서 있는 목록(ol)이라 스크린 리더가 몇 번째 결정인지 알려 준다.
 */
export function DecisionsSection({ section }: Props) {
  return (
    <ol className={styles.cards}>
      {section.meta.map((d, i) => {
        const alt = d.rejected ? splitRejected(d.rejected) : null;
        return (
          <li key={d.title} className={styles.card}>
            <p className={styles.cardMeta}>
              <span>결정 {String(i + 1).padStart(2, "0")}</span>
            </p>
            <h3 className={styles.cardTitle}>
              <Inline text={d.title} />
            </h3>
            <dl className={styles.rows}>
              <div className={styles.row}>
                <dt className={styles.rowLabel}>채택</dt>
                <dd className={styles.rowText}>
                  <Inline text={d.reason} />
                </dd>
              </div>
              {alt && (
                <div className={styles.row}>
                  <dt className={styles.rowLabel}>기각</dt>
                  <dd className={styles.rowText}>
                    <span className={styles.dcOption}>
                      <Inline text={alt.option} />
                    </span>
                    {alt.why && (
                      <>
                        {" "}
                        <Inline text={alt.why} />
                      </>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </li>
        );
      })}
    </ol>
  );
}
