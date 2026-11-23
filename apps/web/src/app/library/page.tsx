import { Suspense } from "react";
import type { Metadata } from "next";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { LibraryRows } from "@/components/library/LibraryRows";
import styles from "@/components/library/Library.module.css";
import { Lines } from "@/components/motion/Lines";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { getLibraryItems } from "@/lib/library";

export const metadata: Metadata = {
  title: "Library | Lee Seungyeol",
  description: "Libraries and plugins Lee Seungyeol has used, plans to try, or keeps an eye on. Filter by category and status.",
  alternates: { canonical: "/library" },
};

/**
 * /library: 쓰면서 모아 두는 라이브러리·플러그인 목록(Works와 같은 Metalab 문법: 라벨 -> 세리프 제목 -> 필터 알약 -> 구분선 행).
 * 데이터는 getLibraryItems() 하나로만 읽는다(지금은 lib/library.ts의 검증된 배열, 관리자 단계에서는 DB로 바뀔 자리).
 * 필터는 URL 쿼리(?c=&s=)를 쓰는 클라이언트 컴포넌트라 Suspense 안에 둔다. 서버 HTML(= JS 없음)에는 fallback의 "전체 목록"이 들어 있고 필터 알약은 없다.
 */
export default async function LibraryPage() {
  const items = await getLibraryItems();

  return (
    <main className={styles.page}>
      <RevealGroup as="header" className={styles.hero}>
        <p className={styles.label} data-r="label">
          Tools &amp; plugins
        </p>
        <Lines as="h1" className={styles.title} lines={["Library"]} />
        <p className={styles.intro} data-r="body">
          쓰면서 모아 두는 도구들
        </p>
      </RevealGroup>

      <section aria-label="Library list">
        <Suspense
          fallback={
            <>
              <div className={styles.skeleton} aria-hidden="true" />
              <p className={styles.count}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
              <LibraryRows items={items} />
            </>
          }
        >
          <LibraryBrowser items={items} />
        </Suspense>
      </section>
    </main>
  );
}
