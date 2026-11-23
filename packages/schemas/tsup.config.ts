import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  // Next(번들러)와 Nest 12(ESM) 둘 다 ESM으로 불러오므로 ESM만 만든다
  format: ["esm"],
  // 타입 선언(.d.ts)도 함께 만든다
  dts: true,
  clean: true,
})
