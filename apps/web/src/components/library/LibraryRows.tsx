import type { LibraryItem } from "@/lib/library";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/library";
import styles from "./Library.module.css";

/**
 * Library 카드 그리드. 훅이 없는 순수 표시 컴포넌트라 서버에서도 그려진다:
 * 페이지의 Suspense fallback(= JS가 꺼져 있을 때 보이는 전체 목록)과 필터가 있는 LibraryBrowser가 같은 마크업을 쓴다.
 * 카드 전체가 하나의 외부 링크다: 이름 링크의 ::after가 카드를 덮어 어디를 눌러도 새 탭으로 열린다(링크는 이름 하나라 스크린 리더에는 한 번만 읽힌다).
 * 카드 한 장 = 이름 / 상태(점 + 영문) / 한 줄 설명 / 분류 + 화살표. note는 화면에 쓰지 않는다.
 */
export function LibraryRows({ items }: { items: readonly LibraryItem[] }) {
  return (
    <ul className={styles.grid}>
      {items.map((it) => (
        <li key={it.id} className={styles.card} data-row>
          <div className={styles.top}>
            <h2 className={styles.name}>
              <a
                className={styles.cardLink}
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${it.name} website (new tab)`}
              >
                {it.name}
              </a>
            </h2>
            {/* 상태 배지: 작은 점 + 글자. 점 모양으로만 구분(used = 채움, planned = 빈 고리, watching = 흐린 채움) */}
            <span className={styles.status} data-status={it.status}>
              <span className={styles.dot} aria-hidden="true" />
              {STATUS_LABELS[it.status]}
            </span>
          </div>
          <p className={styles.desc}>{it.tagline}</p>
          <div className={styles.bottom}>
            <span className={styles.cat}>{CATEGORY_LABELS[it.category]}</span>
            <span className={styles.arrow} aria-hidden="true">
              ↗
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
