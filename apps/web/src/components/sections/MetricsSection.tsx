import { CountUp } from "@/components/motion/CountUp";
import type { ProjectSection } from "@/lib/projects";
import styles from "./Section.module.css";

type Props = { section: Extract<ProjectSection, { type: "metrics" }> };

// "1,240" / "-72" / "0.4" 같은 문자열을 숫자와 소수 자릿수로 바꾼다. 숫자가 아니면 null(그대로 표시한다).
function parseValue(value: string): { to: number; decimals: number; group: boolean } | null {
  const plain = value.replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(plain)) return null;
  return { to: Number(plain), decimals: plain.split(".")[1]?.length ?? 0, group: value.includes(",") };
}

/** 지표 카드: 2열 격자(모바일 1열). 숫자는 디스플레이 세리프로 크게, 설명은 그 아래 보조 글. */
export function MetricsSection({ section }: Props) {
  return (
    <ul className={styles.metrics}>
      {section.meta.map((metric) => {
        const parsed = parseValue(metric.value);
        return (
          <li key={metric.label} className={styles.metric}>
            <p className={styles.metricValue}>
              {/* 숫자면 0에서 올라가고(CountUp, 움직임 줄이기면 바로 최종값), 아니면 문자열 그대로 */}
              {parsed ? <CountUp {...parsed} /> : metric.value}
              {metric.unit && <span className={styles.metricUnit}>{metric.unit}</span>}
            </p>
            <p className={styles.metricLabel}>{metric.label}</p>
          </li>
        );
      })}
    </ul>
  );
}
