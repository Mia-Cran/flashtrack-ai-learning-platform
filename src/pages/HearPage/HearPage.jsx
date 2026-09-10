import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { IconVolume } from "@tabler/icons-react";
import {
  HEAR_UNLOCK_COUNT,
  buildHearRound,
  playableHearTopics,
} from "../../utils/hearGame";
import { canUseSpeech, speakText, stopSpeech } from "../../utils/speech";
import "./HearPage.css";
import { useLanguage, useT } from "../../i18n";

function HearPage({ isLoggedIn, savedTopics = [] }) {
  const t = useT();
  const language = useLanguage();
  const [pinnedRound, setPinnedRound] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [picked, setPicked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState("");
  const speechAvailable = canUseSpeech();

  const playableCount = playableHearTopics(savedTopics).length;
  const round = pinnedRound ?? buildHearRound(savedTopics);
  if (pinnedRound === null && round) {
    setPinnedRound(round);
  }

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const totalCards = round?.cards.length ?? 0;
  const card = round?.cards[cardIndex];
  const pickedCount = picked ? cardIndex + 1 : cardIndex;
  const isComplete = Boolean(round) && picked && cardIndex === totalCards - 1;
  const showTerm = !speechAvailable || picked;

  function quiet() {
    stopSpeech();
    setIsSpeaking(false);
  }

  function startNewRound() {
    quiet();
    setCardIndex(0);
    setPicked(false);
    setStatus(t("hear.tapHear"));
    setPinnedRound(buildHearRound(savedTopics));
  }

  function handleHear() {
    if (!card || !speechAvailable) {
      return;
    }

    if (isSpeaking) {
      quiet();
      return;
    }

    speakText(card.spoken, {
      lang: language === "es" ? "es-ES" : "en-US",
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  }

  function handleOptionClick(id) {
    if (!card || picked || isComplete) {
      return;
    }

    if (id === card.id) {
      quiet();
      setPicked(true);
      setStatus(
        cardIndex === totalCards - 1
          ? t("hear.gotItLast", { term: card.term })
          : t("hear.gotIt", { term: card.term }),
      );
      return;
    }

    setStatus(t("hear.notThat"));
  }

  function handleNext() {
    if (!picked || isComplete) {
      return;
    }

    quiet();
    setCardIndex((index) => index + 1);
    setPicked(false);
    setStatus(t("hear.tapHear"));
  }

  return (
    <section className="hear-page">
      <header className="hear-page__header">
        <h1 className="hear-page__title">
          <IconVolume size={28} stroke={1.75} aria-hidden="true" />
          {t("games.hear")}
        </h1>
        <p className="hear-page__lede">{t("hear.lede")}</p>
        <Link to="/games" className="hear-page__hub-link">
          {t("hear.back")}
        </Link>
      </header>

      {!round ? (
        <div className="hear-page__empty">
          <p>
            {t("hear.needMore", {
              need: HEAR_UNLOCK_COUNT,
              have: playableCount,
            })}
          </p>
          <Link
            to="/search"
            className="hear-page__button hear-page__button--primary"
          >
            {t("common.searchTopic")}
          </Link>
        </div>
      ) : (
        <>
          <p className="hear-page__progress" aria-live="polite">
            {t("hear.progress", { done: pickedCount, total: totalCards })}
          </p>
          <p className="hear-page__status" role="status" aria-live="polite">
            {status || t("hear.tapHear")}
          </p>

          <div className="hear-page__card">
            {showTerm && <p className="hear-page__term">{card.term}</p>}
            <p className="hear-page__prompt">
              {speechAvailable
                ? t("hear.tapHear")
                : t("hear.noSpeech")}
            </p>

            {speechAvailable && (
              <button
                type="button"
                className="hear-page__hear"
                onClick={handleHear}
                aria-pressed={isSpeaking}
                aria-label={
                  isSpeaking ? t("card.stop") : t("hear.hearTerm")
                }
              >
                {isSpeaking ? t("card.stop") : t("hear.hearTerm")}
              </button>
            )}

            <div className="hear-page__options" aria-label={t("hear.meaningsAria")}>
              {card.options.map((option) => {
                const isCorrect = picked && option.id === card.id;
                const isOther = picked && option.id !== card.id;

                return (
                  <button
                    key={`${card.id}-${option.id}`}
                    type="button"
                    className={[
                      "hear-page__option",
                      isCorrect ? "hear-page__option--picked" : "",
                      isOther ? "hear-page__option--other" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleOptionClick(option.id)}
                    disabled={picked}
                    aria-label={t("hear.meaningAria", { label: option.label })}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hear-page__actions">
            {picked && !isComplete && (
              <button
                type="button"
                className="hear-page__button hear-page__button--primary"
                onClick={handleNext}
              >
                {t("hear.next")}
              </button>
            )}
            <button
              type="button"
              className={
                isComplete
                  ? "hear-page__button hear-page__button--primary"
                  : "hear-page__button hear-page__button--secondary"
              }
              onClick={startNewRound}
            >
              {isComplete ? t("common.playAgain") : t("hear.newRound")}
            </button>
            {isComplete && (
              <Link
                to="/home"
                className="hear-page__button hear-page__button--secondary"
              >
                {t("common.backDashboard")}
              </Link>
            )}
          </div>

          {isComplete && (
            <p className="hear-page__complete-note">{t("hear.complete")}</p>
          )}
        </>
      )}
    </section>
  );
}

export default HearPage;
