# D-017 프로젝트 상세 페이지 디자인 해석과 구현

- 상태: 샘플 구현 완료 (세부 일부 미정)
- 날짜: 2026-11-17

> D-011의 컨셉을 `/projects/[slug]` 상세 페이지로 옮긴 첫 샘플. "해외 사이트처럼 세련되되 정신 없지 않게"를 **덜어내는 방향**으로 해석했다.

## 디자인 해석

D-011은 두 가지를 동시에 요구한다: 화려한 배경 + 읽히는 글.
상세 페이지는 읽는 페이지이므로 **글이 이긴다**. 그래서 다음 원칙으로 정했다.

| 원칙 | 구현 |
| --- | --- |
| 색은 적게, 채도는 낮게 | 파스텔 4색(peach, lilac, sky, mint)만 배경에 쓰고, 강조색(accent)은 한 가지. 결과(Result) 줄에만 쓴다 |
| 움직임은 배경에만, 그리고 느리게 | 배경 덩어리가 40~52초 주기로 천천히 떠다닌다. 콘텐츠는 움직이지 않는다 |
| 타이포로 위계를 만든다 | 큰 제목(최대 4.5rem, 자간 -0.035em) + 작은 모노스페이스 라벨(Geist Mono, 대문자). 장식은 쓰지 않는다 |
| 유리는 아끼고, 읽는 면은 불투명하게 | 글래스는 화면당 2개(네비게이션, 정보 패널)만. 본문 섹션은 `.panel`(블러 없음, 불투명도 0.8) |
| 여백이 디자인이다 | 섹션 사이 20px, 본문 패딩 최대 44px, 한 줄 길이 40em 제한 |

## 배경 구현 (Backdrop)

- 번지는 물감: 4개의 `radial-gradient` 원이 `transform`만 바뀌며 떠다닌다. `filter: blur`는 쓰지 않는다(큰 요소에서 비용이 큼). 가장자리가 부드러운 그라데이션 자체가 번짐이다.
- 그레인: 한 장짜리 SVG(`feTurbulence`)를 타일로 깔고 `mix-blend-mode: multiply`. 움직이지 않아 비용이 싸고, 그라데이션의 계단 현상(밴딩)을 가려준다.
- `intensity="calm"`: 상세·소개용(덩어리 투명도 0.55). `"vivid"`는 메인용으로 남겨둔다.
- 모바일(720px 이하): 덩어리 1개를 숨기고 움직임을 더 느리게. `prefers-reduced-motion`이면 정지.

## 구조

```
app/projects/[slug]/page.tsx     ← 정적 셸(배경·네비) + Suspense 안에서 데이터
components/Backdrop/             ← 배경 (서버 컴포넌트, 순수 CSS)
components/SiteNav/              ← 글래스 네비게이션
components/sections/
  SectionRenderer.tsx            ← type으로 컴포넌트를 고르는 switch (assertNever로 누락 방지)
  Markdown/Troubleshooting/Metrics/Gallery/VideoSection.tsx
lib/projects.ts                  ← 샘플 데이터 + use cache/cacheTag (D-015)
```

- `SectionRenderer`의 `switch (section.type)`는 zod `discriminatedUnion`에서 뽑은 타입이라 case마다 `section`의 모양이 자동으로 좁혀진다. 섹션 `type`을 하나 추가하면 `assertNever`가 컴파일 에러로 알려준다. (D-004, D-005, D-010)
- 페이지 셸에서는 `params`를 기다리지 않고 `<Suspense>` 안쪽에서만 기다린다. 그래서 빌드 때 `/projects/sample-project`는 완전 정적(`○`), 그 외 slug는 정적 셸(`◐`)이 만들어진다. (D-015)

## 확인한 것

- `next build`: `/projects/sample-project ○`, `/projects/[slug] ◐`.
- 헤드리스 Chromium 스크린샷(데스크톱 1440px, 모바일 390px)으로 레이아웃 확인. 모바일은 한 열, 목차 숨김, 정보 패널 2열.
- 아직 **측정하지 않은 것**: LCP, 실제 FPS, 저사양 기기에서의 배경 애니메이션 비용. 면접 포인트로 쓰려면 측정값이 필요하다.

## 남은 질문

- [ ] 배경: D-011은 "캔버스/WebGL 셰이더 하나"를 말했는데 샘플은 CSS로 만들었다. 메인에서 셰이더로 갈지, CSS로 충분한지.
- [ ] `Backdrop` 위치: 지금은 페이지마다 넣는다. 레이아웃에 두면 페이지를 옮겨도 배경 애니메이션이 끊기지 않지만, 페이지별 강도 조절 방법이 필요하다.
- [ ] `sectionSchema`에 `id`, `title`, `sort_order`를 넣을지. 지금은 `ProjectSection = { id; title } & Section`으로 화면 쪽에서 합쳤다. DB 행 전체를 zod로 검증하려면 스키마에 들어가야 한다.
- [ ] 마크다운 렌더링 라이브러리. 지금은 빈 줄 기준으로 문단만 나눈다(임시).
- [ ] 이미지 호스트(Supabase Storage)가 정해지면 `GallerySection`의 `<img>`를 `next/image`로.
- [ ] 목차 현재 위치 강조(스크롤 위치에 따라). JS가 필요해서 지금은 뺐다.

## 트러블슈팅

### `PageProps<"/projects/[slug]">`에서 타입 에러

- 증상: `Type '"/projects/[slug]"' does not satisfy the constraint '"/"'`, `Property 'slug' does not exist on type 'unknown'`.
- 원인: `PageProps`는 Next가 라우트를 읽어 **생성하는** 전역 타입이다. 새 라우트를 만든 뒤 `next dev`/`next build`/`next typegen`이 한 번도 돌지 않으면 타입이 없다.
- 해결: `apps/web`의 `typecheck`를 `next typegen && tsc --noEmit`으로 바꿨다. 새로 클론한 환경에서도 `pnpm typecheck`가 통과한다.
