import { useEffect, useRef } from "react";

type Options = {
  enabled: boolean;
  timeoutMs: number;
  onTimeout: () => void;
};

export function useInactivityLogout({ enabled, timeoutMs, onTimeout }: Options) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return;

    let timerId: number | null = null;

    const reset = () => {
      if (timerId !== null) window.clearTimeout(timerId);
      timerId = window.setTimeout(() => onTimeoutRef.current(), timeoutMs);
    };

    // start immediately
    reset();

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "pointermove",
      "wheel",
      "click",
    ];

    const onActivity = () => reset();

    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const onVisibility = () => {
      if (!document.hidden) reset();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      events.forEach((e) => window.removeEventListener(e, onActivity as EventListener));
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, timeoutMs]);
}
