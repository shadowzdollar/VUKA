import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Client-side inactivity guard for shared devices (common in markets and agent shops). After
 * `idleMs` without input a warning appears; if not dismissed within `graceMs` the session ends.
 * The server session (12 h) remains the authority — this only ends it sooner.
 */
export function useIdleTimeout(opts: {
  enabled: boolean;
  idleMs: number;
  graceMs: number;
  onExpire: () => void;
}) {
  const { enabled, idleMs, graceMs, onExpire } = opts;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastActivity = useRef(Date.now());
  const expire = useRef(onExpire);
  expire.current = onExpire;
  const secondsLeftRef = useRef<number | null>(null);
  secondsLeftRef.current = secondsLeft;

  const stay = useCallback(() => {
    lastActivity.current = Date.now();
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const bump = () => {
      // Once the warning is showing, only an explicit "stay signed in" counts.
      if (secondsLeftRef.current === null) lastActivity.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
    for (const e of events) window.addEventListener(e, bump, { passive: true });
    const tick = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= idleMs + graceMs) {
        expire.current();
      } else if (idle >= idleMs) {
        setSecondsLeft(Math.ceil((idleMs + graceMs - idle) / 1000));
      }
    }, 1000);
    return () => {
      for (const e of events) window.removeEventListener(e, bump);
      window.clearInterval(tick);
    };
  }, [enabled, idleMs, graceMs]);

  return { warning: secondsLeft !== null, secondsLeft: secondsLeft ?? 0, stay };
}
