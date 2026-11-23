// /workflow 페이지의 글을 한 곳에 모은다. 컴포넌트는 글을 직접 쓰지 않고 여기서 가져가 그리기만 한다(수정 = 이 파일만).
// 쓰는 원칙: 규칙 원문·구조·사례만 쓴다(일반론 금지). 읽은 근거에 없는 사실은 넣지 않는다.
// 한국어 본문 + 영문 섹션 라벨. 1인칭("저는/제가")으로 쓴다.

// ---------- 페이지 머리 ----------
export const workflowHero = {
  label: "Workflow",
  // 소개 페이지 선언문(lib/about.ts)과 같은 문장
  titleLines: ["구현은 AI와 빠르게,", "구조는 사람이 먼저."],
  titleEn: "Fast with AI, structured by people first.",
  intro:
    "AI와 일할 때 저는 대화창에서 그때그때 부탁하지 않고, 규칙·역할·검증을 파일로 설계해 둡니다. 아래는 제가 구성한 협업 체계의 구조와 실제 규칙입니다.",
} as const;

// 섹션 머리(번호는 페이지가 순서대로 붙인다: ( 01 )…( 06 ))
export const workflowSections = {
  principles: { label: "Principles", title: "원칙 세 가지" },
  system: { label: "System", title: "역할 · 메모리 · 모드" },
  skills: { label: "Skills", title: "Claude 스킬(슬래시 명령)" },
  process: { label: "Process", title: "작업 프로세스" },
  records: { label: "Records & review", title: "기록 체계와 코드 리뷰" },
  portfolio: { label: "This site", title: "이 포트폴리오를 만든 방식" },
} as const;

// ---------- 1. 원칙 ----------
export type Principle = { title: string; en: string; body: string };

export const principles: readonly Principle[] = [
  {
    title: "사람이 승인한다",
    en: "Human approves",
    body: "제품 범위·보안·데이터·merge·배포는 제가 결정합니다. 동작이나 보안, 데이터에 영향이 있는 작업이면 AI는 계획과 파일 목록을 먼저 보여 주고 승인을 기다립니다. 모호하면 추측하지 말고 묻도록 규칙에 적어 두었습니다.",
  },
  {
    title: "파일이 기억한다",
    en: "Files remember",
    body: "에이전트 세션은 프로젝트를 기억하지 못합니다. 그래서 모든 세션이 시작할 때 규칙·상태 파일을 읽고, 끝날 때 결과를 파일에 씁니다. 규칙은 CLAUDE.md, 상태는 STATUS, 결정은 ADR, 실수는 교훈 문서에 남깁니다.",
  },
  {
    title: "구현자는 검증하지 않는다",
    en: "Builders do not verify",
    body: "구현한 세션이 자기 결과를 확인하지 않습니다. 검증자는 매번 새 세션으로 시작해 PR 요약을 믿지 않고 수용 기준, 테스트, 상호작용 체크리스트를 직접 확인합니다. 검증이 시작된 뒤 push가 생기면 새 head를 다시 검증합니다.",
  },
];

// ---------- 2. 역할 · 메모리 · 모드 ----------
// 조직도(RolesOrgChart)의 한 노드. parent로 트리를 만든다(null = 최상단). 글은 기존 역할 표의 내용을 한 줄 책임·핵심 제약으로 나눠 담았다.
// avatar: 캐릭터 그림 종류(RoleAvatar가 그린다). side: 보고 줄기 바깥의 옆 가지(외부 리뷰어·자동화). gate: 사람 승인이 필요한 연결선에 붙는 표시
export type AvatarKind = "human" | "orchestrator" | "implementer" | "verifier" | "reviewer" | "automation";

export type Role = {
  id: string;
  parent: string | null;
  avatar: AvatarKind;
  name: string;
  runsAs: string; // 실행 주체
  summary: string; // 한 줄 책임
  constraint: string; // 핵심 제약 한 줄
  side?: boolean;
  gate?: string;
};

export const roles: readonly Role[] = [
  {
    id: "owner",
    parent: null,
    avatar: "human",
    name: "Owner",
    runsAs: "저(사람)",
    summary: "중요한 계획을 승인하고, 비교안 중 하나를 고르고, 실기기를 확인하고, merge합니다.",
    constraint: "제품 범위·보안·데이터·merge·배포는 사람만 결정합니다.",
  },
  {
    id: "orchestrator",
    parent: "owner",
    avatar: "orchestrator",
    name: "Orchestrator",
    runsAs: "메인 Claude 세션",
    summary: "메모리 파일을 읽고 다음 작업과 계획을 정해 구현자·검증자 세션을 시작하고 닫습니다. 상태 파일을 갱신하고 승인을 요청합니다.",
    constraint: "작업 코드 맥락은 들고 있지 않고 상태는 파일에 둡니다.",
    gate: "사람 승인 · 계획, merge, 릴리스",
  },
  {
    id: "implementer",
    parent: "orchestrator",
    avatar: "implementer",
    name: "Implementer",
    runsAs: "작업마다 별도 worktree의 워커 세션",
    summary: "작업 하나를 구현하고, 로컬 검사를 돌리고, 한국어 PR을 엽니다. 리뷰 지적을 가장 빨리 고치는 쪽이 작성자라서 검증 지적까지 처리합니다.",
    constraint: "작업 하나, worktree 하나만 맡습니다.",
  },
  {
    id: "verifier",
    parent: "orchestrator",
    avatar: "verifier",
    name: "Verifier",
    runsAs: "매번 새로 만드는 별도 세션",
    summary: "수용 기준 대조, 테스트 재실행, 상호작용 체크리스트(모션 줄이기, 긴 한글 문장, 스크린 리더 레이블)를 확인합니다.",
    constraint: "자기가 구현한 PR은 검증하지 않고, 코드는 고치지 않고 심각도를 붙인 지적만 남깁니다. 구현자 재사용 금지.",
  },
  {
    id: "reviewer",
    parent: "orchestrator",
    avatar: "reviewer",
    name: "External reviewer",
    runsAs: "CodeRabbit (GitHub 앱)",
    summary: "초안이 아닌 모든 PR을 한국어로 리뷰합니다.",
    constraint: "merge 권한이 없습니다.",
    side: true,
  },
  {
    id: "automation",
    parent: "orchestrator",
    avatar: "automation",
    name: "Automation",
    runsAs: "GitHub · 작업 관리 도구 · Slack 연동",
    summary: "이슈 상태 전환과 알림을 맡습니다. PR이 열리면 검토 중, dev에 merge되면 완료로 바뀝니다.",
    constraint: "AI가 아니라 규칙 기반입니다.",
    side: true,
  },
];

