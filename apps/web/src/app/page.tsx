import Link from "next/link";
import { HomeStage } from "@/components/home/HomeStage";
import { getProjects } from "@/lib/projects";
import { siteCopy } from "@/lib/site";
import styles from "./page.module.css";

// 메인: 100svh 한 화면, 스크롤 없음. 헤더는 루트 레이아웃의 SiteHeader이고
// 여기서는 배경·알약 목록·헤드라인·hover 장면(HomeStage)만 그린다.
export default async function Home() {
  const projects = (await getProjects()).map(({ slug, group, shortName, tagline, productType, tint, media }) => ({
    slug,
    group,
    shortName,
    tagline,
    productType,
    tint,
    media,
  }));

  return (
    <>
      <main className={styles.main}>
        <HomeStage projects={projects} />
      </main>

      {/* JS가 꺼진 환경: Menu 오버레이를 열 수 없으므로 그 내용(소개·연락)을 홈 아래에 그대로 펼친다(스크롤 허용).
          noscript는 JS가 켜져 있으면 DOM에 만들어지지 않아 한 화면(100svh)이 그대로 유지된다 */}
      <noscript>
        <section className={styles.fallback} aria-label="소개와 연락">
          <h2>{siteCopy.menu.about}</h2>
          <p>{siteCopy.menu.aboutBody}</p>
          <p>
            <Link href="/about">About</Link>
          </p>
          <h2>{siteCopy.menu.library}</h2>
          <p>
            <Link href="/library">Library</Link>
          </p>
          <p>
            <Link href="/workflow">Workflow — How I work with AI</Link>
          </p>
          <h2>{siteCopy.menu.contact}</h2>
          <p>
            <Link href="/contact">Contact</Link>
          </p>
          <p>{siteCopy.email ? <a href={`mailto:${siteCopy.email}`}>{siteCopy.email}</a> : "Email address coming soon."}</p>
          <p>{siteCopy.menu.based}</p>
        </section>
      </noscript>
    </>
  );
}
