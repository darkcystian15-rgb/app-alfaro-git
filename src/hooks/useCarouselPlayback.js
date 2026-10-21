import { useEffect, useState } from "react";
// Explicit pause persists; hover/focus and hidden tabs suspend only temporarily.
export default function useCarouselPlayback() {
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = (e) => {
      if (e.matches) setPaused(true);
    };
    const visibility = () => setHidden(document.hidden);
    media.addEventListener("change", changed);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", changed);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return {
    paused,
    setPaused,
    playing: !paused && !hovered && !focused && !hidden,
    interaction: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      },
    },
  };
}