// 메모리 파일 트리(MemoryTree). 기존 표의 6항목(규칙·명세·결정·현재 상태·교훈·저널)을 폴더 구조로 재배치했다.
// what = 담는 것, who = 기록하는 쪽(오른쪽 회색 주석 `# what — who`가 된다). children이 있으면 폴더
// dir: 자식을 다 그리지 않는 빈 폴더(아이콘만 폴더로 보인다)
export type MemoryNode = { id: string; name: string; what: string; who?: string; dir?: boolean; children?: readonly MemoryNode[] };

export const memoryTree: MemoryNode = {
  id: "root",
  name: "project/",
  what: "에이전트의 기억은 모두 파일",
  children: [
    { id: "claude-md", name: "CLAUDE.md", what: "규칙", who: "제가 승인한 내용만" },
    {
      id: "docs",
      name: "docs/",
      what: "명세",
      who: "PR로 갱신",
      children: [
        { id: "status", name: "STATUS.md", what: "현재 상태 · 다음 작업", who: "오케스트레이터와 마무리하는 에이전트. 제가 AI의 이해를 확인하려고 한국어로 씁니다" },
        { id: "adr", dir: true, name: "adr/", what: "결정", who: "PR로 기록, Accepted는 제가 승인" },
        { id: "journal", dir: true, name: "journal/", what: "저널(결정 서사)", who: "/log, 마무리 단계" },
        { id: "lessons", dir: true, name: "lessons/", what: "교훈(실수 → 방어 수준)", who: "/lesson, 마무리 단계" },
      ],
    },
    {
      id: "dot-claude",
      name: ".claude/",
      what: "에이전트 설정",
      children: [
        { id: "settings", name: "settings.json", what: "훅 · 권한 설정" },
        { id: "skills-dir", dir: true, name: "skills/", what: "슬래시 명령 12종" },
        { id: "agents-dir", dir: true, name: "agents/", what: "역할 정의" },
      ],
    },
  ],
};

export const memoryCaption = "에이전트는 세션이 바뀌면 기억하지 않는다 → 시작할 때 읽고, 끝날 때 쓴다";

// ---- 작업 모드(ModesTabs): 모드마다 탭 하나. 단계의 실행 주체는 칩으로 보인다
export type Actor = "Owner" | "Orchestrator" | "Implementer" | "Verifier";
export type ModeStep = { who: Actor; what: string };
export type ModeCmd = { cmd: string; note: string };

export type Mode = {
  id: "seq" | "compare" | "parallel"; // 탭·패널 id와 URL 해시(#mode-compare)의 기준
  tab: string; // 탭 이름(영문)
  name: string; // 한국어 모드 이름
  label: string; // 이슈 라벨(모드 표시)
  when: string; // 언제 쓰나(한 줄)
  start: ModeCmd; // 사람이 입력하는 시작 명령
  steps: readonly ModeStep[];
  next: readonly ModeCmd[]; // 다음에 이어 쓰는 명령(없을 수 있다)
  nextNote?: string; // next가 비었을 때 보이는 설명
  guards: readonly string[]; // 제약·가드
  stepNote?: string; // 단계 목록 위의 작은 주석
};

export const modeIntro =
  "모드는 AI가 스스로 바꾸지 않습니다. 전환은 제가 입력하는 슬래시 명령으로만 일어나고, 현재 모드는 이슈 라벨과 STATUS에 기록해 세션이 바뀌어도 이어집니다.";

