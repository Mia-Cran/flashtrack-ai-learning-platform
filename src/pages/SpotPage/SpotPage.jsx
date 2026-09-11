import { useState } from "react";
import { Link, Navigate } from "react-router";
import { IconAlertTriangle } from "@tabler/icons-react";
import {
  SPOT_UNLOCK_COUNT,
  buildSpotRound,
  playableSpotTopics,
} from "../../utils/spotGame";
import "./SpotPage.css";
import { useT } from "../../i18n";

function SpotPage({ isLoggedIn, savedTopics = [] }) {
  const t = useT();
  const [pinnedRound, setPinnedRound] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [spotted, setSpotted] = useState(false);
  const [status, setStatus] = useState("");

  const playableCount = playableSpotTopics(savedTopics).length;
  const round = pinnedRound ?? buildSpotRound(savedTopics);
  if (pinnedRound === null && round) {
    setPinnedRound(round);
  }

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const totalCards = round?.cards.length ?? 0;
  const card = round?.cards[cardIndex];
  const spottedCount = spotted ? cardIndex + 1 : cardIndex;
  const isComplete = Boolean(round) && spotted && cardIndex === totalCards - 1;

  function startNewRound() {
    setCardIndex(0);
    setSpotted(false);
    setStatus(t("spot.tapMixup"));
    setPinnedRound(buildSpotRound(savedTopics));
  }

  function handleOptionClick(kind) {
    if (!card || spotted || isComplete) {
      return;
    }

    if (kind === "mistake") {
      setSpotted(true);
      setStatus(
        cardIndex === totalCards - 1
          ? t("spot.spottedLast")
          : t("spot.spotted"),
      );
      return;
    }

    setStatus(t("spot.notThat"));
  }

  function handleNext() {
    if (!spotted || isComplete) {
      return;
    }

    setCardIndex((index) => index + 1);
    setSpotted(false);
    setStatus(t("spot.tapMixup"));
  }

  return (
    <section className="spot-page">
      <header className="spot-page__header">
        <h1 className="spot-page__title">
          <IconAlertTriangle size={28} stroke={1.75} aria-hidden="true" />
          {t("games.spot")}
        </h1>
        <p className="spot-page__lede">{t("spot.lede")}</p>
        <Link to="/games" className="spot-page__hub-link">
          {t("spot.back")}
        </Link>
      </header>

      {!round ? (
        <div className="spot-page__empty">
          <p>
            {t("spot.needMore", {
              need: SPOT_UNLOCK_COUNT,
              have: playableCount,
            })}
          </p>
          <Link
            to="/search"
            className="spot-page__button spot-page__button--primary"
          >
            {t("common.searchTopic")}
          </Link>
        </div>
      ) : (
        <>
          <p className="spot-page__progress" aria-live="polite">
            {t("spot.progress", { done: spottedCount, total: totalCards })}
          </p>
          <p className="spot-page__status" role="status" aria-live="polite">
            {status || t("spot.tapMixup")}
          </p>

          <div className="spot-page__card">
            <p className="spot-page__term">{card.term}</p>
            <p className="spot-page__prompt">{t("spot.prompt")}</p>

            <div className="spot-page__options" aria-label={t("spot.statementsAria")}>
              {card.options.map((option) => {
                const isPickedMistake =
                  spotted && option.kind === "mistake";
                const isRevealedMeaning =
                  spotted && option.kind === "meaning";

                return (
                  <button
                    key={`${card.id}-${option.kind}`}
                    type="button"
                    className={[
                      "spot-page__option",
                      isPickedMistake ? "spot-page__option--spotted" : "",
                      isRevealedMeaning ? "spot-page__option--meaning" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleOptionClick(option.kind)}
                    disabled={spotted}
                    aria-label={t("spot.optionAria", { label: option.label })}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="spot-page__actions">
            {spotted && !isComplete && (
              <button
                type="button"
                className="spot-page__button spot-page__button--primary"
                onClick={handleNext}
              >
                {t("spot.next")}
              </button>
            )}
            <button
              type="button"
              className={
                isComplete
                  ? "spot-page__button spot-page__button--primary"
                  : "spot-page__button spot-page__button--secondary"
              }
              onClick={startNewRound}
            >
              {isComplete ? t("common.playAgain") : t("spot.newRound")}
            </button>
            {isComplete && (
              <Link
                to="/home"
                className="spot-page__button spot-page__button--secondary"
              >
                {t("common.backDashboard")}
              </Link>
            )}
          </div>

          {isComplete && (
            <p className="spot-page__complete-note">{t("spot.complete")}</p>
          )}
        </>
      )}
    </section>
  );
}

export default SpotPage;
