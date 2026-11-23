import type { LibraryItem } from "@/lib/library";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/library";
import styles from "./Library.module.css";

/**
 * Library 행 목록(Works 아카이브 행 문법). 훅이 없는 순수 표시 컴포넌트라 서버에서도 그려진다:
 * 페이지의 Suspense fallback(= JS가 꺼져 있을 때 보이는 전체 목록)과 필터가 있는 LibraryBrowser가 같은 마크업을 쓴다.
 * 행 전체가 하나의 외부 링크다: 이름 링크의 ::after가 행을 덮어 어디를 눌러도 새 탭으로 열린다(링크는 이름 하나라 스크린 리더에는 한 번만 읽힌다).
 */
export function LibraryRows({ items }: { items: readonly LibraryItem[] }) {
  return (
    <ul className={styles.rows}>
      {items.map((it) => (
        <li key={it.id} className={styles.row} data-row>
          <h2 className={styles.name}>
            <a
              className={styles.rowLink}
              href={it.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${it.name} 공식 사이트 새 탭`}
            >
              {it.name}
            </a>
          </h2>
          <div className={styles.desc}>
            <p>{it.tagline}</p>
            {/* 사이트 주인이 직접 쓴 한 줄. 비어 있으면 아무것도 그리지 않는다 */}
            {it.note && <p className={styles.note}>{it.note}</p>}
          </div>
          <span className={styles.cat}>{CATEGORY_LABELS[it.category]}</span>
          {/* 상태 배지: 작은 점 + 글자. 점 모양으로만 구분(써봄 = 채움, 써볼 예정 = 빈 고리, 관심 = 흐린 채움) */}
          <span className={styles.status} data-status={it.status}>
            <span className={styles.dot} aria-hidden="true" />
            {STATUS_LABELS[it.status]}
          </span>
          <span className={styles.arrow} aria-hidden="true">
            ↗
          </span>
          {it.usedIn && it.usedIn.length > 0 && <p className={styles.usedIn}>사용: {it.usedIn.join(" / ")}</p>}
        </li>
      ))}
    </ul>
  );
}