export const modes: readonly Mode[] = [
  {
    id: "seq",
    tab: "Sequential",
    name: "A. 순차",
    label: "mode-seq",
    when: "기반 작업, 그리고 고른 안 하나를 다듬을 때 씁니다. 제가 하는 일은 계획 승인과 merge입니다.",
    start: { cmd: "/seq", note: "작업 키와 함께 시작" },
    stepNote: "순차 모드에서는 세션 하나가 구현자로 일합니다.",
    steps: [
      { who: "Owner", what: "/seq 에 작업 키를 주고 시작합니다." },
      { who: "Implementer", what: "규칙·STATUS·교훈 색인과 작업 이슈(수용 기준)를 읽고, 이슈에 순차 모드 라벨을 붙인 뒤 최신 dev에서 작업 브랜치를 딥니다." },
      { who: "Implementer", what: "계획과 바꿀 파일 목록을 한국어로 제시합니다." },
      { who: "Owner", what: "동작·보안·데이터에 영향이 있는 변경이면 계획을 승인합니다. 승인 전에는 구현하지 않습니다." },
      { who: "Implementer", what: "실패하는 테스트를 먼저 쓰고, 구현해서 통과시킵니다." },
      { who: "Implementer", what: "/finish 로 마무리합니다. 검사, 한국어 PR, 기록, push, 독립 검증 요청까지 한 번에 합니다." },
      { who: "Verifier", what: "구현에 참여하지 않은 새 세션에서 제가 /verify 를 실행해 마지막 push를 검증합니다." },
      { who: "Owner", what: "리뷰하고 dev에 merge합니다." },
    ],
    next: [
      { cmd: "/finish", note: "작업 마무리" },
      { cmd: "/verify", note: "새 세션에서 독립 검증" },
    ],
    guards: [
      "동작·보안·데이터에 영향이 있으면 계획 승인 전에 구현하지 않습니다.",
      "구현은 실패하는 테스트를 먼저 씁니다.",
      "실행하지 않은 검사를 통과했다고 쓰지 않습니다.",
    ],
  },
  {
    id: "compare",
    tab: "Compare",
    name: "B. 비교",
    label: "mode-compare",
    when: "인터랙션 비중이 큰 UI처럼 보고 골라야 할 때 씁니다. 서로 다른 두 안을 만들어 비교하고, 제가 미리보기로 1번 또는 2번을 고릅니다.",
    start: { cmd: "/compare", note: "작업 키와 함께 시작" },
    steps: [
      { who: "Owner", what: "/compare 에 작업 키를 주고 시작합니다." },
      { who: "Orchestrator", what: "작업 이슈와 설계 문서, 이전 라운드 기록을 읽고 라운드 번호를 정합니다. 3라운드가 될 상황이면 멈추고 /back-to-design 을 제안합니다." },
      { who: "Orchestrator", what: "이슈에 비교 모드 라벨을 붙이고 비교 라운드 시작을 기록한 뒤, 의도적으로 다른 두 안의 지시서를 씁니다." },
      { who: "Implementer", what: "구현자 둘이 라운드별 브랜치(-r1-v1, -r1-v2)와 서로 다른 worktree에서 동시에 구현하고, dev를 대상으로 초안 PR과 기기 미리보기를 만듭니다." },
      { who: "Orchestrator", what: "무엇이 다른지, 미리보기 링크, 각 안의 모션 줄이기 동작을 한국어 비교 코멘트로 남깁니다. 실제로 생성된 미리보기만 링크합니다." },
      { who: "Owner", what: "미리보기를 보고 1번 또는 2번을 고르거나, 다음 전환 명령을 입력합니다." },
    ],
    next: [
      { cmd: "/pick", note: "한 안을 고르고 나머지를 닫음" },
      { cmd: "/refine", note: "한 안이 가까움 → 순차로 다듬기" },
      { cmd: "/retry", note: "둘 다 거절 → 새 라운드" },
      { cmd: "/back-to-design", note: "설계 단계로 되돌림" },
    ],
    guards: [
      "비교 라운드는 최대 2회입니다. 두 번 해도 안 맞으면 세 번째 라운드 대신 디자인 단계로 되돌립니다. 비교는 비용이 두 배라서 정한 상한입니다.",
      "두 안은 서로 다른 worktree에서 동시에 구현하고, 의도적으로 다르게 만듭니다.",
      "라운드 2는 라운드 1의 브랜치를 재사용하지 않습니다. 이전 브랜치는 참고용으로 남깁니다.",
      "/pick·/refine 은 고르지 않은 안의 PR을 닫고, 브랜치 삭제는 제가 확인한 뒤에만 합니다.",
    ],
  },
  {
    id: "parallel",
    tab: "Parallel",
    name: "C. 오케스트레이션",
    label: "mode-parallel",
    when: "방향이 정해진 뒤의 상세 구현에 씁니다. 작업 하나 또는 서로 독립인 여러 개를 맡기고, 제가 하는 일은 명령 하나, 질문에 답, merge입니다.",
    start: { cmd: "/parallel", note: "작업 키 하나 이상으로 시작" },
    steps: [
      { who: "Owner", what: "/parallel 에 작업 키를 하나 이상 주고 시작합니다." },
      { who: "Orchestrator", what: "작업마다 건드릴 파일을 추정합니다. 겹치거나 lockfile·마이그레이션·테마 토큰·.claude/ 를 건드리는 작업은 병렬을 거부하고 직렬화합니다. 병렬 모드 라벨을 붙입니다." },
      { who: "Orchestrator", what: "작업마다 구현자 하나를 새 worktree에서 시작합니다. 지시서는 스스로 완결되게 쓰고, 동작·보안·데이터에 영향이 있는 일은 결정하지 말고 묻게 합니다." },
      { who: "Implementer", what: "구현하고 로컬 검사를 돌려 한국어 PR을 엽니다. 질문은 오케스트레이터를 거쳐 제게 오고, 제 답이 같은 길로 돌아갑니다." },
      { who: "Orchestrator", what: "외부 리뷰 지적을 valid / invalid / 제품 결정 필요로 분류해 valid만 같은 구현자에게 보냅니다. 자동 수정은 최대 2라운드입니다." },
      { who: "Orchestrator", what: "최종 SHA를 로컬·원격·PR head 세 곳에서 확인하고, 새 검증자 세션을 시작합니다." },
      { who: "Verifier", what: "마지막 head를 검증합니다. 지적이 있으면 같은 구현자에게 가고, 새 push가 생기면 새 검증자가 새 head를 다시 검증합니다." },
      { who: "Owner", what: "오케스트레이터의 보고(PR 링크, 검증 결과, 남은 위험)를 보고 merge합니다. merge는 AI가 하지 않습니다." },
    ],
    next: [],
    nextNote: "이 모드에서 제가 더 입력하는 명령은 없습니다. 검증자는 오케스트레이터가 자동으로 새 세션에 시작합니다.",
    guards: [
      "작업 하나 = worktree 하나 = 브랜치 하나 = PR 하나.",
      "병렬은 건드리는 파일이 겹치지 않는 작업끼리만 합니다.",
      "package.json과 lockfile, DB 마이그레이션, 공용 테마 토큰, CLAUDE.md와 .claude/ 변경은 병렬로 돌리지 않고 직렬로 처리합니다.",
      "비밀 값은 git에 두지 않습니다. 워크트리 설정 스크립트가 기본 체크아웃에서 복사합니다.",
    ],
  },
];

