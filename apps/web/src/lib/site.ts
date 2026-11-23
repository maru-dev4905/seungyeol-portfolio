// 사이트 문구를 한 곳에 모은다. 화면 컴포넌트는 글을 직접 쓰지 않고 여기서 가져간다(문구 수정 = 이 파일만).
// 연락처는 사이트 주인의 기존 포트폴리오(seungyeol.kr) 푸터에 있던 값만 쓴다. 전화번호는 개인정보라 넣지 않는다.

// 모든 페이지의 공통 헤더(SiteHeader)와 메뉴 오버레이(MenuOverlay)가 쓰는 문구
// TODO: email 외의 값(도시 시계·Latest 카드·메뉴 소개 문구)은 아직 임시다. 사이트 주인이 실제 내용으로 교체한다.
export const siteCopy = {
  name: "seungyeol",
  // ©표기 연도. new Date()는 프리렌더 값이 굳어 버리므로(Cache Components) 직접 적는다. 해가 바뀌면 이 값만 고친다
  year: 2026,
  // 기존 포트폴리오 푸터의 이메일. 헤더 메일 버튼·메뉴 Get in Touch·About 푸터가 모두 이 값을 쓴다.
  // (빈 값으로 바꾸면 메일 버튼·Get in Touch는 링크 없이 "준비 중" 버튼으로 나온다)
  email: "iseung10e@gmail.com" as string, // string으로 넓혀 둔다: 비우는 경우(준비 중 버튼)도 코드가 처리한다
  // 헤더 오른쪽 시계가 보여 주는 도시 코드·시간대(IANA). 서울(내 도시) 하나만 쓴다
  clock: { code: "KOR", name: "Seoul", timeZone: "Asia/Seoul" },
  // 메뉴 오버레이 오른쪽 "Latest" 카드 스택. TODO: 모두 자리표시다. 주인이 실제 소식으로 바꾼다
  latest: [
    { title: "Latest note", date: "Soon", body: "Placeholder: a recent write-up will appear here." },
    { title: "Mar 2026", date: "", body: "Placeholder: a short update about a recent project." },
    { title: "Jan 2026", date: "", body: "Placeholder: a note about what I am learning." },
  ],
  menu: {
    // 메뉴 내비 첫 항목: /works(작업 목록 페이지)로 이동한다
    works: "Works",
    about: "About",
    library: "Library",
    contact: "Contact",
    // 홈의 JS-off 대체 영역이 쓰는 소개 문구(한국어라 sans). About 항목은 /about 페이지로 이동한다
    aboutBody:
      "마크업을 다루던 웹 퍼블리셔에서 출발해, 컴포넌트와 제품을 함께 설계하는 프론트엔드 개발자로 일하고 있습니다.",
    based: "Based in Seoul",
  },
} as const;

// 홈 알약 목록과 메뉴 Case Studies가 같이 쓰는 그룹 라벨(lib/projects.ts의 ProjectGroup)
export const groupLabels = {
  featured: "Engineering",
  selected: "Selected works",
} as const;

// 메인(`/`) 전용 문구. 이름·직무·문장은 임시이며 사이트 주인이 바꾼다.
// TODO: 아래 모든 문장은 임시 카피다. 사이트 주인이 실제 내용으로 교체한다.
export const homeCopy = {
  // 초대형 세리프 헤드라인. 한 문장을 두 줄로 나눈다(쉼표에서 끊고, 두 번째 줄이 오른쪽으로 밀리는 계단식)
  headline: ["Frontend developer,", "publishing precision."],
  // 오른쪽 위의 소개문장(4줄 안팎, 영어)
  intro:
    "Five years in web publishing taught me how interfaces are really built. Now I'm moving into frontend engineering to ship them as products.",
  // 헤드라인 아래 단일 행동 링크(/works로 간다)와 알약 목록 위 힌트 라벨
  cta: "View work",
  hint: "Hover a project",
  // 알약 맨 끝 항목: 눌러서 /works(작업 목록 페이지)로 간다
  allWork: "Works",
  // Works 알약을 올렸을 때 나오는 큰 제목 옆 한 줄 설명
  allWorkTagline: "Starter kits and client work, in one list",
} as const;
