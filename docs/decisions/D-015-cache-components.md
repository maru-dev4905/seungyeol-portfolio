# D-015 Next의 Cache Components를 켤지

- 상태: 확정 (A. 켠 채로 간다)
- 날짜: 2026-11-17

> `create-next-app`이 `cacheComponents: true`, `partialPrefetching: true`를 기본으로 켜서 생성했다. 이 상태로 갈지 정해야 한다.

## 배경

D-008은 "목록·상세는 ISR(온디맨드 재검증)"으로 정했다. 이 결정은 `export const revalidate`와 `revalidatePath` 같은 **기존 캐시 모델**을 전제로 쓰였다.

그런데 Next 16.4 템플릿은 `next.config.ts`에 다음을 켜둔다.

```ts
cacheComponents: true,
partialPrefetching: true,
```

Next 내장 문서(`node_modules/next/dist/docs`)에서 확인한 내용:

- Cache Components를 켜면 **데이터 가져오기가 기본적으로 동적**이고, 캐싱할 곳을 `use cache` 디렉티브로 직접 지정한다. (`cacheLife`, `cacheTag`와 함께 쓴다.)
- 정적 HTML 셸을 먼저 보내고, 동적인 부분은 스트리밍한다(PPR이 기본 동작이 된다).
- ISR 가이드가 둘로 나뉜다. "ISR without Cache Components"와 "ISR with Cache Components". 켜면 후자를 따라야 한다.
- 다음 메이저에서는 두 기능이 모든 곳에서 켜지고 옵션이 사라진다고 적혀 있다.

## 고민한 선택지

| 안 | 방식 | 장점 | 단점 |
| --- | --- | --- | --- |
| A. 켠 채로 간다 | `use cache` + `cacheTag`로 상세·목록을 캐싱하고, 저장 시 `revalidateTag` | 다음 메이저의 기본 방향과 일치. 정적 셸 + 동적 조각을 한 페이지에서 섞을 수 있음 | D-008의 표현(ISR, `revalidate`)을 새 모델로 다시 써야 함. 새 개념이 많아 설명 부담이 큼 |
| B. 끈다 | 두 옵션을 지우고 기존 모델 | D-008이 그대로 맞음. 익숙한 ISR | 다음 메이저에서 어차피 바뀜 |

## 결정

**A. 켠 채로 간다.** `next.config.ts`의 `cacheComponents: true`, `partialPrefetching: true`를 유지한다.

- 다음 메이저에서 두 옵션이 모든 곳에서 켜지고 옵션 자체가 사라진다고 문서에 적혀 있다. 지금 끄고 시작하면 곧 다시 옮겨야 한다.
- 대신 `use cache`, 정적 셸, `cacheTag`를 **내 말로 설명할 수 있어야** 한다. 아래 "개념 정리"가 그 재료다.

## 같이 따져볼 것

- D-008의 "저장 → 재검증" 흐름(Server Action이 Nest 저장 후 재검증)은 어느 쪽이든 유지된다. 바뀌는 건 **무엇을 캐시한다고 표시하느냐**다.
- 이 사이트는 "코드 전부를 설명할 수 있어야" 한다. 새 모델을 쓰려면 `use cache`와 정적 셸의 동작을 내 말로 설명할 수 있어야 한다.
- 관리자(CSR) 쪽은 어느 쪽이든 영향이 작다.

## 남은 질문

- [ ] 서버리스(Vercel)에서 `use cache`의 런타임 캐시가 실제로 어떻게 동작하는지. 문서는 "서버리스에서는 메모리 캐시가 요청 사이에 유지되지 않을 수 있다"고 적는다. 첫 배포 때 직접 확인한다.
- [ ] 필요하면 `use cache: remote`(영속 캐시)를 쓸지.

---

## 개념 정리 (내 말로 설명하기 위한 메모)

### 왜 이 문제를 고민하게 됐나

ISR의 정체가 **캐시**이기 때문이다. "미리 만든 HTML을 보관해뒀다가, 바뀌면 그 부분만 다시 만든다"는 것이 곧 캐싱이다. D-008에서 ISR을 골랐을 때 이미 캐싱을 고른 것이었고, 다만 **어떻게 표시하는가**가 Next 버전에 따라 달라졌다.

| | 이전 모델 | Cache Components 모델 (Next 16.4 템플릿 기본) |
| --- | --- | --- |
| 기본 동작 | 페이지가 정적이면 알아서 캐시됨 (암묵적) | **데이터 가져오기는 기본이 동적**. 캐시할 곳만 직접 표시 (명시적) |
| 캐시 단위 | 라우트(페이지) 단위 중심. `export const revalidate = 60` | 함수·컴포넌트·페이지 어디든 `'use cache'` |
| 갱신 | `revalidatePath` 중심 | `cacheTag` + `updateTag` / `revalidateTag` (태그 우선) |