// ---------- 3. 스킬 12종 ----------
export type SkillGroup = "mode" | "switch" | "quality" | "record";

export type Skill = {
  cmd: string; // 슬래시 명령(접두어 없는 일반 이름)
  group: SkillGroup;
  purpose: string; // 한 줄 목적
  when: string; // 언제 쓰는지
  guard: string; // 핵심 가드·동작
};

export const skillGroups: Readonly<Record<SkillGroup, string>> = {
  mode: "모드 시작",
  switch: "비교 이후 전환",
  quality: "검증·마무리",
  record: "기록·상태",
};

export const skillsIntro = [
  "같은 지시를 매번 대화창에 다시 쓰면 빠뜨리는 단계가 생깁니다. 그래서 반복되는 절차를 스킬(슬래시 명령) 파일로 고정했습니다. 명령 한 줄이면 읽을 문서, 브랜치 규칙, 승인 지점, 마무리 순서가 같게 돌아갑니다.",
  "작업 모드를 바꾸는 명령 7개는 모델이 스스로 호출하지 못하게 막아 두었습니다(disable-model-invocation). 모드 전환은 제가 직접 입력할 때만 일어납니다. 아래 12개는 모두 직접 만든 커스텀 스킬입니다.",
] as const;

export const skills: readonly Skill[] = [
  {
    cmd: "/seq",
    group: "mode",
    purpose: "순차 모드(A)로 작업 하나를 시작하거나 이어갑니다.",
    when: "기반 작업, 또는 비교에서 고른 안을 다듬을 때 작업 키를 주고 실행합니다.",
    guard:
      "규칙·상태·교훈 색인을 먼저 읽고 최신 dev에서 작업 브랜치를 땁니다. 동작·보안·데이터에 영향이 있으면 계획과 파일 목록을 보이고 승인을 기다립니다. 구현은 실패하는 테스트를 먼저 씁니다.",
  },
  {
    cmd: "/compare",
    group: "mode",
    purpose: "비교 모드(B)로 서로 다른 두 안을 동시에 만듭니다.",
    when: "말로 설명하기 어려운 인터랙션처럼 보고 골라야 하는 UI일 때 씁니다.",
    guard:
      "구현자 둘이 라운드별 브랜치(-r1-v1, -r1-v2)와 별도 worktree에서 의도적으로 다른 두 안을 만듭니다. 라운드는 최대 2회이고 3회째면 멈추고 디자인으로 되돌리자고 제안합니다. 실제로 생성된 미리보기만 링크합니다.",
  },
  {
    cmd: "/parallel",
    group: "mode",
    purpose: "오케스트레이션 모드(C)로 구현자와 검증자를 오케스트레이터가 운영합니다.",
    when: "방향이 정해진 뒤 상세 구현을 맡길 때 명령 하나로 시작합니다. 작업 하나도, 서로 독립인 여러 개도 가능합니다.",
    guard:
      "파일이 겹치거나 lockfile·마이그레이션·테마 토큰·.claude/를 건드리는 작업은 병렬을 거부하고 직렬화합니다. 구현자는 동작·보안·데이터에 영향이 있는 일을 스스로 결정하지 않고 묻습니다. 리뷰 지적은 분류해 같은 구현자에게 최대 2라운드 전달하고, 최종 SHA를 세 곳에서 확인한 뒤 새 검증자를 시작합니다. merge는 하지 않습니다.",
  },
  {
    cmd: "/pick",
    group: "switch",
    purpose: "비교에서 한 안을 고르고 나머지를 닫습니다.",
    when: "두 안 중 하나가 맞을 때 안 번호와 함께 실행합니다.",
    guard:
      "고르지 않은 안의 PR은 닫고, 브랜치 삭제는 제가 확인한 뒤에만 합니다. 선택 이유를 기록하고, 이어서 순차(A)로 다듬을지 오케스트레이션(C)으로 쪼갤지 묻습니다.",
  },
  {
    cmd: "/refine",
    group: "switch",
    purpose: "한 안이 거의 맞을 때 순차 모드로 바꿔 피드백을 반영합니다.",
    when: "고른 안이 가깝지만 조정이 필요할 때 피드백 문장과 함께 실행합니다.",
    guard:
      "다른 안의 PR을 이유와 함께 닫고 피드백을 기록합니다. 고른 브랜치에서 모션 줄이기 동작을 유지한 채 반영하고, 끝나면 /finish 절차로 마무리합니다.",
  },
  {
    cmd: "/retry",
    group: "switch",
    purpose: "두 안을 모두 거절하고 피드백을 넣어 새 비교 라운드를 엽니다.",
    when: "두 안 모두 방향이 맞지 않을 때 싫었던 점을 적어 실행합니다.",
    guard:
      "피드백은 새 두 안의 하드 제약이 됩니다. 이미 2라운드를 했다면 3라운드를 열지 않고 디자인으로 되돌리자고 제안한 뒤 멈춥니다. 이전 브랜치는 참고용으로 남깁니다.",
  },
  {
    cmd: "/back-to-design",
    group: "switch",
    purpose: "구현 변형을 닫고 작업을 설계 단계로 되돌립니다.",
    when: "원하는 인터랙션을 아직 말로 설명하지 못할 때 씁니다.",
    guard:
      "시도한 것, 기각한 이유, 열린 질문을 정리합니다. 레퍼런스와 인터랙션 명세를 요청하는 UX 작업을 만들고 원래 작업은 그 작업에 막힌 상태로 표시합니다. 설계 통찰이 있었으면 저널도 씁니다.",
  },
  {
    cmd: "/verify",
    group: "quality",
    purpose: "구현에 참여하지 않은 세션이 PR을 독립적으로 검증합니다.",
    when: "마지막 push 뒤에 새 세션에서 PR 번호와 대상 SHA를 주고 실행합니다.",
    guard:
      "시작하자마자 이 세션이 구현에 참여했는지 확인하고, 참여했다면 멈추고 새 세션을 요구합니다. 대상 SHA가 PR head와 다르면 중단합니다. 공유 체크아웃을 detach하지 않고 별도 worktree에서 검사한 뒤 지웁니다. 확인한 head SHA를 보고서 맨 위에 적고, 지적은 심각도(Critical/High/Medium/Low)와 함께 PR 코멘트 하나로 남기며 코드는 고치지 않습니다.",
  },
  {
    cmd: "/finish",
    group: "quality",
    purpose: "작업을 마무리합니다. 검사, 한국어 PR, 기록, 상태 갱신까지 한 번에 합니다.",
    when: "모든 구현 작업의 끝에 씁니다.",
    guard:
      "있는 검사(포맷·린트·타입·테스트·빌드)를 돌리고 실행하지 않은 검사를 통과했다고 쓰지 않습니다. 검사 스크립트를 새로 만들었다면 먼저 결함을 넣은 사본에서 실제로 실패하는지 확인합니다. PR은 dev를 대상으로 열고, 결정이나 실수가 있었다면 저널·교훈을 추가합니다. push 뒤에는 원격·로컬·PR head SHA가 같은지 확인한 다음에만 보고합니다. merge는 하지 않습니다.",
  },
  {
    cmd: "/lesson",
    group: "record",
    purpose: "실수, 유효한 리뷰 지적, CI 실패를 교훈으로 남깁니다.",
    when: "에이전트의 실수나 리뷰 지적, 하네스 오류가 있었을 때 씁니다. 기존 교훈과 같은 오류를 만났을 때도 씁니다.",
    guard:
      "색인에서 같은 교훈을 먼저 찾습니다. 있으면 재발로 기록하고 방어 수준을 한 단계 올린 뒤 멈춥니다. 없으면 증상·원인·해결·재발 방지·방어 수준을 적고, 지금 가능한 가장 높은 수준(L3 > L2 > L1 > L0)을 고릅니다.",
  },
  {
    cmd: "/log",
    group: "record",
    purpose: "대화 내용에서 의사결정 저널(배경, 선택지, 결정과 이유, 결과)을 씁니다.",
    when: "선택지 사이에서 고른 결정이 있었을 때 주제를 주고 실행합니다.",
    guard:
      "사실만 씁니다. 수치와 인용을 지어내지 않고 불확실한 것은 불확실하다고 표시합니다. 선택지 표에는 실제 트레이드오프와 결정을 이끈 제약을 넣고, 제 목소리로 나가는 글이라 커밋 전에 초안을 보여 줍니다.",
  },
  {
    cmd: "/status",
    group: "record",
    purpose: "읽기 전용 현황 보고입니다.",
    when: "세션을 시작할 때나 지금 어디까지 왔는지 물을 때 씁니다.",
    guard:
      "STATUS를 읽고, 작업 관리 도구에 닿으면 진행 중 작업과 모드 라벨, 열린 PR의 CI·리뷰 상태를 가져옵니다. 진행 중, 다음 할 일, 사람 확인 필요, 불일치(STATUS와 작업 관리 도구가 다를 때)로 나눠 보고하고 아무것도 바꾸지 않습니다.",
  },
];

