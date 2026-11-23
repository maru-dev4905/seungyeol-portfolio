import type { ProjectDetail } from "./projects";

// ------------------------------------------------------------------
// 프로젝트 데이터 7개(kit 2 + project 5). 모두 사이트 주인의 기존 포트폴리오(seungyeol.kr)에 적힌 내용이다.
//  - Meerkit, Weave : https://seungyeol.kr/engineering/meerkit, /engineering/weave
//  - 나머지 5개      : https://seungyeol.kr/works/<slug>
// 문장은 한국어로 정리했지만 사실(역할·기간·기술·수치)은 바꾸지 않았다. 사이트에 없는 값은 쓰지 않는다(그래서 일반 프로젝트에는 수치·트러블슈팅이 없다).
// 이미지는 public/images/seungyeol/works/<slug>/ 아래 WebP 사본이다. 홈 썸네일·메뉴·목록은 모두 이 배열에서 파생된다.
// 본문 서식(MarkdownSection): 빈 줄 = 문단, "- " = 불릿, "### " = 소제목, `백틱` = 코드. 첫 문단은 섹션 리드가 된다.
// 개요(facts) 섹션은 상세 첫 화면의 개요 표로 쓰인다(본문에는 다시 나오지 않는다).
// ------------------------------------------------------------------

const W = "/images/seungyeol/works";
// Meerkit·Weave는 사용자 본인이 운영하는 서비스 사이트(meerkit.dev, weavekit.kr)를 Playwright로 캡처한 화면이다(1920x1200 WebP, 16:10).
// 개인정보(이메일·토큰·계정)가 보이지 않는 구간만 골랐다. 홈 hover 배경·목업·상세 히어로·메뉴·다음 프로젝트 카드가 모두 hero 캡처를 쓴다.
const SHOT = "/images/projects";

// 홈 hover 배경의 어둠(media.dim). 흰 글자(설명 16px)가 배경 위에서 대비 4.5:1 이상이 되도록 화면에서 측정해 정한 값이다.
// 측정: 홈에서 알약 hover -> 제목·설명·분류 글자 칸 뒤 배경 픽셀의 밝은 쪽 95% 지점 휘도로 대비를 계산(n11_contrast.py)
const DIM_SAMWHAPAPER = 0.5; // 분류 글자 뒤가 밝은 종이(0 -> 1.69:1, 0.5 -> 4.82:1)
const DIM_PSS = 0.7; // 흰 배경(0 -> 1.0:1, 0.6 -> 4.23:1, 0.7 -> 5.82:1)
const DIM_DAEDONGMOBILITY = 0; // 어두운 배경(최저 10.7:1)
const DIM_MAUMHANA = 0.7; // 흰 배경(0 -> 1.0:1, 0.6 -> 4.23:1, 0.7 -> 5.82:1)
const DIM_WEVERCNS = 0; // 어두운 배경(최저 11.73:1)
const DIM_MEERKIT = 0.8; // 흰 바탕 캡처. PSS·마음하나(0.7)보다 조금 더 어둡게: 캡처 속 큰 글자("Welcome to Meerkit")가 hover 제목과 겹쳐 읽히지 않게 한다
const DIM_WEAVE = 0.6; // 어두운 남색 바탕이지만 가운데 로고가 밝은 파랑이고 왼쪽 메뉴 글자가 알약과 겹쳐서 덮는다

