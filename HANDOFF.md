# seungyeol-portfolio 작업 인수인계

이 문서는 이전 대화에서 정한 내용을 정리한 것이다. 새 세션은 이 문서를 기준으로 작업한다.
최종 정리일: 2026-11-17

- 저장소: https://github.com/maru-dev4905/seungyeol-portfolio
- 상세 결정 기록(원본): https://claude.ai/artifact/Jir8KPY6rgng7evNRKrBCK

---

## 1. 배경

- 사용자: 이승열(마루). 웹퍼블리셔 5년 경력, 프론트엔드 개발자로 전환 중. 목표는 토스 FE 엔지니어.
- 이 저장소: 새 포트폴리오 사이트. 완성되면 기존 seungyeol.kr 도메인을 이 사이트로 교체한다.
- 기존 `SeungyeolPortfolio` 저장소는 지우지 않고 보관(Archive)한다.
- 이 사이트 자체가 FE 대표작이다. 그래서 코드 전부를 사용자가 설명할 수 있어야 한다.

## 2. 작업 규칙 (반드시 지킬 것)

1. **설명할 수 없는 코드는 머지하지 않는다.** 코드를 만들면 "무엇을, 왜 이렇게" 했는지 사용자에게 설명할 수 있게 남긴다. 작업이 끝나면 만든 구조를 사용자와 같이 읽는다.
2. **사용자는 답을 바로 받기보다 함께 탐구하는 방식을 선호한다.** 설계 선택지가 있으면 혼자 정하지 말고 선택지와 장단점을 제시한다.
3. **고민과 결정은 매번 기록한다.** `docs/decisions/`에 결정 기록을 남긴다. 형식은 배경 → 고민한 선택지 → 결정 → 이유 → 면접 포인트 → 남은 질문. 번호는 D-012부터 이어 붙인다(D-001~D-011은 아래 4번에 요약).
4. **트러블슈팅도 기록한다.** 세팅이나 구현 중 막혔던 문제는 원인과 해결을 짧게 남긴다. 포트폴리오 상세 페이지의 트러블슈팅 섹션 재료가 된다.
5. 커밋과 푸시는 사용자가 요청할 때만 한다.

## 3. 기술 스택

- 프론트: Next.js (App Router), TypeScript
- 백엔드: NestJS
- DB·인증·스토리지: Supabase (Postgres, Auth, Storage)
- 배포: Vercel (프로젝트 2개)
- 모노레포: pnpm workspace + Turborepo
- 검증: zod (Nest와 Next가 같은 스키마를 공유)
- 서버 상태: TanStack Query (관리자 화면에서만)

## 4. 확정된 결정 요약 (D-001 ~ D-011)

| ID | 결정 | 핵심 이유 |
| --- | --- | --- |
| D-001 | Nest 백엔드를 두고 관리자 기능을 만든다 | 코드 수정 없이 프로젝트와 섹션을 추가하기 위해 |
| D-002 | 스펙(SPEC)·카테고리(CATE)는 공통 코드 테이블로 | 값만 추가하면 됨. 단, 그룹이 맞는지는 Nest 서비스에서 검사 |
| D-003 | 섹션은 `project_contents` 한 행씩, `body`(md) + `meta`(JSONB) | 같은 섹션 여러 번, 순서 변경 가능. 구조가 필요한 섹션만 meta 사용 |
| D-004 | 섹션 `type`은 문자열 + CHECK | 타입 추가 시 어차피 컴포넌트와 스키마를 새로 만들어야 하므로 공통 코드의 장점이 없음 |
| D-005 | JSONB 검증은 zod 공유 스키마로 Nest·Next 양쪽에서 | DB는 JSONB 안을 검사하지 않고 TS 타입은 런타임에 없음. 규칙과 타입을 한 곳에서 |
| D-006 | 순서 컬럼은 `sort_order` | `seq`는 자동 증가 번호처럼 읽힘. 드래그 정렬 방식은 미정 |
| D-007 | 메인과 소개 페이지를 나눈다 | 메인은 인터랙션 쇼케이스, 소개는 상세 이력 |
| D-008 | 방문자 페이지는 SSG·ISR, 관리자는 CSR | 아래 6번 참고 |
| D-009 | pnpm workspace + Turborepo, 저장소 이름 `seungyeol-portfolio` | zod 스키마 공유, 빌드 순서 관리 |
| D-010 | 핵심 화면(메인, 상세, 섹션 컴포넌트)만 Figma로, 관리자는 코드로 바로 | 관리자는 본인만 봄 |
| D-011 | 디자인: 그레이니 그라데이션 배경 + 리퀴드 글래스 UI | "번지는 물감 위를 흐르는 물방울". 성능·가독성 주의 |

## 5. DB 설계