// ---------- 4. 작업 프로세스 도식 ----------
// kind: ai = 둥근 박스, human = 이중선 박스(사람 승인·직접 조작), auto = 점선 박스(자동화·외부 봇)
export type FlowKind = "ai" | "human" | "auto";

export type FlowNode = {
  id: string;
  title: string; // 도식 박스의 제목
  sub: string; // 도식 박스의 짧은 보조 글(한 줄)
  kind: FlowKind;
  detail: string; // 텍스트 단계 목록(ol)에 쓰는 설명
};

// 주 흐름 11단계(순서대로 화살표로 이어진다)
export const flowMain: readonly FlowNode[] = [
  { id: "task", title: "Task 정의", sub: "요구·완료 조건", kind: "ai", detail: "요구사항과 완료 조건(수용 기준)을 정합니다. 목적, 범위와 범위 밖, 테스트 가능한 기준, 예외 상황이 빠져 있으면 시작하지 않습니다." },
  { id: "plan", title: "Plan", sub: "계획 제시", kind: "ai", detail: "AI가 계획과 바꿀 파일 목록을 한국어로 제시합니다." },
  { id: "gate1", title: "사람 승인", sub: "계획 확인", kind: "human", detail: "사람 승인 게이트. 동작·보안·데이터에 영향이 있는 변경이면 제가 계획을 승인하기 전에는 구현하지 않습니다." },
  { id: "impl", title: "Implement", sub: "브랜치·worktree", kind: "ai", detail: "작업별 브랜치와 worktree에서 구현자 에이전트가 구현합니다. 실패하는 테스트를 먼저 씁니다." },
  { id: "local", title: "Local checks", sub: "포맷·린트·테스트", kind: "ai", detail: "포맷, 린트, 타입 검사, 테스트, 빌드를 돌립니다. 실행하지 않은 검사를 통과했다고 쓰지 않습니다." },
  { id: "ci", title: "PR + CI", sub: "자동 검사", kind: "auto", detail: "dev를 대상으로 한국어 PR을 열고 CI가 같은 검사를 자동으로 돌립니다." },
  { id: "review", title: "외부 리뷰", sub: "CodeRabbit", kind: "auto", detail: "CodeRabbit이 한국어로 PR을 리뷰하고 심각도(Critical/High/Medium/Low)를 붙입니다." },
  { id: "fix", title: "Fix loop", sub: "분류 후 수정", kind: "ai", detail: "지적을 valid / invalid / 제품 결정 필요로 분류합니다. valid는 같은 구현자가 고치고 검사를 다시 돌려 다시 리뷰를 받습니다. 자동 수정은 최대 2라운드이고, 그 뒤에는 사람에게 올립니다." },
  { id: "verify", title: "독립 검증", sub: "새 세션 Verifier", kind: "ai", detail: "마지막 push 뒤, 구현에 참여하지 않은 새 세션의 검증자가 수용 기준, 테스트 재실행, 상호작용 체크리스트를 확인합니다. 이후 push가 생기면 새 head를 다시 검증합니다." },
  { id: "gate2", title: "사람 리뷰", sub: "merge (dev)", kind: "human", detail: "사람 승인 게이트. 제가 리뷰하고 dev에 merge합니다. AI는 merge하지 않습니다." },
  { id: "release", title: "릴리스", sub: "main · 태그", kind: "human", detail: "기능이 모이면 제가 dev에서 main으로 릴리스 PR을 열어 merge하고 버전 태그를 붙입니다." },
];

