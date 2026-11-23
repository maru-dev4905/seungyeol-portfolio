# D-009 레포 구조: pnpm workspace + Turborepo

- 상태: 확정
- 날짜: 2026-11-17

> 저장소 `seungyeol-portfolio` 하나를 pnpm workspace 모노레포로 구성하고, Turborepo는 처음부터 넣는다.
> 기존 `SeungyeolPortfolio` 저장소는 지우지 않고 보관(Archive)한다.

## 배경

이전 프로젝트(백석 전시 등)는 한 레포 안에 `/frontend`, `/backend`를 두고 각자 배포했다.
이번에는 zod 스키마를 양쪽이 같이 써야 한다(D-005).

## 고민한 선택지

| 안 | 방식 | 버린 이유 / 채택 |
| --- | --- | --- |
| A | `/shared` 폴더를 상대 경로로 불러오기 | 양쪽 `node_modules`의 zod 버전이 갈릴 수 있고, Nest는 자기 폴더 밖 파일을 기본으로 컴파일하지 않으며, 배포 빌드에서 못 찾을 수 있음 |
| B | npm workspaces | pnpm이 의존성 격리가 더 엄격해서 후순위 |
| **C** | **pnpm workspaces + Turborepo** | **채택** |

## 결정

```
seungyeol-portfolio/
├─ apps/
│  ├─ web/        ← Next.js
│  └─ api/        ← NestJS
├─ packages/
│  └─ schemas/    ← zod 스키마 + z.infer 타입
├─ docs/
│  └─ decisions/  ← 이 결정 기록
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

각 앱은 `"@portfolio/schemas": "workspace:*"`로 스키마 패키지를 불러온다.

### 패키지 스코프: `@portfolio`

스코프는 npm 패키지 이름 앞에 붙는 `@이름/` 접두사다(예: `@nestjs/core`). 내부 패키지 이름이 모든 `import`와 `package.json`에 박히므로 처음에 정해야 한다.

| 후보 | 장점 | 단점 |
| --- | --- | --- |
| **`@portfolio`** | 역할이 바로 읽힘 | 흔한 이름 |
| `@seungyeol` | 정체성이 분명함 | 역할이 덜 드러남 |

**`@portfolio`로 확정.** 실제로 npm에 배포하지 않는 내부 패키지라 기능 차이는 없고, 읽는 사람이 역할을 바로 알 수 있는 쪽을 골랐다.

## 이유

- pnpm은 패키지끼리 의존성이 섞이는 문제를 엄격하게 막는다.
- Nest는 컴파일된 JS로 실행되므로 **schemas를 먼저 빌드**해야 한다(tsup 등).
  Turborepo가 그 빌드 순서(`build`의 `dependsOn: ["^build"]`)와 변경분 빌드를 관리한다.

## 배포

한 레포에서 Vercel 프로젝트 2개 (Root Directory `apps/web`, `apps/api`).
도메인은 `seungyeol.kr`, `api.seungyeol.kr`.

## 면접 포인트

"모노레포를 왜 이렇게 구성했나요?"
→ 공유 스키마 때문에 필요했고, 빌드 순서 문제를 Turborepo로 해결했다.
실제로 겪은 문제는 생기는 대로 아래 "트러블슈팅"에 덧붙인다.

## 남은 질문

없음.

## 트러블슈팅

### 1. `create-next-app`: "The application path is not writable"

- 증상: `pnpm dlx create-next-app@latest apps/web ...`이 폴더 권한 에러를 냈다.
- 원인: 권한 문제가 아니라 부모 폴더 `apps/`가 아직 없어서였다. 에러 메시지가 원인을 가리킨다.
- 해결: `mkdir -p apps` 후 다시 실행.

### 2. 생성기가 만든 `pnpm-workspace.yaml`이 앱 안에 중첩됨

- 증상: `apps/web/pnpm-workspace.yaml`이 생겼다. 내용은 `ignoredBuiltDependencies: [sharp, unrs-resolver]`.
- 원인: 단독 프로젝트를 가정한 생성기가 자기 폴더를 workspace 루트로 만들었다. 모노레포에서는 루트가 하나여야 한다.
- 해결: 파일을 지우고 설정을 루트 `pnpm-workspace.yaml`로 옮겼다.

### 3. 생성기가 만든 `package.json` 정리

- 증상: 이름이 `web`/`api`, 각자 `packageManager`, `typescript ^5`/`^6.0.2`, `@types/node ^20`/`^24`로 제각각이었다.
- 해결: 이름을 `@portfolio/web`, `@portfolio/api`로 바꾸고, `packageManager`는 루트에만 두고, TypeScript(D-013)와 `@types/node`(D-012)를 맞췄다.

### 4. Nest 12는 ESM이었다

- 증상: 핸드오프는 "Nest는 CJS"를 전제로 했는데 템플릿이 `"type": "module"`, `module: nodenext`였다.
- 영향: 소스의 상대 import에 `.js` 확장자가 붙는다(`./app.module.js`). schemas의 CJS 출력이 불필요해졌다(→ D-014).

### 5. 두 앱이 같은 포트(3000)를 쓰려 함

- 원인: Next와 Nest 둘 다 기본값이 3000이다.
- 해결: api를 `process.env.PORT ?? 4000`으로 바꿨다.

### 6. `Ignored build scripts: esbuild`

- 증상: `pnpm install` 끝에 pnpm 10이 esbuild의 빌드 스크립트를 막았다는 경고.
- 확인: 막힌 채로 `pnpm build`(tsup 포함)가 통과했다. 지금은 승인하지 않고 둔다.
- 배운 점: pnpm 10은 의존성의 설치 스크립트를 기본으로 막는다(공급망 보안). 필요해지면 `pnpm approve-builds`로 허용한다.
