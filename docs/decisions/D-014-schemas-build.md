# D-014 schemas 패키지는 tsup으로 ESM만 빌드한다

- 상태: 확정
- 날짜: 2026-11-17

> `packages/schemas`는 tsup으로 `dist/index.js`(ESM)와 `dist/index.d.ts`만 만든다. CJS는 만들지 않는다.

## 배경

Nest는 컴파일된 JS로 실행되므로, 앱이 `@portfolio/schemas`를 불러오려면 schemas가 먼저 **빌드**되어 있어야 한다(D-009).
처음에는 "Nest는 CJS, Next는 ESM"이라는 가정으로 ESM과 CJS를 둘 다 만들려 했다.

## 확인한 사실

이번 Nest 12 템플릿은 `"type": "module"`, `module: nodenext`다. **Nest도 ESM이다.**
그래서 CJS 출력은 쓰는 곳이 없다.

## 고민한 선택지

| 안 | 방식 | 결과 |
| --- | --- | --- |
| A. tsc만 | 도구 하나 | 번들·`.d.ts`·ESM 설정을 직접 구성해야 해서 길어짐 |
| B. tsup, ESM+CJS | 둘 다 출력 | 쓰이지 않는 CJS와 `exports` 조건이 늘어남 |
| **C. tsup, ESM만** | `format: ["esm"]`, `dts: true` | **채택** |

## 결정

```ts
// packages/schemas/tsup.config.ts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
})
```

`package.json`은 `"type": "module"`과 `exports["."] = { types, default }`만 둔다.

## 이유

- 소비자(Next 번들러, Nest 12)가 모두 ESM을 이해한다.
- 출력과 `exports`가 단순해지면 "누가 어떻게 불러오는지" 설명하기 쉽다.

## 비용 / 주의

- 나중에 CJS만 아는 도구가 schemas를 불러야 하면 `format`에 `cjs`를 다시 추가해야 한다.
- schemas를 고친 뒤에는 다시 빌드해야 앱이 변경을 본다. 그래서 Turborepo가 `dev`, `build`, `test`, `typecheck` 앞에 `^build`를 건다.

## 면접 포인트

"공유 패키지를 어떻게 빌드하고 소비하나요?" → ESM `exports` 하나로 내보내고, Turborepo의 `dependsOn: ["^build"]`로 소비자보다 먼저 빌드되게 했다. 처음 가정(Nest는 CJS)이 틀렸다는 걸 확인하고 설정을 줄였다.

## 남은 질문

없음.
