import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Media } from "@/components/media/Media";
import { MediaReveal } from "@/components/motion/MediaReveal";
import { SectionPill } from "@/components/nav/SectionPill";
import { HandoffLink } from "@/components/transition/HandoffLink";
import { FactsSection } from "@/components/sections/FactsSection";
import { SectionRenderer, toBlocks } from "@/components/sections/SectionRenderer";
import { mockupMedia } from "@/lib/handoff";
import { getProject, getProjects, getProjectSlugs, type ProjectDetail, type ProjectSection } from "@/lib/projects";
import { siteCopy } from "@/lib/site";
import styles from "./page.module.css";

type Props = PageProps<"/projects/[slug]">;
type Facts = Extract<ProjectSection, { type: "facts" }>;

// 빌드할 때 미리 만들어둘 slug. Cache Components에서는 최소 1개를 돌려줘야 한다.
// 여기에 없는 새 slug는 정적 셸을 먼저 보여준 뒤 채워 넣는다. (D-015)
export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) return { title: "프로젝트를 찾을 수 없어요" };
  return { title: `${project.title} | 이승열`, description: project.summary };
}

// 정적 셸에 들어가는 부분: 아래 Suspense의 fallback.
// params를 기다리는 일은 Suspense 안쪽에서만 한다.
export default function ProjectPage({ params }: Props) {
  return (
    <main className={styles.main}>
      {/* JS가 꺼진 환경: Suspense 안쪽 본문은 서버 HTML에 hidden 상태로 들어 있고, 보이게 바꾸는 스크립트($RC)가 JS라서 실행되지 않는다.
          그때만 hidden 본문을 펼치고 뼈대(skeleton)를 숨겨 본문이 읽히게 한다(JS가 켜져 있으면 noscript는 만들어지지 않는다) */}
      <noscript>
        <style>{`[hidden][id^="S:"]{display:block !important}[class*="skeleton"]{display:none !important}`}</style>
      </noscript>
      <Suspense fallback={<ProjectSkeleton />}>
        <ProjectContent params={params} />
      </Suspense>
    </main>
  );
}

/**
 * 읽기 중심 레이아웃(가독성 피드백 반영, Metalab식 선언문·어긋난 이미지 배치를 버림):
 *   첫 화면  : 영문 이름(디스플레이) + 한국어 한 줄 제목 + 요약 + 개요 표(역할·기간·분류·스택·링크)
 *   히어로   : 풀블리드 미디어 1장(홈에서 이어지는 전환의 도착 칸, data-handoff-target)
 *   본문     : 본문 720px(중앙). 섹션 내비(SectionPill)는 화면 아래 가운데 알약. 블록마다 번호 -> 제목 -> 리드 -> 본문
 *   다음/끝  : 다음 프로젝트(전환 링크) -> 푸터
 * 개요(facts) 섹션은 본문 블록 대신 첫 화면의 개요 표로 한 번만 보여 준다(같은 표가 두 번 나오지 않게).
 */
