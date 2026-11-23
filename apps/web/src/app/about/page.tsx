import type { Metadata } from "next";
import { AboutHero } from "@/components/about/AboutHero";
import { ProfileBlock } from "@/components/about/ProfileBlock";
import { HobbySection } from "@/components/about/HobbySection";
import { SkillsAccordion } from "@/components/about/SkillsAccordion";
import { CareerLedger } from "@/components/about/CareerLedger";
import { WordFillStatement } from "@/components/about/WordFillStatement";
import styles from "@/components/about/About.module.css";
import { Inline } from "@/components/sections/Inline";
import { Reveal } from "@/components/motion/Reveal";
import { Lines } from "@/components/motion/Lines";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { Rule } from "@/components/motion/Rule";
import { SectionPill } from "@/components/nav/SectionPill";
import { aboutCopy, career, skills, socialLinks } from "@/lib/about";
import { siteCopy } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Lee Seungyeol",
  description:
    "Frontend Engineer Lee Seungyeol in Seoul: clean markup, accessible UI and responsive interactions. Career and skills.",
};

// 하단 알약이 이동할 섹션(아래 각 <section id>와 같다)
const PILL_SECTIONS = [
  { id: "intro", label: "Intro" },
  { id: "career", label: "Career" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>
      <SectionPill sections={PILL_SECTIONS} endId="footer-end" label="About 섹션" />

      {/* 1~2. 히어로(진입 모션은 CSS) + Profile 블록(왼쪽 세로 사진 + 오른쪽 이름·문구·정의 목록·요약) + 취미 섹션(흐르는 사진). 둘 다 Intro에 속한다 */}
      <section id="intro" aria-label="Intro">
        <AboutHero />
        <ProfileBlock />
        <HobbySection />
      </section>

      {/* 3~4. 경력 원장 표 + 소개 선언문(선언문은 Career 섹션에 속한다).
          섹션 모션 = 구분선(좌->우) -> 제목 줄 마스크 -> 표 머리·행 스태거: 하나의 RevealGroup 타임라인 */}
      <section id="career" className={styles.career} aria-label="Career">
        <RevealGroup className={styles.careerHead}>
          <Rule className={styles.rule} />
          <Lines
            as="h2"
            className={styles.display}
            lines={[
              <>
                Career <span className={styles.count}>( {career.length} )</span>
              </>,
            ]}
          />
          <CareerLedger items={career} />
        </RevealGroup>

        <div className={styles.statementWrap}>
          {/* 스크롤에 따라 단어가 회색 -> 흰색으로 채워지는 선언문(scrub이라 시간 토큰 없이 스크롤에 묶인다) */}
          <WordFillStatement className={styles.statement} text={aboutCopy.statement} />
          {/* 선언문의 한글 원문 한 줄 병기 */}
          <Reveal>
            <p className={styles.statementLine} lang="ko">
              {aboutCopy.statementKoLine}
            </p>
          </Reveal>
          <RevealGroup className={styles.introduce}>
            <div className={styles.introduceLabel} data-r="label">
              <p className={styles.introduceTag}>
                {aboutCopy.introLabel} <span>( 01 )</span>
              </p>
              <p className={styles.introduceWho}>
                {aboutCopy.name} — {aboutCopy.role}, {aboutCopy.place}
              </p>
            </div>
            {/* 3단락: 단락마다 data-r="body"라 fade-up이 0.08초 간격으로 이어진다 */}
            <div className={styles.statementKo} lang="ko">
              {aboutCopy.statementKo.map((t) => (
                <p key={t} data-r="body">
                  <Inline text={t} />
                </p>
              ))}
            </div>
          </RevealGroup>
        </div>
      </section>

      {/* 5. 스킬 아코디언: 섹션 자체가 그룹(구분선 -> 제목 줄 -> 항목 스태거) */}
      <RevealGroup as="section" id="skills" className={styles.split} aria-label="Skills">
        <Rule className={`${styles.rule} ${styles.splitRule}`} />
        {/* 제목은 아코디언 목록이 이어지는 동안 위쪽에 붙어 따라온다(sticky, 목록이 끝나면 함께 끝) */}
        <div className={styles.skillsTitle}>
          <Lines as="h2" className={styles.display} lines={["Skills —", "what I use"]} />
        </div>
        <SkillsAccordion skills={skills} />
      </RevealGroup>

      {/* 6. 푸터(Contact). 하단 알약은 Intro·Career·Skills·Contact 4개 */}
      <RevealGroup as="footer" id="contact" className={styles.footer} aria-label="Contact">
        <Rule className={styles.footerRule} />
        <div className={styles.footerTitleBox}>
          <Lines as="h2" className={styles.footerTitle} lines={aboutCopy.footerTitle} />
          <p className={styles.footerBody} data-r="body">
            {aboutCopy.footerBody}
          </p>
        </div>
        <ul className={styles.footerLinks}>
          <li data-r="item">
            {/* siteCopy.email은 헤더 메일 버튼·메뉴 Get in Touch와 같은 값이다 */}
            <a className={`pill ${styles.footerPill}`} href={`mailto:${siteCopy.email}`}>
              Email
            </a>
          </li>
          {socialLinks.map((l) => (
            <li key={l.label} data-r="item">
              <a className={`pill ${styles.footerPill}`} href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div id="footer-end" className={styles.footerEnd} data-r="body">
          <p>Site by Lee-Seungyeol</p>
          <p>Seungyeol Portfolio - Thanks for your time</p>
          <p>
            ©{siteCopy.year} / All rights reserved
          </p>
        </div>
      </RevealGroup>
    </main>
  );
}