export const PROJECTS: ProjectDetail[] = [
  // =================================================================
  // KIT 1. Meerkit
  // =================================================================
  {
    slug: "meerkit",
    kind: "kit",
    group: "featured",
    title: "AI 서비스 셋업을 npx 한 줄로 줄이는 스타터킷",
    shortName: "Meerkit",
    tagline: "A starter kit that cuts AI service setup down to a single npx command, and tells you why when it fails.",
    productType: "Starter Kit, CLI",
    tint: "indigo",
    // meerkit.dev 첫 화면 캡처(흰 바탕이라 홈 hover 글자 대비를 맞추려고 어둠 dim을 둔다)
    media: { image: `${SHOT}/meerkit/hero.webp`, mockup: `${SHOT}/meerkit/hero.webp`, dim: DIM_MEERKIT },
    summary:
      "FastAPI, Next.js, LangChain으로 AI 서비스를 시작할 때마다 반복하던 환경 설정을 CLI로 묶은 스타터킷입니다. 만드는 것보다 \"처음 쓰는 사람이 막히는 지점\"을 찾아 없애는 일에 시간을 많이 썼습니다.",
    category: "AI 서비스 스타터킷 (FastAPI · Next.js · LangChain) + CLI",
    company: "구름 부트캠프 SNACKCUP",
    role: "프론트엔드 / CLI 패키징 / Claude 하네스 설계·운영",
    period: "2026.10 ~ 2026.11",
    year: "2026",
    tags: ["Frontend", "CLI Packaging", "Claude Harness"],
    specs: ["Next.js", "TypeScript", "FastAPI", "Node.js CLI", "Docker", "GitHub Actions", "Claude Code", "ESLint"],
    githubUrl: "https://github.com/SNACKCUP/meerkit",
    liveUrl: null,
    links: [{ label: "npm", url: "https://www.npmjs.com/package/@snackcup/meerkit" }],
    sections: [
      {
        id: "overview",
        title: "개요 · Overview",
        type: "facts",
        body: "무엇을, 누구와, 어떤 역할로 만들었나",
        meta: [
          { label: "프로젝트", value: "MeerKit (미어킷)" },
          { label: "분류", value: "AI 서비스 스타터킷 (FastAPI · Next.js · LangChain) + CLI" },
          { label: "팀", value: "구름 부트캠프 SNACKCUP, 3인" },
          { label: "역할", value: "프론트엔드 / CLI 패키징 / Claude 하네스 설계·운영" },
          { label: "기간", value: "2026.10 ~ 2026.11" },
          { label: "스택", value: "Next.js, TypeScript, FastAPI, Node.js CLI, Docker, GitHub Actions, Claude Code, ESLint" },
        ],
      },
      {
        id: "why",
        title: "왜 만들었나 · Problem",
        type: "markdown",
        body: "프로젝트를 시작할 때마다 셋업이 여러 단계로 흩어져 있었습니다.\n\nAI 서비스를 새로 시작하려면 아래 단계를 각각 따로 해야 했습니다.\n- 환경변수 파일 만들기\n- Docker로 DB 띄우기\n- 프론트엔드 의존성 설치\n- 파이썬 의존성 설치\n\n순서가 틀리거나 한 단계가 빠지면 어디서 막혔는지 알기 어려웠고, 같은 설정을 팀원마다 반복했습니다.\n\n두 번째 문제는 Claude Code로 개발하면서 드러났습니다. 환경변수 접두사, 빌드로 확인하지 않은 CSS 수정처럼 같은 종류의 실수가 반복될 수 있었고, 해결 과정이 대화 안에만 남으면 다음 세션과 다른 팀원이 알 수 없었습니다.\n\n그래서 목표를 두 가지로 잡았습니다.\n- 셋업을 명령 하나로 묶되, 실패했을 때 원인을 알려 주는 CLI\n- 한 번 겪은 실수는 규칙으로 남겨 다시 겪지 않게 하는 구조",
        meta: null,
        image: { src: `${SHOT}/meerkit/install.webp`, alt: "Meerkit 설치 문서: 필요한 도구 버전 표와 프로젝트 생성 명령. 흩어져 있던 셋업 단계를 한 곳에 모았다" },
      },
      {
        id: "screens",
        title: "화면 · Screens",
        type: "gallery",
        body: null,
        meta: {
          layout: "grid",
          images: [
            { url: `${SHOT}/meerkit/hero.webp`, alt: "Meerkit 첫 화면: 로그인 카드, 멤버 관리 표, 역할 변경 목록이 둘러싼 가운데에 회원가입·로그인·Docs 버튼" },
            { url: `${SHOT}/meerkit/docs.webp`, alt: "Meerkit 문서 소개 화면: 왼쪽 목차와 원칙·포함 항목을 설명하는 본문" },
            { url: `${SHOT}/meerkit/install.webp`, alt: "Meerkit 설치 문서: 필요한 도구 버전 표와 npx로 프로젝트를 만드는 명령 블록" },
            { url: `${SHOT}/meerkit/cli-setup.webp`, alt: "Meerkit CLI 문서: init과 setup 명령을 설명하는 화면" },
            { url: `${SHOT}/meerkit/components.webp`, alt: "Meerkit 컴포넌트 개요: 로그인 폼, 회원가입 폼 같은 사용자 화면 카드 목록" },
            { url: `${SHOT}/meerkit/m-home.webp`, alt: "스마트폰에서 본 Meerkit 첫 화면" },
            { url: `${SHOT}/meerkit/m-docs.webp`, alt: "스마트폰에서 본 Meerkit 문서 소개 화면" },
          ],
        },
      },
      {
        id: "decisions",
        title: "설계 결정 · Decisions",
        type: "decisions",
        body: "어떤 선택지가 있었고, 왜 이것을 골랐는가",
        meta: [
          {
            title: "설치 가이드 문서 대신 CLI로 묶음",
            reason:
              "막히는 지점이 각 단계 안이 아니라 단계 \"사이\"(DB가 아직 준비되지 않았는데 마이그레이션이 시작됨 등)에 있었습니다. 문서로는 순서와 현재 상태를 검사할 수 없지만 CLI는 검사한 뒤 다음 단계로 넘어갈 수 있다고 판단했습니다.",
            rejected: "README에 단계별 설치 가이드를 쓰는 방식. 쓰기는 쉽지만 사용자가 순서를 어겼을 때 막을 수 없습니다.",
          },
          {
            title: "실패하면 스택 트레이스 대신 \"원인 한 줄, 실제 에러 줄, 해결 순서\"를 보여 줌",
            reason:
              "DB 없이 test를 돌렸을 때 SQLAlchemy 스택 40줄이 출력되어 실제 원인인 \"5432 연결 실패\"가 묻혔습니다. 사용자가 로그를 읽을 수 있다고 가정하지 않기로 했습니다. 분류는 `explain.js` 한 곳에 모아 새 유형을 추가하기 쉽게 했습니다.",
            rejected: "로그를 그대로 보여 주고 문서에서 해결법을 찾게 하는 방식. 원인을 모르는 실패만 원래 출력을 보여 주도록 남겨 두었습니다.",
          },
          {
            title: "검증을 템플릿으로 만든 프로젝트와 저장소 Fork 두 곳에서 모두 함",
            reason:
              "템플릿으로 만든 프로젝트에서만 검증했다가, 저장소를 그대로 Fork한 사용자의 `backend/.env.example` DB 주소(Supabase 54322)가 setup이 띄우는 DB(5432)와 달랐음을 놓친 적이 있습니다. 사용자가 들어오는 입구가 둘이면 검증도 둘이어야 한다고 판단했습니다.",
            rejected: "템플릿 생성 단계에서만 값을 덮어쓰는 방식. 저장소 기본값과 템플릿이 어긋나서 같은 문제가 다시 생겼습니다. 기본값 자체를 맞추고 템플릿은 대체용 줄만 빼도록 바꿨습니다.",
          },
          {
            title: "규칙은 문서에만 두지 않고 가능하면 검사로 만듦",
            reason:
              "문서 3곳이 \"ESLint가 import 방향을 검사한다\"고 적었지만 실제 규칙은 없었습니다(PR #23에서 발견). 문서를 낮춰 쓰는 데서 멈추지 않고 `no-restricted-imports` 규칙을 실제로 추가했습니다(PR #24). 이후에는 자동 검사가 있다고 쓰기 전에 설정 파일에서 확인하는 규칙을 하네스에 넣었습니다.",
            rejected: "문서에 \"이렇게 하세요\"만 적어 두는 방식. 어긴 사람이 있어도 아무도 알 수 없습니다.",
          },
          {
            title: "에러를 해결하면 \"Always / Never\" 규칙으로 승격하는 하네스를 둠",
            reason:
              "해결이 끝난 직후 Claude가 세션의 diff와 에러 로그로 트러블슈팅 표를 초안으로 쓰고(80%), 사람은 근본 원인과 \"왜 그렇게 결정했는지\"만 1~2줄 검토합니다(20%). 같은 실수가 2회 이상 나오거나 치명적이면 `CLAUDE.md`와 `.claude/harness/`의 규칙으로 승격합니다. 사람은 원인 확정과 결정 맥락 기록에 집중하는 구조입니다.",
            rejected: "대화 로그에만 남기는 방식. 다음 세션과 다른 팀원이 읽을 수 없습니다.",
          },
        ],
      },
      {
        id: "timeline",
        title: "타임라인 · Timeline",
        type: "timeline",
        body: "언제 무엇이 일어났는가",
        meta: [
          { date: "2026.10.20", text: "트러블슈팅 기록 시작 (TR-001)" },
          { date: "2026.10.29", text: "CLI 첫 배포 (0.1.0-rc.0). 이날 rc.4까지 5번 배포" },
          { date: "2026.10.30", text: "rc.5 검증 중 첫 setup 간헐 실패 발견 → DB 헬스체크 (PR #17). Linux·Windows CI 도입 (PR #14)" },
          { date: "2026.11.01", text: "Docker 무응답 오진(#20), DB 포트 소유 확인(#29), 실패 원인 안내(#27) 반영. ESLint 오기재 발견(#23) 후 규칙 추가(#24)" },
          { date: "2026.11.03", text: "빈 환경변수로 Docs 버튼이 깨지는 문제 수정 (#43, rc.10)" },
        ],
      },
      {
        id: "tr-1",
        title: "트러블슈팅 01 · PR #17",
        type: "troubleshooting",
        body: "새 사용자의 첫 setup이 4번 중 1번 꼴로 실패함",
        meta: {
          problem: "마이그레이션 단계에서 `server closed the connection unexpectedly`가 났고, 다시 실행하면 통과했습니다. rc.5를 검증하던 중에 발견했습니다.",
          cause:
            "`docker compose up --wait`는 컨테이너가 \"실행 중\"이 되면 바로 반환했는데, 새 볼륨의 Postgres는 초기화 중 한 번 재시작합니다. 그 사이에 마이그레이션이 시작되어 연결이 끊겼습니다.",
          solution:
            "db에 healthcheck를 추가하고 `pg_isready -h 127.0.0.1`로 TCP를 확인하게 했습니다. 초기화용 임시 서버는 TCP를 받지 않으므로 소켓만 보는 확인은 너무 일찍 통과하기 때문입니다. `--wait`가 healthy가 될 때까지 기다리게 하고, compose에 healthcheck가 유지되는지 확인하는 테스트도 추가했습니다.",
          result: "수정 전 db reset(볼륨 삭제 → 새로 켜기 → 마이그레이션)을 4번 돌려 1번 실패한 것을 재현했고, 수정 후 8번 모두 성공했습니다.",
        },
      },
      {
        id: "tr-2",
        title: "트러블슈팅 02 · PR #20",
        type: "troubleshooting",
        body: "Docker가 켜져 있는데 CLI는 \"꺼져 있다\"고 안내함",
        meta: {
          problem: "`docker info`가 응답하지 않았고 CLI는 Docker가 실행 중이 아니라고 안내했습니다. 실제로는 Docker Desktop이 켜져 있었습니다.",
          cause:
            "디스크가 가득 차면 켜져 있는 Docker Desktop이 멈춥니다. CLI는 타임아웃(`ETIMEDOUT`)을 \"미실행\"으로 같이 처리하고 있었습니다. 같은 시기 `npm install`의 `ENOSPC`도 같은 원인에서 났습니다.",
          solution:
            "타임아웃과 미실행을 구분해서 안내하고(공간 확보 → Docker Desktop 재시작 → 재시도), setup 전에 디스크 여유 공간(최소 2GB)을 확인하게 했습니다. 같은 판단 실수를 반복하지 않도록 \"타임아웃을 미실행으로 해석하지 않는다\"를 하네스 규칙으로 남겼습니다.",
          result: "타임아웃과 정상 응답 분기를 단위 테스트로 추가했습니다(테스트 29개 통과).",
        },
      },
      {
        id: "tr-3",
        title: "트러블슈팅 03 · PR #29",
        type: "troubleshooting",
        body: "5432 포트를 다른 컨테이너가 쓸 때, 남의 DB에 마이그레이션이 실행됨",
        meta: {
          problem:
            "setup을 두 번째 실행하면 4단계가 \"완료\"로 끝났고, 5~6단계(마이그레이션, 관리자 계정)가 다른 컨테이너의 DB에서 실행됐습니다. 첫 실행은 `port is already allocated`로 정상 실패했기 때문에 문제가 가려져 있었습니다.",
          cause:
            "`docker compose up`이 성공하면 \"내 DB가 떠 있다\"고 가정했습니다. 실제로는 이 프로젝트의 DB가 호스트 포트에 열리지 않은 상태였고, 접속 주소만 같은 다른 DB가 응답하고 있었습니다.",
          solution:
            "`docker compose port db 5432`로 실제 연결 포트를 읽어 `.env`의 `DATABASE_URL` 포트와 비교하고, 마이그레이션·시드 \"전에\" 검사하게 했습니다. 포트를 쓰는 컨테이너 이름과 해결 방법을 알려 주고, 다른 컨테이너를 CLI가 멈추거나 지우지는 않는다는 규칙을 하네스에 남겼습니다.",
          result:
            "실제로 5432를 다른 컨테이너가 쓰는 상태를 만들어 재현했습니다. 수정 후 setup 재실행이 컨테이너 이름을 알려 주며 멈췄고 마이그레이션은 0회 실행됐습니다. compose 5433과 .env 5432가 다른 경우의 안내, 둘 다 5433인 정상 경우의 통과도 확인했습니다.",
        },
      },
      {
        id: "tr-4",
        title: "트러블슈팅 04 · PR #14",
        type: "troubleshooting",
        body: "Windows에서만 CI가 실패함",
        meta: {
          problem: "`sync-template`이 \"WelcomePage에서 docsButton을 찾지 못했습니다\"로 실패했습니다. macOS에서는 모두 통과했습니다.",
          cause:
            "Windows 러너가 파일을 CRLF로 체크아웃해서 정규식이 맞지 않았습니다. 같은 원인으로 update의 파일 해시도 OS마다 달라질 수 있어, 고치지 않은 파일이 \"고친 파일\"로 오인될 위험이 있었습니다.",
          solution:
            "`.gitattributes`(`* text=auto eol=lf`)로 체크아웃 줄바꿈을 고정하고, 해시는 텍스트 파일의 CRLF를 LF로 바꾼 뒤 계산했습니다(바이너리는 그대로). LF 파일의 해시는 바뀌지 않아 기존 `manifest.json`과 호환됩니다. 줄바꿈에 민감한 코드는 Linux와 Windows 러너에서 모두 테스트하는 규칙을 남겼습니다.",
          result: "ubuntu와 windows 러너 모두 테스트와 스모크(init, update, status 등)를 통과했습니다. CRLF 테스트를 추가했습니다.",
        },
      },
      {
        id: "tr-5",
        title: "트러블슈팅 05 · PR #41, #43",
        type: "troubleshooting",
        body: "npx로 만든 프로젝트에서 웰컴 페이지의 Docs 버튼이 열리지 않음",
        meta: {
          problem: "버튼의 href가 빈 문자열이어서 눌러도 이동하지 않았습니다.",
          cause:
            "`.env.example`의 `NEXT_PUBLIC_DOCS_URL=`(빈 값)이 setup 중 `.env.local`로 복사되었고, `??`는 빈 문자열을 그대로 통과시켜 기본 주소로 돌아가지 않았습니다. `sync-template.mjs`에도 같은 패턴이 있었습니다.",
          solution:
            "`??`를 `||`로 바꾸고, 선택 값은 `.env.example`에서 주석 처리했습니다. 이 일을 \"빈 값으로 들어올 수 있는 환경변수의 기본값에는 `??`를 쓰지 않는다\"는 규칙으로 하네스에 올렸습니다. `NEXT_PUBLIC_*`를 바꾼 뒤에는 개발 서버를 다시 켜야 한다는 주의도 함께 적었습니다.",
          result: "npx로 새 프로젝트를 만들어 Docs 버튼 이동을 확인했고, 0.1.0-rc.10으로 배포했습니다.",
        },
      },
      {
        id: "result",
        title: "결과 · Result",
        type: "markdown",
        body: "무엇이 바뀌었는가\n\n- 첫 setup의 간헐 실패를 재현 가능한 형태로 만들어 고쳤습니다. 수정 전 4번 중 1번 실패, 수정 후 8번 모두 성공했습니다.\n- 포트가 충돌한 상태에서 setup을 다시 실행해도 다른 DB에 마이그레이션과 시드가 실행되지 않습니다.\n- CLI 명령 10개 이상이 실패했을 때 원인, 실제 에러 줄, 해결 순서를 보여 줍니다.\n- CLI 테스트는 25개에서 36개로 늘었고, `packages/**`가 바뀌면 Linux와 Windows 러너에서 자동으로 돌아갑니다.\n- 문서가 말하는 검사와 실제 검사가 일치합니다. import 방향은 ESLint와 `test_import_rules.py`, CLI 설명집은 `cli.test.js`가 확인합니다.\n- 트러블슈팅 16건과 하네스 문서 10개가 남아, 다른 팀원과 다음 세션이 같은 문제를 다시 풀지 않아도 됩니다.",
        meta: null,
        image: { src: `${SHOT}/meerkit/cli-setup.webp`, alt: "Meerkit CLI 문서의 init과 setup 명령. 셋업이 명령 두 줄로 줄었다" },
      },
      {
        id: "numbers",
        title: "수치 · Numbers",
        type: "metrics",
        body: null,
        meta: [
          { label: "PR 작성 (전체 44개 중)", value: "41", unit: "개" },
          { label: "프리릴리스 배포 (rc.0 ~ rc.10, 6일)", value: "11", unit: "회" },
          { label: "CLI 테스트 (PR #14 당시 25개)", value: "36", unit: "개" },
          { label: "트러블슈팅 기록 (TR-001 ~ 016)", value: "16", unit: "건" },
        ],
      },
      {
        id: "limits",
        title: "한계 · Limits",
        type: "markdown",
        body: "아직 해결하지 못한 것, 다시 한다면\n\n규칙이 같은 실수를 실제로 줄였는지는 아직 측정하지 못했습니다. 규칙을 만들기 전의 재발 횟수를 세어 두지 않아 비교할 기준이 없습니다. 다음에는 규칙을 만들 때 재발 횟수를 같이 기록하겠습니다.\n\nCI의 Windows 러너에는 Docker가 없어 자동 검증은 단위 테스트와 init 스모크까지만 가능합니다. 그 너머(실제 실행)는 사람이 Windows PC에서 직접 돌려 확인했고 이상이 없었습니다. 다만 자동화되어 있지 않아 버전이 바뀔 때마다 다시 손으로 확인해야 합니다. stop이 Windows에서 지원되지 않는 점은 문서에 그대로 적어 두었습니다.\n\n하네스는 Claude Code와 협업하는 방식에 맞춰 만들었습니다. Claude가 초안을 쓰고 사람이 검토하는 구조이므로, 검토를 건너뛰면 틀린 원인이 규칙으로 굳을 수 있습니다. 그래서 근본 원인은 사람이 확정하도록 했습니다.",
        meta: null,
      },
    ],
  },

  // =================================================================
  // KIT 2. Weave
  // =================================================================
  {
    slug: "weave",
    kind: "kit",
    group: "featured",
    title: "반복하던 프론트엔드 세팅을 없애려고 만든 CSS 유틸리티와 JS 플러그인 라이브러리",
    shortName: "Weave",
    tagline: "A CSS utility and JS plugin library that ends the frontend setup repeated in every project.",
    productType: "CSS Library, JS Plugins",
    tint: "teal",
    // weavekit.kr 첫 화면 캡처(어두운 남색 바탕)
    media: { image: `${SHOT}/weave/hero.webp`, mockup: `${SHOT}/weave/hero.webp`, dim: DIM_WEAVE },
    summary:
      "Tailwind를 쓸 수 없는 PHP·Java 환경에서, 프로젝트마다 새로 만들던 reset, base, JS 공통 구조, 자주 쓰는 기능을 하나의 라이브러리와 문서 사이트로 묶었습니다.",
    category: "프론트엔드 CSS 유틸리티 + JS 플러그인 + 문서 사이트",
    company: "WeverCNS (재직 중 제작·적용)",
    role: "설계 / 개발 / 문서 / 배포",
    period: "2026.03 ~ 2026.05",
    year: "2026",
    tags: ["Design", "Development", "Docs", "Release"],
    specs: ["CSS", "SCSS", "JavaScript", "GSAP", "pnpm monorepo", "GitHub Pages"],
    githubUrl: "https://github.com/maru-dev4905/Weave",
    liveUrl: "https://weavekit.kr/",
    sections: [
      {
        id: "overview",
        title: "개요 · Overview",
        type: "facts",
        body: "무엇을, 누구와, 어떤 역할로 만들었나",
        meta: [
          { label: "프로젝트", value: "WEAVE (위브)" },
          { label: "분류", value: "프론트엔드 CSS 유틸리티 + JS 플러그인 + 문서 사이트" },
          { label: "팀", value: "개인 (웨버씨엔에스 재직 중 제작·적용, 사내 프론트엔드 담당은 본인 한 명)" },
          { label: "역할", value: "설계 / 개발 / 문서 / 배포" },
          { label: "기간", value: "2026.03 ~ 2026.05" },
          { label: "스택", value: "CSS, SCSS, JavaScript, GSAP, pnpm monorepo, GitHub Pages" },
        ],
      },
      {
        id: "why",
        title: "왜 만들었나 · Problem",
        type: "markdown",
        body: "프로젝트마다 같은 세팅을 처음부터 다시 만들고 있었습니다.\n\n회사 프로젝트는 PHP·Java 서버 위에서 진행되는 경우가 많아 Tailwind나 번들러 기반 도구를 쓰기 어려웠습니다. 그래서 프로젝트를 시작할 때마다 아래 것들을 새로 만들거나 이전 프로젝트에서 복사해 왔습니다.\n- `reset.css`, `base.css`\n- JS 공통 구조와 라이브러리 설정\n- 탭·모달·폼 검증 같은 자주 쓰는 기능\n\n복사한 코드는 프로젝트마다 조금씩 달라졌고, 어느 쪽이 최신인지 알 수 없었습니다. 담당자가 바뀌면 클래스 이름과 구조를 다시 익혀야 했습니다.\n\n목표는 \"불러오기만 하면 바로 쓰는\" 하나의 기준을 만드는 것이었습니다. 새 프레임워크를 도입하는 것이 아니라, 기존 환경에서 그대로 쓸 수 있는 CSS와 JS로 만드는 것을 조건으로 잡았습니다.",
        meta: null,
        image: { src: `${SHOT}/weave/css.webp`, alt: "Weave CSS 설명서의 파일 구조 표. 프로젝트마다 새로 만들던 reset과 base를 한 곳에서 설명한다" },
      },
      {
        id: "screens",
        title: "화면 · Screens",
        type: "gallery",
        body: null,
        meta: {
          layout: "grid",
          images: [
            { url: `${SHOT}/weave/hero.webp`, alt: "Weave 문서 사이트 첫 화면: 왼쪽 메뉴와 큰 WEAVE 로고, CSS Docs·JS Docs·Download 버튼" },
            { url: `${SHOT}/weave/css.webp`, alt: "Weave CSS 설명서: 파일 구조와 역할을 정리한 표" },
            { url: `${SHOT}/weave/js.webp`, alt: "Weave 스크립트 모듈 설명서: 런타임과 선택자 규칙, Copy·Link Button 모듈 카드" },
            { url: `${SHOT}/weave/tools.webp`, alt: "Weave 개발 보조 도구 화면: PX to VW, PX to REM, IMG to WEBP 같은 변환 도구 카드" },
            { url: `${SHOT}/weave/playground.webp`, alt: "Weave 플레이그라운드: HTML을 수정하고 결과를 바로 보는 에디터형 미리보기 실험실" },
            { url: `${SHOT}/weave/m-home.webp`, alt: "스마트폰에서 본 Weave 첫 화면" },
            { url: `${SHOT}/weave/m-css.webp`, alt: "스마트폰에서 본 Weave CSS 설명서" },
          ],
        },
      },
      {
        id: "decisions",
        title: "설계 결정 · Decisions",
        type: "decisions",
        body: "어떤 선택지가 있었고, 왜 이것을 골랐는가",
        meta: [
          {
            title: "빌드 도구 없이 쓸 수 있는 CSS 유틸리티와 플러그인 런타임으로 만듦",
            reason:
              "서버 템플릿(PHP·Java)에 파일을 얹는 것만으로 쓸 수 있어야 한다는 환경 조건이 있었고, 탭·모달·복사 버튼 같은 똑같은 UI 기능을 프로젝트마다 새로 만드는 일을 없애고 싶었습니다. 그래서 사내 내규에 맞는 클래스 규칙과 코드를 따로 갖기로 했습니다. CSS는 토큰을 담은 `common.css`와 유틸리티·기본 스타일을 담은 `wv.css`로 나누고, JS는 `createWeave()` 하나로 필요한 플러그인(tabs, modal, validation, anim 등)만 골라 조합하게 했습니다.",
            rejected: "사내에서 먼저 쓰고 있던 Bootstrap을 그대로 쓰는 방식. 쓰지 않는 코드까지 함께 들어오는 것이 불필요하다고 판단해, 사내에서 많이 쓰는 코드만 추려 사내 클래스 규칙으로 따로 만들었습니다.",
          },
          {
            title: "라이브러리와 문서·데모 앱을 한 저장소(pnpm monorepo)에 둠",
            reason:
              "`packages/wv`(라이브러리)와 `apps/docs`(문서 앱)를 같이 두어, 문서의 데모 페이지가 실제 플러그인을 mount하게 했습니다. 문서가 설명이면서 동시에 동작을 확인하는 검증 환경 역할을 합니다. 폼 검증, 파일 드롭, 애니메이션처럼 동작이 중요한 기능을 같은 커밋 안에서 데모와 함께 확인할 수 있습니다.",
          },
          {
            title: "작업 중에 자주 쓰는 변환 도구를 문서 앱의 Tools 페이지로 가져옴",
            reason:
              "PX to VW, PX to REM, IMG to WEBP처럼 프론트엔드 작업 중에 매번 새 탭을 열어 외부 사이트에서 하던 일을 문서 앱 한 곳에서 할 수 있게 통합했습니다. 번거로운 이동을 없애려는 것이었습니다. 이후 에셋 파일 이름을 검사하는 linter와 이름 규칙 기능을 더해, 이름 규칙처럼 사람이 어기기 쉬운 부분을 도구로 확인하게 했습니다.",
          },
          {
            title: "만든 뒤에 스스로 점검해서 약점을 문서로 정리함",
            reason:
              "`WEAVE_STATUS_STRATEGY_2026Q2.md`에 현재 구성과 개선점을 나눠 적었습니다. 유틸 클래스 `h_max_content`가 height가 아니라 width를 설정하는 오류, 색상 유틸의 `bgc_s_*` 네이밍과 토큰 참조 불일치 등을 \"즉시 수정\", \"단기\", \"중기\"로 분류해 두었습니다.",
          },
        ],
      },
      {
        id: "timeline",
        title: "타임라인 · Timeline",
        type: "timeline",
        body: "언제 무엇이 일어났는가",
        meta: [
          { date: "2026.03.06", text: "저장소 시작. 랜딩 페이지와 README" },
          { date: "2026.03.23", text: "CSS 설명서와 문서 구조 정리" },
          { date: "2026.04.02", text: "fileDrop, targetButton 플러그인 추가" },
          { date: "2026.04.06", text: "GSAP 기반 anim 플러그인과 스타터 킷 구조 정리" },
          { date: "2026.04.08", text: "폼 유효성 검증 플러그인, Tools 페이지(px/rem, img/webp)" },
          { date: "2026.04.13", text: "v1.0.0 정렬, 배포 파일 minify와 버전 헤더, GitHub Pages 배포" },
          { date: "2026.04.15", text: "wv 패키지 import와 빌드 흐름 안정화" },
          { date: "2026.04.17", text: "CSS 문서를 속성별 레퍼런스로 전면 개편" },
          { date: "2026.04.26", text: "도구 모듈 분리, linter와 에셋 이름 검사 고도화, v1.0.2" },
          { date: "2026.05.06", text: "커스텀 도메인(weavekit.kr) 배포, base 경로 수정" },
        ],
      },
      {
        id: "tr-1",
        title: "트러블슈팅 01",
        type: "troubleshooting",
        body: "커스텀 도메인으로 옮기자 문서 사이트의 경로가 어긋남",
        meta: {
          problem: "GitHub Pages 주소(저장소 이름 하위 경로)에서 잘 보이던 문서 사이트를 weavekit.kr로 옮기자 경로 설정이 맞지 않았습니다.",
          cause: "문서 앱의 base 경로를 저장소 하위 경로 기준으로 잡아 두었는데, 커스텀 도메인은 루트에서 시작합니다.",
          solution: "`CNAME`을 추가하고 배포 설정의 base 경로를 루트로 바꿨습니다(`fix(docs): use root base path for custom domain deploy`).",
          result: "2026.05.06 수정 후 문서 사이트가 weavekit.kr에서 열렸습니다. 배포 경로가 바뀌는 시점에 base 경로를 같이 확인해야 한다는 점을 배웠습니다.",
        },
      },
      {
        id: "result",
        title: "결과 · Result",
        type: "markdown",
        body: "무엇이 바뀌었는가\n\n- 회사 프로젝트 5개 이상에서 같은 라이브러리를 불러와 사용했습니다. 프로젝트를 시작할 때 reset과 base, 자주 쓰는 기능을 새로 만드는 시간이 크게 줄었습니다. 절감 시간을 재 두지는 않았습니다.\n- 사내 프론트엔드 담당은 본인 한 명이어서 다른 담당자가 쓰지는 않았지만, 이사님이 직접 사용해 작업 속도가 대폭 빨라졌다는 말을 여러 번 들었습니다.\n- 문서 사이트(weavekit.kr)에서 CSS 유틸리티, JS 플러그인, 애니메이션, 폼 검증을 데모와 함께 확인할 수 있습니다.\n- 버전을 1.0.0으로 정렬하고 배포 파일에 저장소와 버전 헤더를 넣어, 가져다 쓴 파일이 어느 버전인지 알 수 있게 했습니다.",
        meta: null,
        image: { src: `${SHOT}/weave/js.webp`, alt: "Weave 스크립트 모듈 설명서. 플러그인별 사용법과 동작 확인을 한 화면에 모았다" },
      },
      {
        id: "numbers",
        title: "수치 · Numbers",
        type: "metrics",
        body: null,
        meta: [
          { label: "회사 프로젝트에 적용", value: "5+", unit: "개" },
          { label: "JS 플러그인 (anim은 하위 6종)", value: "11", unit: "개" },
          { label: "현재 버전 (2026.04.13 1.0.0 정렬)", value: "1.0.2", unit: "" },
          { label: "문서 사이트 페이지 유형", value: "8", unit: "종" },
        ],
      },
      {
        id: "limits",
        title: "한계 · Limits",
        type: "markdown",
        body: "아직 해결하지 못한 것, 다시 한다면\n\n문서는 퇴사 직전에야 정리했습니다. 만들면서 같이 썼어야 했는데, 기능을 먼저 만들고 문서를 나중에 쓰는 순서가 되었습니다.\n\n회사 프로젝트 적용 결과(시간 절감 등)는 측정하지 않았습니다. \"최소 5개 프로젝트\"는 사용한 프로젝트 수이고, 절감 시간은 수치로 말할 수 없습니다.\n\n같은 UI라도 서비스와 기획에 따라 기능이 크게 달라서, 공통 플러그인의 이벤트 핸들링이 겹치는 경우가 몇 번 있었습니다. 이벤트 콜백을 받도록 열어 두어도 한계가 있어, 그때는 기능을 새로 만들 수밖에 없었습니다. 어떤 UI를 공통화하고 어떤 UI는 남겨 둘지 기준을 먼저 정했어야 했습니다.\n\n자동 테스트가 없습니다. 폼 검증이나 애니메이션 같은 동작은 문서 사이트의 데모 페이지에서 눈으로 확인하는 방식이어서, 수정할 때 다른 기능이 깨졌는지 자동으로 알 수 없습니다.",
        meta: null,
      },
    ],
  },

  // =================================================================
  // PROJECT 1. Samwhapaper (삼화제지)
  // =================================================================
  {
    slug: "samwhapaper",
    kind: "project",
    group: "selected",
    title: "스크롤 인터랙션과 전환 애니메이션으로 만든 제품 중심 웹사이트",
    shortName: "Samwhapaper",
    tagline: "Scroll-based interactions and transition animations for a product-driven browsing experience, stable in an adaptive layout.",
    productType: "Official Websites, Web Publishing",
    tint: "red",
    media: { image: `${W}/samwhapaper/hero.webp`, mockup: `${W}/samwhapaper/mockup.webp`, dim: DIM_SAMWHAPAPER },
    summary:
      "제품 중심 경험을 위해 스크롤 기반 인터랙션과 페이지 전환 애니메이션을 설계·구현했습니다. Adaptive 환경에서도 레이아웃 안정성을 확보했습니다.",
    category: "Interactive Product Website (Adaptive)",
    company: "DFRY",
    role: "Web Publishing 100% (UI Markup / Interaction)",
    period: "1 Month",
    year: "2021",
    tags: ["Web Publishing", "Interaction"],
    specs: ["PUG", "SCSS", "JavaScript", "jQuery", "Swiper", "ScrollMagic", "Lucid.js", "GSAP", "fullPage"],
    githubUrl: null,
    liveUrl: null,
    sections: [
      {
        id: "overview",
        title: "개요 · Overview",
        type: "facts",
        body: "프로젝트 개요",
        meta: [
          { label: "프로젝트", value: "삼화제지" },
          { label: "분류", value: "Interactive Product Website (Adaptive)" },
          { label: "회사", value: "DFRY" },
          { label: "역할", value: "Web Publishing 100% (UI Markup / Interaction)" },
          { label: "기간", value: "1 Month" },
          { label: "스택", value: "PUG, SCSS, JavaScript, jQuery, Swiper, ScrollMagic, Lucid.js, GSAP, fullPage" },
        ],
      },
      {
        id: "work",
        title: "작업 내용 · Work",
        type: "markdown",
        image: { src: `${W}/samwhapaper/img-01.webp`, alt: "삼화제지 웹사이트 메인 화면을 노트북 화면에 띄운 목업" },
        body: "메인 페이지를 포함한 전 페이지 퍼블리싱을 전담했습니다.\n\n- 스크롤 기반 인터랙션과 페이지 전환 애니메이션 설계·구현\n- 서브 페이지 비주얼 영역과 상품 게이트 전환 구간의 모션\n- Adaptive 환경에서의 레이아웃 안정화\n\nBuilt scroll-based interactions and transition animations to enhance a product-driven browsing experience. Ensured layout stability within an adaptive structure.",
        meta: null,
      },
      {
        id: "motion",
        title: "구현 포인트 · Scroll Interaction",
        type: "markdown",
        image: { src: `${W}/samwhapaper/img-05.webp`, alt: "스마트폰에 삼화제지 모바일 화면이 떠 있는 목업", position: "50% 40%" },
        body: "제품 중심의 비주얼 사이트 특성에 맞춰, 사용자가 스크롤 흐름 속에서 자연스럽게 정보를 탐색할 수 있도록 스크롤 기반 인터랙션과 전환 애니메이션을 구현했습니다.\n\n### 전환 구간과 비주얼 영역의 모션\n서브 페이지에서 상품 게이트로 이동하는 전환 구간, 그리고 각 서브 페이지의 비주얼 영역에는 사용 흐름을 방해하지 않으면서도 몰입을 높이는 모션을 적용해 콘텐츠의 집중도를 강화했습니다.\n\n### Adaptive 레이아웃 안정화\n적응형(Adaptive) 환경에서도 제품 상세 레이아웃이 무너져 가독성이 떨어지지 않도록 Grid/Flex 기반으로 레이아웃을 안정화하고, 브라우저 폭 변화에 따른 콘텐츠 우선순위가 유지되도록 조정했습니다.",
        meta: null,
      },
      {
        id: "screens",
        title: "화면 · Screens",
        type: "gallery",
        body: null,
        meta: {
          layout: "grid",
          images: [
            { url: `${W}/samwhapaper/img-02.webp`, alt: "삼화제지 서브 페이지: Bespoke Solution과 Bespoke Embossing" },
            { url: `${W}/samwhapaper/img-03.webp`, alt: "삼화제지 서브 페이지: 컬러 종이 소개와 Bespoke Paper 제품 목록" },
            { url: `${W}/samwhapaper/img-04.webp`, alt: "삼화제지 빈티지 모터사이클 클럽 콘텐츠 화면" },
            { url: `${W}/samwhapaper/img-06.webp`, alt: "삼화제지 모바일 화면 모음: 제품 소개 페이지" },
            { url: `${W}/samwhapaper/img-07.webp`, alt: "삼화제지 모바일 화면 모음: 콘텐츠와 검색 페이지" },
          ],
        },
      },
    ],
  },

  // =================================================================
  // PROJECT 2. PSS (대통령 경호처)
  // =================================================================
  {
    slug: "pss",
    kind: "project",
    group: "selected",
    title: "공공기관 웹 접근성 기준을 고려한 반응형 웹",
    shortName: "PSS",
    tagline: "Semantic markup, alternative text and a clear keyboard focus flow for a public-sector website.",
    productType: "Institutions & Non-profits, A11Y",
    tint: "indigo",
    media: { image: `${W}/pss/hero.webp`, mockup: `${W}/pss/pss-mockup.webp`, aspect: "16 / 10", dim: DIM_PSS },
    summary:
      "공공기관 웹 접근성 기준을 고려하여 시맨틱 마크업과 대체 텍스트를 적용했습니다. 키보드 탭 이동 및 포커스 흐름을 정리하여, 인터랙션 환경에서도 동일한 사용 경험을 제공하도록 구현했습니다.",
    category: "Accessibility-Enhanced Responsive Web",
    company: "WeverCNS",
    role: "Web Publishing (UI Markup / Interaction / A11Y) 100%",
    period: "3 Months",
    year: "2023",
    tags: ["Web Publishing", "Accessibility"],
    specs: ["HTML5", "CSS3", "JavaScript", "jQuery", "Swiper", "GSAP", "ScrollMagic", "Figma"],
    githubUrl: null,
    liveUrl: null,
    sections: [
      {
        id: "overview",
        title: "개요 · Overview",
        type: "facts",
        body: "프로젝트 개요",
        meta: [
          { label: "프로젝트", value: "대통령 경호처" },
          { label: "분류", value: "Accessibility-Enhanced Responsive Web" },
          { label: "회사", value: "WeverCNS" },
          { label: "역할", value: "Web Publishing (UI Markup / Interaction / A11Y) 100%" },
          { label: "기간", value: "3 Months" },
          { label: "스택", value: "HTML5, CSS3, JavaScript, jQuery, Swiper, GSAP, ScrollMagic, Figma" },
        ],
      },
      {
        id: "a11y",
        title: "작업 내용 · Accessibility",
        type: "markdown",
        image: { src: `${W}/pss/mobile.webp`, alt: "대통령 경호처 웹사이트 모바일 화면들이 기울어진 채 나열된 이미지", position: "50% 50%" },
        body: "공공기관 웹 접근성 기준을 고려해 전 화면을 퍼블리싱했습니다.\n\n- 시맨틱 마크업과 대체 텍스트 적용\n- 키보드 탭 이동과 포커스 흐름 정리\n- 인터랙션이 있는 구간에서도 동일한 사용 경험 제공\n\nApplied semantic markup and alternative text to meet public-sector accessibility standards. Improved keyboard tab navigation and focus flow to ensure consistent interaction for all users.",
        meta: null,
      },
      {
        id: "screens",
        title: "화면 · Screens",
        type: "gallery",
        body: null,
        meta: {
          layout: "grid",
          images: [
            { url: `${W}/pss/img-01.webp`, alt: "대통령 경호처 메인 페이지 전체 화면" },
            { url: `${W}/pss/img-02.webp`, alt: "보도자료 목록 페이지" },
            { url: `${W}/pss/img-03.webp`, alt: "경호처 소개 하위 페이지" },
            { url: `${W}/pss/img-04.webp`, alt: "민원 안내 페이지" },
            { url: `${W}/pss/img-06.webp`, alt: "홍보영상 목록 페이지" },
            { url: `${W}/pss/img-07.webp`, alt: "경호처 안내 하위 페이지" },
          ],
        },
      },
    ],
  },

  // =================================================================
  // PROJECT 3. DaedongMobility (대동 모빌리티)
  // =================================================================
  {
    slug: "daedongmobility",
    kind: "project",
    group: "selected",
    title: "가격 정책 변경에도 흔들리지 않게 정리한 제품 홍보·안내 페이지",
    shortName: "DaedongMobility",
    tagline: "A product promotion page presenting key features and pricing, kept consistent through frequent pricing updates.",
    productType: "Official Websites, Maintenance",
    tint: "red",
    media: { image: `${W}/daedongmobility/hero.webp`, mockup: `${W}/daedongmobility/mockup.webp`, dim: DIM_DAEDONGMOBILITY },
    summary:
      "대동 계열사 모빌리티 제품의 특징과 가격 구성을 소개하는 홍보/안내 페이지로, 전 화면 퍼블리싱을 단독으로 수행했습니다.",
    category: "Product Promotion Website (Responsive Web)",
    company: "WeverCNS",
    role: "Web Publishing 100% (UI Markup / Maintenance)",
    period: "1 Month",
    year: "2024-2025",
    tags: ["Web Publishing", "Maintenance"],
    specs: ["HTML5", "CSS3", "JavaScript", "jQuery", "Swiper", "GSAP", "ScrollMagic", "Figma"],
    githubUrl: null,
    liveUrl: null,
    sections: [
      {
        id: "overview",
        title: "개요 · Overview",
        type: "facts",
        body: "프로젝트 개요",
        meta: [
          { label: "프로젝트", value: "대동 모빌리티" },
          { label: "분류", value: "Product Promotion Website (Responsive Web)" },
          { label: "회사", value: "WeverCNS" },
          { label: "역할", value: "Web Publishing 100% (UI Markup / Maintenance)" },
          { label: "기간", value: "1 Month" },
          { label: "스택", value: "HTML5, CSS3, JavaScript, jQuery, Swiper, GSAP, ScrollMagic, Figma" },
        ],
      },
      {
        id: "work",
        title: "작업 내용 · Work",
        type: "markdown",
        image: { src: `${W}/daedongmobility/img-01.webp`, alt: "대동 모빌리티 웹사이트 메인 화면을 노트북 화면에 띄운 목업" },
        body: "전 화면 퍼블리싱을 단독으로 수행했습니다.\n\n- 가격 정책 변경에 따른 잦은 수정 사항을 일관된 구조로 정리해 신속하게 반영\n- 콘텐츠 흐름을 해치지 않는 범위에서 간단한 노출 모션 적용\n- 재직 기간 동안 지속적인 유지보수로 변경 이력 대응과 화면 안정성 관리\n\nA product promotion page for Daedong Mobility, presenting key features and pricing structures. Handled 100% of UI publishing, efficiently reflecting frequent pricing updates with clean, consistent layout control.",
        meta: null,
      },
      {
        id: "maintenance",
        title: "구현 포인트 · Maintenance",
        type: "markdown",
        image: { src: `${W}/daedongmobility/img-05.webp`, alt: "스마트폰으로 결제 카드를 인식하는 장면을 담은 이미지", position: "50% 30%" },
        body: "가격/정책 변경으로 수정이 반복되는 페이지 특성상, 컴포넌트 단위로 구조를 정리하여 변경 반영 속도와 안정성을 확보했습니다.\n\n유지보수 과정에서도 아래 실무 변수를 고려해 화면 품질이 흔들리지 않도록 관리했습니다.\n- 레이아웃 깨짐\n- 텍스트 길이 변동\n- 데이터 교체\n\nMaintained the site continuously during my tenure, applying subtle reveal motion without disrupting content flow.",
        meta: null,
      },
      {
        id: "screens",
        title: "화면 · Screens",
        type: "gallery",
        body: null,
        meta: {
          layout: "grid",
          images: [
            { url: `${W}/daedongmobility/img-02.webp`, alt: "대동 모빌리티 제품 페이지: 배터리 교환 스테이션과 가드닝 모빌리티" },
            { url: `${W}/daedongmobility/img-03.webp`, alt: "대동 모빌리티 제품 페이지: 프리미엄 리무진 카트와 체인 제품" },
            { url: `${W}/daedongmobility/img-04.webp`, alt: "전기스쿠터 프로모션 배너 화면" },
            { url: `${W}/daedongmobility/img-06.webp`, alt: "대동 모빌리티 모바일 화면 모음" },
            { url: `${W}/daedongmobility/img-07.webp`, alt: "대동 모빌리티 모바일 제품 페이지와 서비스 안내" },
          ],
        },
      },
    ],
  },

  // =================================================================
  // PROJECT 4. MaumHana (마음하나)
  // =================================================================
  {
    slug: "maumhana",
    kind: "project",
    group: "selected",
    title: "일러스트 중심 브랜드의 톤앤매너를 지킨 커뮤니티 플랫폼",
    shortName: "MaumHana",
    tagline: "A brand website and community platform, published end to end while keeping the brand's tone and readability.",
    productType: "Services & Systems, Web Publishing",
    tint: "teal",
    media: { image: `${W}/maumhana/hero.webp`, mockup: `${W}/maumhana/maumhana-mockup.webp`, aspect: "16 / 10", dim: DIM_MAUMHANA },
    summary:
      "마음하나 서비스의 전 화면 퍼블리싱을 전담하여, 브랜드 톤앤매너가 유지되도록 UI 구조와 레이아웃을 정리했습니다.",
    category: "Brand Website & Community Platform (Responsive Web)",
    company: "WeverCNS",
    role: "Web Publishing 100% (UI Markup)",
    period: "1 Month",
    year: "2024-2025",
    tags: ["Web Publishing", "Responsive"],
    specs: ["HTML5", "CSS3", "JavaScript", "jQuery", "Swiper", "GSAP", "ScrollMagic", "Figma"],
    githubUrl: null,
    liveUrl: null,
    sections: [
      {
        id: "overview",
        title: "개요 · Overview",
        type: "facts",
        body: "프로젝트 개요",
        meta: [
          { label: "프로젝트", value: "마음하나" },
          { label: "분류", value: "Brand Website & Community Platform (Responsive Web)" },
          { label: "회사", value: "WeverCNS" },
          { label: "역할", value: "Web Publishing 100% (UI Markup)" },
          { label: "기간", value: "1 Month" },
          { label: "스택", value: "HTML5, CSS3, JavaScript, jQuery, Swiper, GSAP, ScrollMagic, Figma" },
        ],
      },
      {
        id: "work",
        title: "작업 내용 · Work",
        type: "markdown",
        image: { src: `${W}/maumhana/img-01.webp`, alt: "마음하나 로고가 들어간 분홍색 헤더 이미지" },
        body: "마음하나 서비스의 전 화면 퍼블리싱을 전담했습니다.\n\n- 브랜드 톤앤매너가 유지되도록 UI 구조와 레이아웃 정리\n- 일러스트 중심의 비주얼 구성에서도 콘텐츠 가독성과 사용 흐름이 자연스럽게 이어지도록 구현\n- PC/모바일 환경에 맞춘 반응형 최적화\n\nOwned 100% of the UI publishing across all pages, maintaining the brand's tone through structured layout and markup. Ensured readability and a natural content flow within an illustration-driven design, and optimized responsiveness for both desktop and mobile.",
        meta: null,
      },
      {
        id: "screens",
        title: "화면 · Screens",
        type: "gallery",
        body: null,
        meta: {
          layout: "grid",
          images: [
            { url: `${W}/maumhana/img-02.webp`, alt: "마음하나 메인 페이지 전체 화면" },
            { url: `${W}/maumhana/img-03.webp`, alt: "고민 말하기, 도움 주기 등 서비스 소개 페이지" },
            { url: `${W}/maumhana/img-04.webp`, alt: "마음하나 커뮤니티 고민 목록 페이지" },
            { url: `${W}/maumhana/img-05.webp`, alt: "마음하나 게시글 상세 페이지" },
            { url: `${W}/maumhana/img-06.webp`, alt: "마음하나 사용자 프로필 페이지" },
            { url: `${W}/maumhana/img-07.webp`, alt: "마음하나 브랜드 소개 페이지" },
            { url: `${W}/maumhana/img-08.webp`, alt: "마음하나 상담 신청 폼 페이지" },
            { url: `${W}/maumhana/img-09.webp`, alt: "마음하나 하단 안내 영역" },
            { url: `${W}/maumhana/mobile.webp`, alt: "마음하나 모바일 화면들이 기울어진 채 나열된 이미지" },
          ],
        },
      },
    ],
  },

  // =================================================================
  // PROJECT 5. WeverCNS (웨버씨엔에스)
  // =================================================================
  {
    slug: "wevercns",
    kind: "project",
    group: "selected",
    title: "읽히는 흐름을 돕는 절제된 인터랙션의 기업 웹사이트",
    shortName: "WeverCNS",
    tagline: "A corporate website with smooth scrolling and scroll-based motion that supports the brand message instead of distracting from it.",
    productType: "Portfolio Sites, Web Publishing",
    tint: "indigo",
    media: { image: `${W}/wevercns/hero.webp`, mockup: `${W}/wevercns/mockup.webp`, dim: DIM_WEVERCNS },
    summary:
      "회사 소개 목적에 맞춰 깔끔한 정보 구조를 유지하면서, 부드러운 스크롤과 스크롤 인터랙션, 전환 애니메이션을 구현했습니다. 사용 흐름을 해치지 않는 범위에서 모션의 완성도를 높였습니다.",
    category: "Corporate Website (Interactive Responsive Web)",
    company: "WeverCNS",
    role: "Web Publishing 100% (UI / Interaction)",
    period: "1 Month",
    year: "2023",
    tags: ["Web Publishing", "Interaction"],
    specs: ["HTML5", "CSS3", "JavaScript", "jQuery", "GSAP", "ScrollMagic", "Figma"],
    githubUrl: null,
    liveUrl: null,
    sections: [
      {
        id: "overview",
        title: "개요 · Overview",
        type: "facts",
        body: "프로젝트 개요",
        meta: [
          { label: "프로젝트", value: "웨버씨엔에스" },
          { label: "분류", value: "Corporate Website (Interactive Responsive Web)" },
          { label: "회사", value: "WeverCNS" },
          { label: "역할", value: "Web Publishing 100% (UI / Interaction)" },
          { label: "기간", value: "1 Month" },
          { label: "스택", value: "HTML5, CSS3, JavaScript, jQuery, GSAP, ScrollMagic, Figma" },
        ],
      },
      {
        id: "work",
        title: "작업 내용 · Work",
        type: "markdown",
        image: { src: `${W}/wevercns/img-01.webp`, alt: "웨버씨엔에스 메인 화면을 노트북 화면에 띄운 목업" },
        body: "회사 소개 목적에 맞춰 깔끔한 정보 구조를 유지하면서 사이트 전체를 퍼블리싱했습니다.\n\n- 부드러운 스크롤과 스크롤 인터랙션\n- 페이지 전환 애니메이션\n- 사용 흐름을 해치지 않는 범위에서 모션 완성도 높이기\n\nPublished the entire corporate portfolio site with a clear content structure. Implemented smooth scrolling, scroll-based interactions, and page transitions while keeping motion subtle to support the brand message.",
        meta: null,
      },
      {
        id: "interaction",
        title: "구현 포인트 · Scroll-based Motion System",
        type: "markdown",
        image: { src: `${W}/wevercns/img-05.webp`, alt: "스마트폰 화면이 돌 조형물 옆에 놓인 흑백 이미지", position: "50% 40%" },
        body: "이 프로젝트는 \"보여주기 위한 모션\"이 아니라, 읽히는 흐름을 돕는 인터랙션에 집중했습니다.\n\n### 스크롤과 구간별 연출\nGSAP ScrollSmoother를 적용하여 스크롤 경험을 매끄럽게 정리하고, 구간별로 ScrollTrigger / ScrollMagic을 활용해 텍스트 노출, 섹션 전환 타이밍, 시선 유도 효과를 일관된 리듬으로 구성했습니다.\n\n### 지도 커스텀\n지도 영역은 디자인 콘셉트에 맞춰 Google Map을 모던 스타일로 커스텀하여, 정보 요소가 사이트 톤을 해치지 않도록 통일감을 유지했습니다.\n\n### 마감 기준\n전체적으로는 브랜드/콘텐츠 전달을 우선으로 두고, 인터랙션은 \"절제된 완성도\"로 마감했습니다.",
        meta: null,
      },
      {
        id: "screens",
        title: "화면 · Screens",
        type: "gallery",
        body: null,
        meta: {
          layout: "grid",
          images: [
            { url: `${W}/wevercns/img-02.webp`, alt: "웨버씨엔에스 메인과 Work 섹션 화면" },
            { url: `${W}/wevercns/img-03.webp`, alt: "웨버씨엔에스 Who, What 섹션 화면" },
            { url: `${W}/wevercns/img-04.webp`, alt: "Who, What, Work, Contact 메뉴 화면" },
            { url: `${W}/wevercns/img-06.webp`, alt: "웨버씨엔에스 모바일 화면 모음: 메인과 메뉴" },
            { url: `${W}/wevercns/img-07.webp`, alt: "웨버씨엔에스 모바일 화면 모음: Who와 What 섹션" },
          ],
        },
      },
    ],
  },
];
