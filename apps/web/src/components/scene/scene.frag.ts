// 홈 배경 셰이더. 영상이 없을 때 "영상 대신" 쓰는 근사다(D-021).
//  - 기본(uMix=0): 검정 바탕 위의 크롬 느낌 4갈래 튜브 오브젝트(형광 보라 + 흰 하이라이트)
//  - 프로젝트(uMix=1): 검정 바탕 위에 프로젝트 색조(uTint) 한 가지가 결 방향으로 번진 면
// 두 장면을 한 셰이더에서 uMix로 섞어서, 알약을 올릴 때 배경이 크로스페이드로 바뀐다.
// uRot/uOff는 홈의 Drag 인터랙션(회전·이동)이다. 그레인·노이즈 오버레이는 쓰지 않는다.
export const sceneFrag = `#version 300 es
precision highp float;
out vec4 outColor;

uniform vec2 uRes;       // 캔버스 픽셀 크기
uniform float uTime;     // 초
uniform float uMix;      // 0 = 기본 오브젝트, 1 = 프로젝트 색조
uniform vec3 uTint;      // 프로젝트 색조(0~1)
uniform vec3 uViolet;    // 기본 오브젝트의 보라
uniform float uSeed;     // 프로젝트마다 번짐 모양을 다르게 하는 값
uniform float uRot;      // 드래그 회전(라디안)
uniform vec2 uOff;       // 드래그 이동(화면 높이 = 1)
uniform float uZoom;     // 1 = 전체, 클수록 확대(메뉴 가운데 미디어가 더 가까이 본다)
// 오브젝트 "형태" 파라미터(SceneCanvas의 SHAPES). 같은 재질·조명에 막대 배치만 바꿔 형태를 다르게 한다. 기본값은 홈의 크롬 별
uniform vec4 uShape;     // x: 막대가 중심에서 떨어진 거리, y: 막대 반길이, z: 두께 배율, w: 막대 사이 각도(라디안)
uniform vec2 uShape2;    // x: 오브젝트 전체 회전, y: 막대마다 길이 방향으로 어긋나는 정도

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// 선분 캡슐까지의 거리(두께 r)
float capsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

// 4개의 막대로 이뤄진 오브젝트. 막대 i는 중심에서 uShape.x 떨어진 위치에서 i * uShape.w 만큼 돌아 있다.
// 각도(w)가 90도면 바람개비('#' 모양, 홈 기본), 45도면 부채꼴, 120도면 삼각형, 180도면 엇갈린 평행 막대다.
// 파라미터는 JS가 프레임마다 목표를 향해 섞으므로(보간) 형태가 바뀔 때 막대들이 부드럽게 움직이며 변한다
float shape(vec2 p) {
  float d = 1e3;
  p = rot(uShape2.x) * p;
  for (int i = 0; i < 4; i++) {
    vec2 q = rot(uShape.w * float(i)) * p;
    q.x -= uShape2.y * (float(i) - 1.5);
    // 두꺼운(0.15) 캡슐과 가는(0.11) 캡슐을 겹쳐 끝이 살짝 가늘어 보이게 한다. 길이는 반길이(y) 비율로 따라간다
    float L = uShape.y;
    float bar = min(capsule(q, vec2(-L, uShape.x), vec2(L, uShape.x), 0.11 * uShape.z),
                    capsule(q, vec2(-0.636 * L, uShape.x), vec2(0.758 * L, uShape.x), 0.15 * uShape.z));
    d = min(d, bar);
  }
  return d;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }
  return v;
}

vec3 chrome(vec2 p) {
  vec3 bg = vec3(0.008, 0.006, 0.045); // 거의 검정에 가까운 짙은 남색
  float d = shape(p);
  // 가장자리에서 안쪽으로의 깊이 t(0 = 가장자리, 1 = 튜브 중심). 튜브 반폭은 약 0.125 x 두께 배율
  float t = clamp(-d / (0.15 * uShape.z), 0.0, 1.0);
  // 거리장의 기울기 = 바깥쪽 방향(유한 차분)
  vec2 e = vec2(0.004, 0.0);
  vec2 g = normalize(vec2(shape(p + e.xy) - shape(p - e.xy), shape(p + e.yx) - shape(p - e.yx)) + 1e-5);
  // 원기둥 단면: 가장자리에서는 옆을 보고 가운데서는 정면을 본다
  float u = 1.0 - t;
  vec3 n = normalize(vec3(g * u, sqrt(max(1.0 - u * u, 0.0)) + 0.02));
  // 빛이 천천히 돌아다닌다: 하이라이트가 튜브를 따라 흐른다(uTime=0이면 예전의 고정된 빛과 같다 -> 움직임 줄이기의 정지 프레임)
  vec3 L = normalize(vec3(-0.45 + 0.45 * sin(uTime * 0.35), 0.6 + 0.25 * sin(uTime * 0.27), 0.65));
  vec3 L2 = normalize(vec3(0.7 + 0.35 * sin(uTime * 0.31), -0.35 + 0.3 * sin(uTime * 0.22), 0.5));
  vec3 V = vec3(0.0, 0.0, 1.0);
  float spec1 = pow(max(dot(reflect(-L, n), V), 0.0), 22.0);
  float spec2 = pow(max(dot(reflect(-L2, n), V), 0.0), 16.0);
  float rim = pow(1.0 - n.z, 2.6);
  vec3 col = vec3(0.012, 0.01, 0.03);
  col += uViolet * rim * (0.25 + 1.6 * pow(max(dot(n, L), 0.0), 2.0));
  col += vec3(0.72, 0.7, 0.9) * spec1 * 0.95;
  col += uViolet * 0.9 * spec2;
  // 튜브 바깥 가장자리는 살짝 어둡게(두께감)
  col *= smoothstep(0.0, 0.1, t) * 0.6 + 0.4;
  float inside = smoothstep(0.004, -0.004, d);
  return mix(bg, col, inside);
}

vec3 smear(vec2 p) {
  // 프로젝트 장면: 대각선 방향으로 길게 번진 색조 띠. 결(streak) 방향으로 노이즈를 늘여서 모션 블러처럼 보이게 한다
  vec2 q = rot(-0.62 + uSeed * 0.35) * p;
  float band = exp(-pow(q.y * (2.4 + 0.5 * uSeed), 2.0));
  float streak = fbm(vec2(q.x * 0.7 + uSeed * 3.0 + uTime * 0.03, q.y * 7.0));
  float core = exp(-pow((q.y + 0.08 * sin(q.x * 2.0 + uSeed)) * 3.2, 2.0));
  vec3 col = uTint * band * (0.15 + 0.85 * streak) * 0.9;
  col += mix(uTint, vec3(1.0), 0.55) * core * 0.55 * smoothstep(0.2, 0.9, streak);
  col *= smoothstep(1.2, 0.1, length(p)); // 가장자리는 검정으로 가라앉는다
  return col;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  // 화면 높이를 1로 두고 가운데를 원점으로 하는 좌표. 가로가 길면 그만큼 x가 넓어진다
  vec2 p = (frag - 0.5 * uRes) / uRes.y;
  p /= uZoom;
  p -= uOff;
  p = rot(uRot) * p;
  // 기본 오브젝트는 살짝 기울어져 있고 천천히 흔들리며(약 ±8도, 주기 약 37초) 떠다닌다(약 ±0.03).
  // 드래그(uRot·uOff)는 위에서 이미 p에 적용했고, 이 흔들림은 그 위에 더해지므로 서로 부딪치지 않는다
  float sway = 0.14 * sin(uTime * 0.17) + 0.05 * sin(uTime * 0.41);
  vec2 drift = vec2(0.03 * sin(uTime * 0.29), 0.035 * sin(uTime * 0.23));
  vec2 pc = rot(0.38 + sway) * (p - drift);
  vec3 a = chrome(pc * 0.95);
  vec3 b = smear(p);
  vec3 col = mix(a, b, uMix);
  outColor = vec4(col, 1.0);
}`;
