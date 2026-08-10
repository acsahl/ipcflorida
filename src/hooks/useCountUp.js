import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Ease-out cubic — fast start, gentle settle, which reads better for a
// number that's meant to land on a value.
const ease = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Animates 0 -> target whenever `runKey` changes. Returns the current value.
 * Honours prefers-reduced-motion by jumping straight to the target.
 */
export default function useCountUp(target, runKey, duration = 1100) {
  const [value, setValue] = useState(target);
  const frame = useRef(null);

  useEffect(() => {
    if (typeof target !== "number" || Number.isNaN(target)) return;
    if (prefersReducedMotion() || duration === 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * ease(t)));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    setValue(0);
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, runKey, duration]);

  return value;
}