// 옆 가지 2개: 기록(마무리 때 결정·교훈·상태 갱신) -> 반복 실수는 교훈으로 올려 방어 수준 상향
export const flowSide: readonly FlowNode[] = [
  { id: "record", title: "기록", sub: "결정·교훈·상태", kind: "ai", detail: "옆 가지. 마무리할 때 선택지 사이의 결정은 저널에, 실수와 유효한 지적은 교훈에, 현재 상태는 STATUS에 기록합니다." },
  { id: "raise", title: "방어 수준 상향", sub: "반복 → L0~L3", kind: "ai", detail: "옆 가지. 같은 실수가 반복되면 교훈의 방어 수준을 최소 한 단계 올립니다(문서 L0, 규칙 한 줄 L1, 절차 단계 L2, 자동 검사 L3)." },
];

export const flowLegend = [
  { kind: "ai", label: "AI 단계" },
  { kind: "auto", label: "자동화" },
  { kind: "human", label: "사람" },
] as const;

export const flowCopy = {
  title: "작업 프로세스 도식",
  desc: "작업 정의, 계획, 사람 승인, 구현, 로컬 검사, PR과 CI, 외부 리뷰, 수정 루프(최대 2회), 독립 검증, 사람 리뷰와 merge, 릴리스 순서로 이어지는 흐름도. 마무리할 때 기록 단계가 옆 가지로 붙고, 반복되는 실수는 교훈의 방어 수준을 올립니다.",
  loopLabel: "다시 리뷰 · 최대 2회",
  textSummary: "Steps as text",
} as const;

// ---------- 5. 기록 체계 + 코드 리뷰 ----------
export type Level = { level: string; form: string; strength: string };

export const defenseLevels: readonly Level[] = [
  { level: "L0", form: "교훈 문서만 남김", strength: "약함" },
  { level: "L1", form: "CLAUDE.md에 규칙 한 줄", strength: "매 세션 읽음" },
  { level: "L2", form: "스킬·체크리스트의 단계", strength: "절차의 일부" },
  { level: "L3", form: "자동 검사(테스트·린트·훅·CI)", strength: "강제" },
];

