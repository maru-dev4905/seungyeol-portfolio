import type { Metadata } from "next";
import type { ReactNode } from "react";
import styles from "@/components/workflow/Workflow.module.css";
import { WorkflowDiagram } from "@/components/workflow/WorkflowDiagram";
import { Lines } from "@/components/motion/Lines";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { Rule } from "@/components/motion/Rule";
import {
  automation,
  buildRules,
  defenseLevels,
  flowCopy,
  flowMain,
  flowSide,
  lessons,
  memory,
  modeNotes,
  modes,
  parallelRules,
  portfolioIntro,
  principles,
  recordsIntro,
  reviewPoints,
  roles,
  skillGroups,
  skills,
  skillsIntro,
  workflowHero,
  workflowMeta,
  workflowSections,
  type SkillGroup,
} from "@/lib/workflow";

export const metadata: Metadata = {
  title: workflowMeta.title,
  description: workflowMeta.description,
  alternates: { canonical: "/workflow" },
};

// 순서 있는 단계 목록과 스킬 그룹 순서(데이터 순서가 아니라 화면 순서를 여기서 고정한다)
const SKILL_GROUP_ORDER: readonly SkillGroup[] = ["mode", "switch", "quality", "record"];

/** 섹션 머리: 구분선 -> "( 0n ) 라벨" -> 제목 줄 마스크. 섹션 하나 = RevealGroup 타임라인 하나(About과 같은 문법) */
function Head({ n, label, title }: { n: number; label: string; title: string }): ReactNode {
  return (
    <>
      <Rule className={styles.rule} />
      <p className={styles.label} data-r="label">
        {label} <span className={styles.num}>( {String(n).padStart(2, "0")} )</span>
      </p>
      <Lines as="h2" className={styles.h2} lines={[title]} />
    </>
  );
}

/**
 * /workflow: 제가 AI와 일하는 방식(원칙 -> 체계 -> 스킬 -> 프로세스 도식 -> 기록·리뷰 -> 이 사이트).
 * 글은 모두 lib/workflow.ts의 데이터를 그린다. 전부 서버 HTML이라 JS가 꺼져도 읽히고, 도식도 아래 텍스트 단계 목록으로 같은 내용이 있다.
 */