```
common_codes
  id            int PK
  group_code    text        -- 'SPEC', 'CATE'
  code          text        -- '001'
  code_name     text        -- 'React'
  description   text
  sort_order    int
  is_used       boolean
  UNIQUE (group_code, code)

projects
  id                uuid PK
  slug              text UNIQUE      -- URL용
  title             text
  summary           text             -- 목록 카드용 한 줄
  category_code_id  int FK -> common_codes.id   -- CATE 그룹만 허용(서비스에서 검사)
  company           text
  role              text
  team              text             -- 작업자
  contribution      int              -- 기여도 %
  start_date        date
  end_date          date
  thumbnail_url     text
  github_url        text
  live_url          text
  sort_order        int
  is_published      boolean
  is_deleted        boolean          -- soft delete
  created_at        timestamptz
  created_by        uuid             -- Supabase auth.users
  updated_at        timestamptz

project_specs                        -- 프로젝트 ↔ 스펙 (다대다)
  project_id    uuid FK -> projects.id
  spec_code_id  int  FK -> common_codes.id     -- SPEC 그룹만 허용
  sort_order    int
  PRIMARY KEY (project_id, spec_code_id)

project_contents                     -- 프로젝트 안의 섹션
  id          uuid PK
  project_id  uuid FK -> projects.id
  sort_order  int
  type        text CHECK (type IN ('markdown','troubleshooting','metrics','gallery','video'))
  title       text                   -- 섹션 소제목
  body        text                   -- markdown, 없으면 null
  meta        jsonb                  -- 구조 데이터, 없으면 null (이름 변경 검토 중)
  created_at  timestamptz
  updated_at  timestamptz
  UNIQUE (project_id, sort_order)    -- DEFERRABLE 여부는 정렬 방식 결정 후
```

타입별 `body` / `meta`:

| type | body | meta |
| --- | --- | --- |
| markdown (텍스트·코드 블록) | 본문 전체 | 없음 |
| troubleshooting | 회고 한 줄 (선택) | `{ problem, cause, solution, result }` |
| metrics | 없음 | `[{ label, value, unit }]` |
| gallery | 없음 | `{ layout: 'grid' \| 'slider', images: [{ url, alt }] }` (alt 필수) |
| video | 설명 (선택) | `{ youtubeUrl }` |

이미지 파일은 Supabase Storage에 올리고 DB에는 URL만 저장한다.

### zod 스키마 방향 (packages/schemas)

```ts
const sectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("markdown"), body: z.string(), meta: z.null() }),
  z.object({
    type: z.literal("troubleshooting"),
    body: z.string().nullable(),
    meta: z.object({
      problem: z.string(),
      cause: z.string(),
      solution: z.string(),
      result: z.string(),
    }),
  }),
  // metrics, gallery, video ...
])

export type Section = z.infer<typeof sectionSchema>
```

- Nest: 요청을 받을 때 `parse()`로 검증한다(진짜 문지기).
- Next 관리자 폼: react-hook-form + `zodResolver`로 즉시 에러 표시(UX).
- Next 화면: `z.infer` 타입으로 섹션 컴포넌트를 그린다.
- zod는 `parse()`를 부른 곳에서만 검사한다는 점에 주의.

## 6. 페이지와 렌더링 방식

| 페이지 | 방식 | 이유 |
| --- | --- | --- |
| `/` 메인 | SSG + 인터랙션 부분만 클라이언트 컴포넌트 | 서버 데이터 없음, 검색 노출 필요 |
| `/about` 소개 | SSG | 메인과 같음 |
| `/projects` 목록 | ISR (온디맨드 재검증) | 관리자에서 저장할 때만 바뀜 |
| `/projects/[slug]` 상세 | ISR (온디맨드 재검증) | 자주 안 바뀌고 바뀌는 시점을 앎 |
| `/admin/login` | CSR | |
| `/admin/projects` | CSR + TanStack Query | 검색 노출 금지, 화면에서 데이터를 계속 바꿈 |
| `/admin/projects/[id]` | CSR + TanStack Query | 기본 정보 폼 + 섹션 빌더(추가·수정·삭제·드래그 순서 변경) |
| `/admin/codes` | CSR + TanStack Query | 공통 코드 관리 |

- 관리자: `robots: { index: false }`, 미들웨어에서 미로그인 시 `/admin/login`으로 리다이렉트, 실제 권한 검사는 Nest API에서.
- `'use client'`는 CSR이 아니다. 클라이언트 컴포넌트도 서버에서 HTML로 먼저 만들어지고 하이드레이션된다.

### 저장 → 재검증 흐름 (D-008, B안)

```
브라우저 ──Server Action──▶ Next 서버 ──저장──▶ Nest (DB)
                            Next 서버 ◀──성공── Nest
                            Next 서버: revalidatePath / revalidateTag
```

