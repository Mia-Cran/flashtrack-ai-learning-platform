import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "../../i18n";
import "./AppTour.css";

function AppTour({ steps, stepIndex, onNext, onSkip }) {
  const t = useT();
  const [anchor, setAnchor] = useState(null);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  useLayoutEffect(() => {
    if (!step) {
      return undefined;
    }

    function measure() {
      const target = document.querySelector(`[data-tour="${step.id}"]`);
      const width = Math.min(300, window.innerWidth - 24);
      const bubbleHeight = 210;

      if (!target) {
        setAnchor({ top: 72, left: 12 });
        return;
      }

      const rect = target.getBoundingClientRect();
      let top = rect.bottom + 10;

      if (top + bubbleHeight > window.innerHeight - 12) {
        top = Math.max(12, rect.top - bubbleHeight - 10);
      }

      setAnchor({
        top,
        left: Math.min(
          Math.max(12, rect.left),
          Math.max(12, window.innerWidth - width - 12),
        ),
      });
      target.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  useLayoutEffect(() => {
    function handleKey(event) {
      if (event.key === "Escape") {
        onSkip();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onSkip]);

  if (!step || !anchor) {
    return null;
  }

  return createPortal(
    <div
      className="app-tour"
      style={{ top: `${anchor.top}px`, left: `${anchor.left}px` }}
      role="dialog"
      aria-modal="false"
      aria-labelledby="app-tour-title"
    >
      <p className="app-tour__progress">
        {t("tour.progress", {
          current: stepIndex + 1,
          total: steps.length,
        })}
      </p>
      <h2 id="app-tour-title" className="app-tour__title">
        {t(step.titleKey)}
      </h2>
      <p className="app-tour__body">{t(step.bodyKey)}</p>
      <div className="app-tour__actions">
        <button type="button" className="app-tour__skip" onClick={onSkip}>
          {t("tour.skip")}
        </button>
        <button type="button" className="app-tour__next" onClick={onNext}>
          {isLast ? t("tour.done") : t("tour.next")}
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default AppTour;
