import type { ProjectSection } from "@/lib/projects";
import styles from "./Section.module.css";

type Props = {
  section: Extract<ProjectSection, { type: "facts" }>;
  /** 이 값과 똑같은 행(스택)은 글 대신 태그 목록으로 그린다. 프로젝트의 specs 배열을 넘긴다 */
  tags?: string[];
};

/**
 * 개요 표: 프로젝트·분류·팀·역할·기간·스택 같은 라벨/값 쌍.
 * 상세 첫 화면(히어로 아래 메타)에서 쓴다. 넓은 화면은 4칸 격자, 좁은 화면은 "라벨 | 값" 행으로 쌓인다(CSS).
 * 스택 행: 데이터의 값("Next.js, TypeScript, ...")이 specs 배열을 이은 것과 같으면, 쉼표 글 대신 배열을 태그로 보여 준다.
 */
export function FactsSection({ section, tags }: Props) {
  const tagText = tags?.join(", ");
  return (
    <dl className={styles.facts}>
      {section.meta.map((f) => {
        const asTags = tags && f.value === tagText;
        return (
          <div key={f.label} className={styles.fact} data-wide={asTags || undefined}>
            <dt>{f.label}</dt>
            <dd>
              {asTags ? (
                <ul className={styles.tagList} aria-label={f.label}>
                  {tags.map((t) => (
                    <li key={t} className={styles.tag}>
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                f.value
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
