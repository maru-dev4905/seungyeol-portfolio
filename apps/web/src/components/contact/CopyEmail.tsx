"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Contact.module.css";

type Props = { email: string };

/**
 * 이메일 칸: 주소 글자(누르면 mailto) + "Copy" 버튼(클립보드 복사) 둘 다 있다.
 * 복사하면 화면 아래에 "복사됨" 알약 토스트가 1.8초 보였다 사라진다(role="status"라 스크린 리더도 읽는다).
 * 복사 순서: navigator.clipboard(보안 컨텍스트 필요) -> 안 되면 숨은 textarea + execCommand("copy") -> 그래도 안 되면 "복사하지 못했어요" 안내.
 * JS가 없으면 Copy 버튼은 숨고(data-needs-js) mailto 링크만 남는다.
 */
export function CopyEmail({ email }: Props) {
  const [toast, setToast] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef(0);

  // 페이지를 떠날 때 남은 타이머를 정리한다
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(email);
      ok = true;
    } catch {
      // 대체 방법: 화면 밖 textarea에 넣고 선택해서 복사한다
      const ta = document.createElement("textarea");
      ta.value = email;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
    }
    setToast(ok ? "ok" : "fail");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast("idle"), 1800);
  };

  return (
    <>
      <div className={styles.emailRow}>
        <a className={styles.emailLink} href={`mailto:${email}`}>
          {email}
        </a>
        <div className={styles.emailActions}>
          <button type="button" className={`pill ${styles.actionPill}`} data-needs-js onClick={copy}>
            Copy
          </button>
          <a className={`pill ${styles.actionPill}`} href={`mailto:${email}`}>
            Send email
          </a>
        </div>
      </div>
      {/* 토스트: 항상 DOM에 있어야 스크린 리더가 변화를 읽는다. 보일 때만 data-show */}
      <p className={`pill ${styles.toast}`} role="status" data-show={toast !== "idle" || undefined}>
        {toast === "ok" ? "복사됨" : toast === "fail" ? "복사하지 못했어요. 주소를 직접 선택해 주세요" : ""}
      </p>
    </>
  );
}
