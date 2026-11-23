import Link from "next/link";
import type { Metadata } from "next";
import { CopyEmail } from "@/components/contact/CopyEmail";
import styles from "@/components/contact/Contact.module.css";
import { Lines } from "@/components/motion/Lines";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { aboutCopy, socialLinks } from "@/lib/about";
import { siteCopy } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact | Lee Seungyeol",
  description: "Start a story with Lee Seungyeol, a frontend engineer in Seoul. Email, GitHub and other ways to get in touch.",
};

/**
 * /contact: Metalab Contact·푸터 문법(큰 세리프 H1, 오른쪽 링크 열, 맨 아래 링크 컬럼)에 About 푸터와 같은 12열 격자.
 * H1·한 줄 소개는 About 푸터와 같은 문구(lib/about.ts), 이메일은 헤더 메일 버튼·About 푸터와 같은 값(siteCopy.email). 전화번호는 넣지 않는다.
 * 모두 서버 HTML이라 JS가 꺼져도 읽히고 mailto 링크로 연락할 수 있다(Copy 버튼만 JS가 필요해 숨는다).
 */
export default function ContactPage() {
  const email = siteCopy.email;
  return (
    <main className={styles.page}>
      {/* 헤더 전체가 한 타임라인: 제목 줄 마스크 -> 한 줄 소개 -> 링크 행 스태거(About과 같은 모션 문법, lib/motion.ts) */}
      <RevealGroup as="header" className={styles.hero}>
        <div className={styles.titleBox}>
          <Lines as="h1" className={styles.title} lines={aboutCopy.footerTitle} />
          <p className={styles.body} data-r="body">
            {aboutCopy.footerBody}
          </p>
        </div>

        <div className={styles.links}>
          <ul className={styles.linkList} aria-label="Contact">
            <li data-r="item">
              <p className={styles.label}>Email</p>
              {email ? <CopyEmail email={email} /> : <p className={styles.soon}>Email address coming soon.</p>}
            </li>
            <li data-r="item">
              <p className={styles.label}>Code</p>
              <a className={`pill ${styles.actionPill}`} href={socialLinks[0].href} target="_blank" rel="noopener noreferrer">
                {socialLinks[0].label}
                <span className="sr-only"> (새 탭)</span>
              </a>
            </li>
            <li data-r="item">
              <p className={styles.label}>Work</p>
              <Link className={`pill ${styles.actionPill}`} href="/works">
                See my work
              </Link>
            </li>
          </ul>
        </div>
      </RevealGroup>

      {/* 맨 아래 링크 컬럼: About 푸터와 같은 소셜 링크(lib/about.ts) 4개 */}
      <footer className={styles.footer} aria-label="Elsewhere">
        <p className={styles.label}>Elsewhere</p>
        <ul className={styles.columns}>
          {socialLinks.map((l) => (
            <li key={l.label}>
              <a className={styles.colLink} href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
                <span aria-hidden="true"> ↗</span>
                <span className="sr-only"> (새 탭)</span>
              </a>
            </li>
          ))}
        </ul>
        <div className={styles.end}>
          <p>Site by Lee-Seungyeol</p>
          <p>Seungyeol Portfolio - Thanks for your time</p>
          <p>
            ©{siteCopy.year} / All rights reserved
          </p>
        </div>
      </footer>
    </main>
  );
}
