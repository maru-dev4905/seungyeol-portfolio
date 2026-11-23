import type { ProjectSection } from "@/lib/projects";
import { Inline } from "./Inline";
import { splitTitle } from "./title";
import styles from "./Section.module.css";

type Section = Extract<ProjectSection, { type: "troubleshooting" }>;

// meta의 키와 화면 이름. 순서가 곧 읽는 순서다(증상 -> 원인 -> 해결 -> 검증).
const STEPS = [
  { key: "problem", label: "증상" },
  { key: "cause", label: "원인" },
  { key: "solution", label: "해결" },
  { key: "result", label: "검증" },
] as const;

/**
 * 트러블슈팅 한 건 = 조용한 항목 하나(카드·색 면·화살표 없음). 위 구분선 하나로 앞 항목과 나뉜다.
 * 머리: 12px 회색 메타(TR 번호 · PR 번호) -> 한 줄 요약(제목).
 * 본문: 4단계가 같은 모양의 행이다. 왼쪽 12px 회색 라벨(증상/원인/해결/검증) | 오른쪽 본문(최대 약 60자 폭, 줄 간격 1.7). Metalab 리스트·아코디언 문법.
 * 색은 "검증" 라벨 앞의 점 하나뿐이다(CSS). 증상만 본문이 한 단계 밝고, 근거는 `코드` 조각으로, 검증의 수치는 굵게 보인다.
 * 정의 목록(dl)이라 JS 없이도, 스크린 리더로도 "증상: …, 원인: …" 순서로 읽힌다. 모바일은 라벨 칸만 좁아지고 두 칸 구조는 그대로다.
 * 제목 데이터 "트러블슈팅 01 · PR #17"에서 번호(01 -> TR-001)와 PR 태그를 나눠 쓴다. id는 카드에 달아 #tr-1 같은 링크가 그대로 동작한다.
 */
export function TroubleshootingSection({ section }: { section: Section }) {
  const { main, sub } = splitTitle(section.title);
  const no = main.match(/\d+/)?.[0];
  return (
    <article id={section.id} className={styles.card} aria-labelledby={`${section.id}-title`}>
      <p className={styles.cardMeta}>
        {no && <span>TR-{no.padStart(3, "0")}</span>}
        {sub && <span>{sub}</span>}
      </p>
      <h3 id={`${section.id}-title`} className={styles.cardTitle}>
        {/* body(한 줄 요약)는 스키마상 선택이라, 없으면 섹션 제목의 앞부분을 대신 쓴다 */}
        <Inline text={section.body ?? main} />
      </h3>

      <dl className={styles.rows}>
        {STEPS.map((st) => (
          <div key={st.key} className={styles.row} data-step={st.key}>
            <dt className={styles.rowLabel}>{st.label}</dt>
            <dd className={styles.rowText}>
              <Inline text={section.meta[st.key]} numbers={st.key === "result"} />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
