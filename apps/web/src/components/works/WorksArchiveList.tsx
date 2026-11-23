"use client";

import { useState } from "react";
import Link from "next/link";
import { WORKS_BASE_URL, WORK_CATEGORIES, type Work, type WorkCategory } from "@/lib/about";
import styles from "./Works.module.css";

type Filter = "All" | WorkCategory;

/**
 * Works 아카이브(45개): 분류 필터 + 행 목록. lib/about.ts의 works 배열을 그대로 쓴다(About의 아카이브와 같은 데이터).
 * 행 = 이름 | 역할 | 연도 | 분류 | (상세 페이지가 있는 작업만) View project.
 * 이 페이지는 필터 알약을 JS 없이도 보이게 둘 수 없으므로 data-needs-js로 숨기고, 그때는 전체가 보인다.
 */
export function WorksArchiveList({ works }: { works: readonly Work[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const shown = filter === "All" ? works : works.filter((w) => w.category === filter);
  const filters: Filter[] = ["All", ...WORK_CATEGORIES];

  return (
    <>
      <nav className={styles.filterNav} aria-label="Filter archive" data-needs-js>
        <p className={styles.filterLabel}>Filter By:</p>
        <div className={styles.chips}>
          {filters.map((f) => (
            <button key={f} type="button" className={`pill ${styles.chip}`} aria-pressed={filter === f} data-active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </nav>
      <p className={styles.archiveCount} role="status">
        {shown.length} projects
      </p>

      <ul className={styles.archiveRows}>
        {shown.map((w) => (
          <li key={w.name} className={styles.archiveRow}>
            <h3 className={styles.archiveName}>{w.name}</h3>
            <span className={styles.archiveRole}>{w.role}</span>
            <span className={styles.archiveYear}>{w.year}</span>
            <span className={styles.archiveCat}>{w.category}</span>
            <span className={styles.archiveLink}>
              {w.slug && (
                <Link href={`${WORKS_BASE_URL}/${w.slug}`} aria-label={`${w.name} 자세히 보기`}>
                  View project
                </Link>
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