async function ProjectContent({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  // 다음 프로젝트(마지막 다음은 처음으로 이어진다). 샘플이 하나뿐이면 자기 자신이라 보이지 않게 한다
  const all = await getProjects();
  const at = all.findIndex((p) => p.slug === project.slug);
  const next = all.length > 1 ? all[(at + 1) % all.length] : null;

  const overview = project.sections.find((s): s is Facts => s.type === "facts");
  const blocks = toBlocks(project.sections.filter((s) => s !== overview));
  // 섹션 내비(SectionPill)가 쓰는 목록: 첫 화면(개요) + 본문 블록
  const nav = [{ id: "intro", label: "개요" }, ...blocks.map((b) => ({ id: b.id, label: b.label }))];

  return (
    <article>
      {/* 섹션 내비: 화면 아래 가운데에 떠 있는 알약(현재 섹션 + 진행 링, 누르면 목록이 위로 펼쳐진다) */}
      <SectionPill sections={nav} endId="end" label="Contents" />

      <Hero project={project} overview={overview} />

      {/* 풀블리드 히어로 미디어: 좌우 거터 0, 모서리 직각(측정 1440x838). 홈에서 확대된 면이 이어지는 자리.
          media.aspect(가로 프레임)가 있는 프로젝트는 칸 비율을 그 값으로 바꿔 목업이 잘리지 않게 한다(데스크톱·모바일 모두).
          그림은 홈 썸네일·메뉴 창·확대 면과 같은 목업(mockupMedia)이다. 별도의 히어로 그림을 쓰면 확대 면이 내려앉은 뒤 다른 그림으로 바뀌어 전환이 끊긴다 */}
      <MediaReveal className={styles.bleed} handoff aspect={project.media?.aspect}>
        <Media
          tint={project.tint}
          media={mockupMedia(project.media)}
          alt={project.media ? `${project.shortName} 대표 이미지` : `${project.shortName} 대표 미디어(자리표시)`}
          sizes="100vw"
          priority
        />
      </MediaReveal>

      <div className={styles.body}>
        <div className={styles.content}>
          {blocks.map((block, i) => (
            <SectionRenderer key={block.id} block={block} index={i} tint={project.tint} />
          ))}
          {next && <NextProject project={next} />}
        </div>
      </div>

      <Footer project={project} />
    </article>
  );
}

/**
 * 첫 화면: 영문 이름(디스플레이 세리프) -> 한국어 한 줄 제목 -> 요약 -> 개요 표 -> 링크.
 * 개요 표는 데이터의 facts 섹션(사이트 주인이 쓴 프로젝트·분류·팀·역할·기간·스택)을 그대로 쓰고,
 * 스택 행은 specs 배열을 태그로 보여 준다(FactsSection). facts가 없으면 기본 필드로 최소 표를 만든다.
 */
function Hero({ project, overview }: { project: ProjectDetail; overview?: Facts }) {
  const facts: Facts = overview ?? {
    id: "overview",
    title: "개요",
    type: "facts",
    body: null,
    meta: [
      { label: "분류", value: project.category },
      { label: "역할", value: project.role },
      { label: "기간", value: project.period },
      { label: "스택", value: project.specs.join(", ") },
    ],
  };
  // 바깥 링크: 라이브 사이트 -> 그 밖의 링크(npm 등) -> GitHub 순서
  const links = [
    ...(project.liveUrl ? [{ label: "Live", url: project.liveUrl }] : []),
    ...(project.links ?? []),
    ...(project.githubUrl ? [{ label: "GitHub", url: project.githubUrl }] : []),
  ];

  return (
    <header id="intro" className={styles.hero}>
      <h1 className={styles.title}>{project.shortName}</h1>
      <p className={styles.heroTitle}>{project.title}</p>
      <p className={styles.summary}>{project.summary}</p>

      <div className={styles.meta}>
        <FactsSection section={facts} tags={project.specs} />
        {links.length > 0 && (
          <ul className={styles.links} aria-label="프로젝트 링크">
            {links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {l.label}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only"> (새 탭)</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </header>
  );
}

/**
 * 다음 프로젝트: 본문 폭 안의 가로 카드(썸네일 + 이름 + 한 줄 제목). 전체가 하나의 링크다.
 * 누르면 썸네일 칸(data-handoff-src)이 마스크로 열려 다음 프로젝트의 히어로로 이어진다(HandoffLink).
 */
function NextProject({ project }: { project: ProjectDetail }) {
  return (
    <section className={styles.next} aria-label="다음 프로젝트">
      <HandoffLink href={`/projects/${project.slug}`} tint={project.tint} projectMedia={project.media} source="[data-handoff-src]" className={styles.nextLink}>
        <span className={styles.nextMedia} data-handoff-src style={{ aspectRatio: project.media?.aspect }}>
          <Media tint={project.tint} media={mockupMedia(project.media)} sizes="(max-width: 768px) 100vw, 320px" />
        </span>
        <span className={styles.nextText}>
          <span className={styles.nextLabel}>다음 프로젝트 →</span>
          <span className={styles.nextName}>{project.shortName}</span>
          <span className={styles.nextDesc}>{project.title}</span>
        </span>
      </HandoffLink>
    </section>
  );
}

// 맨 아래: 큰 세리프 한 줄과 링크 목록(원본의 "How can we help?" 자리). 문구는 임시다.
function Footer({ project }: { project: ProjectDetail }) {
  return (
    <footer id="end" className={styles.footer}>
      <h2 className={styles.footerTitle}>Let’s talk</h2>
      <ul className={styles.footerLinks}>
        <li>
          {siteCopy.email ? (
            <a className={`pill ${styles.footerPill}`} href={`mailto:${siteCopy.email}`}>
              Get in touch
            </a>
          ) : (
            // TODO: siteCopy.email이 정해지면 mailto 링크가 나온다
            <span className={`pill ${styles.footerPill}`} aria-disabled="true">
              Get in touch (soon)
            </span>
          )}
        </li>
        {project.liveUrl && (
          <li>
            <a className={`pill ${styles.footerPill}`} href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              Live
            </a>
          </li>
        )}
        {project.links?.map((l) => (
          <li key={l.url}>
            <a className={`pill ${styles.footerPill}`} href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          </li>
        ))}
        {project.githubUrl && (
          <li>
            <a className={`pill ${styles.footerPill}`} href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </li>
        )}
        <li>
          <Link className={`pill ${styles.footerPill}`} href="/works">
            Works
          </Link>
        </li>
      </ul>
      <p className={styles.footerNote}>©{siteCopy.year} {siteCopy.name}</p>
    </footer>
  );
}

function ProjectSkeleton() {
  return <div className={styles.skeleton} aria-hidden="true" />;
}