export default function WorkflowPage() {
  const S = workflowSections;
  const steps = [...flowMain, ...flowSide];

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        {/* 0. 머리 */}
        <RevealGroup as="header" className={styles.hero}>
          <p className={styles.label} data-r="label">
            {workflowHero.label}
          </p>
          <Lines as="h1" className={styles.title} lines={workflowHero.titleLines} />
          <p className={styles.titleEn} data-r="body">
            {workflowHero.titleEn}
          </p>
          <p className={styles.intro} data-r="body">
            {workflowHero.intro}
          </p>
        </RevealGroup>

        {/* 1. 원칙 */}
        <RevealGroup as="section" className={styles.section} aria-label={S.principles.label}>
          <Head n={1} label={S.principles.label} title={S.principles.title} />
          <ul className={styles.cards3}>
            {principles.map((p) => (
              <li key={p.title} className={styles.card} data-r="item">
                <p className={styles.cardEn}>{p.en}</p>
                <h3 className={styles.cardTitle}>{p.title}</h3>
                <p className={styles.cardBody}>{p.body}</p>
              </li>
            ))}
          </ul>
        </RevealGroup>

        {/* 2. 역할 · 메모리 · 모드 */}
        <RevealGroup as="section" className={styles.section} aria-label={S.system.label}>
          <Head n={2} label={S.system.label} title={S.system.title} />
          <div data-r="body">
            <h3 className={styles.sub}>역할 Roles</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">역할</th>
                  <th scope="col">실행 주체</th>
                  <th scope="col">하는 일</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td data-label="실행 주체">{r.runsAs}</td>
                    <td data-label="하는 일">{r.duty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className={styles.sub}>메모리 Memory</h3>
            <p className={styles.lead}>에이전트는 세션이 끝나면 잊습니다. 아래 파일이 프로젝트의 기억입니다.</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">종류</th>
                  <th scope="col">위치</th>
                  <th scope="col">기록하는 쪽</th>
                </tr>
              </thead>
              <tbody>
                {memory.map((m) => (
                  <tr key={m.kind}>
                    <td>{m.kind}</td>
                    <td data-label="위치" className={styles.mono}>
                      {m.location}
                    </td>
                    <td data-label="기록하는 쪽">{m.writer}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className={styles.sub}>작업 모드 Modes</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">모드</th>
                  <th scope="col">언제</th>
                  <th scope="col">제가 하는 일</th>
                </tr>
              </thead>
              <tbody>
                {modes.map((m) => (
                  <tr key={m.name}>
                    <td>
                      {m.name} <span className={`${styles.small} ${styles.mono}`}>{m.label}</span>
                    </td>
                    <td data-label="언제">{m.when}</td>
                    <td data-label="제가 하는 일">{m.human}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className={styles.bullets}>
              {modeNotes.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            <h3 className={styles.sub}>병렬 안전 규칙</h3>
            <ul className={styles.bullets}>
              {parallelRules.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </RevealGroup>

        {/* 3. 스킬 12종 */}
        <RevealGroup as="section" className={styles.section} aria-label={S.skills.label}>
          <Head n={3} label={S.skills.label} title={S.skills.title} />
          {skillsIntro.map((t) => (
            <p key={t} className={styles.lead} data-r="body">
              {t}
            </p>
          ))}
          <p className={styles.small} data-r="body" style={{ marginTop: 12 }}>
            커스텀 스킬 {skills.length}종
          </p>
          {SKILL_GROUP_ORDER.map((g) => (
            <div key={g} className={styles.group} data-r="item">
              <p className={styles.groupLabel}>{skillGroups[g]}</p>
              <ul className={styles.skillGrid}>
                {skills
                  .filter((s) => s.group === g)
                  .map((s) => (
                    <li key={s.cmd} className={styles.skillCard} data-skill>
                      <h3 className={styles.cmd}>{s.cmd}</h3>
                      <p className={styles.purpose}>{s.purpose}</p>
                      <dl className={styles.dl}>
                        <div>
                          <dt>언제 쓰나</dt>
                          <dd>{s.when}</dd>
                        </div>
                        <div>
                          <dt>핵심 가드와 동작</dt>
                          <dd>{s.guard}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </RevealGroup>

        {/* 4. 작업 프로세스 도식 + 텍스트 단계 목록 */}
        <RevealGroup as="section" className={styles.section} aria-label={S.process.label}>
          <Head n={4} label={S.process.label} title={S.process.title} />
          <p className={styles.lead} data-r="body">
            작업 하나가 정의에서 릴리스까지 가는 길입니다. 사람이 개입하는 지점(이중선 박스)은 계획 승인, merge, 릴리스입니다. 되돌아가는 화살표는 리뷰 지적을 고치는 루프입니다.
          </p>
        </RevealGroup>
        <WorkflowDiagram />
        <details className={styles.steps}>
          <summary>{flowCopy.textSummary}</summary>
          <ol className={styles.stepList}>
            {steps.map((s) => (
              <li key={s.id}>
                <b>{s.title}</b> · {s.detail}
              </li>
            ))}
          </ol>
        </details>

        {/* 5. 기록 체계 + 코드 리뷰 */}
        <RevealGroup as="section" className={styles.section} aria-label={S.records.label}>
          <Head n={5} label={S.records.label} title={S.records.title} />
          <p className={styles.lead} data-r="body">
            {recordsIntro}
          </p>
          <div data-r="body">
            <h3 className={styles.sub}>방어 수준 Defense levels</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">수준</th>
                  <th scope="col">형태</th>
                  <th scope="col">강도</th>
                </tr>
              </thead>
              <tbody>
                {defenseLevels.map((l) => (
                  <tr key={l.level}>
                    <td>{l.level}</td>
                    <td data-label="형태">{l.form}</td>
                    <td data-label="강도">{l.strength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className={styles.bullets}>
              {automation.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>

            <h3 className={styles.sub}>교훈 예시 Lessons</h3>
            <ul className={styles.lessonGrid}>
              {lessons.map((l) => (
                <li key={l.title} className={styles.card}>
                  <p className={styles.lessonLevel}>방어 수준 {l.level}</p>
                  <h4 className={styles.cardTitle}>{l.title}</h4>
                  <dl className={styles.dl}>
                    <div>
                      <dt>증상</dt>
                      <dd>{l.symptom}</dd>
                    </div>
                    <div>
                      <dt>원인</dt>
                      <dd>{l.cause}</dd>
                    </div>
                    <div>
                      <dt>해결</dt>
                      <dd>{l.fix}</dd>
                    </div>
                    <div>
                      <dt>재발 방지</dt>
                      <dd>{l.prevent}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <h3 className={styles.sub}>코드 리뷰 Review</h3>
            <div className={styles.rows}>
              {reviewPoints.map((r) => (
                <div key={r.title} className={styles.row}>
                  <h4 className={styles.rowTitle}>{r.title}</h4>
                  <p className={styles.rowBody}>{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealGroup>

        {/* 6. 이 포트폴리오를 만든 방식 */}
        <RevealGroup as="section" className={styles.section} aria-label={S.portfolio.label}>
          <Head n={6} label={S.portfolio.label} title={S.portfolio.title} />
          <p className={styles.lead} data-r="body">
            {portfolioIntro}
          </p>
          <div className={styles.rows} data-r="body">
            {buildRules.map((r) => (
              <div key={r.title} className={styles.row}>
                <h3 className={styles.rowTitle}>{r.title}</h3>
                <p className={styles.rowBody}>{r.body}</p>
              </div>
            ))}
          </div>
        </RevealGroup>
      </div>
    </main>
  );
}
