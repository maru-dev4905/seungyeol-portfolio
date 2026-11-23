// WebGL2로 "화면 전체를 덮는 셰이더 한 장"을 그리기 위한 작은 도우미.

// 정점 셰이더: 속성 버퍼 없이 gl_VertexID(0,1,2)만으로 화면을 덮는 큰 삼각형 하나를 만든다.
// 정점 3개의 좌표가 (-1,-1), (3,-1), (-1,3)이라 화면(-1~1)을 통째로 덮고 남는 부분은 잘려 나간다.
const vertexSource = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[scene] 셰이더 컴파일 실패:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * 정점·프래그먼트 셰이더를 컴파일하고 링크한다. 실패하면 console.warn 후 null
 * (호출한 쪽은 null이면 캔버스를 그리지 않고 CSS 바탕만 보여 준다).
 * uniforms에는 프래그먼트 소스의 모든 uniform 위치가 이름으로 들어 있다.
 */
export function createFullscreenProgram(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
): { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> } | null {
  const vs = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn("[scene] 프로그램 링크 실패:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (!info) continue;
    uniforms[info.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
}

/**
 * CSS 커스텀 프로퍼티(#rrggbb)를 읽어 0~1 범위 RGB로 바꾼다.
 * 색을 GLSL에 박지 않고 globals.css 토큰 한 곳에서만 정하려고 쓴다. 읽지 못하면 검정.
 */
export function readColor(el: Element, name: string): [number, number, number] {
  const hex = getComputedStyle(el).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) {
    console.warn(`[scene] ${name} 토큰이 #rrggbb 형식이 아닙니다:`, hex);
    return [0, 0, 0];
  }
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}