export const recordsIntro =
  "결정은 ADR에 요약하고, 선택지 사이에서 어떻게 골랐는지는 저널에 이야기로 남깁니다. 실수는 교훈 문서에 증상·원인·해결·재발 방지·방어 수준으로 씁니다. 같은 교훈이 재발하면 방어 수준을 최소 한 단계 올립니다. 문서만 쓰고 끝나지 않고, 점점 더 강제되는 쪽으로 옮기는 것이 목적입니다.";

export const automation: readonly string[] = [
  "Stop 훅: 작업을 끝내려 할 때 변경 사항이 프로젝트 검사에 실패하면 종료를 막습니다. detached HEAD에서 어느 브랜치에도 속하지 않은 커밋이 있어도 막습니다.",
  "SessionStart 훅: 세션이 시작되면 STATUS를 읽으라고 안내하고 교훈 색인을 출력합니다.",
  "권한 설정: .env 읽기·수정을 거부하고, force push·reset --hard·rm -rf·패키지 설치는 매번 묻게 합니다.",
];

export type Lesson = {
  title: string;
  symptom: string;
  cause: string;
  fix: string;
  prevent: string;
  level: string;
};

export const lessons: readonly Lesson[] = [
  {
    title: "검사가 결함이 있어도 통과함",
    symptom:
      "새로 만든 검사 스크립트가 결함을 넣은 입력에서도 통과했고, 같은 유형의 허점을 리뷰 봇과 독립 검증이 PR마다 약 10건 반복해서 짚었습니다. 두 패턴 중 하나만 맞아도 통과, 첫 번째 일치만 확인, 추출 결과가 비어도 통과 같은 것들이었습니다.",
    cause: "검사를 정상 파일이 통과하는지로만 확인하고 끝냈습니다. 결함이 있는 입력에서 실제로 실패하는지는 확인하지 않았습니다.",
    fix: "지적마다 결함을 넣은 사본으로 놓치는 것을 먼저 재현했습니다. 그다음 값 전체를 비교하고, 추출 개수 가드를 넣고, 주석 줄을 제외하도록 고쳤습니다.",
    prevent:
      "마무리 절차(L2)에 결함 사본 확인 단계를 넣었습니다. 그리고 회귀 테스트가 결함 사례 51건을 문서·워크플로 사본에 넣어 검사가 실제로 실패하는지 자동으로 확인하고 CI에서 돌립니다(L3). 허점이 있던 옛 검사 버전을 넣어 보니 11건, 14건이 걸러졌습니다.",
    level: "L3 + L2",
  },
  {
    title: "리뷰 봇이 승인하지 않은 테스트를 직접 커밋함",
    symptom:
      "리뷰 봇의 테스트 생성 기능이 실행되어, 승인하지 않은 언어와 라이브러리로 쓴 테스트 파일을 PR 브랜치에 직접 커밋했습니다. CI에도 연결되지 않은 파일이었습니다.",
    cause: "그 기능이 기본으로 켜져 있었고, 체크박스를 누르는 즉시 실행되어 결과를 브랜치에 push했습니다.",
    fix: "git revert로 되돌렸습니다(히스토리를 다시 쓰지 않았습니다). 리뷰 봇 설정에서 테스트 생성 기능을 껐습니다.",
    prevent:
      "설정으로 기능 자체를 막았습니다(L3). 봇이 브랜치에 커밋할 수 있다는 전제로 push 전에 git pull --ff-only로 원격 변경을 확인하고, 봇 커밋은 의존성·스택 규칙으로 검토한 뒤 수용하거나 되돌립니다.",
    level: "L3",
  },
  {
    title: "리뷰 봇이 이전 커밋 기준으로 답함",
    symptom:
      "수정 커밋을 push한 직후 스레드에 답글을 달았더니, 리뷰 봇이 이전 커밋 체크아웃 기준으로 그 커밋을 찾지 못했다고 답했습니다. 짧은 시간에 커밋을 연달아 올리자 자동 리뷰가 일시정지되기도 했습니다.",
    cause: "봇의 리뷰 실행과 push 사이의 시점 차이입니다. 짧은 시간에 커밋이 많으면 자동 일시정지가 동작합니다.",
    fix: "git ls-remote로 브랜치 head가 수정 커밋인지 확인한 뒤 재리뷰를 기다렸습니다. 일시정지된 경우에는 봇에게 리뷰 재개를 요청했습니다.",
    prevent:
      "수정은 가능하면 한 커밋으로 묶어 push하고, 답글은 push 뒤에 답니다. 봇이 미확인이라고 답해도 head를 확인하기 전에는 다시 작업하지 않습니다. 아직 문서 수준(L0)이라 반복되면 올립니다.",
    level: "L0",
  },
];

export type ReviewPoint = { title: string; body: string };