- Server Action 하나가 Nest 저장을 요청하고, 성공하면 같은 자리에서 재검증한다.
- 로그인 토큰은 httpOnly 쿠키로 서버에만 둔다.
- 관리자 화면은 `useMutation`의 `mutationFn`에 Server Action을 넣어 TanStack Query를 그대로 쓴다.
- 재검증 Server Action도 로그인 확인을 한다.
- 안전망으로 시간 기반 revalidate(예: 1시간)도 건다.

## 7. 레포 구조

```
seungyeol-portfolio/
├─ apps/
│  ├─ web/        ← Next.js
│  └─ api/        ← NestJS
├─ packages/
│  └─ schemas/    ← zod 스키마 + z.infer 타입
├─ docs/
│  └─ decisions/  ← 결정 기록 (D-001부터)
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

- 앱은 `"@<scope>/schemas": "workspace:*"`로 스키마 패키지를 불러온다. 스코프 이름(`@portfolio` 또는 `@seungyeol`)은 아직 미정이니 사용자에게 확인한다.
- Nest는 컴파일된 JS로 실행되므로 schemas를 먼저 빌드해야 한다(tsup 등). Turborepo의 `dependsOn: ["^build"]`로 순서를 관리한다.
- 배포: Vercel 프로젝트 2개(Root Directory `apps/web`, `apps/api`). 도메인 `seungyeol.kr`, `api.seungyeol.kr`. NestJS는 Vercel에서 설정 없이 Function 하나로 배포된다.

## 8. 디자인 컨셉 (D-011)

- 그레이니 그라데이션 배경 위에 리퀴드 글래스 UI. "번지는 물감 위를 흐르는 물방울".
- 사용자를 설명하는 말: "동화 같은 삶", "어디든 적응해 흐르는 물".
- 메인은 화려하게, 상세·소개는 배경을 낮추고 패널을 더 불투명하게 해서 글이 먼저 읽히게.
- 성능: 배경은 캔버스/WebGL 셰이더 하나로, 글래스 요소 수 제한, 모바일에서 효과 축소.
- `prefers-reduced-motion`이면 배경 정지. 유리 위 글자 대비(접근성) 확인.
- 프로젝트 상세의 기본 섹션 순서(관리자에서 새 프로젝트 생성 시 미리 깔기): 문제 발견 → 설계 결정 → 구현 → 트러블슈팅 → 임팩트(숫자) → 배운 점.

## 9. 아직 정하지 않은 것

- [ ] `meta` 컬럼 이름 (`data`, `fields` 등)
- [ ] 드래그 정렬 방식: A(정렬된 id 목록을 보내 트랜잭션에서 통째로 다시 매기기, UNIQUE는 DEFERRABLE) / B(1000 간격 사이값)
- [ ] 패키지 스코프 이름
- [ ] 기술 스택으로 목록 필터를 넣을지
- [ ] 메인 인터랙션 구체화와 색 팔레트
- [ ] 블로그·배움일기 페이지를 둘지

---

## 10. 첫 작업: 모노레포 뼈대 세팅

목표는 "구조만 있고 서로 연결되는 빈 모노레포"다. DB, 인증, 화면 디자인은 아직 하지 않는다.

1. pnpm workspace와 Turborepo 루트 설정 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, Node 버전 고정).
2. `apps/web`: Next.js (App Router, TypeScript).
3. `apps/api`: NestJS (TypeScript).
4. `packages/schemas`: zod 설치, 위 5번의 `sectionSchema` 초안과 `Section` 타입 export, tsup으로 빌드.
5. 연결 확인: web과 api 양쪽에서 schemas를 import해서 실제로 쓰는 최소 코드 하나씩(예: api의 헬스체크 응답이나 테스트에서 `sectionSchema.parse` 호출, web 페이지에서 `Section` 타입 사용).
6. `turbo.json`에서 `build`가 `^build`에 의존하게 해서 schemas가 먼저 빌드되게.
7. `docs/decisions/`에 이 문서의 4번 결정들을 옮겨 적는다(파일 하나에 모아도 되고 결정별로 나눠도 됨. 사용자에게 확인).

**완료 기준**
- 루트에서 `pnpm install`, `pnpm build`가 통과한다(schemas → web, api 순서).
- `pnpm dev`로 web과 api가 동시에 뜬다.
- 세팅 중 막힌 문제가 있으면 원인과 해결을 기록해둔다.

**작업이 끝나면**
- 만든 파일과 폴더를 사용자와 하나씩 같이 읽는다. 특히 `pnpm-workspace.yaml`, `turbo.json`, schemas의 `package.json`(exports, build), 각 앱이 schemas를 어떻게 불러오는지.
- 결정이 필요했던 지점(버전 선택, 빌드 도구 등)은 D-012부터 기록한다.

## 11. 첫 배포 범위 (목표 날짜는 없음)

"프로젝트 하나가 DB에서 불러와져 상세 페이지에 보이는 것"까지를 첫 배포로 본다. 그다음부터 하나씩 붙인다.
