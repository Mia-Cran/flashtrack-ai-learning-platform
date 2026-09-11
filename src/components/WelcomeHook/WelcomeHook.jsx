import { useEffect, useState } from "react";
import { useT } from "../../i18n";
import "./WelcomeHook.css";

const SCENE_MS = 2600;
const TYPE_MS = 85;
const CAPTION_KEYS = [
  "welcome.hookSearch",
  "welcome.hookSearchGo",
  "welcome.hookLearn",
  "welcome.hookFlipGo",
  "welcome.hookFlipBack",
  "welcome.hookSave",
  "welcome.hookSaveGo",
  "welcome.hookQuiz",
  "welcome.hookGames",
  "welcome.hookHome",
];

function SpeakerIcon() {
  return (
    <svg
      className="welcome-hook__hear-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11 5L6 9H3v6h3l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 010 7" />
      <path d="M18.5 5.5a9 9 0 010 13" />
    </svg>
  );
}

function ClickArrow() {
  return (
    <svg
      className="welcome-hook__arrow"
      viewBox="0 0 32 32"
      width="44"
      height="44"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 2v23l7-6 5 11 4-2-5-10h10z"
        fill="#ffffff"
        stroke="#1c1b19"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlipButton({ label, clicking }) {
  return (
    <span
      className={
        clicking
          ? "welcome-hook__flip welcome-hook__flip--on welcome-hook__flip--clicking"
          : "welcome-hook__flip welcome-hook__flip--aim"
      }
    >
      {label}
      <ClickArrow />
    </span>
  );
}

function CardFront({ term, flipLabel, hint, hearLabel, clicking }) {
  return (
    <article className="welcome-hook__card" aria-hidden="true">
      <div className="welcome-hook__card-top">
        <h3>{term}</h3>
        <FlipButton label={flipLabel} clicking={clicking} />
      </div>
      <div className="welcome-hook__card-actions">
        <span className="welcome-hook__hear-chip">
          <SpeakerIcon />
          {hearLabel}
        </span>
        <p className="welcome-hook__hint">{hint}</p>
      </div>
    </article>
  );
}

function CardBack({
  meaning,
  flipLabel,
  saveLabel,
  waysLabel,
  simpleLabel,
  showSave,
  saveClicking,
}) {
  return (
    <article className="welcome-hook__card welcome-hook__card--back" aria-hidden="true">
      <div className="welcome-hook__card-top">
        <h3>{waysLabel}</h3>
        <span className="welcome-hook__flip">{flipLabel}</span>
      </div>
      <p className="welcome-hook__section">{simpleLabel}</p>
      <p>{meaning}</p>
      {showSave && (
        <span
          className={
            saveClicking
              ? "welcome-hook__go welcome-hook__go--on welcome-hook__go--clicking"
              : "welcome-hook__go welcome-hook__go--aim"
          }
        >
          {saveLabel}
          <ClickArrow />
        </span>
      )}
    </article>
  );
}

function WelcomeHook() {
  const t = useT();
  const term = t("welcome.hookTerm");
  const [scene, setScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [typedCount, setTypedCount] = useState(term.length);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setScene((current) => (current + 1) % CAPTION_KEYS.length);
    }, SCENE_MS);

    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (scene !== 0 || !playing) {
      return undefined;
    }

    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setTypedCount(index);
      if (index >= term.length) {
        window.clearInterval(timer);
      }
    }, TYPE_MS);

    return () => window.clearInterval(timer);
  }, [scene, playing, term]);

  const typed =
    playing && scene === 0 ? term.slice(0, typedCount) : term;

  function togglePlaying() {
    setPlaying((current) => !current);
  }

  return (
    <section className="welcome-hook" aria-label={t("welcome.hookAria")}>
      <button
        type="button"
        className="welcome-hook__stage"
        onClick={togglePlaying}
        aria-label={playing ? t("welcome.hookPause") : t("welcome.hookPlayButton")}
      >
        <div className="welcome-hook__chrome" aria-hidden="true">
          <span className="welcome-hook__dot" />
          <span className="welcome-hook__dot" />
          <span className="welcome-hook__dot" />
          <span className="welcome-hook__brand">FlashTrack</span>
        </div>

        {scene === 0 && (
          <div className="welcome-hook__search" aria-hidden="true">
            <p className="welcome-hook__query">
              {typed}
              {playing && typed.length < term.length ? (
                <span className="welcome-hook__caret">|</span>
              ) : null}
            </p>
            <span className="welcome-hook__go welcome-hook__go--aim">
              {t("search.search")}
              <ClickArrow />
            </span>
          </div>
        )}

        {scene === 1 && (
          <div className="welcome-hook__search" aria-hidden="true">
            <p className="welcome-hook__query">{term}</p>
            <span className="welcome-hook__go welcome-hook__go--on welcome-hook__go--clicking">
              {t("search.search")}
              <ClickArrow />
            </span>
          </div>
        )}

        {scene === 2 && (
          <CardFront
            term={term}
            flipLabel={t("card.flip")}
            hint={t("card.tapFlip")}
            hearLabel={t("card.hearIt")}
          />
        )}

        {scene === 3 && (
          <CardFront
            term={term}
            flipLabel={t("card.flip")}
            hint={t("card.tapFlip")}
            hearLabel={t("card.hearIt")}
            clicking
          />
        )}

        {scene === 4 && (
          <CardBack
            meaning={t("welcome.hookMeaning")}
            flipLabel={t("card.flip")}
            saveLabel={t("card.save")}
            waysLabel={t("card.waysToLearn")}
            simpleLabel={t("card.simple")}
          />
        )}

        {scene === 5 && (
          <CardBack
            meaning={t("welcome.hookMeaning")}
            flipLabel={t("card.flip")}
            saveLabel={t("card.save")}
            waysLabel={t("card.waysToLearn")}
            simpleLabel={t("card.simple")}
            showSave
          />
        )}

        {scene === 6 && (
          <CardBack
            meaning={t("welcome.hookMeaning")}
            flipLabel={t("card.flip")}
            saveLabel={t("card.save")}
            waysLabel={t("card.waysToLearn")}
            simpleLabel={t("card.simple")}
            showSave
            saveClicking
          />
        )}

        {scene === 7 && (
          <div className="welcome-hook__quiz" aria-hidden="true">
            <p className="welcome-hook__kicker">{t("dashboard.quizzes")}</p>
            <p className="welcome-hook__question">{t("welcome.hookQuizQuestion")}</p>
            <p className="welcome-hook__choice welcome-hook__choice--on">
              {t("welcome.hookQuizRight")}
            </p>
            <p className="welcome-hook__choice">{t("welcome.hookQuizWrong")}</p>
          </div>
        )}

        {scene === 8 && (
          <div className="welcome-hook__games" aria-hidden="true">
            <span>{t("welcome.hookMatch")}</span>
            <span>{t("welcome.hookSpot")}</span>
            <span>{t("welcome.hookHear")}</span>
          </div>
        )}

        {scene === 9 && (
          <div className="welcome-hook__home" aria-hidden="true">
            <p className="welcome-hook__kicker">{t("dashboard.title")}</p>
            <p className="welcome-hook__stat">{t("welcome.hookHomeSaved")}</p>
            <p className="welcome-hook__stat">{t("welcome.hookHomeLanguage")}</p>
            <p className="welcome-hook__stat welcome-hook__stat--accent">
              {t("dashboard.startReview")}
            </p>
          </div>
        )}

        {!playing && (
          <span className="welcome-hook__play" aria-hidden="true">
            ▶
          </span>
        )}
      </button>

      <p className="welcome-hook__caption" aria-live="polite">
        {t(CAPTION_KEYS[scene])}
      </p>

      <div className="welcome-hook__dots" aria-hidden="true">
        {CAPTION_KEYS.map((key, index) => (
          <span
            key={key}
            className={
              index === scene
                ? "welcome-hook__pip welcome-hook__pip--on"
                : "welcome-hook__pip"
            }
          />
        ))}
      </div>
    </section>
  );
}

export default WelcomeHook;