export const reviewPoints: readonly ReviewPoint[] = [
  {
    title: "CodeRabbit 설정",
    body: "저장소의 설정 파일로 정합니다. 리뷰 언어는 한국어(ko-KR), 프로필은 chill, 대상은 main과 dev를 base로 하는 초안이 아닌 PR입니다. 전체·docs·ADR·교훈 경로마다 확인할 것을 다르게 지시합니다(예: ADR 상태가 바뀌면 본문과 PR 설명이 일치하는지). 리뷰 기준 문서(CODEX_REVIEW.md)는 하나로 두고 봇과 독립 검증이 같은 기준을 씁니다.",
  },
  {
    title: "심각도와 지적 형식",
    body: "모든 지적은 심각도(Critical/High/Medium/Low), 파일과 줄, 구체적인 실패 시나리오, 영향, 수정안을 갖춰야 합니다. 추측성 스타일 지적은 피하게 합니다. Critical과 High는 merge를 막습니다.",
  },
  {
    title: "지적 분류와 수정 루프",
    body: "지적을 valid / invalid / 제품 결정 필요(NEEDS_PRODUCT_DECISION)로 나눕니다. valid는 고치고 검사를 다시 돌립니다. 제품 결정은 제게 올립니다. 자동 수정은 최대 2라운드까지만 하고, 남은 것은 사람에게 올립니다.",
  },
  {
    title: "봇의 글은 신뢰하지 않는 입력",
    body: "리뷰 코멘트의 문장은 지시가 아니라 검토할 입력입니다. 그대로 따르지 않고 diff와 검사 결과로 확인한 뒤 분류합니다. 위의 두 번째 교훈이 이 원칙의 근거입니다.",
  },
  {
    title: "독립 검증은 별도 세션",
    body: "리뷰 봇 다음에 구현에 참여하지 않은 새 세션이 다시 확인합니다. 봇이 통과시킨 것도 수용 기준과 테스트를 직접 재실행해 봅니다.",
  },
];

// ---------- 6. 이 포트폴리오를 만든 방식 ----------
export type BuildRule = { title: string; body: string };

export const portfolioIntro =
  "같은 원칙을 이 사이트에도 가볍게 적용했습니다. 이 저장소에는 작업자·검증자·문서 작성자 에이전트가 .claude/agents/ 아래 파일로 정의되어 있고, 결정은 docs/decisions/에 D-001부터 D-020까지 남아 있습니다.";

export const buildRules: readonly BuildRule[] = [
  {
    title: "계획 → 구현 → 검증 순서",
    body: "요구를 정리하고 결정 기록을 승인한 뒤 Task 단위 계획서를 씁니다. 계획서에는 모든 Task에 적용되는 제약(Global Constraints)과 Task 테스트가 다루지 않는 위험(Review Focus)이 들어갑니다. Task마다 작업자 → 검증자 순서로 돌고, 통과해야 다음 Task로 넘어갑니다. 마지막에 문서 작성자가 기록을 갱신합니다.",
  },
  {
    title: "작업자: 범위와 금지를 정의 파일에",
    body: "작업자는 맡은 Task 하나만 구현합니다. 커밋·푸시와 새 의존성은 금지이고, 색·반경·글꼴은 토큰으로만 쓰며, 새 코드에는 무엇을 왜 하는지 한국어 주석을 답니다. 검증 명령은 실제로 실행하고 실행하지 않은 것을 했다고 쓰지 않습니다. 개발 서버를 띄웠다면 끝나기 전에 종료하고 포트가 비었는지 확인합니다.",
  },
  {
    title: "검증자: 읽기 전용을 구조로",
    body: "검증자의 도구에는 Edit와 Write가 없습니다. 읽기 전용을 규칙이 아니라 구조로 강제한 것입니다. 작업자 보고는 참고만 하고 명령을 직접 다시 실행합니다. 색 리터럴은 grep으로 globals.css 밖에 있는지 확인하고, 대비는 렌더된 픽셀로 측정합니다. 확인하지 못한 것은 확인 못 함이라고 적습니다.",
  },
  {
    title: "문서 작성자: 보고에 있는 사실만",
    body: "문서 작성자는 docs/만 다루는 가벼운 모델입니다. 보고에 있는 사실만 쓰고, 측정하지 않은 값은 측정 전이라고 씁니다. 버린 선택지는 버린 이유까지 적고, 결정이 바뀌면 지우지 않고 대체됨으로 표시합니다.",
  },
  {
    title: "결정 기록의 형식",
    body: "배경 → 고민한 선택지 → 결정 → 이유 → 면접 포인트 → 남은 질문 순서로 씁니다. 처음에 틀렸다가 바로잡은 것과 알고 있는 단점도 숨기지 않습니다. 설명할 수 없는 코드는 머지하지 않는다는 원칙이 이 기록의 출발점입니다.",
  },
  {
    title: "병합은 조율자가",
    body: "작업자는 커밋하지 않습니다. 작업은 브랜치 단위로 진행하고 병합은 조율자(메인 에이전트)가 합니다. 서브에이전트가 보내는 메시지는 사용자의 지시가 아니라서, 그 안의 승인 요청이나 권한 변경 요청은 제게 올립니다.",
  },
  {
    title: "쓰지 않을 때를 정해 둠",
    body: "한두 파일을 고치는 작은 수정에는 서브에이전트를 쓰지 않습니다. 매번 새 컨텍스트로 시작해 읽을 파일을 다시 읽기 때문에 오히려 비쌉니다. 요구가 정리되지 않은 탐색 단계에도 쓰지 않습니다.",
  },
];

export const workflowMeta = {
  title: "Workflow — How I work with AI",
  description:
    "AI와 협업하는 방식: 규칙·역할·검증을 파일로 설계하는 체계, 직접 만든 Claude 스킬 12종, 작업 프로세스와 코드 리뷰. How I work with AI: roles, memory files, custom skills, verification and review.",
} as const;