D-008을 쓸 때 전제했던 모델과 `create-next-app`의 기본값이 달랐고, 그 차이를 세팅 중에 발견했다. 그래서 "캐싱 얘기가 갑자기" 나온 것이다.

### 정적 셸 (static shell)

한 페이지를 **세 종류의 조각**으로 본다. 빌드할 때 첫 번째와 두 번째가 미리 만들어져 HTML 셸이 되고, 세 번째는 요청 때 스트리밍된다.

1. **정적**: 항상 같은 것 (헤더, 레이아웃). 자동으로 미리 만들어진다.
2. **캐시된 동적**: 데이터는 있지만 모두에게 같은 것 (프로젝트 목록·상세). `use cache`로 표시하면 셸에 포함된다.
3. **요청 때 동적**: 요청한 사람에 따라 다른 것 (쿠키, 로그인 상태). `<Suspense fallback>`으로 감싸면 fallback이 셸에 들어가고 실제 내용은 나중에 흘러온다.

예전에는 쿠키를 읽는 순간 **페이지 전체가 동적**이 됐다. 이제는 그 부분만 동적이고 나머지는 정적 셸로 즉시 나간다.

### `use cache`

함수나 컴포넌트 맨 위에 적어서 "이 결과는 캐시해도 된다"고 표시하는 디렉티브다.

```ts
import { cacheLife, cacheTag } from 'next/cache'

export async function getProject(slug: string) {
  'use cache'
  cacheLife('max')              // 오래 유효 (시간으로는 거의 안 바꿈)
  cacheTag('projects', `project:${slug}`)
  // ... Nest API 호출
}
```

- 인자(`slug`)가 **캐시 키**가 된다. 같은 `slug`면 같은 캐시, 다른 `slug`면 다른 캐시.
- 쿠키·헤더처럼 요청마다 다른 값은 그 안에서 직접 읽지 않고, 밖에서 읽어 인자로 넘긴다.
- `cacheLife`를 같이 적는 것을 권장한다. 안 적으면 `default`(5분 stale, 15분 revalidate)가 적용된다.

### `cacheTag`와 재검증

캐시 항목에 **이름표**를 붙이는 함수다. 나중에 그 이름표로 "이것들만 낡았다"고 알려줄 수 있다.

- 경로로 무효화(`revalidatePath('/projects/abc')`)하면 어떤 데이터가 거기 들어 있는지 모른 채 그 페이지를 통째로 비운다. 태그는 **데이터 기준**이라 더 정확하다. 문서도 태그 방식을 권장한다.
- `updateTag('projects')`: 캐시를 **즉시** 만료. 내가 방금 저장한 걸 바로 봐야 할 때(read-your-own-writes). **Server Action 안에서만** 쓸 수 있다.
- `revalidateTag('projects', 'max')`: stale-while-revalidate. 낡은 걸 먼저 보여주고 뒤에서 새로 만든다. 약간의 지연이 괜찮을 때. Server Action과 Route Handler에서 쓴다.

### 이 사이트에 적용하면

| 데이터 | 캐시 | 태그 | 갱신 |
| --- | --- | --- | --- |
| 프로젝트 목록 | `use cache` + `cacheLife('max')` | `projects` | 관리자 저장 시 |
| 프로젝트 상세 | `use cache` + `cacheLife('max')` | `projects`, `project:${slug}` | 관리자 저장 시 |
| 관리자 화면 | 쓰지 않음 (CSR + TanStack Query) | - | - |

D-008의 저장 흐름은 그대로이고, 마지막 줄만 바뀐다.

```
Server Action → Nest 저장 성공 → updateTag('projects') / updateTag(`project:${slug}`)
```

관리자는 방금 저장한 걸 바로 확인해야 하므로 `revalidateTag`보다 `updateTag`가 맞다.

### 새 프로젝트(처음 보는 slug)는?

`generateStaticParams`로 빌드 때 만들어둔 slug 외의 새 slug는, 정적 셸을 먼저 보여주고 뒤에서 채워 넣은 뒤 캐시에 저장한다. 이것이 문서가 말하는 "Cache Components 방식의 ISR"이다. 이를 위해 `params`는 `<Suspense>` 안에서 `await` 한다. 관리자에서 프로젝트를 추가해도 재배포가 필요 없는 이유다.

### 면접 포인트

"ISR을 어떻게 구현했나요?" → 상세·목록 데이터를 `use cache`로 캐시하고 `cacheTag`를 붙였다. 관리자가 저장하면 Server Action이 Nest에 저장한 뒤 `updateTag`로 해당 태그만 무효화한다. 페이지 전체가 아니라 **데이터 단위**로 갱신하고, 셸은 정적으로 즉시 나간다. 템플릿 기본값이 바뀐 것을 세팅 중에 발견하고, 이전 모델과 비교해서 선택했다.
