import type { Metadata } from "next";
import { WorksArchiveList } from "@/components/works/WorksArchiveList";
import { WorksList, type WorkRow } from "@/components/works/WorksList";
import { SectionPill } from "@/components/nav/SectionPill";
import { Lines } from "@/components/motion/Lines";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { works } from "@/lib/about";
import { getProjects } from "@/lib/projects";
import { siteCopy } from "@/lib/site";
import styles from "@/components/works/Works.module.css";

export const metadata: Metadata = {
  title: "Works | Lee Seungyeol",
  description:
    "Selected work by Lee Seungyeol: two starter kits (Meerkit, Weave), five client projects, and a 45-project publishing archive.",
};

// 하단 섹션 알약
const PILL_SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "selected", label: "Selected" },
  { id: "archive", label: "Archive" },
];

/**
 * /works: Metalab /work 레이아웃(큰 세리프 제목 -> 필터 -> 구분선으로 나뉜 행 목록)을 이 사이트 데이터로 채운다.
 * 대표 7개(kit 2 + project 5)는 projects.ts에서, 아래 Archive 45개는 lib/about.ts의 works에서 온다.
 * 헤더는 레이아웃의 공통 SiteHeader.
 */
export default async function WorksPage() {
  const all = await getProjects();
  const rows: WorkRow[] = all.map((p) => ({
    slug: p.slug,
    kind: p.kind,
    name: p.shortName,
    description: p.tagline,
    tags: p.tags,
    tint: p.tint,
    media: p.media,
  }));

  return (
    <main className={styles.page}>
      <SectionPill sections={PILL_SECTIONS} endId="works-end" label="Works 섹션" />

      {/* 제목 줄 마스크 reveal(About과 같은 모션 문법) */}
      <RevealGroup as="header" id="intro" className={styles.hero}>
        <Lines as="h1" className={styles.title} lines={["A sample of my work —", "from publishing to tooling"]} />
      </RevealGroup>

      <section id="selected" aria-label="Selected work">
        <WorksList rows={rows} />
      </section>

      <section id="archive" className={styles.archive} aria-label="Archive">
        <RevealGroup>
          <Lines
            as="h2"
            className={styles.archiveTitle}
            lines={[
              <>
                Archive <span className={styles.archiveCountNote}>( {works.length} )</span>
              </>,
            ]}
          />
          <p className={styles.archiveIntro} data-r="body">
            Projects I&apos;ve worked on as a front-end publisher.
          </p>
        </RevealGroup>
        <WorksArchiveList works={works} />
      </section>

      <footer id="works-end" className={styles.end}>
        <a className="pill" href={`mailto:${siteCopy.email}`}>
          Get in touch
        </a>
        <p>
          ©{siteCopy.year} {siteCopy.name}
        </p>
      </footer>
    </main>
  );
}
